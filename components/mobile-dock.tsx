"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Armchair, BarChart3, BookOpen, CalendarRange, FileText, Gamepad2, Home, Landmark, LayoutGrid, Newspaper, PieChart, Scale, SlidersHorizontal, Users, Wallet } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import InstallApp from "@/components/app-install";
import "@/app/mobile-dock.css";

/*
  Mobilná navigácia pri palci: päť tlačidiel dole (štyri hlavné sekcie a Viac). „Viac“ otvorí
  spodný panel so všetkými ostatnými sekciami a inštaláciou na plochu (tmavý režim je v hlavičke). Na počítači sa nezobrazuje; horná
  lišta záložiek je na mobile skrytá (preberá ju táto navigácia).
*/
const primary: { id: string; label: string; icon: ReactNode }[] = [
  { id: "overview", label: "Prehľad", icon: <Home/> },
  { id: "polls", label: "Prieskumy", icon: <BarChart3/> },
  { id: "news", label: "Správy", icon: <Newspaper/> },
  { id: "parties", label: "Strany", icon: <Users/> },
];
const details: Record<string, { icon: ReactNode; text: string }> = {
  parliament: { icon: <Armchair/>, text: "3D sála, hlasovania a poslanci" },
  finance: { icon: <Wallet/>, text: "Deficit, dlh, dane a životná úroveň" },
  responsibility: { icon: <Landmark/>, text: "Kto vládol a čo zažil tvoj ročník" },
  cases: { icon: <Scale/>, text: "Register prípadov" },
  data: { icon: <PieChart/>, text: "Polkruhy, bloky a agentúry" },
  model: { icon: <SlidersHorizontal/>, text: "Posuňte percentá, zostavte väčšinu" },
  programmes: { icon: <FileText/>, text: "Programy strán a archív 2023" },
  game: { icon: <Gamepad2/>, text: "Tri hry o rozhodovaní" },
  method: { icon: <BookOpen/>, text: "Zdroje, metodika a hranice dát" },
};

// Pri čítaní (skrolovanie nadol) sa lišta zmenší na ikony, pri pohybe nahor alebo na konci stránky sa rozbalí.
function useCompactOnScroll() {
  const [compact, setCompact] = useState(false);
  const last = useRef(0);
  useEffect(() => {
    last.current = window.scrollY;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const y = window.scrollY, dy = y - last.current;
        const atEnd = window.innerHeight + y >= document.documentElement.scrollHeight - 40;
        if (y < 80 || atEnd || dy < -6) setCompact(false);
        else if (dy > 6) setCompact(true);
        if (Math.abs(dy) > 6) last.current = y;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(frame); };
  }, []);
  return compact;
}

/*
  iOS (najmä aplikácia nainštalovaná na ploche) po zatvorení klávesnice občas nechá prvky s position: fixed posunuté
  a lišta potom visí v strede obrazovky, kým sa aplikácia nereštartuje. Lištu preto posúvame k spodku viditeľnej plochy
  podľa visualViewport (bez rozdielu je posun 0); pri priblížení prstami sa nehýbe. Kým je otvorená klávesnica,
  lištu skryje CSS (app/mobile-dock.css).
*/
function useViewportShift() {
  const [shift, setShift] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    let frame = 0, late = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const gap = vv.scale > 1.01 ? 0 : Math.round(vv.offsetTop + vv.height - window.innerHeight);
        setShift(Math.abs(gap) < 2 ? 0 : gap);
      });
    };
    // Po zatvorení klávesnice sa rozmery ustália až po animácii; skontrolovať aj o chvíľu neskôr.
    const settle = () => { update(); clearTimeout(late); late = window.setTimeout(update, 450); };
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    window.addEventListener("focusout", settle);
    window.addEventListener("orientationchange", settle);
    update();
    return () => {
      vv.removeEventListener("resize", update); vv.removeEventListener("scroll", update);
      window.removeEventListener("focusout", settle); window.removeEventListener("orientationchange", settle);
      cancelAnimationFrame(frame); clearTimeout(late);
    };
  }, []);
  return shift;
}

export default function MobileDock({ views, active, onView }: { views: { id: string; label: string }[]; active: string; onView: (id: string) => void }) {
  const [more, setMore] = useState(false);
  const compact = useCompactOnScroll();
  const shift = useViewportShift();
  const rest = views.filter(v => !primary.some(p => p.id === v.id));
  const inRest = rest.some(v => v.id === active);
  const index = inRest || more ? primary.length : Math.max(0, primary.findIndex(p => p.id === active));
  const go = (id: string) => { setMore(false); onView(id); };
  return <>
    <nav className={`mobile-dock${compact && !more ? " is-compact" : ""}`} aria-label="Hlavné sekcie" style={{ "--dock-index": index, "--dock-count": primary.length + 1, ...(shift ? { translate: `0 ${shift}px` } : {}) } as CSSProperties}>
      <span className="mobile-dock-glider" aria-hidden="true"/>
      {primary.map(p => <button key={p.id} type="button" aria-current={active === p.id ? "page" : undefined} onClick={() => go(p.id)}>{p.icon}<span>{p.label}</span></button>)}
      <button type="button" aria-expanded={more} aria-current={inRest ? "page" : undefined} onClick={() => setMore(true)}><LayoutGrid/><span>Viac</span></button>
    </nav>
    <Sheet open={more} onOpenChange={setMore}>
      <SheetContent side="bottom" className="mobile-more">
        <SheetHeader className="mobile-more-head"><SheetTitle>Všetky sekcie</SheetTitle><SheetDescription className="sr-only">Prejsť na inú sekciu Mandátu.</SheetDescription></SheetHeader>
        <ul>{rest.map(v => <li key={v.id}><button type="button" aria-current={active === v.id ? "page" : undefined} onClick={() => go(v.id)}>{details[v.id]?.icon ?? <CalendarRange/>}<b>{v.label}</b><small>{details[v.id]?.text ?? ""}</small></button></li>)}</ul>
        <div className="mobile-more-settings"><InstallApp onPrepareHome={() => onView("overview")}/></div>
      </SheetContent>
    </Sheet>
  </>;
}
