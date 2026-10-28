import { useCallback, useEffect, useRef, useState } from "react";
import { startVoiceSession, mintVoiceToken, saveVoiceTranscript } from "@/services/voice";
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
 * Live voice lesson for the AI Tutor (LernaVoice protocol).
 *
 * - Mic frames go up as binary PCM16 @16 kHz while the mic is on.
 * - Tutor audio plays as PCM16 @24 kHz, scheduled back to back.
 * - `assistant.interrupted` (and the local "stop tutor") stops playback at once.
 * - A dropped socket gets a new token and a `resume`, so the lesson continues.
 *   Events already applied are skipped by seq.
 * - The transcript is saved to the student's chat history when the lesson
 *   ends, is left, or the page closes.
 */
// Matches tags such as <noise>, <ctrl46>, </ctrl46>. Ordinary text with "<" and ">" is left alone.
const CONTROL_TAG = /<\/?[a-zA-Z_][a-zA-Z_-]*\d*>/g;
const stripControlTags = (text) => text.replace(CONTROL_TAG, "").replace(/[ \t]{2,}/g, " ");

// Words that mean "carry on" after the student has stopped the tutor (English and Egyptian Arabic).
const CONTINUE_WORDS = /^\s*(continue|go on|keep going|carry on|resume|كمل|كمّل|كمّل الشرح|كمل الشرح|استمر)\s*[.!؟?]*\s*$/i;

