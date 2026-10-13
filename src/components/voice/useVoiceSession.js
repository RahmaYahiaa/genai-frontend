import { useCallback, useEffect, useRef, useState } from "react";
import { startVoiceSession, mintVoiceToken } from "@/services/voice";
import { ApiError } from "@/services/http";
import { floatToPcm16, base64ToBytes, pcm16ToFloat32, INPUT_RATE, OUTPUT_RATE } from "@/components/voice/pcm";
import { createMicWorkletUrl } from "@/components/voice/micWorklet";

const MAX_RECONNECTS = 5;
const PING_MS = 20000;
const STOP_GRACE_MS = 800;

function levelOf(analyser, buf) {
  if (!analyser) return 0;
  analyser.getByteTimeDomainData(buf);
  let sum = 0;
  for (let i = 0; i < buf.length; i += 1) {
    const v = (buf[i] - 128) / 128;
    sum += v * v;
  }
  return Math.min(1, Math.sqrt(sum / buf.length) * 4);
}

/**
 * Live voice session for the AI Tutor (LernaVoice protocol).
 *
 * - Mic frames go up as binary PCM16 @16 kHz while the mic is on.
 * - Tutor audio plays as PCM16 @24 kHz, scheduled back to back.
 * - `assistant.interrupted` stops playback at once (barge-in).
 * - On a dropped socket we mint a new token and send `resume`, so the lesson
 *   continues instead of restarting. Events already applied are skipped by seq.
 */
