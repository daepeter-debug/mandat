"use client";

import { ArrowRight } from "lucide-react";
import { currentAggregate } from "@/lib/aggregate";
import { edition, signed } from "@/lib/edition";
import { result2023 } from "@/lib/parliament";
import { fundingForParty } from "@/lib/party-funding";
import { partyProfiles } from "@/lib/party-profiles";
import { fmt, parties } from "@/lib/polls";
import { programmes, statusLabel } from "@/lib/programmes";
import { responsibilityRows } from "@/lib/responsibility";
import { currentSeatUncertainty, thresholdLabels, thresholdStatus } from "@/lib/uncertainty";
import "@/app/party-compare.css";

/*
  Porovnanie 2–3 strán vedľa seba: dnešná podpora s pásmom, orientačné kreslá, zmena za 30 dní,
  voľby 2023, čas vo vláde od 1993, štátne príspevky 2023–2027, lídri a programové dokumenty.
  Výber je v adrese (?porovnaj=ps,smer,rep), takže sa dá poslať ďalej.
*/
export const COMPARE_MAX = 3;
const mil = (v: number) => `${(v / 1e6).toLocaleString("sk-SK", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mil. €`;
const candidates = parties.filter(p => (currentAggregate.values[p.id]?.value ?? 0) >= 1).sort((a, b) => currentAggregate.values[b.id].value - currentAggregate.values[a.id].value);
export const defaultCompare = candidates.slice(0, COMPARE_MAX).map(p => p.id);

type Cell = { main: React.ReactNode; note?: React.ReactNode; tone?: string };
type Row = { label: string; cell: (id: string) => Cell };

const tenure = Object.fromEntries(responsibilityRows().map(r => [r.id, r]));
const rows: Row[] = [
  { label: "Podpora dnes", cell: id => {
    const v = currentAggregate.values[id];
    if (!v) return { main: "—", note: "bez údaja v Modeli Mandát" };
    const status = thresholdStatus(v);
    return { main: `${fmt(v.value)} %`, note: <>pásmo {fmt(v.lower)}–{fmt(v.upper)} % · <span className={`pc-status is-${status}`}>{thresholdLabels[status]}</span></> };
  } },
  { label: "Kreslá, orientačne", cell: id => {
    const seats = edition.now.rows.find(r => r.id === id)?.seats ?? 0;
    const range = currentSeatUncertainty().parties[id];
    return { main: String(seats), note: range ? `rozpätie ${range.low}–${range.high}` : undefined };
  } },
  { label: "Zmena za 30 dní", cell: id => {
    const m = edition.movers.find(x => x.id === id);
    return m ? { main: `${signed(m.delta)} p. b.`, tone: m.delta > 0 ? "up" : "down" } : { main: "bez zmeny" };
  } },
  { label: "Voľby 2023", cell: id => {
    const r = result2023(id);
    if (r.kind === "absent") return { main: "nekandidovala" };
    return { main: `${fmt(r.pct)} %`, note: r.kind === "coalition" ? `v koalícii ${r.label} · ${r.seats} kresiel` : r.seats ? `${r.seats} kresiel` : "bez kresla" };
  } },
  { label: "Vo vláde od roku 1993", cell: id => {
    const t = tenure[id];
    if (!t || t.days === 0) return { main: "nikdy" };
    return { main: t.label, note: `${Math.round(t.share)} % času · ${t.cabinets.length} ${t.cabinets.length === 1 ? "vláda" : t.cabinets.length < 5 ? "vlády" : "vlád"}${t.led > 0 ? " · aj premiér" : ""}` };
  } },
  { label: "Od štátu 2023–2027", cell: id => {
    const f = fundingForParty(id);
    if (f.kind === "party") return { main: mil(f.funding.total), note: "nárok zo zákona" };
    if (f.kind === "coalition") return { main: mil(f.funding.total), note: `celá koalícia ${f.funding.subject.short}, delí sa dohodou` };
    if (f.kind === "below") return { main: "0 €", note: `${fmt(f.funding.subject.pct)} % hlasov je pod 3 %` };
    return { main: "0 €", note: "v roku 2023 nekandidovala" };
  } },
  { label: "Na čele", cell: id => {
    const person = partyProfiles[id]?.people[0];
    return person ? { main: person.name, note: person.role } : { main: "—" };
  } },
  { label: "Programové dokumenty", cell: id => {
    const list = programmes.filter(p => p.partyId === id);
    const latest = [...list].sort((a, b) => (b.year ?? 0) - (a.year ?? 0))[0];
    return { main: String(list.length), note: latest ? `${latest.title} · ${statusLabel[latest.status]}` : "zatiaľ žiadny overený" };
  } },
];

export default function PartyCompare({ selected, onSelect, onOpen }: { selected: string[]; onSelect: (ids: string[]) => void; onOpen: (id: string) => void }) {
  const ids = selected.length ? selected : defaultCompare;
  const toggle = (id: string) => {
    if (ids.includes(id)) { if (ids.length > 1) onSelect(ids.filter(x => x !== id)); return; }
    onSelect([...(ids.length >= COMPARE_MAX ? ids.slice(1) : ids), id]);
  };
  const chosen = ids.map(id => parties.find(p => p.id === id)!).filter(Boolean);
  return <section className="party-compare" id="porovnanie" aria-labelledby="party-compare-title">
    <div className="pc-head"><h2 id="party-compare-title">Porovnať strany</h2><p>Vyberte dve alebo tri strany. Podpora, kreslá, rok 2023, čas vo vláde, peniaze od štátu a programy vedľa seba.</p></div>
    <div className="pc-picks" role="group" aria-label={`Strany na porovnanie, najviac ${COMPARE_MAX}`}>
      {candidates.map(p => <button key={p.id} type="button" aria-pressed={ids.includes(p.id)} onClick={() => toggle(p.id)}><i style={{ background: p.color }} aria-hidden="true"/>{p.short}</button>)}
    </div>
    <div className="pc-table" style={{ "--pc-cols": chosen.length } as React.CSSProperties} role="table" aria-label="Porovnanie strán">
      <div className="pc-row pc-names" role="row"><span role="columnheader" className="pc-label"><span className="sr-only">Údaj</span></span>
        {chosen.map(p => <span key={p.id} role="columnheader" className="pc-party" style={{ "--pc": p.color } as React.CSSProperties}><b>{p.short}</b><small>{p.name}</small></span>)}
      </div>
      {rows.map(r => <div className="pc-row" role="row" key={r.label}>
        <span role="rowheader" className="pc-label">{r.label}</span>
        {chosen.map(p => { const c = r.cell(p.id); return <span key={p.id} role="cell" className="pc-cell"><b className={c.tone}>{c.main}</b>{c.note && <small>{c.note}</small>}</span>; })}
      </div>)}
      <div className="pc-row pc-actions" role="row"><span role="cell" className="pc-label"/>
        {chosen.map(p => <span key={p.id} role="cell" className="pc-cell"><button type="button" className="text-button" onClick={() => onOpen(p.id)}>Profil {p.short} <ArrowRight size={14} aria-hidden="true"/></button></span>)}
      </div>
    </div>
    <p className="pc-note">Podpora a kreslá sú z Modelu Mandát, nie predpoveď. Čas vo vláde počítame ako v sekcii Zodpovednosť, bez predchodcov strán. Peniaze sú nárok zo zákona, nie vyplatené sumy.</p>
  </section>;
}
