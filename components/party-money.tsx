import { ArrowUpRight } from "lucide-react";
import { averageWage, eligibleFunding, fundingChecked, fundingLaw, fundingThresholdPct, fundingTotal, subjectFunding, termMonths } from "@/lib/party-funding";
import { validVotes2023 } from "@/lib/parliament";
import { date } from "@/lib/polls";
import "@/app/party-money.css";

/*
  Strany: koľko dostanú od štátu za volebné obdobie 2023–2027 (nárok zo zákona, lib/party-funding.ts).
  Stĺpec delí sumu na príspevok za hlasy, na činnosť a na mandáty; pri každom subjekte aj suma na jedného voliča.
*/
const mil = (v: number) => `${(v / 1e6).toLocaleString("sk-SK", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mil. €`;
const eur = (v: number, d = 0) => `${v.toLocaleString("sk-SK", { minimumFractionDigits: d, maximumFractionDigits: d })} €`;

export default function PartyMoney() {
  const max = Math.max(...eligibleFunding.map(f => f.total));
  const perVote = averageWage.eur / 100;
  const mandate = 30 * averageWage.eur;
  // Najbližšie pod hranicou nároku: koľko hlasov chýbalo do 3 %.
  const limitVotes = Math.floor(validVotes2023 * fundingThresholdPct / 100) + 1;
  const near = subjectFunding.filter(f => !f.eligible).sort((a, b) => b.subject.votes - a.subject.votes)[0];
  const withSeats = eligibleFunding.filter(f => f.subject.seats > 0);
  const perVoterSeated = withSeats.reduce((a, f) => a + f.total, 0) / withSeats.reduce((a, f) => a + f.subject.votes, 0);
  return <section className="party-money" aria-labelledby="party-money-title">
    <div className="party-money-head">
      <h2 id="party-money-title">Koľko dostanú strany od štátu</h2>
      <p>Nárok zo zákona za volebné obdobie 2023–2027 podľa výsledku volieb 2023. Príspevok patrí stranám s viac ako {fundingThresholdPct} % hlasov; mandáty prinášajú peniaze navyše každý rok.</p>
    </div>
    <dl className="party-money-kpis">
      <div><dt>Spolu za obdobie</dt><dd>{mil(fundingTotal)}</dd><small>{eligibleFunding.length} subjektov nad {fundingThresholdPct} %</small></div>
      <div><dt>Za jeden hlas</dt><dd>{eur(perVote * 2, 2)}</dd><small>{eur(perVote, 2)} jednorazovo + rovnako na činnosť</small></div>
      <div><dt>Za mandát ročne</dt><dd>{eur(mandate)}</dd><small>za každý z prvých 20, ďalšie po {eur(20 * averageWage.eur)}</small></div>
      <div><dt>Na voliča strany v parlamente</dt><dd>{eur(perVoterSeated, 0)}</dd><small>za celé obdobie, vrátane mandátov</small></div>
    </dl>
    <ol className="party-money-list" aria-label="Nárok subjektov na štátne príspevky za obdobie 2023–2027">
      {eligibleFunding.map(f => <li key={f.subject.number}>
        <span className="party-money-name"><i style={{ background: f.subject.color }} aria-hidden="true"/><b>{f.subject.short}</b><small>{f.subject.pct.toLocaleString("sk-SK")} % · {f.subject.seats ? `${f.subject.seats} mandátov` : "bez mandátu"}</small></span>
        <span className="party-money-bar" aria-hidden="true">
          <i className="votes" style={{ width: `${f.forVotes / max * 100}%` }}/>
          <i className="activity" style={{ width: `${f.forActivity / max * 100}%` }}/>
          <i className="mandates" style={{ width: `${f.mandateTerm / max * 100}%` }}/>
        </span>
        <span className="party-money-sum"><strong>{mil(f.total)}</strong><small>{eur(f.total / f.subject.votes)} na voliča</small></span>
      </li>)}
    </ol>
    <p className="party-money-legend" aria-hidden="true"><span><i className="votes"/>za hlasy</span><span><i className="activity"/>na činnosť ({termMonths} mesačných podielov)</span><span><i className="mandates"/>na mandáty</span></p>
    {near && <p className="party-money-near">Najtesnejšie pod hranicou nároku: {near.subject.short} s {near.subject.pct.toLocaleString("sk-SK")} % hlasov. Do {fundingThresholdPct} % im chýbalo {(limitVotes - near.subject.votes).toLocaleString("sk-SK")} hlasov, s nimi by mali nárok asi na {mil(near.subject.votes * perVote * 2)}.</p>}
    <p className="party-money-note">Počítame nárok zo zákona z oficiálnych výsledkov, nie skutočne vyplatené sumy; tie môžu byť nižšie (strana musí včas odovzdať výročnú správu, koalícia dohodu o delení). Priemerná mzda {averageWage.year}: {eur(averageWage.eur)} (ŠÚ SR). <a href={fundingLaw.url} target="_blank" rel="noopener noreferrer">{fundingLaw.name}<ArrowUpRight size={11} aria-hidden="true"/><span className="sr-only"> (nová karta)</span></a> · overené {date(fundingChecked)}.</p>
  </section>;
}