export default function useVoiceSession({ courseId }) {
  const [status, setStatus] = useState("idle"); // idle | connecting | live | reconnecting | ended | error
  const [errorCode, setErrorCode] = useState(null); // mic_denied | mic_unavailable | unavailable | connection | server
  const [topic, setTopic] = useState(null);
  const [micOn, setMicOn] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [turns, setTurns] = useState([]);
  const [visual, setVisual] = useState(null);
  const [sources, setSources] = useState([]);
  const levelRef = useRef(0);

  const R = useRef({
    ws: null,
    session: null,
    topicId: null,
    lastSeq: -1,
    micOn: false,
    interrupted: false,
    currentTutorId: null,
    partialStudentId: null,
    nextId: 1,
    stopping: false,
    starting: false,
    reconnects: 0,
    ping: null,
    reconnectTimer: null,
    stopTimer: null,
    levelRaf: 0,
    mic: null,
    play: null,
  });

  const addTurn = (turn) => {
    const id = R.current.nextId;
    R.current.nextId += 1;
    setTurns((prev) => [...prev.slice(-80), { id, final: false, ...turn }]);
    return id;
  };
  const patchTurn = (id, patch) => {
    setTurns((prev) => prev.map((turn) => (turn.id === id ? { ...turn, ...patch(turn) } : turn)));
  };

  const safeSend = (message) => {
    const ws = R.current.ws;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
  };

  // ── speaker ───────────────────────────────────────────────────────────────
  const openPlayback = () => {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const gain = ctx.createGain();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    gain.connect(analyser);
    analyser.connect(ctx.destination);
    R.current.play = { ctx, gain, analyser, buf: new Uint8Array(512), nextTime: 0, active: new Set() };
  };

  const stopPlayback = () => {
    const play = R.current.play;
    if (!play) return;
    for (const source of play.active) {
      source.onended = null;
      try {
        source.stop();
      } catch {
        // already stopped
      }
    }
    play.active.clear();
    play.nextTime = 0;
    setSpeaking(false);
  };

  const enqueueAudio = (b64) => {
    const play = R.current.play;
    if (!play) return;
    const samples = pcm16ToFloat32(base64ToBytes(b64));
    if (samples.length === 0) return;
    const buffer = play.ctx.createBuffer(1, samples.length, OUTPUT_RATE);
    buffer.copyToChannel(samples, 0);
    const source = play.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(play.gain);
    const startAt = Math.max(play.ctx.currentTime + 0.03, play.nextTime);
    source.start(startAt);
    play.nextTime = startAt + buffer.duration;
    play.active.add(source);
    source.onended = () => {
      play.active.delete(source);
      if (play.active.size === 0) setSpeaking(false);
    };
    setSpeaking(true);
  };

  // ── microphone ────────────────────────────────────────────────────────────
  const onMicFrame = (frame) => {
    const r = R.current;
    const ws = r.ws;
    if (!r.micOn || !r.mic || !ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(floatToPcm16(frame, r.mic.rate, INPUT_RATE).buffer);
  };

  const openMic = async () => {
    if (!navigator.mediaDevices?.getUserMedia) throw Object.assign(new Error("no mic"), { name: "NotSupportedError" });
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    const sink = ctx.createGain();
    sink.gain.value = 0;

    let node;
    if (ctx.audioWorklet) {
      await ctx.audioWorklet.addModule(createMicWorkletUrl());
      node = new AudioWorkletNode(ctx, "pcm-capture");
      node.port.onmessage = (event) => onMicFrame(event.data);
    } else {
      node = ctx.createScriptProcessor(4096, 1, 1);
      node.onaudioprocess = (event) => onMicFrame(new Float32Array(event.inputBuffer.getChannelData(0)));
    }
    source.connect(node);
    node.connect(sink);
    sink.connect(ctx.destination);
    R.current.mic = { stream, ctx, analyser, buf: new Uint8Array(512), rate: ctx.sampleRate };
  };

  const closeMic = () => {
    const mic = R.current.mic;
    if (!mic) return;
    mic.stream.getTracks().forEach((track) => track.stop());
    mic.ctx.close().catch(() => {});
    R.current.mic = null;
  };

  // ── orb level: mic while listening, tutor voice while speaking ───────────
  const startLevelLoop = () => {
    const tick = () => {
      const r = R.current;
      const mic = r.mic && r.micOn ? levelOf(r.mic.analyser, r.mic.buf) : 0;
      const out = r.play ? levelOf(r.play.analyser, r.play.buf) : 0;
      levelRef.current = levelRef.current * 0.7 + Math.max(mic, out) * 0.3;
      r.levelRaf = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(R.current.levelRaf);
    R.current.levelRaf = requestAnimationFrame(tick);
  };

  // ── protocol events ───────────────────────────────────────────────────────
  const handleEvent = (event) => {
    const r = R.current;
    if (typeof event.seq === "number") {
      if (event.seq <= r.lastSeq) return; // already applied (replay after reconnect)
      r.lastSeq = event.seq;
    }

    switch (event.event) {
      case "input.transcript": {
        const text = (event.text ?? "").trim();
        if (!text) break;
        if (event.final) {
          if (r.partialStudentId) {
            const id = r.partialStudentId;
            r.partialStudentId = null;
            patchTurn(id, () => ({ text, final: true }));
          } else {
            addTurn({ role: "student", text, final: true });
          }
        } else if (r.partialStudentId) {
          const id = r.partialStudentId;
          patchTurn(id, () => ({ text }));
        } else {
          r.partialStudentId = addTurn({ role: "student", text, final: false });
        }
        break;
      }
      case "assistant.response.started":
        r.interrupted = false;
        r.currentTutorId = addTurn({ role: "tutor", text: "", final: false });
        break;
      case "assistant.text.delta": {
        if (!r.currentTutorId) r.currentTutorId = addTurn({ role: "tutor", text: "", final: false });
        const delta = event.text ?? "";
        patchTurn(r.currentTutorId, (turn) => ({ text: turn.text + delta }));
        break;
      }
      case "assistant.audio.chunk":
        if (!r.interrupted && event.audio) enqueueAudio(event.audio);
        break;
      case "assistant.response.completed": {
        if (r.currentTutorId) {
          const id = r.currentTutorId;
          patchTurn(id, (turn) => ({ final: true, text: turn.text || event.text || "" }));
        }
        r.currentTutorId = null;
        break;
      }
      case "assistant.interrupted": {
        // Barge-in: stop the sound first, then mark the turn.
        stopPlayback();
        r.interrupted = true;
        if (r.currentTutorId) {
          const id = r.currentTutorId;
          patchTurn(id, () => ({ final: true, interrupted: true }));
        }
        r.currentTutorId = null;
        break;
      }
      case "visual.updated":
        if (event.visual) setVisual(event.visual);
        break;
      case "rag.retrieved":
        if (Array.isArray(event.sources)) {
          const names = event.sources
            .map((s) => (typeof s === "string" ? s : s?.title ?? s?.source ?? ""))
            .filter(Boolean)
            .slice(0, 4);
          setSources(names);
        }
        break;
      case "session.ended":
        r.ended = true;
        break;
      case "error":
        if (event.recoverable === false) setErrorCode("server");
        break;
      default:
        break;
    }
  };

  // ── connection and reconnect ──────────────────────────────────────────────
  const connect = (session, { resume }) => {
    const r = R.current;
    const ws = new WebSocket(`${session.wsUrl}?token=${encodeURIComponent(session.token)}`);
    ws.binaryType = "arraybuffer";
    r.ws = ws;

    ws.onopen = () => {
      if (R.current.ws !== ws) return;
      R.current.reconnects = 0;
      setStatus("live");
      setErrorCode(null);
      ws.send(JSON.stringify({ type: resume ? "resume" : "start" }));
      clearInterval(R.current.ping);
      R.current.ping = setInterval(() => safeSend({ type: "ping" }), PING_MS);
    };

    ws.onmessage = (message) => {
      if (R.current.ws !== ws || typeof message.data !== "string") return;
      let event;
      try {
        event = JSON.parse(message.data);
      } catch {
        return;
      }
      handleEvent(event);
    };

    ws.onclose = (close) => {
      if (R.current.ws !== ws) return;
      R.current.ws = null;
      clearInterval(R.current.ping);
      if (R.current.stopping || R.current.ended) return;
      scheduleReconnect(close.code);
    };

    ws.onerror = () => {}; // onclose follows and handles it
  };

  const scheduleReconnect = (code) => {
    const r = R.current;
    if (r.reconnects >= MAX_RECONNECTS) {
      setStatus("error");
      setErrorCode("connection");
      closeAll();
      return;
    }
    r.reconnects += 1;
    setStatus("reconnecting");
    clearTimeout(r.reconnectTimer);
    const delay = Math.min(8000, 800 * 2 ** (r.reconnects - 1));
    r.reconnectTimer = setTimeout(() => void reconnect(code), delay);
  };

  const reconnect = async (code) => {
    const r = R.current;
    if (r.stopping || r.ended || !r.session) return;
    try {
      if (code === 4404) {
        // The voice service no longer knows this session (for example after a restart).
        const fresh = await startVoiceSession(courseId, r.topicId);
        r.session = fresh;
        r.lastSeq = -1;
        r.interrupted = false;
        r.partialStudentId = null;
        r.currentTutorId = null;
        connect(fresh, { resume: false });
        return;
      }
      // 4401 (token expired), 4500, or a dropped network: new token, same session.
      const minted = await mintVoiceToken(r.session.sessionId);
      r.session = { ...r.session, token: minted.token };
      connect(r.session, { resume: true });
    } catch (error) {
      if (error instanceof ApiError && (error.status === 403 || error.status === 404)) {
        setStatus("error");
        setErrorCode("connection");
        closeAll();
        return;
      }
      scheduleReconnect(code);
    }
  };

  // ── public controls ───────────────────────────────────────────────────────
  function closeAll() {
    const r = R.current;
    clearTimeout(r.reconnectTimer);
    clearTimeout(r.stopTimer);
    clearInterval(r.ping);
    cancelAnimationFrame(r.levelRaf);
    if (r.ws) {
      const ws = r.ws;
      r.ws = null;
      try {
        ws.close(1000);
      } catch {
        // already closing
      }
    }
    stopPlayback();
    if (r.play) {
      r.play.ctx.close().catch(() => {});
      r.play = null;
    }
    closeMic();
    r.micOn = false;
    setMicOn(false);
    levelRef.current = 0;
  }

  const start = useCallback(
    async (topicId = null) => {
      const r = R.current;
      if (r.ws || r.starting || r.mic) return;
      r.starting = true;
      r.stopping = false;
      r.ended = false;
      r.topicId = topicId;
      r.session = null;
      r.reconnects = 0;
      r.lastSeq = -1;
      r.interrupted = false;
      r.partialStudentId = null;
      r.currentTutorId = null;
      setTurns([]);
      setVisual(null);
      setSources([]);
      setErrorCode(null);
      setSpeaking(false);
      setStatus("connecting");
      try {
        try {
          await openMic();
        } catch (error) {
          setStatus("error");
          setErrorCode(error?.name === "NotAllowedError" ? "mic_denied" : "mic_unavailable");
          closeAll();
          return;
        }
        openPlayback();
        startLevelLoop();
        const session = await startVoiceSession(courseId, topicId);
        R.current.session = session;
        setTopic(session.topic ?? null);
        R.current.micOn = true;
        setMicOn(true);
        connect(session, { resume: false });
      } catch (error) {
        setStatus("error");
        setErrorCode(error instanceof ApiError && error.status === 503 ? "unavailable" : "connection");
        closeAll();
      } finally {
        R.current.starting = false;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [courseId],
  );

  const stop = useCallback(() => {
    const r = R.current;
    r.stopping = true;
    r.micOn = false;
    setMicOn(false);
    safeSend({ type: "end" });
    setStatus("ended");
    // Give the service a moment to write the summary before closing.
    clearTimeout(r.stopTimer);
    r.stopTimer = setTimeout(closeAll, STOP_GRACE_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMic = useCallback(() => {
    const r = R.current;
    if (!r.mic || !r.ws) return;
    r.micOn = !r.micOn;
    setMicOn(r.micOn);
  }, []);

  const interrupt = useCallback(() => {
    const r = R.current;
    stopPlayback();
    r.interrupted = true;
    if (r.currentTutorId) {
      const id = r.currentTutorId;
      patchTurn(id, () => ({ final: true, interrupted: true }));
    }
    r.currentTutorId = null;
    safeSend({ type: "interrupt" });
    if (r.mic && !r.micOn) {
      r.micOn = true;
      setMicOn(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      R.current.stopping = true;
      closeAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    status,
    errorCode,
    topic,
    micOn,
    speaking,
    turns,
    visual,
    sources,
    levelRef,
    start,
    stop,
    toggleMic,
    interrupt,
  };
}
