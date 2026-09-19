"use client";

import { ArrowUpRight } from "lucide-react";
import { hemicycleSeats, seated2023, election2023, scenarioFromPoll } from "@/lib/parliament";
import { blocSeats, MAJORITY, optionalIds, type SeatEntry } from "@/lib/blocs";
import { partnerWording } from "@/lib/edition";
import { aggregateAsPoll, aggregateLastDate, aggregatePolls } from "@/lib/aggregate";
import { date } from "@/lib/polls";

/*
  Karta s dvoma pohľadmi na 150 kresiel v rovnakej vizuálnej logike (koalícia vľavo, ostatní v strede,
  opozícia vpravo): scenár z Modelu Mandát (vážený priemer piatich agentúr, prepočet podľa § 68) a
  oficiálny výsledok volieb 2023. Východiskom je scenár, aby karta hovorila to isté čo titulok
  vydania; historický výsledok je druhý pohľad. Scenár nie je predpoveď.

  Druhý prepínač pridáva k blokom voliteľných partnerov: REPUBLIKU ku koalícii a Hnutie Slovensko
  (Matoviča) k opozícii. Je to REDAKČNÝ PREDPOKLAD, nie oznámená dohoda, a karta to pri zapnutom
  variante hovorí. Oba pohľady sú v adrese (pn = zdroj, pp = partneri), takže sa dajú zdieľať.
*/
const points = hemicycleSeats(150, 6);

function buildView(entries: SeatEntry[], partners = false) {
  const summary = blocSeats(entries, partners ? optionalIds : []);
  const groups: [string, SeatEntry[]][] = [["Koalícia", summary.coalition.members], ["Ostatní", summary.others.members], ["Opozícia", summary.opposition.members]];
  const ordered = groups.flatMap(([, members]) => members);
  const colours = ordered.flatMap(m => Array.from({ length: m.seats }, () => m));
  return { summary, groups, ordered, colours };
}

const todayEntries = seated2023.map(s => ({ id: s.partyId ?? `election-2023-${s.number}`, short: s.short, color: s.color, seats: s.seats }));
const modelScenario = scenarioFromPoll(aggregateAsPoll());
const modelEntries = modelScenario.rows.map(r => ({ id: r.id, short: r.short, color: r.color, seats: r.seats }));

const views = {
  model: { title: "Parlament podľa prieskumov", tab: "Podľa prieskumov", meta: `150 kresiel · Model Mandát k ${date(aggregateLastDate)}`, data: [buildView(modelEntries), buildView(modelEntries, true)] as const, label: `Scenár podľa Modelu Mandát k ${date(aggregateLastDate)}` },
  volby2023: { title: "Parlament z volieb 2023", tab: "Voľby 2023", meta: "150 kresiel · oficiálny výsledok", data: [buildView(todayEntries), buildView(todayEntries, true)] as const, label: "Parlament z volieb 2023" },
} as const;
type ViewId = keyof typeof views;
const order: ViewId[] = ["model", "volby2023"];
// Slovné tvary sú rovnaké ako v titulku vydania, aby web hovoril o partneroch všade rovnako.
const blocLabel = (bloc: "Koalícia" | "Opozícia", partners: boolean) =>
  partners ? `${bloc} ${partnerWording[bloc === "Koalícia" ? "rep" : "slovensko"]}` : bloc;

export default function ParliamentNow({ onNavigate, view, onView, partners, onPartners }: { onNavigate: (target: string) => void; view: string; onView: (value: string) => void; partners: boolean; onPartners: (value: boolean) => void }) {
  const active: ViewId = view === "volby2023" ? "volby2023" : "model";
  const { title, meta, data, label } = views[active];
  const { summary, groups, ordered, colours } = data[partners ? 1 : 0];
  const coalitionLabel = blocLabel("Koalícia", partners), oppositionLabel = blocLabel("Opozícia", partners);
  const description = `${label}, 150 kresiel: ${coalitionLabel} ${summary.coalition.seats}, ostatní ${summary.others.seats}, ${oppositionLabel} ${summary.opposition.seats}; väčšina je ${MAJORITY}. ${ordered.map(m => `${m.short} ${m.seats}`).join(", ")}.`;
  return <section className="parliament-now" aria-labelledby="parliament-now-title">
    <div className="parliament-now-head"><h2 id="parliament-now-title">{title}</h2><span>{meta}</span></div>
    <div className="parliament-now-switches">
      <div className="parliament-now-switch" role="group" aria-label="Zdroj rozdelenia kresiel">
        {order.map(id => <button key={id} type="button" aria-pressed={active === id} onClick={() => onView(id)}>{views[id].tab}</button>)}
      </div>
      <div className="parliament-now-switch" role="group" aria-label="Zaradenie voliteľných partnerov">
        <button type="button" aria-pressed={!partners} onClick={() => onPartners(false)}>Dnešné bloky</button>
        <button type="button" aria-pressed={partners} onClick={() => onPartners(true)}>S partnermi</button>
      </div>
    </div>
    <svg className="parliament-now-svg" viewBox="-1.06 -1.06 2.12 1.1" role="img" aria-label={description}>
      {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={0.036} fill={colours[i]?.color ?? "var(--border)"}/>)}
    </svg>
    <dl className="parliament-now-blocs">
      <div><dt>{coalitionLabel}</dt><dd>{summary.coalition.seats}</dd></div>
      <div className="parliament-now-majority"><dt>Väčšina</dt><dd>{MAJORITY}</dd></div>
      <div><dt>{oppositionLabel}</dt><dd>{summary.opposition.seats}</dd></div>
    </dl>
    <ul className="parliament-now-list">
      {groups.map(([name, members]) => members.length > 0 && <li key={name}><span>{name === "Koalícia" ? coalitionLabel : name === "Opozícia" ? oppositionLabel : name}</span>{members.map(m => <span key={m.id} className="parliament-now-party"><i style={{ background: m.color }} aria-hidden="true"/>{m.short} <b>{m.seats}</b></span>)}</li>)}
    </ul>
    {active === "volby2023"
      ? <p className="parliament-now-note">Oficiálny výsledok volieb 2023, nie aktuálne kluby. Koalícia: SMER, HLAS, SNS.{partners ? " S partnermi: REPUBLIKA sa do parlamentu nedostala, OĽANO a priatelia sú pripočítaní k opozícii." : ""} <a href={election2023.source} target="_blank" rel="noopener noreferrer">ŠÚ SR<ArrowUpRight size={11} aria-hidden="true"/><span className="sr-only"> (nová karta)</span></a> · <button type="button" onClick={() => onNavigate("data")}>Scenáre a bloky</button></p>
      : <p className="parliament-now-note">Scenár, nie predpoveď: prepočet kresiel podľa § 68 z váženého priemeru {aggregatePolls.length} agentúr. {partners ? "Priradenie REPUBLIKY ku koalícii a Hnutia Slovensko k opozícii je redakčný predpoklad, nie dohoda strán." : "Bloky sú bez voliteľných partnerov; prepínačom vyššie pridáte Republiku ku koalícii a Matoviča k opozícii."} <button type="button" onClick={() => onNavigate("method")}>Model Mandát</button> · <button type="button" onClick={() => onNavigate("data")}>Scenáre a bloky</button></p>}
  </section>;
}
