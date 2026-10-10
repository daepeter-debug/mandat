import type { CSSProperties } from "react";
import MiniHemicycle from "@/components/mini-hemicycle";
import SupportRange from "@/components/support-range";
import { aggregateSeries, currentAggregate } from "@/lib/aggregate";
import { partyDelta } from "@/lib/mobile-insights";
import { edition } from "@/lib/edition";
import { fmt, type Party } from "@/lib/polls";
export function PartyTrend({ party }: { party: Party }) {
  const values = aggregateSeries.slice(-6).flatMap(p => p.values[party.id] ? [p.values[party.id].value] : []);
  if (!currentAggregate.values[party.id]) return null;
  const min = Math.min(...values), max = Math.max(...values), delta = partyDelta(party.id);
  const points = values.map((v,i) => `${Math.round(3+i/Math.max(1,values.length-1)*78)},${Math.round(24-(v-min)/Math.max(1,max-min)*20)}`).join(" ");
  return <span className="party-card-trend">
    {values.length > 1 && <svg viewBox="0 0 84 28" role="img" aria-label={`Podpora ${party.short} v posledných ${values.length} bodoch Modelu Mandát: ${values.map(fmt).join(", ")} percent`}><polyline points={points} stroke={party.color} strokeWidth="2" strokeLinejoin="round" fill="none"/><circle cx="81" cy={points.split(" ").at(-1)?.split(",")[1]} r="2.5" fill={party.color}/></svg>}
    {delta !== null && <small data-direction={delta > 0 ? "up" : delta < 0 ? "down" : "flat"}>{delta > 0 ? "▲" : delta < 0 ? "▼" : "·"} {fmt(Math.abs(delta))} b. <span>za 30 dní</span></small>}
  </span>;
}
export function PartySupport({ party }: { party: Party }) {
  const support = currentAggregate.values[party.id];
  if (!support) return null;
  const seats = edition.now.rows.find(r => r.id === party.id)?.seats ?? 0;
  const colors = edition.now.rows.flatMap(r => Array.from({ length:r.seats }, () => r.id===party.id ? party.color : "var(--border)"));
  return <div className="party-profile-support" style={{ "--party-color":party.color } as CSSProperties}>
    <div><strong>{fmt(support.value)} <small>%</small></strong><span>Model Mandát · vážený priemer</span><span>Pásmo neistoty: {fmt(support.lower)}–{fmt(support.upper)} %</span></div>
    {support.value >= 5 && seats > 0 && <figure><MiniHemicycle colors={colors} label={`${party.short}: ${seats} zo 150 kresiel v scenári Modelu Mandát. Nejde o predpoveď.`}/><figcaption>{seats} kresiel · scenár</figcaption></figure>}
    <SupportRange support={support}/>
  </div>;
}