export default function useVoiceSession({ courseId, onSaved }) {
  const [status, setStatus] = useState("idle"); // idle | connecting | live | reconnecting | ended | error
  const [errorCode, setErrorCode] = useState(null); // mic_denied | mic_unavailable | unavailable | connection | server
  const [topic, setTopic] = useState(null);
  const [micOn, setMicOn] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [turns, setTurns] = useState([]);
  const [tutorUnavailable, setTutorUnavailable] = useState(false);
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
    turns: [],
    stopping: false,
    starting: false,
    ended: false,
    reconnects: 0,
    ping: null,
    reconnectTimer: null,
    stopTimer: null,
    levelRaf: 0,
    mic: null,
    play: null,
    savedSignature: null,
    pendingResume: false, // resume the explanation once the student's answer is done
    awaitingAnswer: false,
    resumePending: false, // a `resume` was sent and `resume.started` has not arrived yet
    resumeTimer: null,
    resumeFallback: null, // opens a fresh lesson if the saved one cannot be resumed
  });
  const onSavedRef = useRef(onSaved);
  onSavedRef.current = onSaved;

  // Turns live in a ref too, so saving always sees the latest text.
  const commitTurns = (next) => {
    R.current.turns = next;
    setTurns(next);
  };
  // The voice service sometimes sends control tokens such as <noise> or <ctrl46> inside text.
  // They are not words, so they are removed everywhere a turn's text is stored or shown.
  const cleanTurn = (turn) => (typeof turn.text === "string" ? { ...turn, text: stripControlTags(turn.text) } : turn);
  const addTurn = (turn) => {
    const id = R.current.nextId;
    R.current.nextId += 1;
    commitTurns([...R.current.turns.slice(-200), cleanTurn({ id, final: false, ...turn })]);
    return id;
  };
  const patchTurn = (id, patch) => {
    commitTurns(R.current.turns.map((turn) => (turn.id === id ? cleanTurn({ ...turn, ...patch(turn) }) : turn)));
  };

  // The voice service streams the student's speech as fragments (" round", " Ro", "bin", …).
  // A fragment is appended; a cumulative version of the same text replaces the bubble text.
  const joinTranscript = (prev, next) => {
    if (!prev) return next.trimStart();
    if (next.startsWith(prev)) return next.trimStart();
    if (prev.endsWith(next)) return prev;
    return prev + next;
  };

  // Ends the student's current utterance. Each spoken question gets its own bubble;
  // a bubble stays open only until the next utterance, answer, or question begins.
  const closeStudentTurn = () => {
    const r = R.current;
    clearTimeout(r.studentTimer);
    if (!r.partialStudentId) return;
    const id = r.partialStudentId;
    r.partialStudentId = null;
    patchTurn(id, (turn) => ({ final: true, text: turn.text.trim() }));
  };
  // Silence closes the bubble, so the next spoken question starts a new one.
  const armStudentTimer = () => {
    const r = R.current;
    clearTimeout(r.studentTimer);
    r.studentTimer = setTimeout(closeStudentTurn, 1600);
  };

  const safeSend = (message) => {
    const ws = R.current.ws;
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(message));
  };

  // ── saving to chat history ────────────────────────────────────────────────
  const saveTranscript = () => {
    const r = R.current;
    const sessionId = r.session?.sessionId;
    if (!sessionId) return;
    const toSave = r.turns
      .filter((turn) => turn.text && turn.text.trim())
      .map((turn) => ({ role: turn.role, text: turn.text }));
    if (toSave.length === 0) return;
    // Compare the content, not just the count: a turn can change text after an earlier save.
    const signature = JSON.stringify(toSave);
    if (signature === r.savedSignature) return;
    r.savedSignature = signature;
    saveVoiceTranscript(sessionId, toSave)
      .then(() => onSavedRef.current?.())
      .catch(() => {
        // The lesson itself is over; the student can still see it on screen.
        R.current.savedSignature = null;
      });
  };

  // ── speaker ───────────────────────────────────────────────────────────────
  const openPlayback = () => {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    ctx.resume?.().catch(() => {});
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
    ctx.resume?.().catch(() => {});
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
  // While `interrupted` is set (after the student stops the tutor), audio and
  // text from the old explanation are dropped. The gate lifts on the first
  // event of the student's turn (their speech or question) or of the resume.
  const handleEvent = (event) => {
    const r = R.current;
    if (typeof event.seq === "number") {
      if (event.seq <= r.lastSeq) return; // already applied (replay after reconnect)
      r.lastSeq = event.seq;
    }

    switch (event.event) {
      case "input.transcript": {
        r.interrupted = false;
        r.awaitingAnswer = true;
        const fragment = event.text ?? "";
        if (!fragment.trim() && !event.final) break;
        if (r.partialStudentId) {
          const id = r.partialStudentId;
          patchTurn(id, (turn) => ({ text: joinTranscript(turn.text, fragment) }));
        } else if (fragment.trim()) {
          r.partialStudentId = addTurn({ role: "student", text: fragment.trimStart(), final: false });
        }
        if (event.final) closeStudentTurn();
        else armStudentTimer();
        break;
      }
      case "audio.input.started":
        closeStudentTurn();
        break;
      case "question.started":
        closeStudentTurn();
        r.interrupted = false;
        r.awaitingAnswer = true;
        break;
      case "resume.started":
        r.interrupted = false;
        r.pendingResume = false;
        r.awaitingAnswer = false;
        r.resumePending = false;
        clearTimeout(r.resumeTimer);
        break;
      case "assistant.response.started":
        closeStudentTurn();
        r.interrupted = false;
        r.tutorSpoke = true;
        setTutorUnavailable(false);
        r.currentTutorId = addTurn({ role: "tutor", text: "", final: false });
        break;
      case "assistant.text.delta": {
        if (r.interrupted) break;
        if (!r.currentTutorId) r.currentTutorId = addTurn({ role: "tutor", text: "", final: false });
        const delta = event.text ?? "";
        const id = r.currentTutorId;
        patchTurn(id, (turn) => ({ text: turn.text + delta }));
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
        if (r.pendingResume && r.awaitingAnswer && !r.interrupted) {
          // The student's answer is done: carry on with the explanation, by voice.
          r.pendingResume = false;
          r.awaitingAnswer = false;
          safeSend({ type: "resume" });
        }
        break;
      }
      case "assistant.interrupted": {
        // The provider stopped the tutor (for example on the student's speech).
        stopPlayback();
        r.interrupted = true;
        r.pendingResume = true;
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
        setStatus("ended");
        saveTranscript();
        break;
      case "error":
        // A saved lesson that cannot be resumed is replaced by a fresh one, so the student is never stuck.
        if (r.resumePending) {
          r.resumeFallback?.();
          break;
        }
        if (event.recoverable === false) setErrorCode("server");
        // Before the tutor has said anything, a recoverable error means the lesson is stuck on providers.
        else if (!r.tutorSpoke) setTutorUnavailable(true);
        break;
      default:
        break;
    }
  };

  // ── connection and reconnect ──────────────────────────────────────────────
  // The saved lesson could not be resumed: close that socket and open a new lesson for the same topic.
  const openFreshLesson = async (ws) => {
    const r = R.current;
    if (r.ws !== ws || !r.resumePending) return;
    r.resumePending = false;
    clearTimeout(r.resumeTimer);
    clearInterval(r.ping);
    r.ws = null;
    try { ws.close(); } catch { /* already closed */ }
    try {
      const fresh = await startVoiceSession(courseId, r.topicId ?? null, { resume: false });
      if (R.current.ended || R.current.stopping) return;
      r.session = fresh;
      r.lastSeq = -1; // the new session numbers its events from the start
      r.interrupted = false;
      r.pendingResume = false;
      r.awaitingAnswer = false;
      setTopic(fresh.topic ?? null);
      connect(fresh, { resume: false });
    } catch {
      setStatus("error");
      setErrorCode("connection");
      closeAll();
    }
  };

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
      if (resume) {
        ws.send(JSON.stringify({ type: "resume" }));
        R.current.resumePending = true;
        R.current.resumeFallback = () => openFreshLesson(ws);
        clearTimeout(R.current.resumeTimer);
        R.current.resumeTimer = setTimeout(() => openFreshLesson(ws), 15000);
      } else {
        // `start` opens the lesson; the explicit request makes the tutor begin the explanation right away.
        ws.send(JSON.stringify({ type: "start" }));
        const lessonTopic = session.topic || "this course";
        R.current.explainText = `Explain ${lessonTopic} now, starting from the basics.`;
        R.current.tutorSpoke = false;
        ws.send(JSON.stringify({ type: "text", text: R.current.explainText }));
      }
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
      saveTranscript();
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
        saveTranscript();
        closeAll();
        return;
      }
      scheduleReconnect(code);
    }
  };

  // ── teardown ──────────────────────────────────────────────────────────────
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

  // ── public controls ───────────────────────────────────────────────────────
  const start = useCallback(
    async (topicId = null, options = {}) => {
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
      r.savedSignature = null;
      r.pendingResume = false;
      r.awaitingAnswer = false;
      commitTurns([]);
      setVisual(null);
      setSources([]);
      setErrorCode(null);
      setTutorUnavailable(false);
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
        const session = await startVoiceSession(courseId, topicId, { resume: !!options.resume });
        R.current.session = session;
        R.current.topicId = topicId;
        setTopic(session.topic ?? null);
        // The microphone starts closed so the explanation can begin. The hand button opens it
        // when the student wants to speak. Live mic audio is what stalls the voice providers.
        R.current.micOn = false;
        setMicOn(false);
        // A resumed lesson attaches with `resume` (no restart); a new one starts with `start`.
        connect(session, { resume: !!session.resumed });
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
    // Not sending `end`: the lesson stays resumable from chat history.
    setStatus("ended");
    saveTranscript();
    // Give the service a moment to write its summary before closing.
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

  // Stop the tutor right now and let the student speak (the raised-hand / stop button).
  // Stop the tutor now and let the student speak. This only silences the tutor
  // here: nothing is sent to the voice service. Sending an explicit `interrupt`
  // leaves the session in a state where typed questions get no answer, while
  // the service's own barge-in on the student's speech (and a plain `question`)
  // keeps voice answers working.
  const stopTutor = useCallback(() => {
    const r = R.current;
    if (!r.ws) return;
    stopPlayback();
    r.interrupted = true;
    r.pendingResume = true;
    if (r.currentTutorId) {
      const id = r.currentTutorId;
      patchTurn(id, () => ({ final: true, interrupted: true }));
    }
    r.currentTutorId = null;
    if (r.mic && !r.micOn) {
      r.micOn = true;
      setMicOn(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ask the tutor to begin the explanation again (used when no provider could answer the first time).
  const retryExplain = useCallback(() => {
    const r = R.current;
    if (!r.ws || !r.explainText) return;
    setTutorUnavailable(false);
    safeSend({ type: "text", text: r.explainText });
  }, []);

  // Typed question inside the lesson: it appears in the transcript and the tutor answers by voice.
  const ask = useCallback((text) => {
    const r = R.current;
    const clean = (text ?? "").trim();
    if (!clean || !r.ws || r.ws.readyState !== WebSocket.OPEN) return false;
    if (r.pendingResume && CONTINUE_WORDS.test(clean)) {
      // "continue" after a stop: carry on with the explanation, by voice.
      stopPlayback();
      r.interrupted = true; // lifted by resume.started
      r.pendingResume = false;
      r.awaitingAnswer = false;
      addTurn({ role: "student", text: clean, final: true });
      safeSend({ type: "resume" });
      return true;
    }
    stopPlayback();
    r.interrupted = true; // lifted by question.started
    r.pendingResume = true;
    r.awaitingAnswer = true;
    if (r.currentTutorId) {
      const id = r.currentTutorId;
      patchTurn(id, () => ({ final: true, interrupted: true }));
      r.currentTutorId = null;
    }
    addTurn({ role: "student", text: clean, final: true });
    safeSend({ type: "question", text: clean });
    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const r = R.current;
    return () => {
      r.stopping = true;
      saveTranscript();
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
    stopTutor,
    ask,
    tutorUnavailable,
    retryExplain,
  };
}
