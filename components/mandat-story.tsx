"use client";

import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type KeyboardEvent, type PointerEvent } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { ArrowDownRight, ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play, Share2, X } from "lucide-react";
import { MAJORITY } from "@/lib/blocs";
import { edition, signed } from "@/lib/edition";
import { date, fmt } from "@/lib/polls";
import { blocs, debtAt, debtLastMeur, debtPerSecond, debtYear, down, edge, leader, lowerFirst, majorityWinner, population, pollWordNew, ranked, seatPoints, seatSide, slides, storyParty, up, type SlideId } from "@/lib/story-data";
import { track } from "@/lib/track";
import { currentSeatUncertainty, inRuns } from "@/lib/uncertainty";
import { isBirthYear } from "@/lib/your-slovakia";
import { storyCardImage } from "@/components/story-image";
import "@/app/story.css";

/*
  „Mandát za minútu“: šesť kariet ako príbeh na sociálnych sieťach. Karta sa po pár sekundách sama posunie
  (prúžky hore), ťuknutie vpravo/vľavo = ďalšia/predchádzajúca, podržanie = pauza, potiahnutie dole = zavrieť,
  na klávesnici šípky, medzerník a Esc. Pri „obmedziť pohyb“ sa karty neposúvajú samy a čísla nenabiehajú.
  Tlačidlo Zdieľať uloží kartu ako obrázok 1080 × 1920 (components/story-image.ts); na mobile otvorí zdieľanie.
  Dáta: lib/story-data.ts (rovnaké čísla ako na úvode).
*/
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function Count({ value, digits = 0 }: { value: number; digits?: number }) {
  const [shown, setShown] = useState(() => reducedMotion() ? value : 0);
  useEffect(() => {
    if (reducedMotion()) return;
    let frame = 0;
    const start = performance.now();
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / 850);
      setShown(value * (1 - (1 - k) ** 3));
      if (k < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  const format = (v: number) => v.toLocaleString("sk-SK", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  // Čítačka obrazovky dostane hneď konečnú hodnotu, nie nabiehajúce číslo.
  return <><span aria-hidden="true">{format(shown)}</span><span className="sr-only">{format(value)}</span></>;
}

function DebtSlide() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), reducedMotion() ? 1000 : 100);
    return () => window.clearInterval(id);
  }, []);
  const debt = debtAt(now);
  return <>
    <p className="story-big story-debt">{(debt / 1e9).toLocaleString("sk-SK", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}<small> mld. €</small></p>
    <ul className="story-facts">
      <li><b>+{Math.round(debtPerSecond).toLocaleString("sk-SK")} €</b><span>každú sekundu</span></li>
      <li><b>{Math.round(debt / population).toLocaleString("sk-SK")} €</b><span>na obyvateľa</span></li>
    </ul>
    <p className="story-fine">Odhad tempom rastu dlhu v roku {debtYear}. Posledný údaj Eurostatu: {(debtLastMeur / 1000).toLocaleString("sk-SK", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mld. € ku koncu roka {debtYear}.</p>
  </>;
}

const Dot = ({ id }: { id: string }) => <i className="story-dot" style={{ background: storyParty(id)?.color ?? "#8a968c" }} aria-hidden="true"/>;

function Slide({ id, onYear, onCoalition, onPolls }: { id: SlideId; onYear: (y: number) => void; onCoalition: () => void; onPolls: () => void }) {
  const u = currentSeatUncertainty();
  const [year, setYear] = useState("");
  const [yearError, setYearError] = useState(false);
  if (id === "leader") {
    const top = ranked.slice(0, 5);
    const max = Math.max(...top.map(v => v.upper));
    return <>
      <p className="story-party"><Dot id={leader.partyId}/>{storyParty(leader.partyId)?.short}</p>
      <p className="story-big"><Count value={leader.value} digits={1}/><small> %</small></p>
      <p className="story-text">Pásmo neistoty {fmt(leader.lower)}–{fmt(leader.upper)} %. Prvé miesto {inRuns(u.parties[leader.partyId]?.first ?? 0)}.</p>
      <ol className="story-bars" aria-label="Päť strán s najvyššou podporou">
        {top.map((v, i) => <li key={v.partyId} style={{ "--w": v.value / max, "--c": storyParty(v.partyId)?.color, "--i": i } as CSSProperties}><span>{storyParty(v.partyId)?.short}</span><i aria-hidden="true"/><b>{fmt(v.value)} %</b></li>)}
      </ol>
    </>;
  }
  if (id === "seats") {
    const winner = majorityWinner();
    return <>
      <svg className="story-hemi" viewBox="-1.08 -1.08 2.16 1.16" role="img" aria-label={`${blocs.coalitionLabel} ${blocs.coalition} kresiel, ${lowerFirst(blocs.oppositionLabel)} ${blocs.opposition} kresiel, ostatní ${150 - blocs.coalition - blocs.opposition}.`}>
        {seatPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={0.034} className={`is-${seatSide(i)}`} style={{ "--i": i } as CSSProperties}/>)}
      </svg>
      <div className="story-vs"><span className="is-c"><b><Count value={blocs.coalition}/></b>{blocs.coalitionLabel}</span><em>väčšina {MAJORITY}</em><span className="is-o"><b><Count value={blocs.opposition}/></b>{blocs.oppositionLabel}</span></div>
      <p className="story-text">{winner ? <>Väčšinu by mala {lowerFirst(winner.label)}, {inRuns(winner.share)}.</> : <>Väčšinu by nemal ani jeden blok.</>}</p>
      <p className="story-fine">Republiku ku koalícii a Hnutie Slovensko k opozícii radíme ako redakčný predpoklad, nie dohodu strán.</p>
    </>;
  }
  if (id === "month") return <>
    <ul className="story-moves">
      {up && <li className="is-up"><ArrowUpRight aria-hidden="true"/><span><Dot id={up.id}/>{up.short}<small>teraz {fmt(up.value)} %</small></span><strong>{signed(up.delta)}<small> p. b.</small></strong></li>}
      {down && <li className="is-down"><ArrowDownRight aria-hidden="true"/><span><Dot id={down.id}/>{down.short}<small>teraz {fmt(down.value)} %</small></span><strong>{signed(down.delta)}<small> p. b.</small></strong></li>}
    </ul>
    <p className="story-text">Najväčší rast a pokles v Modeli Mandát od {date(edition.monthAgo)}. Za ten čas pribudlo {edition.newPolls.length} {pollWordNew(edition.newPolls.length)}.</p>
  </>;
  if (id === "edge") return edge.length ? <>
    <div className="story-line" aria-hidden="true">
      <div className="story-line-row is-scale"><span/><div><span>0 %</span><span>5 %</span><span>10 %</span></div><em/></div>
      {edge.map((v, i) => <div key={v.partyId} className="story-line-row" style={{ "--l": Math.max(0, v.lower) / 10, "--u": Math.min(10, v.upper) / 10, "--v": Math.min(10, v.value) / 10, "--c": storyParty(v.partyId)?.color, "--i": i } as CSSProperties}>
        <span>{storyParty(v.partyId)?.short}</span><div><s/><i/><b/></div><em>{fmt(v.value)} %</em>
      </div>)}
    </div>
    <p className="story-text">{edge.map((v, i) => <span key={v.partyId}>{i > 0 && " · "}<b>{storyParty(v.partyId)?.short}</b> nad 5 % {inRuns(u.parties[v.partyId]?.entry ?? 0)}</span>)}.</p>
    <p className="story-fine">Pásmo neistoty týchto strán pretína hranicu 5 %. O vstupe do parlamentu rozhodnú voľby, nie prieskum.</p>
  </> : <p className="story-text">Pásmo žiadnej strany dnes nepretína hranicu 5 %.</p>;
  if (id === "debt") return <DebtSlide/>;
  const submit = (e: FormEvent) => {
    e.preventDefault();
    const y = Number(year);
    if (isBirthYear(y)) onYear(y); else setYearError(true);
  };
  return <>
    <p className="story-title">Čo zažil tvoj ročník?</p>
    <p className="story-text">Zadaj rok narodenia a pozri, koľko vlád, premiérov a eur dlhu prešlo tvojím životom.</p>
    <form className="story-year" onSubmit={submit}>
      <input value={year} onChange={e => { setYear(e.target.value.replace(/[^0-9]/g, "").slice(0, 4)); setYearError(false); }} inputMode="numeric" autoComplete="off" placeholder="napr. 1990" aria-label="Rok narodenia" aria-invalid={yearError || undefined}/>
      <button type="submit">Ukázať<ChevronRight size={18} aria-hidden="true"/></button>
    </form>
    {yearError && <p className="story-error" role="alert">Zadaj rok od 1920 po dnešok.</p>}
    <div className="story-links"><button type="button" onClick={onCoalition}>Zostaviť vlastnú koalíciu</button><button type="button" onClick={onPolls}>Všetky prieskumy</button></div>
  </>;
}

export default function MandatStory({ open, morph, onOpenChange, onYear, onNavigate }: { open: boolean; morph?: boolean; onOpenChange: (open: boolean) => void; onYear: (year: number) => void; onNavigate: (view: string) => void }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hold, setHold] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [toast, setToast] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);
  const press = useRef<{ x: number; y: number; t: number } | null>(null);
  const slide = slides[index];
  const last = index === slides.length - 1;
  const next = () => setIndex(i => Math.min(slides.length - 1, i + 1));
  const prev = () => setIndex(i => Math.max(0, i - 1));
  const close = () => onOpenChange(false);
  const after = (run: () => void) => { close(); window.setTimeout(run, 60); };
  const drag = (dy: number) => cardRef.current?.style.setProperty("--drag", `${Math.max(0, dy)}px`);
  const say = (text: string) => { setToast(text); window.setTimeout(() => setToast(""), 2600); };

  // Karta ako obrázok 1080 × 1920: na mobile systémové zdieľanie (Instagram, správy…), inak stiahnutie.
  async function share() {
    if (sharing) return;
    setSharing(true);
    track("share", `pribeh-${slide.id}`);
    try {
      const blob = await storyCardImage(slide.id);
      if (!blob) { say("Obrázok sa nepodarilo vytvoriť."); return; }
      const file = new File([blob], `mandat-${slide.id}.png`, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        try { await navigator.share({ files: [file], title: `Mandát za minútu · ${slide.label}` }); } catch { /* zdieľanie zrušené */ }
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = file.name; a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      say("Obrázok karty je uložený medzi stiahnutými súbormi.");
    } finally { setSharing(false); }
  }

  function onPointerDown(e: PointerEvent) {
    if ((e.target as HTMLElement).closest("button,a,input,form,label")) return;
    press.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    setHold(true);
  }
  function onPointerMove(e: PointerEvent) {
    const p = press.current;
    if (!p) return;
    const dy = e.clientY - p.y;
    if (dy > 0 && dy > Math.abs(e.clientX - p.x)) drag(dy);
  }
  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    const p = press.current;
    press.current = null;
    setHold(false);
    drag(0);
    if (!p) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y, dt = performance.now() - p.t;
    if (dy > 90 && dy > Math.abs(dx)) { close(); return; }
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) { if (dx < 0) next(); else prev(); return; }
    if (dt < 300 && Math.abs(dx) < 12 && Math.abs(dy) < 12) {
      const r = e.currentTarget.getBoundingClientRect();
      if (e.clientX - r.left < r.width * 0.3) prev(); else next();
    }
  }
  function onKeyDown(e: KeyboardEvent) {
    if ((e.target as HTMLElement).closest("input")) return;
    if (e.key === "ArrowRight") { e.preventDefault(); next(); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
    else if (e.key === " ") { e.preventDefault(); setPaused(v => !v); }
  }

  return <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="story-overlay"/>
      <DialogPrimitive.Content className="story" ref={cardRef} data-morph={morph ? "" : undefined} onKeyDown={onKeyDown} aria-describedby="story-help"
        style={{ "--story-bg": slide.bg, "--dur": `${slide.ms}ms`, "--play": paused || hold || sharing ? "paused" : "running" } as CSSProperties}>
        <DialogPrimitive.Title className="sr-only">Mandát za minútu</DialogPrimitive.Title>
        <p id="story-help" className="sr-only">Šesť kariet s hlavnými číslami. Šípkami vľavo a vpravo prechádzate kartami, medzerníkom zastavíte, Esc zavrie. Tlačidlo Zdieľať uloží kartu ako obrázok.</p>
        <div className="story-top">
          <div className="story-progress" aria-hidden="true">{slides.map((s, i) => <i key={s.id} className={i < index ? "is-done" : i === index ? "is-active" : undefined}>
            {i === index ? <b key={`run-${index}`} onAnimationEnd={() => { if (!last) next(); }}/> : <b/>}
          </i>)}</div>
          <div className="story-bar">
            <span className="story-brand"><svg viewBox="0 0 64 64" aria-hidden="true"><g fill="#f5f4ee"><circle cx="10" cy="43" r="4.6"/><circle cx="16.4" cy="27.4" r="4.6"/><circle cx="32" cy="21" r="4.6"/><circle cx="21" cy="43" r="4.6"/><circle cx="32" cy="32" r="4.6"/></g><g fill="#9dbb86"><circle cx="47.6" cy="27.4" r="4.6"/><circle cx="54" cy="43" r="4.6"/><circle cx="43" cy="43" r="4.6"/></g></svg>
              <span><b>Mandát za minútu</b><small>{index + 1}/{slides.length} · {slide.label}</small></span></span>
            <button type="button" onClick={share} disabled={sharing} aria-label="Zdieľať kartu ako obrázok" title="Uložiť alebo zdieľať kartu ako obrázok"><Share2 size={18}/></button>
            <button type="button" onClick={() => setPaused(v => !v)} aria-label={paused ? "Pokračovať" : "Zastaviť"}>{paused ? <Play size={18}/> : <Pause size={18}/>}</button>
            <DialogPrimitive.Close className="story-close" aria-label="Zavrieť"><X size={20}/></DialogPrimitive.Close>
          </div>
        </div>
        <div className="story-stage" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={() => { press.current = null; setHold(false); drag(0); }}>
          <section key={slide.id} className={`story-slide is-${slide.id}`} aria-label={`${index + 1} zo ${slides.length}: ${slide.label}`}>
            <p className="story-kicker">{slide.label}</p>
            <Slide id={slide.id} onYear={y => after(() => onYear(y))} onCoalition={() => after(() => document.getElementById("koalicia")?.scrollIntoView({ behavior: reducedMotion() ? "instant" : "smooth", block: "start" }))} onPolls={() => after(() => onNavigate("polls"))}/>
          </section>
        </div>
        <p className="story-toast" role="status">{toast}</p>
        <div className="story-foot">
          <button type="button" onClick={prev} disabled={index === 0} aria-label="Predchádzajúca karta"><ChevronLeft size={20}/></button>
          <span>{slide.id === "debt" ? "Eurostat, odhad Mandátu" : slide.id === "you" ? "Mandát · nezávislý projekt bez reklamy" : `Model Mandát k ${date(edition.asOf)} · ${edition.agencies.length} agentúr · scenár, nie predpoveď`}</span>
          <button type="button" onClick={last ? close : next} aria-label={last ? "Zavrieť" : "Ďalšia karta"}>{last ? <X size={20}/> : <ChevronRight size={20}/>}</button>
        </div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>;
}
