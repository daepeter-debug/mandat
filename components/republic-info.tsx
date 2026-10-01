"use client";

import { createElement, useEffect, useRef } from "react";
import { AlertTriangle, ArrowRight, BookOpen, Check, Drama, Flower2, Hammer, House, Landmark, Move, Archive, Route, School, Sparkles, Sprout, Stethoscope, Store, TrainFront, Trees, X, type LucideIcon } from "lucide-react";
import { catalog, combos, connected, type ItemId, type Placed, type Point, type RepublicState } from "@/lib/republic";
import { categories, info, type Highlight, type Quick, type Report } from "@/lib/republic-info";
import "@/app/republic-guide.css";

/*
  Čo je na mape: farebná značka s ikonou a krátkym názvom pri každej budove, karta detailu po ťuknutí
  (čo to je, čo robí, komu pomáha, čo chýba) a vysvetlivka „Ako hra funguje“. Dáta: lib/republic-info.ts.
  Značky sú zámerne jednoduché (ikony lucide); ilustrované verzie môže dokresliť Codex.
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

const at = (p: Point) => ({ x: 280 + (p.x - p.y) * 43, y: 100 + (p.x + p.y) * 24 });
const same = (a: Point, b: Point) => a.x === b.x && a.y === b.y;
// Šírka textu v SVG (IBM Plex Sans 11 px, priemerná šírka znaku), aby štítok sedel bez merania v prehliadači.
const textWidth = (s: string) => Math.round([...s].reduce((w, c) => w + (/[mwMWÁÄÔ]/.test(c) ? 9 : /[iljíĺľ.\s]/.test(c) ? 3.6 : /[A-ZÁČĎÉÍĽĹŇÓŔŠŤÚÝŽ]/.test(c) ? 7.4 : 6.2), 0));

/**
 * Vrstva značiek v mape (nad budovami aj nočným závojom, aby bola čitateľná vždy).
 * Bez popisov: krúžok s ikonou. S popismi: štítok s ikonou, krátkym názvom a bodkou napojenia.
 * Vybraná budova je tmavá, domy a služby, ktorým pomáha, majú zelený okraj, nefunkčné oranžový.
 */
export function MapBadges({ town, labels, selected, highlight }: { town: RepublicState; labels: boolean; selected: string | null; highlight: Highlight | null }) {
  const isIn = (list: Point[] | undefined, p: Point) => !!list?.some(q => same(q, p));
  return <g className="republic-badges" aria-hidden="true" pointerEvents="none">
    {town.placed.filter(o => catalog[o.id].kind === "building" || o.instanceId === selected).map((o: Placed) => {
      const c = at(o), color = colorOf(o.id), chosen = o.instanceId === selected;
      const good = isIn(highlight?.good, o), bad = isIn(highlight?.bad, o), linked = o.fixed || catalog[o.id].kind !== "building" || connected(town, o);
      const ring = chosen ? "#f2c94c" : good ? "#2f7d3c" : bad ? "#c4651b" : null;
      if (!labels && !chosen) return <g key={o.instanceId} transform={`translate(${c.x} ${c.y + 14})`} className="republic-badge">
        {ring && <circle r="12.5" fill="none" stroke={ring} strokeWidth="3"/>}
        <circle r="9.5" fill="#fffefa" stroke={color} strokeWidth="2.2"/>
        {icon(o.id, { x: -6, y: -6, size: 12, color, strokeWidth: 2.4 })}
      </g>;
      const name = info[o.id].short, w = 30 + textWidth(name);
      return <g key={o.instanceId} transform={`translate(${c.x - w / 2} ${c.y + 6})`} className="republic-badge" data-selected={chosen || undefined}>
        {ring && <rect x="-3" y="-3" width={w + 6} height="24" rx="12" fill="none" stroke={ring} strokeWidth="3"/>}
        <rect width={w} height="18" rx="9" fill={chosen ? "#20392f" : "#fffefa"} stroke={chosen ? "#20392f" : color} strokeWidth="1.3"/>
        <circle cx="9" cy="9" r="7" fill={color}/>
        {icon(o.id, { x: 4.5, y: 4.5, size: 9, color: "#fffefa", strokeWidth: 2.6 })}
        <text x="20" y="12.6" fontSize="11" fontWeight="600" fill={chosen ? "#fffefa" : "#20392f"}>{name}</text>
        {catalog[o.id].kind === "building" && !o.fixed && <circle cx={w - 6} cy="9" r="3.2" fill={linked ? "#3e8a5a" : "#b8613f"}/>}
      </g>;
    })}
  </g>;
}

/** Karta detailu pod mapou: čo to je, čo robí, komu pomáha, čo chýba a rýchle akcie. */
export function InfoCard({ report, blocked = false, readOnly = false, onClose, onQuick, onMove, onStore }: {
  report: Report; blocked?: boolean; readOnly?: boolean; onClose: () => void; onQuick?: (q: Quick) => void; onMove?: () => void; onStore?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Karta sa objaví pod mapou; ak je mimo obrazovky, stránka sa k nej jemne posunie (mapa ostane na mieste).
  useEffect(() => { ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }); }, [report.key]);
  const color = report.category ? categories[report.category].color : "#6b7a68";
  return <div ref={ref} className="info-card" style={{ ["--cat" as string]: color }} role="region" aria-label={`Detail: ${report.title}`} aria-live="polite">
    <div className="info-card-head">
      {report.id ? <CategoryBadge id={report.id}/> : <span className="info-badge is-plot" aria-hidden="true"/>}
      <div><h3>{report.title}</h3><p className="info-card-label">{report.label}</p></div>
      <button type="button" className="info-card-close" onClick={onClose} aria-label="Zavrieť detail"><X size={18}/></button>
    </div>
    <p className="info-card-does">{report.does}</p>
    {report.summary && <p className="info-card-summary">{report.summary}</p>}
    {report.checks.length > 0 && <ul className="info-card-checks">{report.checks.map(c => <li key={c.text} data-ok={c.ok}>{c.ok ? <Check size={15} aria-hidden="true"/> : <X size={15} aria-hidden="true"/>}<span>{c.text}</span><span className="sr-only">{c.ok ? " (splnené)" : " (chýba)"}</span></li>)}</ul>}
    {!readOnly && report.related.length > 0 && <ul className="info-card-related">{report.related.map(c => <li key={c.text} data-ok={c.ok}>{c.ok ? <Check size={14} aria-hidden="true"/> : <AlertTriangle size={14} aria-hidden="true"/>}<span>{c.text}</span></li>)}</ul>}
    {!readOnly && report.notes.map(n => <p key={n} className="info-card-note">{n}</p>)}
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
        <li><b>Spoj všetko s námestím.</b> Budova funguje, len keď má vedľa cestu, ktorá vedie na námestie (C3). Bodka na štítku: zelená = napojené, hnedá = bez cesty.</li>
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
