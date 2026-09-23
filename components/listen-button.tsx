"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Volume2 } from "lucide-react";
import { track } from "@/lib/track";
import "@/app/listen-button.css";

// Tlačidlo „Vypočuj si“ pri texte: prehrá vopred vygenerovanú nahrávku neurálnym hlasom (scripts/build-audio.mjs).
// Naraz hrá len jedna nahrávka na stránke. Bez nahrávky (src) sa tlačidlo neukáže.
const EVENT = "mandat-audio-play";
// Prehrávač sa vytvára mimo komponentu (poslucháče udalostí sa naň pripájajú len tu).
function createAudio(src: string, onTime: (p: number) => void, onEnd: () => void) {
  const a = new Audio(src);
  a.addEventListener("timeupdate", () => onTime(a.duration ? a.currentTime / a.duration : 0));
  a.addEventListener("ended", onEnd);
  return a;
}
const fmtTime = (ms: number) => { const s = Math.max(1, Math.round(ms / 1000)); return s < 60 ? `${s} s` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")} min`; };

export default function ListenButton({ src, ms, label = "Vypočuj si", credit = "Hlas: ElevenLabs (AI)", id }: { src?: string; ms?: number; label?: string; credit?: string; id: string }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const audio = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    const other = (e: Event) => { if ((e as CustomEvent).detail !== id) { audio.current?.pause(); setPlaying(false); } };
    window.addEventListener(EVENT, other);
    return () => { window.removeEventListener(EVENT, other); audio.current?.pause(); };
  }, [id]);
  if (!src) return null;
  function toggle() {
    const a = audio.current ?? (audio.current = createAudio(src!, setProgress, () => { setPlaying(false); setProgress(0); }));
    if (playing) { a.pause(); setPlaying(false); return; }
    window.dispatchEvent(new CustomEvent(EVENT, { detail: id }));
    void a.play().then(() => { setPlaying(true); track("listen", id); }).catch(() => setPlaying(false));
  }
  return <button type="button" className="listen-button" aria-pressed={playing} onClick={toggle} title={credit} style={{ "--p": progress } as React.CSSProperties}>
    <span className="listen-icon" aria-hidden="true">{playing ? <Pause size={15}/> : <Volume2 size={15}/>}</span>
    <span className="listen-text">{playing ? "Zastaviť" : label}<small>{ms ? `${fmtTime(ms)} · ` : ""}hlas AI</small></span>
  </button>;
}
