import { ArrowUpRight } from "lucide-react";
import { accuracyElection, accuracyParties, accuracyRanking, finalPolls2023, result2023Share, systematicErrors } from "@/lib/poll-accuracy";
import { date } from "@/lib/polls";
import "@/app/poll-accuracy.css";

// Prieskumy: ako presne trafili posledné prieskumy pred voľbami 2023 (lib/poll-accuracy.ts).
const n = (v: number, d = 1) => v.toLocaleString("sk-SK", { minimumFractionDigits: d, maximumFractionDigits: d });
const signed = (v: number, d = 1) => `${v > 0 ? "+" : v < 0 ? "−" : "±"}${n(Math.abs(v), d)}`;

export default function PollAccuracy() {
  const ranking = accuracyRanking();
  const maxMae = Math.max(...ranking.map(a => a.mae));
  const bias = systematicErrors();
  const maxBias = Math.max(...bias.map(b => Math.abs(b.mean)));
  const all = bias.filter(b => b.sameSign);
  const under = all.filter(b => b.mean < 0).map(b => b.short), over = all.filter(b => b.mean > 0).map(b => b.short);
  const list = (items: string[]) => items.length > 1 ? `${items.slice(0, -1).join(", ")} a ${items.at(-1)}` : items.join("");
  return <section className="accuracy" aria-labelledby="accuracy-title">
    <div className="accuracy-head">
      <h2 id="accuracy-title">Ako presne trafili agentúry v roku 2023</h2>
      <p>Posledný prieskum každej agentúry pred moratóriom oproti výsledku volieb {date(accuracyElection.date)}. Meriame priemernú odchýlku na stranu pri {accuracyParties.length} subjektoch, ktoré uvádzali všetky agentúry.</p>
    </div>
    <div className="accuracy-grid">
      <div className="accuracy-card">
        <h3>Priemerná odchýlka na stranu</h3>
        <ol className="accuracy-rank">
          {ranking.map((a, i) => <li key={a.poll.agency}>
            <div className="accuracy-row">
              <span className="accuracy-agency"><b>{a.poll.agency}</b>{a.poll.client && <small>pre {a.poll.client}</small>}</span>
              <span className="accuracy-bar" aria-hidden="true"><i style={{ width: `${a.mae / maxMae * 100}%` }} className={i === 0 ? "is-best" : ""}/></span>
              <strong>{n(a.mae, 2)}<small> b.</small></strong>
            </div>
            <p className="accuracy-meta">
              <span className={a.winnerRight ? "ok" : "miss"}>{a.winnerRight ? "víťaz správne" : "víťaz nesprávne"}</span>
              <span>hranica 5 %: {a.thresholdRight} z {accuracyParties.length}</span>
              <span>najviac {a.biggest.short} {signed(a.biggest.error)}</span>
            </p>
          </li>)}
        </ol>
      </div>
      <div className="accuracy-card">
        <h3>Kde sa mýlili všetky rovnako</h3>
        <p className="accuracy-lead">Všetky agentúry podcenili {list(under)} a precenili {list(over)}. Keď sa mýlia všetky rovnakým smerom, nie je to náhoda jednej vzorky.</p>
        <ul className="accuracy-bias" aria-label="Priemerná odchýlka prieskumov pri stranách, kladná znamená precenenie">
          {bias.map(b => <li key={b.id} className={b.sameSign ? "is-all" : ""}>
            <span>{b.short}</span>
            <span className="accuracy-diverge" aria-hidden="true"><i style={b.mean < 0 ? { right: "50%", width: `${Math.abs(b.mean) / maxBias * 50}%` } : { left: "50%", width: `${b.mean / maxBias * 50}%` }} className={b.mean < 0 ? "under" : "over"}/></span>
            <b>{signed(b.mean)}</b>
          </li>)}
        </ul>
        <p className="accuracy-axis" aria-hidden="true"><span>podcenené</span><span>precenené</span></p>
      </div>
    </div>
    <details className="accuracy-table">
      <summary>Všetky čísla</summary>
      <div className="accuracy-table-wrap" tabIndex={0}><table>
        <caption className="sr-only">Posledné prieskumy pred voľbami 2023 a výsledok, v percentách</caption>
        <thead><tr><th scope="col">Strana</th>{finalPolls2023.map(p => <th key={p.agency} scope="col" className="num">{p.agency}<small>{date(p.end)}</small></th>)}<th scope="col" className="num">Výsledok</th></tr></thead>
        <tbody>{accuracyParties.map(p => <tr key={p.id}><th scope="row">{p.short}</th>{finalPolls2023.map(poll => <td key={poll.agency} className="num">{n(poll.values[p.id])}</td>)}<td className="num"><b>{n(result2023Share(p.id), 2)}</b></td></tr>)}</tbody>
      </table></div>
    </details>
    <p className="accuracy-note">Prieskum je obraz niekoľkých dní pred voľbami, nie predpoveď; časť voličov sa rozhoduje až na konci. Presnosť v jedných voľbách nehovorí všetko o presnosti dnes. Hranicu 5 % hodnotíme podľa toho, na ktorej strane hranice prieskum stranu ukázal. Zdroje: {finalPolls2023.map((p, i) => <span key={p.agency}>{i > 0 && " · "}<a href={p.source} target="_blank" rel="noopener noreferrer">{p.sourceName}<ArrowUpRight size={11} aria-hidden="true"/><span className="sr-only"> (nová karta)</span></a></span>)} · výsledok: ŠÚ SR.</p>
  </section>;
}
