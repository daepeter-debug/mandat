"use client";

import { createElement, useEffect, useRef } from "react";
import { AlertTriangle, ArrowRight, BookOpen, Check, Drama, Flower2, Hammer, House, Landmark, Move, Archive, Route, School, Sparkles, Sprout, Stethoscope, Store, TrainFront, Trees, X, type LucideIcon } from "lucide-react";
import { catalog, combos, type Branch, type ItemId, type RepublicState } from "@/lib/republic";
import { categories, info, type Quick, type Report } from "@/lib/republic-info";
import RepublicArt from "@/components/republic-art";
import "@/app/republic-guide.css";

/*
  Mapa ostáva bez trvalých názvov. Po ťuknutí sa otvorí ilustrovaný detail
  (čo to je, čo robí, komu pomáha, čo chýba). Dáta: lib/republic-info.ts.
*/
const icons: Partial<Record<ItemId, LucideIcon>> = {
  house: House, school: School, library: BookOpen, clinic: Stethoscope, park: Trees, garden: Sprout, market: Store, workshop: Hammer,
  culture: Drama, "town-hall": Landmark, plaza: Route, station: TrainFront, bench: Flower2, "flower-bed": Flower2, linden: Trees, fountain: Sparkles, pergola: Flower2,
};
/** Ikona objektu ako prvok (nie komponent vytvorený počas kreslenia). */
const icon = (id: ItemId, props: { size: number; color: string; strokeWidth: number; x?: number; y?: number }) => createElement(icons[id] ?? Sparkles, props);
const colorOf = (id: ItemId) => categories[info[id].category].color;

/** HTML značka (karta, legenda, katalóg): farebný krúžok s ikonou. */
export function CategoryBadge({ id, size = 18 }: { id: ItemId; size?: number }) {
  return <span className="info-badge" style={{ background: colorOf(id), width: size + 12, height: size + 12 }} aria-hidden="true">{icon(id, { size, color: "#fffefa", strokeWidth: 2.2 })}</span>;
}

/** Detail pri mape; na mobile pod ňou, aby zostala priechodná pre dotyk aj posúvanie stránky. */
export function InfoCard({ report, blocked = false, readOnly = false, branch=null, finished=false, onClose, onQuick, onMove, onStore }: {
  report: Report; blocked?: boolean; readOnly?: boolean; branch?: Branch|null; finished?: boolean; onClose: () => void; onQuick?: (q: Quick) => void; onMove?: () => void; onStore?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const head=ref.current;
    if (!head || head.closest(".republic-map-detail") && window.matchMedia("(min-width: 960px)").matches) return;
    const rect=head.getBoundingClientRect();
    if(rect.top<0||rect.bottom>window.innerHeight-80) head.scrollIntoView({block:"nearest",behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});
  }, [report.key]);
  function close() {
    const cell=ref.current?.closest(".republic")?.querySelector<SVGGElement>(`[data-cell="${report.point.x}-${report.point.y}"]`);
    onClose();cell?.focus({preventScroll:true});
  }
  return <div className="info-card" role="region" aria-label={`Detail: ${report.title}`} aria-live="polite" onKeyDown={e=>{if(e.key==="Escape"){e.stopPropagation();close();}}}>
    <div ref={ref} className="info-card-head">
      {report.id ? <div className="info-card-art" aria-hidden="true"><RepublicArt id={report.id} branch={report.id==="station"?branch:null} finished={finished}/></div> : <span className="info-badge is-plot" aria-hidden="true"/>}
      <div><h3>{report.title}</h3><p className="info-card-label">{report.label}</p></div>
      <button type="button" className="info-card-close" onClick={close} aria-label="Zavrieť detail"><X size={18}/></button>
    </div>
    <p className="info-card-does">{report.does}</p>
    {report.summary && <p className="info-card-summary">{report.summary}</p>}
    {report.checks.length > 0 && <ul className="info-card-checks">{report.checks.map(c => <li key={c.text} data-ok={c.ok}>{c.ok ? <Check size={15} aria-hidden="true"/> : <X size={15} aria-hidden="true"/>}<span>{c.text}</span><span className="sr-only">{c.ok ? " (splnené)" : " (chýba)"}</span></li>)}</ul>}
    {!readOnly && (report.related.length>0||report.notes.length>0) && <details key={report.key} className="info-card-more"><summary>Úlohy a odporúčania</summary>
      {report.related.length>0&&<ul className="info-card-related">{report.related.map(c => <li key={c.text} data-ok={c.ok}>{c.ok ? <Check size={14} aria-hidden="true"/> : <AlertTriangle size={14} aria-hidden="true"/>}<span>{c.text}</span></li>)}</ul>}
      {report.notes.map(n => <p key={n} className="info-card-note">{n}</p>)}
    </details>}
    {!readOnly && (report.quick.length > 0 || report.movable) && <div className="info-card-actions">
      {report.quick.map(q => <button key={q.label} type="button" className={q.kind === "build" || q.kind === "build-here" ? "is-primary" : ""} disabled={blocked} onClick={() => onQuick?.(q)}>{q.label}<ArrowRight size={15} aria-hidden="true"/></button>)}
      {report.movable && <><button type="button" onClick={onMove}><Move size={15} aria-hidden="true"/> Presunúť</button><button type="button" disabled={blocked} onClick={onStore}><Archive size={15} aria-hidden="true"/> Odložiť</button></>}
    </div>}
  </div>;
}

