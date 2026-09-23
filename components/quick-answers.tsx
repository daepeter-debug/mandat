"use client";

import { createContext, lazy, Suspense, useContext, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { ArrowRight, Crown, Landmark, Scale, Split, Users, Wallet } from "lucide-react";
import ListenButton from "@/components/listen-button";
import quickAudio from "@/lib/audio/quick.json";
import { currentAggregate } from "@/lib/aggregate";
import { MAJORITY } from "@/lib/blocs";
import { edition } from "@/lib/edition";
import { fmt, parties } from "@/lib/polls";
import { systematicErrors } from "@/lib/poll-accuracy";
import { currentSeatUncertainty, inRuns, thresholdStatus } from "@/lib/uncertainty";
import { voiceItem } from "@/lib/voice";
import "@/app/quick-answers.css";

/*
  Rýchle odpovede na úvode: šesť otázok, každá odpoveď je jeden obrázok a jedna veta.
  Čísla sú z Modelu Mandát (lib/edition, lib/uncertainty), dlh z Eurostatu (načíta sa až pri otvorení).
  Hlasová verzia každej odpovede: lib/narration.ts (quickNarrations) → lib/audio/quick.json.
*/
const DebtAnswer = lazy(() => import("@/components/quick-debt"));
const party = (id: string) => parties.find(p => p.id === id);
const values = Object.values(currentAggregate.values).sort((a, b) => b.value - a.value);
const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

// Čísla nabehnú od nuly, keď čitateľ prepne otázku. Prvá odpoveď pri načítaní stránky sa ukáže hneď
// (rovnako na serveri aj v prehliadači); pri „obmedziť pohyb“ alebo skrytej karte tiež bez animácie.
const Animate = createContext(false);
function CountUp({ value, digits = 0, suffix = "" }: { value: number; digits?: number; suffix?: string }) {
  const animate = useContext(Animate);
  const [progress, setProgress] = useState(animate ? 0 : 1);
  useEffect(() => {
    if (progress >= 1) return;
    if (document.hidden || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const timer = window.setTimeout(() => setProgress(1), 0);
      return () => window.clearTimeout(timer);
    }
    let frame = 0; const start = performance.now();
    const step = (now: number) => { const p = Math.min(1, (now - start) / 700); setProgress(p); if (p < 1) frame = requestAnimationFrame(step); };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- animácia sa spustí raz pri zobrazení
  }, []);
  const shown = value * (1 - Math.pow(1 - progress, 3));
  return <>{shown.toLocaleString("sk-SK", { minimumFractionDigits: digits, maximumFractionDigits: digits })}{suffix}</>;
}

function Winner() {
  const [a, b] = values;
  const u = currentSeatUncertainty().parties;
  const pa = party(a.partyId)!, pb = party(b.partyId)!;
  const fa = u[a.partyId]?.first ?? 0, fb = u[b.partyId]?.first ?? 0;
  const under = systematicErrors().filter(x => x.sameSign && x.mean <= -2);
  return <div className="qa-card qa-duel" style={{ "--a": pa.color, "--b": pb.color } as CSSProperties}>
    <div className="qa-duel-sides">
      <span><b>{pa.short}</b><strong><CountUp value={a.value} digits={1} suffix=" %"/></strong></span>
      <em>vs</em>
      <span><b>{pb.short}</b><strong><CountUp value={b.value} digits={1} suffix=" %"/></strong></span>
    </div>
    <div className="qa-tug" aria-hidden="true"><i className="qa-tug-a" style={{ width: `${fa / (fa + fb || 1) * 100}%` }}/><i className="qa-tug-b"/></div>
    <p className="qa-say">Prvé miesto v Modeli Mandát: <b>{pa.short} {inRuns(fa)}</b>{fb > 0.05 ? <>, {pb.short} {inRuns(fb)}</> : null}.</p>
    {under.length > 0 && <p className="qa-fine">Pozor: v roku 2023 prieskumy podcenili {under.map(x => x.short).join(" a ")} priemerne o {fmt(Math.abs(under[0].mean))} b.</p>}
  </div>;
}

function Majority() {
  const u = currentSeatUncertainty().blocs;
  const w = edition.withPartners;
  const coalition = w.coalition, opposition = w.opposition, others = 150 - coalition - opposition;
  const winner = opposition >= MAJORITY ? { label: w.oppositionLabel, share: u.oppositionWith.majority } : coalition >= MAJORITY ? { label: w.coalitionLabel, share: u.coalitionWith.majority } : null;
  return <div className="qa-card">
    <div className="qa-seats" aria-hidden="true">
      <i className="qa-seats-c" style={{ flexGrow: coalition }}/><i className="qa-seats-o" style={{ flexGrow: others }}/><i className="qa-seats-p" style={{ flexGrow: opposition }}/>
      <s style={{ left: `${MAJORITY / 150 * 100}%` }}/><s style={{ right: `${MAJORITY / 150 * 100}%` }}/>
    </div>
    <div className="qa-seats-legend"><span><b><CountUp value={coalition}/></b>{w.coalitionLabel}</span><span className="qa-mid">väčšina {MAJORITY}</span><span><b><CountUp value={opposition}/></b>{w.oppositionLabel}</span></div>
    <p className="qa-say">{winner ? <>Väčšinu by mala <b>{lowerFirst(winner.label)}</b>, {inRuns(winner.share)}.</> : <>Väčšinu {MAJORITY} kresiel by <b>nemal ani jeden blok</b>.</>} Bez partnerov: koalícia {edition.now.coalition}, opozícia {edition.now.opposition}.</p>
    <p className="qa-fine">Priradenie Republiky ku koalícii a Hnutia Slovensko k opozícii je redakčný predpoklad, nie dohoda strán.</p>
  </div>;
}

function Edge() {
  const u = currentSeatUncertainty().parties;
  const near = values.filter(v => v.upper >= 3 && v.lower <= 7.5);
  const min = 1, max = 10, x = (v: number) => `${(Math.min(max, Math.max(min, v)) - min) / (max - min) * 100}%`;
  const edge = near.filter(v => thresholdStatus(v) === "edge");
  return <div className="qa-card">
    <div className="qa-line" aria-hidden="true" style={{ height: near.length * 22 + 30 }}>
      <span className="qa-line-limit" style={{ left: x(5) }}><em>5 %</em></span>
      {near.map((v, i) => { const p = party(v.partyId)!; return <span key={v.partyId} className={`qa-line-row ${thresholdStatus(v) === "edge" ? "is-edge" : ""}`} style={{ top: `${i * 22 + 26}px`, "--c": p.color } as CSSProperties}>
        <i style={{ left: x(v.lower), width: `calc(${x(v.upper)} - ${x(v.lower)})` }}/><b style={{ left: x(v.value) }}/><small style={{ left: x(v.upper) }}>{p.short}</small>
      </span>; })}
    </div>
    <p className="qa-say">{edge.length ? edge.map((v, i) => <span key={v.partyId}>{i > 0 && ", "}<b>{party(v.partyId)?.short}</b>: nad 5 % <b>{inRuns(u[v.partyId]?.entry ?? 0)}</b></span>) : "Pásmo žiadnej strany dnes nepretína hranicu 5 %"}.</p>
  </div>;
}

function Wasted() {
  const below = values.filter(v => v.value < 5 && v.value >= 1);
  const share = below.reduce((a, v) => a + v.value, 0);
  const part = share >= 18 && share <= 22 ? "každý piaty" : share >= 9 && share <= 11 ? "každý desiaty" : null;
  return <div className="qa-card qa-wasted">
    <div className="qa-big"><strong><CountUp value={share} digits={0} suffix=" %"/></strong><span>hlasov by dnes<br/>nemalo zástupcu</span></div>
    <div className="qa-stack" aria-hidden="true">{below.map(v => <i key={v.partyId} style={{ flexGrow: v.value, background: party(v.partyId)?.color }} title={`${party(v.partyId)?.short} ${fmt(v.value)} %`}/>)}<i className="qa-stack-rest" style={{ flexGrow: 100 - share }}/></div>
    <p className="qa-say">Približne <b>{part ?? `${Math.round(share)} zo 100`}</b> {part ? "hlas by prepadol" : "hlasov by prepadlo"}: {below.map(v => party(v.partyId)?.short).join(", ")}.</p>
  </div>;
}

function YourYear({ onYear }: { onYear: (year: number) => void }) {
  const [year, setYear] = useState("");
  const valid = /^\d{4}$/.test(year) && Number(year) >= 1920 && Number(year) <= 2026;
  return <form className="qa-card qa-year" onSubmit={e => { e.preventDefault(); if (valid) onYear(Number(year)); }}>
    <label htmlFor="qa-year">Rok narodenia</label>
    <div><input id="qa-year" inputMode="numeric" maxLength={4} placeholder="napr. 1990" value={year} onChange={e => setYear(e.target.value.replace(/\D/g, "").slice(0, 4))}/><button type="submit" className="mag-button" disabled={!valid}>Ukáž <ArrowRight size={17}/></button></div>
    <p className="qa-say">Koľko vlád a premiérov zažil tvoj ročník, kto vládol na tvoje 18. narodeniny a ako sa zmenil dlh, mzdy a ceny.</p>
  </form>;
}

type Question = { id: string; label: string; icon: ReactNode };
const questions: Question[] = [
  { id: "winner", label: "Kto by dnes vyhral?", icon: <Crown size={16}/> },
  { id: "majority", label: "Má niekto väčšinu?", icon: <Scale size={16}/> },
  { id: "edge", label: "Kto je na hrane 5 %?", icon: <Split size={16}/> },
  { id: "wasted", label: "Koľko hlasov prepadne?", icon: <Users size={16}/> },
  { id: "debt", label: "Aký veľký je dlh?", icon: <Wallet size={16}/> },
  { id: "year", label: "Čo zažil môj ročník?", icon: <Landmark size={16}/> },
];

export default function QuickAnswers({ onYear }: { onYear: (year: number) => void }) {
  const [active, setActive] = useState("winner");
  const [switched, setSwitched] = useState(false);
  const voice = voiceItem(quickAudio, active);
  return <section className="qa" aria-labelledby="qa-title">
    <h2 id="qa-title">Rýchle odpovede</h2>
    <div className="qa-questions" role="tablist" aria-label="Otázky">
      {questions.map(q => <button key={q.id} type="button" role="tab" id={`qa-tab-${q.id}`} aria-selected={active === q.id} aria-controls="qa-panel" onClick={() => { setActive(q.id); setSwitched(true); }}>{q.icon}{q.label}</button>)}
    </div>
    <Animate.Provider value={switched}><div className="qa-panel" id="qa-panel" role="tabpanel" aria-labelledby={`qa-tab-${active}`} key={active}>
      {active === "winner" && <Winner/>}
      {active === "majority" && <Majority/>}
      {active === "edge" && <Edge/>}
      {active === "wasted" && <Wasted/>}
      {active === "debt" && <Suspense fallback={<div className="qa-card qa-loading"/>}><DebtAnswer/></Suspense>}
      {active === "year" && <YourYear onYear={onYear}/>}
      <ListenButton id={`rychla-${active}`} src={voice?.src} ms={voice?.ms} label="Vypočuj si odpoveď" credit={quickAudio.credit}/>
    </div></Animate.Provider>
  </section>;
}
