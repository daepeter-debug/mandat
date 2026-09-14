"use client";

import { useState } from "react";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { tenureAsOf, tenureMethodology, formatTenureDate } from "@/lib/government-tenure";
import { inactiveTenureNote } from "@/lib/government-tenure-inactive";
import { inactiveResponsibilityRows, responsibilityGroups, responsibilityRows, type ResponsibilityRow } from "@/lib/responsibility";

const pct = (v: number) => v.toLocaleString("sk-SK", { maximumFractionDigits: v >= 10 ? 0 : 1, minimumFractionDigits: 0 });

/* Skupiny podľa stupňa škály, jeden riadok na stranu: názov, pruh (svetlý = vo vláde, tmavý = premiér zo strany), podiel, celé roky. */
function Groups({ rows, maxShare }: { rows: ResponsibilityRow[]; maxShare: number }) {
  return <>{responsibilityGroups(rows).map(g => <div className="responsibility-group" key={g.label}>
    <h3><span>{g.label}</span><small>{g.hint}</small></h3>
    <ol className="responsibility-list" aria-label={`${g.label}, ${g.hint}`}>
      {g.rows.map(r => <li key={r.id} title={`${r.name}: ${r.label} vo vláde${r.led > 0 ? `, z toho na čele vlády ${pct(r.ledShare)} % času` : ""}${r.fate ? `. ${r.fate}` : ""}`}>
        <span className="responsibility-name"><i style={{ background: r.color }} aria-hidden="true"/>{r.short}</span>
        <span className="responsibility-bar" aria-hidden="true"><i style={{ width: `${r.share / maxShare * 100}%`, background: r.color, opacity: .38 }}/>{r.led > 0 && <b style={{ width: `${r.ledShare / maxShare * 100}%`, background: r.color }}/>}</span>
        <span className="responsibility-value"><b>{pct(r.share)}<span aria-hidden="true"> %</span><span className="sr-only"> percent času</span></b><small>{r.compact}<span className="sr-only">, {r.label}{r.led > 0 && `, na čele vlády ${pct(r.ledShare)} % času`}{r.fate && `. ${r.fate}`}</span></small></span>
      </li>)}
    </ol>
  </div>)}</>;
}

export default function ResponsibilityScale({ onNavigate }: { onNavigate: (view: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const rows = responsibilityRows();
  const inactive = inactiveResponsibilityRows();
  const never = rows.filter(r => r.days === 0);
  const maxShare = Math.max(...rows.map(r => r.share), ...inactive.map(r => r.share));
  const top = inactive[0];
  const leaders = [...rows].filter(r => r.days > 0).sort((a, b) => b.share - a.share).slice(0, 2);
  // Aliancia a podobné: predchodcovia sú v zozname neaktívnych strán, nástupcovi ich nepočítame.
  const predecessors = never.filter(r => r.predecessorNote).map(r => ({ id: r.id, short: r.short, names: inactive.filter(i => i.successor === r.id).map(i => i.short) }));
  return <section className="responsibility" aria-labelledby="responsibility-title">
    <div className="responsibility-head"><h2 id="responsibility-title">Zodpovednosť za stav krajiny</h2><span>čas vo vláde od 1. 1. 1993</span></div>
    <p className="responsibility-mobile-summary">Najdlhšie vo vláde: {leaders.map(r => `${r.short} ${pct(r.share)} %`).join(" · ")}</p>
    <button className="responsibility-toggle" type="button" aria-expanded={expanded} aria-controls="responsibility-content" onClick={() => setExpanded(value => !value)}>
      {expanded ? "Skryť celý prehľad" : "Zobraziť celý prehľad"}<ChevronDown size={16} aria-hidden="true"/>
    </button>
    <div id="responsibility-content" className={`responsibility-content${expanded ? " is-expanded" : ""}`}>
      <Groups rows={rows} maxShare={maxShare}/>
      <details className="responsibility-inactive">
        <summary><span>Neaktívne strany <b>{inactive.length}</b></span>{top && <small>najviac {top.short} {pct(top.share)}&nbsp;%</small>}</summary>
        <div className="responsibility-inactive-body">
          <Groups rows={inactive} maxShare={maxShare}/>
          <p className="responsibility-inactive-note">{inactiveTenureNote}</p>
        </div>
      </details>
      <p className="responsibility-never"><b>Bez účasti</b>{never.map((r, i) => <span key={r.id}>{i > 0 && ", "}{r.predecessorNote ? <abbr title={r.predecessorNote}>{r.short}*</abbr> : r.short}</span>)}</p>
      <p className="responsibility-legend"><i className="is-coalition" aria-hidden="true"/> vo vláde <i className="is-led" aria-hidden="true"/> na čele vlády (premiér zo strany)</p>
      <p className="responsibility-note">Čas pri moci k {formatTenureDate(tenureAsOf)}, nie hodnotenie výsledkov. Strany vládnu súčasne, preto súčet nie je 100 %.{predecessors.map(p => ` * ${p.names.length ? p.names.join(" a ") : "Predchodcov"} nájdete medzi neaktívnymi stranami, do ${p.short} ich nepočítame.`).join("")} <a href={tenureMethodology.source} target="_blank" rel="noopener noreferrer">História vlád SR<ArrowUpRight size={11} aria-hidden="true"/><span className="sr-only"> (nová karta)</span></a> · <button type="button" onClick={() => onNavigate("parties")}>Profily strán</button></p>
    </div>
  </section>;
}
