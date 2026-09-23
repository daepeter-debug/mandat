import { currentAggregate } from "@/lib/aggregate";
import { edition, signed } from "@/lib/edition";
import { date, fmt, parties } from "@/lib/polls";

// „V skratke“ na úvode: päť faktov z Modelu Mandát a ich zmena za 30 dní (lib/edition.ts).
// Nahrádza hustý zoznam zmien; kreslá blokov nesú karty nad ním.
const party = (id: string) => parties.find(p => p.id === id);
const pollWord = (n: number) => n === 1 ? "nové meranie" : n >= 2 && n <= 4 ? "nové merania" : "nových meraní";

function Name({ id }: { id: string }) {
  const p = party(id);
  return <span className="brief-party"><i style={{ background: p?.color ?? "#8a968c" }} aria-hidden="true"/>{p?.short ?? id}</span>;
}

export default function EditionBrief() {
  const values = Object.values(currentAggregate.values).sort((a, b) => b.value - a.value);
  const leader = values[0];
  const up = edition.movers.find(m => m.delta > 0);
  const down = edition.movers.find(m => m.delta < 0);
  // Na hrane je strana, ktorej pásmo neistoty zasahuje na obe strany hranice 5 %.
  const edge = values.filter(v => v.lower < 5 && v.upper >= 5).slice(0, 3);
  const crossing = (id: string) => edition.crossings.find(c => c.id === id);
  const newest = edition.newPolls[0];
  const latestAgencies = [...new Set(edition.newPolls.filter(p => p.end === newest?.end).map(p => p.agency))];

  return <section className="edition-brief" aria-labelledby="brief-title">
    <header><h2 id="brief-title">V skratke</h2><span>zmeny za 30 dní, od {date(edition.monthAgo)}</span></header>
    <dl>
      {leader && <div><dt>Vedie</dt><dd><Name id={leader.partyId}/><b>{fmt(leader.value)} %</b></dd><small>pásmo {fmt(leader.lower)}–{fmt(leader.upper)} %</small></div>}
      <div><dt>Najviac rastie</dt>{up ? <><dd><Name id={up.id}/><b className="up">{signed(up.delta)} p. b.</b></dd><small>na {fmt(up.value)} %</small></> : <dd>žiadna strana</dd>}</div>
      <div><dt>Najviac klesá</dt>{down ? <><dd><Name id={down.id}/><b className="down">{signed(down.delta)} p. b.</b></dd><small>na {fmt(down.value)} %</small></> : <dd>žiadna strana</dd>}</div>
      <div><dt>Na hrane 5 %</dt>{edge.length ? <><dd className="brief-list">{edge.map(v => <span key={v.partyId}><Name id={v.partyId}/><b>{fmt(v.value)} %</b></span>)}</dd>
        <small>{edge.map(v => {
          const c = crossing(v.partyId);
          const note = c ? (c.direction === "down" ? `pred mesiacom ${c.seatsBefore} kresiel` : "pred mesiacom pod 5 %") : `pásmo ${fmt(v.lower)}–${fmt(v.upper)} %`;
          return edge.length > 1 ? `${party(v.partyId)?.short}: ${note}` : note;
        }).join(" · ")}</small></> : <><dd>žiadna strana</dd><small>pásma všetkých strán sú mimo 5 %</small></>}</div>
      <div><dt>Merania</dt><dd><b>{edition.newPolls.length}</b> {pollWord(edition.newPolls.length)}</dd><small>{newest ? `najnovšie ${date(newest.end)}: ${latestAgencies.join(", ")}` : "za 30 dní žiadne"}</small></div>
    </dl>
  </section>;
}
