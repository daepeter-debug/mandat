"use client";

import { ArrowUpRight } from "lucide-react";
import { hemicycleSeats, seated2023, election2023, scenarioFromPoll } from "@/lib/parliament";
import { blocSeats, MAJORITY, type SeatEntry } from "@/lib/blocs";
import { aggregateAsPoll, aggregateLastDate, aggregatePolls } from "@/lib/aggregate";
import { date } from "@/lib/polls";

/*
  Karta s dvoma pohľadmi na 150 kresiel v rovnakej vizuálnej logike (koalícia vľavo, ostatní v strede,
  opozícia vpravo): scenár z Modelu Mandát (vážený priemer piatich agentúr, prepočet podľa § 68) a
  oficiálny výsledok volieb 2023. Východiskom je scenár, aby karta hovorila to isté čo titulok
  vydania; historický výsledok je druhý pohľad. Scenár nie je predpoveď. Bloky sú dnešná koalícia
  a opozícia bez voliteľných partnerov; varianty s partnermi má titulok vydania a Dátový prehľad.
  Vybraný pohľad je v adrese (parameter pn), takže sa dá zdieľať aj obnoviť.
*/
const points = hemicycleSeats(150, 6);

function buildView(entries: SeatEntry[]) {
  const summary = blocSeats(entries);
  const groups: [string, SeatEntry[]][] = [["Koalícia", summary.coalition.members], ["Ostatní", summary.others.members], ["Opozícia", summary.opposition.members]];
  const ordered = groups.flatMap(([, members]) => members);
  const colours = ordered.flatMap(m => Array.from({ length: m.seats }, () => m));
  return { summary, groups, ordered, colours };
}

const today = buildView(seated2023.map(s => ({ id: s.partyId ?? `election-2023-${s.number}`, short: s.short, color: s.color, seats: s.seats })));
const modelScenario = scenarioFromPoll(aggregateAsPoll());
const model = buildView(modelScenario.rows.map(r => ({ id: r.id, short: r.short, color: r.color, seats: r.seats })));

const views = {
  model: { title: "Parlament podľa prieskumov", tab: "Podľa prieskumov", meta: `150 kresiel · Model Mandát k ${date(aggregateLastDate)}`, data: model, label: `Scenár podľa Modelu Mandát k ${date(aggregateLastDate)}` },
  volby2023: { title: "Parlament z volieb 2023", tab: "Voľby 2023", meta: "150 kresiel · oficiálny výsledok", data: today, label: "Parlament z volieb 2023" },
} as const;
type ViewId = keyof typeof views;
const order: ViewId[] = ["model", "volby2023"];

export default function ParliamentNow({ onNavigate, view, onView }: { onNavigate: (target: string) => void; view: string; onView: (value: string) => void }) {
  const active: ViewId = view === "volby2023" ? "volby2023" : "model";
  const { title, meta, data, label } = views[active];
  const { summary, groups, ordered, colours } = data;
  const description = `${label}, 150 kresiel: vládna koalícia ${summary.coalition.seats}, ostatní ${summary.others.seats}, opozícia ${summary.opposition.seats}; väčšina je ${MAJORITY}. ${ordered.map(m => `${m.short} ${m.seats}`).join(", ")}.`;
  return <section className="parliament-now" aria-labelledby="parliament-now-title">
    <div className="parliament-now-head"><h2 id="parliament-now-title">{title}</h2><span>{meta}</span></div>
    <div className="parliament-now-switch" role="group" aria-label="Zdroj rozdelenia kresiel">
      {order.map(id => <button key={id} type="button" aria-pressed={active === id} onClick={() => onView(id)}>{views[id].tab}</button>)}
    </div>
    <svg className="parliament-now-svg" viewBox="-1.06 -1.06 2.12 1.1" role="img" aria-label={description}>
      {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={0.036} fill={colours[i]?.color ?? "var(--border)"}/>)}
    </svg>
    <dl className="parliament-now-blocs">
      <div><dt>Koalícia</dt><dd>{summary.coalition.seats}</dd></div>
      <div className="parliament-now-majority"><dt>Väčšina</dt><dd>{MAJORITY}</dd></div>
      <div><dt>Opozícia</dt><dd>{summary.opposition.seats}</dd></div>
    </dl>
    <ul className="parliament-now-list">
      {groups.map(([name, members]) => members.length > 0 && <li key={name}><span>{name}</span>{members.map(m => <span key={m.id} className="parliament-now-party"><i style={{ background: m.color }} aria-hidden="true"/>{m.short} <b>{m.seats}</b></span>)}</li>)}
    </ul>
    {active === "volby2023"
      ? <p className="parliament-now-note">Oficiálny výsledok volieb 2023, nie aktuálne kluby. Koalícia: SMER, HLAS, SNS. <a href={election2023.source} target="_blank" rel="noopener noreferrer">ŠÚ SR<ArrowUpRight size={11} aria-hidden="true"/><span className="sr-only"> (nová karta)</span></a> · <button type="button" onClick={() => onNavigate("data")}>Scenáre a bloky</button></p>
      : <p className="parliament-now-note">Scenár, nie predpoveď: prepočet kresiel podľa § 68 z váženého priemeru {aggregatePolls.length} agentúr. Bloky sú bez voliteľných partnerov; čísla s Republikou a s Matovičom sú v titulku vydania vyššie. <button type="button" onClick={() => onNavigate("method")}>Model Mandát</button> · <button type="button" onClick={() => onNavigate("data")}>Scenáre a bloky</button></p>}
  </section>;
}
