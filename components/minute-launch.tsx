"use client";

import { useRef, useState, useSyncExternalStore, type ComponentType } from "react";
import { Play } from "lucide-react";
import { edition } from "@/lib/edition";
import { canMorph, morphBack, morphTo } from "@/lib/morph";
import { date } from "@/lib/polls";
import { track } from "@/lib/track";
import "@/app/minute-launch.css";

// Tlačidlo „Mandát za minútu“ na úvode (krúžok ako pri príbehoch na sociálnych sieťach). Kým čitateľ príbeh
// tohto vydania nevidel, krúžok je farebný; potom sivý (pamätá sa dátum vydania v prehliadači).
// Pri otvorení sa krúžok plynulo roztiahne do karty príbehu a pri zatvorení sa do neho vráti (lib/morph.ts).
type StoryProps = { open: boolean; morph?: boolean; onOpenChange: (open: boolean) => void; onYear: (year: number) => void; onNavigate: (view: string) => void };
const KEY = "mandat-story-seen";
const EVENT = "mandat-story";
const load = () => import("@/components/mandat-story");
const preload = () => { void load(); };

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => { window.removeEventListener(EVENT, onChange); window.removeEventListener("storage", onChange); };
}
const seenNow = () => { try { return localStorage.getItem(KEY) === edition.asOf; } catch { return false; } };

export default function MinuteLaunch({ onYear, onNavigate }: { onYear: (year: number) => void; onNavigate: (view: string) => void }) {
  const seen = useSyncExternalStore(subscribe, seenNow, () => false);
  const [Story, setStory] = useState<ComponentType<StoryProps> | null>(null);
  const [open, setOpen] = useState(false);
  const [morph, setMorph] = useState(false);
  const ring = useRef<HTMLSpanElement>(null);

  async function openStory() {
    track("story", "open");
    const component = (await load()).default as ComponentType<StoryProps>;
    const show = (animated: boolean) => { setStory(() => component); setMorph(animated); setOpen(true); };
    if (canMorph(ring.current)) morphTo(ring.current, "mandat-story", "vt-story", () => show(true));
    else show(false);
  }
  function closeStory() {
    const hide = () => setOpen(false);
    if (morph && canMorph(ring.current)) morphBack(ring.current, "mandat-story", "vt-story", hide);
    else hide();
    try { localStorage.setItem(KEY, edition.asOf); } catch { /* súkromné okno */ }
    window.dispatchEvent(new Event(EVENT));
  }

  return <>
    <button type="button" className={`minute-launch${seen ? " is-seen" : ""}`} aria-haspopup="dialog" onPointerEnter={preload} onPointerDown={preload} onFocus={preload} onClick={() => { void openStory(); }}>
      <span className="minute-ring" ref={ring} aria-hidden="true"><span><svg viewBox="0 0 64 64"><g fill="#f5f4ee"><circle cx="10" cy="43" r="4.6"/><circle cx="16.4" cy="27.4" r="4.6"/><circle cx="32" cy="21" r="4.6"/><circle cx="21" cy="43" r="4.6"/><circle cx="32" cy="32" r="4.6"/></g><g fill="#9dbb86"><circle cx="47.6" cy="27.4" r="4.6"/><circle cx="54" cy="43" r="4.6"/><circle cx="43" cy="43" r="4.6"/></g></svg></span></span>
      <span className="minute-text"><b>Mandát za minútu</b><small>6 kariet · údaje k {date(edition.asOf)}</small></span>
      <Play size={15} aria-hidden="true"/>
    </button>
    {open && Story && <Story open morph={morph} onOpenChange={next => { if (!next) closeStory(); }} onYear={onYear} onNavigate={onNavigate}/>}
  </>;
}
