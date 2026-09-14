"use client";

import type { CSSProperties } from "react";
import type { BlocSummary, SeatEntry } from "@/lib/blocs";

type Segment = SeatEntry & { bloc: "coalition" | "others" | "opposition"; first: boolean };

/** Jeden riadok blokov: koalícia vľavo, ostatní v strede, opozícia vpravo; čísla sú vždy aj v texte. */
export default function BlocBar({ title, summary }: { title: string; summary: BlocSummary }) {
  const groups: [Segment["bloc"], SeatEntry[]][] = [["coalition", summary.coalition.members], ["others", summary.others.members], ["opposition", summary.opposition.members]];
  const segments: Segment[] = groups.flatMap(([bloc, members]) => members.filter(m => m.seats > 0).map((m, i) => ({ ...m, bloc, first: i === 0 })));
  const flag = (seats: number) => seats >= summary.constitutional ? "ústavná väčšina" : seats >= summary.majority ? "väčšina" : null;
  const label = `${title}: vládna koalícia ${summary.coalition.seats} kresiel, ostatní ${summary.others.seats}, opozícia ${summary.opposition.seats} zo ${summary.total}. Väčšina je ${summary.majority} kresiel, ústavná väčšina ${summary.constitutional}.`;
  const groupLabel: Record<Segment["bloc"], string> = { coalition: "Koalícia", others: "Ostatní", opposition: "Opozícia" };

  return <div className="bloc-row">
    <div className="bloc-row-head">
      <h3>{title}</h3>
      <dl className="bloc-counts">
        <div><dt>Koalícia</dt><dd>{summary.coalition.seats}{flag(summary.coalition.seats) && <span className="bloc-flag">{flag(summary.coalition.seats)}</span>}</dd></div>
        <div><dt>Ostatní</dt><dd>{summary.others.seats}</dd></div>
        <div><dt>Opozícia</dt><dd>{summary.opposition.seats}{flag(summary.opposition.seats) && <span className="bloc-flag">{flag(summary.opposition.seats)}</span>}</dd></div>
      </dl>
    </div>
    <div className="bloc-bar" role="img" aria-label={label}>
      {segments.map(s => <span key={`${s.bloc}-${s.id}`} className={`bloc-seg is-${s.bloc}${s.first && s.bloc !== "coalition" ? " is-first" : ""}`} style={{ flexGrow: s.seats, background: s.color } as CSSProperties} title={`${s.short}: ${s.seats}`}/>)}
      <span className="bloc-marker" aria-hidden="true"><small>väčšina {summary.majority}</small></span>
    </div>
    <ul className="bloc-members">
      {groups.map(([bloc, members]) => members.length > 0 && <li key={bloc} className="bloc-group"><span>{groupLabel[bloc]}</span>{members.map(m => <span key={m.id} className="bloc-member"><i style={{ background: m.color }} aria-hidden="true"/>{m.short} <b>{m.seats}</b></span>)}</li>)}
    </ul>
  </div>;
}
