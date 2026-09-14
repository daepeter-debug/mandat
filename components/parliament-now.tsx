"use client";

import { ArrowUpRight } from "lucide-react";
import { hemicycleSeats, seated2023, election2023 } from "@/lib/parliament";
import { blocSeats, MAJORITY } from "@/lib/blocs";

// Oficiálny výsledok volieb 2023 rozdelený do blokov: koalícia vľavo, ostatní v strede, opozícia vpravo.
const entries = seated2023.map(s => ({ id: s.partyId ?? `election-2023-${s.number}`, short: s.short, color: s.color, seats: s.seats }));
const summary = blocSeats(entries);
const groups: [string, typeof entries][] = [["Koalícia", summary.coalition.members], ["Ostatní", summary.others.members], ["Opozícia", summary.opposition.members]];
const ordered = groups.flatMap(([, members]) => members);
const colours = ordered.flatMap(m => Array.from({ length: m.seats }, () => m));
const points = hemicycleSeats(150, 6);
const label = `Parlament z volieb 2023, 150 kresiel: vládna koalícia ${summary.coalition.seats}, ostatní ${summary.others.seats}, opozícia ${summary.opposition.seats}; väčšina je ${MAJORITY}. ${ordered.map(m => `${m.short} ${m.seats}`).join(", ")}.`;

export default function ParliamentNow({ onNavigate }: { onNavigate: (view: string) => void }) {
  return <section className="parliament-now" aria-labelledby="parliament-now-title">
    <div className="parliament-now-head"><h2 id="parliament-now-title">Parlament dnes</h2><span>150 kresiel · voľby 2023</span></div>
    <svg className="parliament-now-svg" viewBox="-1.06 -1.06 2.12 1.1" role="img" aria-label={label}>
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
    <p className="parliament-now-note">Oficiálny výsledok volieb 2023, nie aktuálne kluby. Koalícia: SMER, HLAS, SNS. <a href={election2023.source} target="_blank" rel="noopener noreferrer">ŠÚ SR<ArrowUpRight size={11} aria-hidden="true"/><span className="sr-only"> (nová karta)</span></a> · <button type="button" onClick={() => onNavigate("data")}>Scenáre a bloky</button></p>
  </section>;
}