const legend: ItemId[] = ["house", "school", "library", "clinic", "park", "garden", "market", "workshop", "culture", "plaza", "town-hall", "station"];
const comboNames = { school: ["Školská štvrť", "Škola a knižnica do 2 políčok od seba"], craft: ["Remeselná štvrť", "Škola a dielňa do 2 políčok od seba"], centre: ["Živé centrum", "Tržnica do 2 políčok od námestia"] } as const;

/** Prečo robíme to, čo robíme: príbeh, tri pravidlá, čo ktorá budova robí a bonusy za susedstvo. */
export function HowItWorks({ town, onClose, onGuide }: { town: RepublicState; onClose: () => void; onGuide: (() => void) | null }) {
  const active = combos(town);
  return <section className="republic-howto" id="republic-howto" aria-labelledby="republic-howto-title">
    <div className="howto-head"><h2 id="republic-howto-title">Ako hra funguje</h2><button type="button" className="info-card-close" onClick={onClose} aria-label="Zavrieť vysvetlivku"><X size={18}/></button></div>
    <div className="howto-body">
      <p className="howto-story">Stará stanica chátra a štvrť sa vyprázdňuje. Ako plánovač ju oživíš: postavíš, čo susedia potrebujú, a sedem krokov projektu stanicu znova otvorí.</p>
      <ol className="howto-rules">
        <li><b>Spoj všetko s námestím.</b> Budova funguje, len keď má vedľa cestu, ktorá vedie na námestie (C3). Hnedá bodka označuje budovu bez cesty; po ťuknutí uvidíš jej napojenie a účinky.</li>
        <li><b>Daj susedom, čo potrebujú.</b> Každý dom chce zeleň a ambulanciu do 2 políčok a v štvrti napojenú školu a tržnicu. Chýbajúce prianie je bublina nad domom.</li>
        <li><b>Spokojní susedia posúvajú štvrť.</b> Objednávky a zásielky dávajú mince a materiál na ďalšie stavby, kroky projektu otvoria stanicu a spokojnosť rozhodne voľby 24. 10.</li>
      </ol>
      <h3>Čo ktorá budova robí</h3>
      <ul className="howto-legend">{legend.map(id => <li key={id}><CategoryBadge id={id} size={15}/><div><b>{catalog[id].name}</b><span>{info[id].does}</span>{catalog[id].coins > 0 && <small>{catalog[id].coins} {catalog[id].coins < 5 ? "mince" : "mincí"} · {catalog[id].materials} mat.</small>}</div></li>)}</ul>
      <h3>Bonusy za susedstvo</h3>
      <ul className="howto-combos">{(Object.keys(comboNames) as (keyof typeof comboNames)[]).map(k => <li key={k} data-ok={active[k]}>{active[k] ? <Check size={15} aria-hidden="true"/> : <span className="howto-dot" aria-hidden="true"/>}<div><b>{comboNames[k][0]}</b><span>{comboNames[k][1]}{active[k] ? " · máš" : ""}</span></div></li>)}</ul>
      <p className="howto-tip">Tip: ťukni na mape na budovu alebo voľné políčko. Uvidíš, čo robí, komu pomáha a čo jej chýba; dosah 2 políčok sa podfarbí.</p>
      {onGuide && <button type="button" className="howto-guide" onClick={onGuide}>Ukázať prvé kroky s Evou<ArrowRight size={15} aria-hidden="true"/></button>}
    </div>
  </section>;
}
