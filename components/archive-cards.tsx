import { ArrowRight, ArrowUpRight } from "lucide-react";
import { date, fmt, rank, type Poll } from "@/lib/polls";
import "@/app/archive-cards.css";

/*
  Archív meraní na mobile: namiesto vysokej karty s metadátami kompaktná karta s výsledkom.
  Štyri najsilnejšie strany ako mini stĺpce, pod nimi zber, vzorka, zdroj a detail.
  Na počítači ostáva tabuľka (táto zložka je tam skrytá v CSS).
*/
const range = (p: Poll) => {
  const [s, e] = [p.start, p.end];
  const d = (x: string) => Number(x.slice(8, 10)), m = (x: string) => Number(x.slice(5, 7));
  return s.slice(0, 7) === e.slice(0, 7) ? `${d(s)}. – ${d(e)}. ${m(e)}. ${e.slice(0, 4)}` : `${date(s)} – ${date(e)}`;
};

export default function ArchiveCards({ polls, onDetail }: { polls: Poll[]; onDetail: (p: Poll) => void }) {
  return <ul className="archive-cards" aria-label="Archív meraní">
    {polls.map(p => {
      const top = rank(p).slice(0, 4);
      const max = Math.max(...top.map(x => p.values[x.id]), 1);
      return <li key={p.id} className="archive-card">
        <div className="archive-card-head"><b>{p.agency}</b><span>{p.month} {p.end.slice(0, 4)}</span></div>
        <p className="archive-card-meta">zber {range(p)}{p.sample ? ` · n = ${p.sample.toLocaleString("sk-SK")}` : ""}</p>
        <ul className="archive-card-bars" aria-label={`Najsilnejšie strany: ${top.map(x => `${x.short} ${fmt(p.values[x.id])} %`).join(", ")}`}>
          {top.map(x => <li key={x.id}><span><b>{x.short}</b><em>{fmt(p.values[x.id])} %</em></span><i aria-hidden="true"><s style={{ width: `${p.values[x.id] / max * 100}%`, background: x.color }}/></i></li>)}
        </ul>
        <div className="archive-card-foot">
          <a href={p.source} target="_blank" rel="noopener noreferrer">Pôvodná správa<ArrowUpRight size={13} aria-hidden="true"/><span className="sr-only"> (nová karta)</span></a>
          <button type="button" onClick={() => onDetail(p)}>Detail merania <ArrowRight size={15} aria-hidden="true"/></button>
        </div>
      </li>;
    })}
  </ul>;
}
