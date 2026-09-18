"use client";
import { lazy, Suspense } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { cabinets, cabinetSummaries, debtBrake, debtPerCapita, eventsForYear, financeEvents, financeFetched, financeSources, financeYears, latestFinanceYear, leadingCabinet, maastricht, primaryBalance, yearShares, type CabinetSummary, type FinanceYear } from '@/lib/public-finance';
import { date } from '@/lib/polls';

const FinanceChart = lazy(() => import('@/components/finance-chart'));

/*
  Záložka Hospodárenie: koľko štát každý rok minul nad príjmy (saldo), koľko dlhu sa nazbieralo
  a čo sa s tým dialo za jednotlivých vlád. Dva pohľady na tie isté čísla: po rokoch (tabuľka)
  a po vládach (súhrny vážené dňami vo funkcii). Pravidlá a hranice dát sú v závere stránky.
*/

const num = (v: number | null | undefined, d = 1, sign = false) => v === null || v === undefined ? '—' : `${sign && v > 0 ? '+' : ''}${v.toLocaleString('sk-SK', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
const bn = (meur: number | null | undefined, sign = false) => meur === null || meur === undefined ? '—' : num(meur / 1000, 1, sign);
const int = (v: number | null | undefined) => v === null || v === undefined ? '—' : v.toLocaleString('sk-SK', { maximumFractionDigits: 0 });
const tone = (v: number | null | undefined) => v === null || v === undefined ? '' : v < 0 ? 'finance-neg' : 'finance-pos';
const pct = (share: number) => `${Math.round(share * 100)} %`;

function CabinetCell({ year }: { year: number }) {
  const shares = [...yearShares(year)].sort((a, b) => b.days - a.days);
  return <>{shares.map(s => <span className="finance-cab" key={s.cabinet.id}><i style={{ background: s.cabinet.color }} aria-hidden="true"/>{s.cabinet.short}{shares.length > 1 && <small>{pct(s.share)}</small>}</span>)}</>;
}

function Kpis({ row }: { row: FinanceYear }) {
  const limit = debtBrake.upperLimit(row.year);
  const over = row.debtPct - limit;
  const interestMeur = row.interestPct !== undefined && row.gdpMeur !== undefined ? row.interestPct * row.gdpMeur / 100 : null;
  return <dl className="finance-kpis">
    <div><dt>Saldo {row.year}</dt><dd className={tone(row.deficitPct)}>{num(row.deficitPct)} % HDP<small>{bn(row.deficitMeur)} mld €{primaryBalance(row) !== null && ` · bez úrokov ${num(primaryBalance(row))} %`}</small></dd></div>
    <div><dt>Dlh koncom {row.year}</dt><dd>{num(row.debtPct)} % HDP<small>{bn(row.debtMeur)} mld €</small></dd></div>
    <div><dt>Dlh na obyvateľa</dt><dd>{int(debtPerCapita(row))} €<small>hrubý dlh / obyvateľ</small></dd></div>
    <div className={over > 0 ? 'is-over' : ''}><dt>Dlhová brzda {row.year}</dt><dd>{over > 0 ? `+${num(over)} p. b.` : `${num(over)} p. b.`}<small>{over > 0 ? 'nad' : 'pod'} horným limitom {num(limit, 0)} % HDP</small></dd></div>
    <div><dt>Úroky z dlhu {row.year}</dt><dd>{num(row.interestPct)} % HDP<small>{interestMeur !== null ? `≈ ${bn(interestMeur)} mld € ročne` : 'bez údaja'}</small></dd></div>
  </dl>;
}

function YearsTable() {
  const rows = [...financeYears].reverse();
  return <div className="finance-table-wrap"><table className="finance-table">
    <caption className="sr-only">Verejné financie Slovenska po rokoch</caption>
    <thead><tr>
      <th scope="col">Rok</th><th scope="col">Vláda</th>
      <th scope="col" className="num">Saldo<small>% HDP</small></th><th scope="col" className="num">Saldo<small>mld €</small></th>
      <th scope="col" className="num">Bez úrokov<small>% HDP</small></th>
      <th scope="col" className="num">Dlh<small>% HDP</small></th><th scope="col" className="num">Dlh<small>mld €</small></th><th scope="col" className="num">Dlh na obyv.<small>€</small></th>
      <th scope="col" className="num">Príjmy<small>% HDP</small></th><th scope="col" className="num">Výdavky<small>% HDP</small></th>
      <th scope="col" className="num">Rast HDP<small>%</small></th><th scope="col" className="num">Nezamestn.<small>%</small></th><th scope="col" className="num">Inflácia<small>%</small></th>
    </tr></thead>
    <tbody>{rows.map(r => <tr key={r.year}>
      <th scope="row">{r.year}{eventsForYear(r.year).map(e => <small className="finance-event" key={e}>{e}</small>)}</th>
      <td><CabinetCell year={r.year}/></td>
      <td className={`num ${tone(r.deficitPct)}`}>{num(r.deficitPct)}</td><td className="num">{bn(r.deficitMeur)}</td>
      <td className={`num ${tone(primaryBalance(r))}`}>{num(primaryBalance(r))}</td>
      <td className="num"><b>{num(r.debtPct)}</b></td><td className="num">{bn(r.debtMeur)}</td><td className="num">{int(debtPerCapita(r))}</td>
      <td className="num">{num(r.revenuePct)}</td><td className="num">{num(r.expenditurePct)}</td>
      <td className="num">{num(r.gdpGrowth)}</td><td className="num">{num(r.unemployment)}{r.unemploymentSource === 'historic' && <sup title="historický rad Eurostatu">*</sup>}</td><td className="num">{num(r.inflation)}</td>
    </tr>)}</tbody>
  </table></div>;
}

function CabinetCard({ s }: { s: CabinetSummary }) {
  const c = s.cabinet;
  const yearsLabel = s.years.map(y => y.share < 0.995 ? `${y.year} (${pct(y.share)})` : String(y.year)).join(' · ');
  const events = [...new Set(s.years.filter(y => y.share >= 0.3).flatMap(y => eventsForYear(y.year)))];
  return <article className="finance-cabinet" style={{ '--cab': c.color } as React.CSSProperties}>
    <header><h3>{c.name}</h3><p>{c.pm} · {c.parties}</p><p>{date(c.start)} – {c.end ? date(c.end) : 'úraduje'} · v dátach {num(s.weight, 1)} r. ({yearsLabel})</p></header>
    <dl>
      <div><dt>Priemerné saldo</dt><dd className={tone(s.avgDeficitPct)}>{num(s.avgDeficitPct)} % HDP</dd></div>
      <div><dt>Súčet salda</dt><dd className={tone(s.deficitSumMeur)}>{bn(s.deficitSumMeur)} mld €<small>podiel podľa dní vo funkcii</small></dd></div>
      <div><dt>Dlh, % HDP</dt><dd>{num(s.debtStartPct)} → {num(s.debtEndPct)}<small>koniec {s.debtStartYear ?? '—'} → koniec {s.debtEndYear ?? '—'} · pripísané {num(s.debtChangePct, 1, true)} p. b.</small></dd></div>
      <div><dt>Rast HDP</dt><dd>{num(s.avgGrowth)} %<small>priemer za rok</small></dd></div>
      <div><dt>Nezamestnanosť</dt><dd>{num(s.avgUnemployment)} %</dd></div>
      <div><dt>Inflácia</dt><dd>{num(s.avgInflation)} %</dd></div>
    </dl>
    {events.length > 0 && <p className="finance-note"><b>Kontext:</b> {events.join('; ')}.</p>}
    {c.note && <p className="finance-note">{c.note}</p>}
  </article>;
}

function CabinetsView() {
  const all = cabinetSummaries();
  const withData = all.filter(s => s.years.length > 0);
  const withoutData = all.filter(s => s.years.length === 0);
  const ranked = [...withData].sort((a, b) => (b.avgDeficitPct ?? -99) - (a.avgDeficitPct ?? -99));
  const maxAbs = Math.max(...ranked.map(s => Math.abs(s.avgDeficitPct ?? 0)), 1);
  return <>
    <section className="finance-rank" aria-labelledby="finance-rank-title">
      <h2 id="finance-rank-title">Priemerné saldo počas vlády</h2>
      <p>Od najmenšieho deficitu. Rok, v ktorom sa vlády striedali, je rozdelený podľa dní vo funkcii; rozpočet na prvý rok vlády však spravidla zostavila predchádzajúca vláda.</p>
      <ol>{ranked.map(s => <li key={s.cabinet.id} style={{ '--cab': s.cabinet.color } as React.CSSProperties}>
        <span className="finance-cab"><i style={{ background: s.cabinet.color }} aria-hidden="true"/>{s.cabinet.short}</span>
        <div className="finance-bar" aria-hidden="true"><i style={{ width: `${Math.abs(s.avgDeficitPct ?? 0) / maxAbs * 100}%` }}/></div>
        <b className={tone(s.avgDeficitPct)}>{num(s.avgDeficitPct)} %</b>
      </li>)}</ol>
    </section>
    <div className="finance-cabinets">{[...withData].reverse().map(s => <CabinetCard key={s.cabinet.id} s={s}/>)}</div>
    {withoutData.length > 0 && <p className="finance-method-note">Bez údajov v rade Eurostatu (začína rokom 1995): {withoutData.map(s => `${s.cabinet.name} (${date(s.cabinet.start)} – ${s.cabinet.end ? date(s.cabinet.end) : 'úraduje'})`).join('; ')}.</p>}
  </>;
}

function Method() {
  return <details className="finance-method">
    <summary>Odkiaľ sú čísla, ako priraďujeme roky vládam a čo znamená dlhová brzda</summary>
    <h3>Zdroje</h3>
    <p>Všetky ročné rady preberáme z Eurostatu, ktorý zverejňuje údaje zostavené Štatistickým úradom SR podľa európskej metodiky ESA 2010. Saldo aj dlh sú za celú verejnú správu (štát, samosprávy, Sociálna poisťovňa, zdravotné poisťovne a ďalšie subjekty), nie iba za štátny rozpočet. Dlh je hrubý „maastrichtský“ dlh ku koncu roka. Údaje k {date(financeFetched)}; Eurostat ich reviduje pri každej notifikácii (apríl a október), preto sa staršie roky môžu mierne meniť. Sumy v eurách pred rokom 2009 sú prepočítané zo slovenských korún (dlh kurzom ku koncu roka, HDP priemerným kurzom), preto sa dlh v € a v % HDP v tých rokoch nezhodujú presne — smerodajný je podiel na HDP.</p>
    <ul>{financeSources.map(s => <li key={s.url + s.name}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.name} <ArrowUpRight size={11}/><span className="sr-only"> (nová karta)</span></a>{s.note && <> — {s.note}</>}</li>)}</ul>
    <h3>Ako priraďujeme roky vládam</h3>
    <p>Rok, v ktorom sa vlády striedali, delíme medzi ne podľa dní vo funkcii; deň výmeny patrí novej vláde. Priemerné saldo, súčet salda aj zmena dlhu za vládu sú vážené týmto podielom. Je to jednoduché a kontrolovateľné pravidlo, nie súd o tom, kto za čo môže: rozpočet na daný rok schvaľuje spravidla predchádzajúca vláda, veľká časť výdavkov je daná zákonmi a krízové roky (bankové sanácie 1999–2000, finančná kríza 2009, pandémia 2020–2021, energetická kríza 2022–2023) zasahujú bez ohľadu na to, kto vládne. V tabuľke po rokoch preto ostáva pri každom čísle aj kontext.</p>
    <h3>Čo je saldo bez úrokov</h3>
    <p>Primárne saldo je saldo bez zaplatených úrokov z dlhu. Hovorí, či štát hospodári vyrovnane ešte pred splácaním starých dlhov; ak je záporné, dlh rastie aj bez úrokov.</p>
    <h3>Dlhová brzda</h3>
    <p>{debtBrake.law} určuje horný limit dlhu verejnej správy: pôvodne 60 % HDP, od roku 2018 každý rok o jeden percentuálny bod nižší, až kým v roku 2027 nedosiahne 50 % HDP. Pod limitom sú štyri pásma, pri ktorých prekročení nastupujú postupne prísnejšie opatrenia — od vysvetlenia vlády parlamentu cez zmrazenie výdavkov až po hlasovanie o dôvere vláde. Zjednodušené; presné znenie vrátane výnimiek (napr. hlboká recesia, náklady krízy) je v zákone, jeho plnenie hodnotí Rada pre rozpočtovú zodpovednosť. Maastrichtské referenčné hodnoty Paktu stability a rastu sú deficit {Math.abs(maastricht.deficitPct)} % a dlh {maastricht.debtPct} % HDP; čiarkovaná hranica v grafe je −3 %.</p>
    <h3>Kontext krízových rokov</h3>
    <ul>{financeEvents.map(e => <li key={`${e.year}-${e.label}`}><b>{e.year}</b> — {e.label}</li>)}</ul>
    <p>* Nezamestnanosť pred rokom 2009 pochádza z historického radu Eurostatu (pred zmenou metodiky výberového zisťovania); roky pred 1997 rad nemá.</p>
  </details>;
}

export default function PublicFinance({ view, onView }: { view: string; onView: (view: string) => void }) {
  const chartRows = financeYears.map(r => {
    const lead = leadingCabinet(r.year);
    return { year: r.year, deficitPct: r.deficitPct, debtPct: r.debtPct, limit: r.year >= debtBrake.effectiveFrom ? debtBrake.upperLimit(r.year) : null, color: lead?.color ?? '#999', cabinet: lead?.short ?? '', events: eventsForYear(r.year) };
  });
  const legendCabinets = cabinets.filter(c => financeYears.some(r => leadingCabinet(r.year)?.id === c.id));
  const first = financeYears[0], last = latestFinanceYear;
  return <section className="finance-page" aria-labelledby="finance-title">
    <header className="news-heading"><div><h1 id="finance-title">Ako hospodári štát.</h1><p>Koľko verejná správa každý rok minie nad svoje príjmy, koľko dlhu sa nazbieralo a ako to vyzeralo za jednotlivých vlád. Roky {first.year}–{last.year} podľa Eurostatu a Štatistického úradu SR.</p></div><span className="news-selection">Eurostat · údaje k {date(financeFetched)}</span></header>
    <Kpis row={last}/>
    <div className="finance-switch" role="group" aria-label="Pohľad na hospodárenie">
      <button type="button" aria-pressed={view !== 'governments'} onClick={() => onView('years')}>Po rokoch</button>
      <button type="button" aria-pressed={view === 'governments'} onClick={() => onView('governments')}>Po vládach</button>
    </div>
    <div className="finance-chart-wrap">
      <Suspense fallback={<p className="chart-loading">Načítavame graf…</p>}><FinanceChart rows={chartRows}/></Suspense>
      <div className="finance-legend" aria-label="Legenda grafu">
        {legendCabinets.map(c => <span key={c.id}><i style={{ background: c.color }} aria-hidden="true"/>{c.short}</span>)}
        <span className="line"><i aria-hidden="true"/>dlh, % HDP (pravá os)</span>
        <span className="line dash"><i aria-hidden="true"/>horný limit dlhu (ústavný zákon)</span>
        <span>stĺpce: saldo, % HDP · bodkovaná −3 %: maastrichtská hranica</span>
      </div>
    </div>
    {view === 'governments' ? <CabinetsView/> : <YearsTable/>}
    <Method/>
  </section>;
}
