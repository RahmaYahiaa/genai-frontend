import { useEffect, useRef } from "react";

/**
 * The voice orb. It breathes slowly when idle, and it moves with the sound
 * level (levelRef) while someone is talking. Motion is reduced for users who
 * ask for reduced motion.
 */
export default function VoiceOrb({ levelRef, state = "idle", size = 220 }) {
  const orbRef = useRef(null);
  const glowRef = useRef(null);
  const ringRef = useRef(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    let smooth = 0;
    let raf = 0;

    const frame = (now) => {
      const t = (now - start) / 1000;
      const st = stateRef.current;
      const target = st === "idle" ? 0 : (levelRef?.current ?? 0);
      smooth += (target - smooth) * 0.22;

      let breathe = 0;
      if (!reduce) {
        if (st === "idle") breathe = 0.025 * Math.sin(t * 1.6);
        if (st === "thinking") breathe = 0.04 * Math.sin(t * 4);
      }
      const scale = 1 + breathe + smooth * 0.38;
      if (orbRef.current) orbRef.current.style.transform = `scale(${scale.toFixed(4)})`;
      if (glowRef.current) {
        glowRef.current.style.opacity = (0.3 + smooth * 0.7).toFixed(3);
        glowRef.current.style.transform = `scale(${(1 + smooth * 0.3).toFixed(4)})`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `scale(${(1.12 + smooth * 0.5 + breathe * 2).toFixed(4)})`;
        ringRef.current.style.opacity = (0.2 + smooth * 0.6).toFixed(3);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [levelRef]);

  const box = { position: "absolute", inset: 0, borderRadius: "50%" };
  return (
    <div aria-hidden="true" style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <div ref={ringRef} style={{ ...box, border: "1px solid rgba(125,155,246,0.45)", transition: "none" }} />
      <div ref={glowRef} style={{ ...box, inset: "-18%", background: "radial-gradient(circle, rgba(61,102,214,0.55) 0%, rgba(27,77,168,0.18) 45%, rgba(27,77,168,0) 70%)", filter: "blur(8px)" }} />
      <div
        ref={orbRef}
        style={{
          ...box,
          background: "radial-gradient(circle at 35% 28%, #E4EDFF 0%, #7D9BF6 28%, #3D66D6 58%, #1B4DA8 82%, #12357A 100%)",
          boxShadow: "inset 0 -18px 40px rgba(255,255,255,0.22), 0 0 60px rgba(61,102,214,0.45)",
        }}
      />
    </div>
  );
}
