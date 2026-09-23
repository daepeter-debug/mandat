"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Pause, Volume2 } from "lucide-react";
import { hasRecording, playRecording } from "@/lib/audio-play";
import { track } from "@/lib/track";
import "@/app/listen-button.css";

// Tlačidlo „Vypočuj si“ pri texte: prehrá vopred nahranú nahrávku neurálnym hlasom (lib/audio, scripts/import-audio.mjs).
// Naraz hrá len jedna nahrávka na stránke. Bez nahrávky (src) sa tlačidlo neukáže.
const EVENT = "mandat-audio-play";
// Prehrávač sa vytvára mimo komponentu (poslucháče udalostí sa naň pripájajú len tu); tichý zvuk na odomknutie sa nepočíta.
function createAudio(onTime: (p: number) => void, onEnd: () => void) {
  const a = new Audio();
  a.addEventListener("timeupdate", () => { if (hasRecording(a)) onTime(a.duration ? a.currentTime / a.duration : 0); });
  a.addEventListener("ended", () => { if (hasRecording(a)) onEnd(); });
  return a;
}
const fmtTime = (ms: number) => { const s = Math.max(1, Math.round(ms / 1000)); return s < 60 ? `${s} s` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")} min`; };

export default function ListenButton({ src, ms, label = "Vypočuj si", credit = "Hlas: ElevenLabs (AI)", id }: { src?: string; ms?: number; label?: string; credit?: string; id: string }) {
  const [state, setState] = useState<"idle" | "loading" | "playing">("idle");
  const [progress, setProgress] = useState(0);
  const audio = useRef<HTMLAudioElement | null>(null);
  const ticket = useRef(0);
  useEffect(() => {
    // Zruší aj rozbehnuté sťahovanie (nová otázka, iná nahrávka, odchod zo stránky).
    const cancel = () => { ticket.current++; audio.current?.pause(); };
    const other = (e: Event) => { if ((e as CustomEvent).detail !== id) { cancel(); setState("idle"); } };
    window.addEventListener(EVENT, other);
    return () => { window.removeEventListener(EVENT, other); cancel(); };
  }, [id]);
  if (!src) return null;
  function toggle() {
    const a = audio.current ?? (audio.current = createAudio(setProgress, () => { setState("idle"); setProgress(0); }));
    if (state !== "idle") { ticket.current++; a.pause(); setState("idle"); return; }
    window.dispatchEvent(new CustomEvent(EVENT, { detail: id }));
    const t = ++ticket.current;
    setState("loading");
    playRecording(a, src!, () => ticket.current === t)
      .then(ok => { if (ok && ticket.current === t) { setState("playing"); track("listen", id); } })
      .catch(() => { if (ticket.current === t) setState("idle"); });
  }
  const busy = state === "loading";
  return <button type="button" className="listen-button" aria-pressed={state !== "idle"} aria-busy={busy} onClick={toggle} title={credit} style={{ "--p": progress } as React.CSSProperties}>
    <span className="listen-icon" aria-hidden="true">{busy ? <LoaderCircle size={15}/> : state === "playing" ? <Pause size={15}/> : <Volume2 size={15}/>}</span>
    <span className="listen-text">{busy ? "Načítavam…" : state === "playing" ? "Zastaviť" : label}<small>{ms ? `${fmtTime(ms)} · ` : ""}hlas AI</small></span>
  </button>;
}
