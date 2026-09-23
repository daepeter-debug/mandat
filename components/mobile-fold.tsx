"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import "@/app/mobile-fold.css";

/*
  Rozbaľovanie len na mobile: na počítači sa obsah zobrazí celý ako doteraz, na telefóne (do 760 px)
  ostane viditeľný nadpis a obsah sa rozbalí ťuknutím. Server a prvé vykreslenie počítajú s počítačom,
  preto sa na mobile obsah zbalí hneď po načítaní.
*/
const query = "(max-width: 760px)";
const subscribe = (notify: () => void) => { const m = window.matchMedia(query); m.addEventListener("change", notify); return () => m.removeEventListener("change", notify); };
export const useIsMobile = () => useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);

function Toggle({ open, onClick, children }: { open: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" className="fold-toggle" aria-expanded={open} onClick={onClick}><span>{children}</span><ChevronDown size={18} aria-hidden="true"/></button>;
}

/** Článok s nadpisom h3, ktorý sa na mobile zbalí. */
export function Fold({ title, id, defaultOpen = false, children }: { title: string; id?: string; defaultOpen?: boolean; children: ReactNode }) {
  const mobile = useIsMobile();
  const [open, setOpen] = useState(defaultOpen);
  if (!mobile) return <article id={id}><h3>{title}</h3>{children}</article>;
  return <article id={id} className={`fold ${open ? "is-open" : ""}`}><h3><Toggle open={open} onClick={() => setOpen(o => !o)}>{title}</Toggle></h3>{open && <div className="fold-body">{children}</div>}</article>;
}

/** Celá sekcia (napr. dlhý zoznam zdrojov), ktorá sa na mobile zbalí pod jeden riadok. */
export function MobileCollapse({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  const mobile = useIsMobile();
  const [open, setOpen] = useState(false);
  if (!mobile) return <>{children}</>;
  return <div className={`mobile-collapse ${open ? "is-open" : ""}`}>
    <Toggle open={open} onClick={() => setOpen(o => !o)}>{label}{hint && <small>{hint}</small>}</Toggle>
    {open && <div className="mobile-collapse-body">{children}</div>}
  </div>;
}
