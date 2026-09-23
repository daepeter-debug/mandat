"use client";

import { lazy, Suspense, useState, useSyncExternalStore } from "react";
import { Play } from "lucide-react";
import { edition } from "@/lib/edition";
import { date } from "@/lib/polls";
import { track } from "@/lib/track";
import "@/app/minute-launch.css";

// Tlačidlo „Mandát za minútu“ na úvode (krúžok ako pri príbehoch na sociálnych sieťach). Kým čitateľ príbeh
// tohto vydania nevidel, krúžok je farebný; potom sivý (pamätá sa dátum vydania v prehliadači).
const MandatStory = lazy(() => import("@/components/mandat-story"));
const KEY = "mandat-story-seen";
const EVENT = "mandat-story";
const preload = () => { void import("@/components/mandat-story"); };

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => { window.removeEventListener(EVENT, onChange); window.removeEventListener("storage", onChange); };
}
const seenNow = () => { try { return localStorage.getItem(KEY) === edition.asOf; } catch { return false; } };

export default function MinuteLaunch({ onYear, onNavigate }: { onYear: (year: number) => void; onNavigate: (view: string) => void }) {
  const seen = useSyncExternalStore(subscribe, seenNow, () => false);
  const [open, setOpen] = useState(false);
  const change = (next: boolean) => {
    setOpen(next);
    if (next) return;
    try { localStorage.setItem(KEY, edition.asOf); } catch { /* súkromné okno */ }
    window.dispatchEvent(new Event(EVENT));
  };
  return <>
    <button type="button" className={`minute-launch${seen ? " is-seen" : ""}`} aria-haspopup="dialog" onPointerEnter={preload} onPointerDown={preload} onFocus={preload} onClick={() => { setOpen(true); track("story", "open"); }}>
      <span className="minute-ring" aria-hidden="true"><span><svg viewBox="0 0 64 64"><g fill="#f5f4ee"><circle cx="10" cy="43" r="4.6"/><circle cx="16.4" cy="27.4" r="4.6"/><circle cx="32" cy="21" r="4.6"/><circle cx="21" cy="43" r="4.6"/><circle cx="32" cy="32" r="4.6"/></g><g fill="#9dbb86"><circle cx="47.6" cy="27.4" r="4.6"/><circle cx="54" cy="43" r="4.6"/><circle cx="43" cy="43" r="4.6"/></g></svg></span></span>
      <span className="minute-text"><b>Mandát za minútu</b><small>6 kariet · údaje k {date(edition.asOf)}</small></span>
      <Play size={15} aria-hidden="true"/>
    </button>
    {open && <Suspense fallback={null}><MandatStory open onOpenChange={change} onYear={onYear} onNavigate={onNavigate}/></Suspense>}
  </>;
}
