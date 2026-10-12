import { useEffect, useRef, useState } from "react";

/**
 * Reads the microphone level (0..1) while `active` is true.
 * Used to move the voice orb with the student's voice. Nothing is recorded
 * or sent anywhere from here: the level is only used for the animation.
 */
export default function useMicLevel(active) {
  const levelRef = useRef(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!active) {
      levelRef.current = 0;
      return undefined;
    }
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!navigator.mediaDevices?.getUserMedia || !AudioCtx) {
      setError("unavailable");
      return undefined;
    }
    let cancelled = false;
    let stream = null;
    let ctx = null;
    let raf = 0;
    setError(null);

    navigator.mediaDevices
      .getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = s;
        ctx = new AudioCtx();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        ctx.createMediaStreamSource(stream).connect(analyser);
        const buf = new Uint8Array(analyser.fftSize);
        const tick = () => {
          analyser.getByteTimeDomainData(buf);
          let sum = 0;
          for (let i = 0; i < buf.length; i += 1) {
            const v = (buf[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / buf.length);
          levelRef.current = levelRef.current * 0.7 + Math.min(1, rms * 4) * 0.3;
          raf = requestAnimationFrame(tick);
        };
        tick();
      })
      .catch((err) => {
        if (!cancelled) setError(err?.name === "NotAllowedError" ? "denied" : "unavailable");
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((track) => track.stop());
      if (ctx) ctx.close().catch(() => {});
      levelRef.current = 0;
    };
  }, [active]);

  return { levelRef, error };
}
