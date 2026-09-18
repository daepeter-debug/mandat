"use client";
import { lazy, Suspense } from 'react';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { cabinets, cabinetSummaries, compareV4, debtBrake, debtPerCapita, eventsForYear, financeCompare, financeEvents, financeFetched, financeSources, financeYears, latestFinanceYear, latestWith, leadingCabinet, levelChange, maastricht, partiesLabel, primaryBalance, v4Rank, yearShares, type Cabinet, type CabinetSummary, type CompareRow, type FinanceYear } from '@/lib/public-finance';
import { inactiveParties } from '@/lib/government-tenure-inactive';
import { date, parties } from '@/lib/polls';
import logos from '@/lib/party-logos.json';

const FinanceChart = lazy(() => import('@/components/finance-chart'));
const LivingChart = lazy(() => import('@/components/living-chart'));

/*
  Záložka Hospodárenie: koľko štát každý rok minul nad príjmy (saldo), koľko dlhu sa nazbieralo
  a čo sa s tým dialo za jednotlivých vlád. Štyri pohľady na tie isté roky: po rokoch (tabuľka),
  po vládach (súhrny vážené dňami vo funkcii), životná úroveň (mzdy, príjmy, chudoba, dobiehanie EÚ)
  a porovnanie so susedmi a eurozónou. Pravidlá a hranice dát sú v závere stránky.
*/

const num = (v: number | null | undefined, d = 1, sign = false) => v === null || v === undefined ? '—' : `${sign && v > 0 ? '+' : ''}${v.toLocaleString('sk-SK', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
const bn = (meur: number | null | undefined, sign = false) => meur === null || meur === undefined ? '—' : num(meur / 1000, 1, sign);
const int = (v: number | null | undefined, sign = false) => v === null || v === undefined ? '—' : `${sign && v > 0 ? '+' : ''}${v.toLocaleString('sk-SK', { maximumFractionDigits: 0 })}`;
const tone = (v: number | null | undefined) => v === null || v === undefined ? '' : v < 0 ? 'finance-neg' : 'finance-pos';
const pct = (share: number) => `${Math.round(share * 100)} %`;
const logoMap: Record<string, { src: string }> = logos;

function CabinetCell({ year }: { year: number }) {
  const shares = [...yearShares(year)].sort((a, b) => b.days - a.days);
  return <>{shares.map(s => <span className="finance-cab" key={s.cabinet.id}><i style={{ background: s.cabinet.color }} aria-hidden="true"/>{s.cabinet.short}{shares.length > 1 && <small>{pct(s.share)}</small>}</span>)}</>;
}

// Logo, keď strana existuje dodnes (OĽANO nesie logo dnešného Hnutia Slovensko); inak monogram vo farbe z registra neaktívnych strán.
function CabinetParties({ cabinet }: { cabinet: Cabinet }) {
  if (!cabinet.parties.length) return <p className="finance-parties finance-parties-none">{partiesLabel(cabinet)}</p>;
  return <ul className="finance-parties" aria-label="Koaličné strany">{cabinet.parties.map(p => {
    const logo = p.party ? logoMap[p.party] : undefined;
    const name = p.party ? parties.find(x => x.id === p.party)?.name : p.inactive ? inactiveParties.find(x => x.id === p.inactive)?.name : undefined;
    const color = p.inactive ? inactiveParties.find(x => x.id === p.inactive)?.color : undefined;
    return <li key={p.short} title={name}>{logo ? <Image src={logo.src} alt="" width={22} height={22} unoptimized/> : <i style={color ? { background: color } : undefined} aria-hidden="true">{p.short.replace(/[^A-ZĽŠČŽÁÉÍÓÚÝŤĎŇ]/g, '').slice(0, 2)}</i>}<span>{p.short}</span></li>;
  })}</ul>;
}

function ChartLegend({ line, dash, note }: { line: string; dash?: string; note: string }) {
  const legendCabinets = cabinets.filter(c => financeYears.some(r => leadingCabinet(r.year)?.id === c.id));
  return <div className="finance-legend" aria-label="Legenda grafu">
    {legendCabinets.map(c => <span key={c.id}><i style={{ background: c.color }} aria-hidden="true"/>{c.short}</span>)}
    <span className="line"><i aria-hidden="true"/>{line}</span>
    {dash && <span className="line dash"><i aria-hidden="true"/>{dash}</span>}
    <span>{note}</span>
  </div>;
}

/* ---------- Saldo a dlh ---------- */

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
    <header><h3>{c.name}</h3><p>{c.pm} · {date(c.start)} – {c.end ? date(c.end) : 'úraduje'}</p><CabinetParties cabinet={c}/><p>V dátach {num(s.weight, 1)} r. ({yearsLabel})</p></header>
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

/* ---------- Životná úroveň ---------- */

function LivingKpis() {
  const pps = latestWith('gdpPcPps'), mw = latestWith('minWage'), mi = latestWith('medianIncome'), pov = latestWith('povertyRate'), emp = latestWith('employment');
  const cz = financeCompare.rows.find(r => r.geo === 'CZ')?.gdpPcPps;
  return <dl className="finance-kpis">
    <div><dt>HDP na obyvateľa {pps?.year}</dt><dd>{int(pps?.gdpPcPps)} % EÚ<small>parita kúpnej sily{cz !== undefined && `; Česko ${int(cz)} %`}</small></dd></div>
    <div><dt>Minimálna mzda {mw?.year}</dt><dd>{int(mw?.minWage)} €<small>mesačne, stav v januári</small></dd></div>
    <div><dt>Medián príjmu {mi?.year}</dt><dd>{int(mi?.medianIncome)} €<small>disponibilný príjem na osobu za rok{mi?.medianIncome && ` · ≈ ${int(mi.medianIncome / 12)} € mesačne`}</small></dd></div>
    <div><dt>Riziko chudoby {pov?.year}</dt><dd>{num(pov?.povertyRate)} %<small>ľudia pod 60 % mediánu príjmu</small></dd></div>
    <div><dt>Zamestnanosť {emp?.year}</dt><dd>{num(emp?.employment)} %<small>ľudia 20–64 rokov, ktorí pracujú</small></dd></div>
  </dl>;
}

function LivingTable() {
  const rows = [...financeYears].reverse();
  return <div className="finance-table-wrap"><table className="finance-table">
    <caption className="sr-only">Životná úroveň na Slovensku po rokoch</caption>
    <thead><tr>
      <th scope="col">Rok</th><th scope="col">Vláda</th>
      <th scope="col" className="num">HDP na obyv.<small>EÚ = 100</small></th>
      <th scope="col" className="num">Min. mzda<small>€ / mesiac</small></th>
      <th scope="col" className="num">Medián príjmu<small>€ / rok</small></th><th scope="col" className="num">Chudoba<small>%</small></th>
      <th scope="col" className="num">Zamestnanosť<small>20–64, %</small></th><th scope="col" className="num">Nezamestn.<small>%</small></th><th scope="col" className="num">Inflácia<small>%</small></th>
    </tr></thead>
    <tbody>{rows.map(r => <tr key={r.year}>
      <th scope="row">{r.year}</th>
      <td><CabinetCell year={r.year}/></td>
      <td className="num"><b>{int(r.gdpPcPps)}</b></td>
      <td className="num">{int(r.minWage)}</td>
      <td className="num">{int(r.medianIncome)}</td><td className="num">{num(r.povertyRate)}</td>
      <td className="num">{num(r.employment)}</td><td className="num">{num(r.unemployment)}</td><td className="num">{num(r.inflation)}</td>
    </tr>)}</tbody>
  </table></div>;
}

function LivingCabinetCard({ s }: { s: CabinetSummary }) {
  const c = s.cabinet;
  const pps = levelChange(s, 'gdpPcPps'), mw = levelChange(s, 'minWage'), pov = levelChange(s, 'povertyRate'), emp = levelChange(s, 'employment');
  const span = s.debtStartYear && s.debtEndYear ? `koniec ${s.debtStartYear} → koniec ${s.debtEndYear}` : '';
  return <article className="finance-cabinet" style={{ '--cab': c.color } as React.CSSProperties}>
    <header><h3>{c.name}</h3><p>{c.pm} · {date(c.start)} – {c.end ? date(c.end) : 'úraduje'}</p><p>{span}</p></header>
    <dl>
      <div><dt>HDP na obyvateľa, EÚ = 100</dt><dd>{pps ? <>{int(pps.start)} → {int(pps.end)}<small>{num(pps.change, 1, true)} bodu</small></> : '—'}</dd></div>
      <div><dt>Minimálna mzda</dt><dd>{mw ? <>{int(mw.start)} → {int(mw.end)} €<small>{int(mw.change, true)} € mesačne</small></> : '—'}</dd></div>
      <div><dt>Riziko chudoby</dt><dd>{pov ? <>{num(pov.start)} → {num(pov.end)} %<small>{num(pov.change, 1, true)} p. b.</small></> : '—'}</dd></div>
      <div><dt>Zamestnanosť 20–64</dt><dd>{emp ? <>{num(emp.start)} → {num(emp.end)} %<small>{num(emp.change, 1, true)} p. b.</small></> : '—'}</dd></div>
      <div><dt>Nezamestnanosť</dt><dd>{num(s.avgUnemployment)} %<small>priemer</small></dd></div>
      <div><dt>Inflácia</dt><dd>{num(s.avgInflation)} %<small>priemer za rok</small></dd></div>
    </dl>
  </article>;
}

function LivingView() {
  const rows = financeYears.map(r => { const lead = leadingCabinet(r.year); return { year: r.year, minWage: r.minWage ?? null, gdpPcPps: r.gdpPcPps ?? null, color: lead?.color ?? '#999', cabinet: lead?.short ?? '' }; });
  const sums = cabinetSummaries().filter(s => s.years.length > 0).reverse();
  return <>
    <LivingKpis/>
    <div className="finance-chart-wrap">
      <Suspense fallback={<p className="chart-loading">Načítavame graf…</p>}><LivingChart rows={rows}/></Suspense>
      <ChartLegend line="HDP na obyvateľa v parite kúpnej sily, EÚ = 100 (pravá os)" note="stĺpce: minimálna mzda v € (ľavá os), rad od 1999"/>
    </div>
    <LivingTable/>
    <section className="finance-rank" aria-labelledby="living-cabinets-title"><h2 id="living-cabinets-title">Za jednotlivých vlád</h2><p>Stav na konci roka pred prvým rokom, ktorý vláda odvládla aspoň z polovice, a na konci posledného takého roka. Pri krátkych vládach ide o jeden až dva roky, takže čísla hovoria viac o období než o vláde.</p></section>
    <div className="finance-cabinets">{sums.map(s => <LivingCabinetCard key={s.cabinet.id} s={s}/>)}</div>
  </>;
}

/* ---------- Porovnanie ---------- */

type Indicator = { field: keyof CompareRow; label: string; unit: string; higherIsBetter: boolean; digits: number };
const indicators: Indicator[] = [
  { field: 'deficitPct', label: 'Saldo verejnej správy', unit: '% HDP', higherIsBetter: true, digits: 1 },
  { field: 'debtPct', label: 'Dlh verejnej správy', unit: '% HDP', higherIsBetter: false, digits: 1 },
  { field: 'gdpGrowth', label: 'Rast HDP', unit: '%, reálne', higherIsBetter: true, digits: 1 },
  { field: 'inflation', label: 'Inflácia', unit: '%, HICP', higherIsBetter: false, digits: 1 },
  { field: 'unemployment', label: 'Nezamestnanosť', unit: '%, 15–74 rokov', higherIsBetter: false, digits: 1 },
  { field: 'gdpPcPps', label: 'HDP na obyvateľa', unit: 'parita kúpnej sily, EÚ = 100', higherIsBetter: true, digits: 0 },
];
const geoLabel = (code: string) => financeCompare.geos.find(g => g.code === code)?.label ?? code;
const isAggregate = (code: string) => code.startsWith('EA') || code.startsWith('EU');

function CompareCard({ ind }: { ind: Indicator }) {
  const f = ind.field;
  const rows = financeCompare.rows.filter(r => typeof r[f] === 'number').sort((a, b) => ind.higherIsBetter ? (b[f] as number) - (a[f] as number) : (a[f] as number) - (b[f] as number));
  const maxAbs = Math.max(...rows.map(r => Math.abs(r[f] as number)), 0.1);
  const rank = v4Rank(f, ind.higherIsBetter);
  const meta = financeCompare.indicators[f];
  return <article className="compare-card">
    <header><h3>{ind.label}</h3><span>{ind.unit} · {meta?.year}</span></header>
    <ol>{rows.map(r => <li key={r.geo} className={r.geo === 'SK' ? 'is-sk' : isAggregate(r.geo) ? 'is-agg' : ''}>
      <span>{geoLabel(r.geo)}</span>
      <div className="finance-bar" aria-hidden="true"><i style={{ width: `${Math.abs(r[f] as number) / maxAbs * 100}%` }}/></div>
      <b>{num(r[f] as number, ind.digits)}</b>
    </li>)}</ol>
    {rank && <p className="compare-rank">Slovensko {rank.rank}. zo {rank.of} vo V4 · {ind.higherIsBetter ? 'vyššie je lepšie' : 'nižšie je lepšie'}</p>}
  </article>;
}

function CompareView() {
  const year = financeCompare.indicators.deficitPct?.year;
  const ranks = indicators.map(ind => ({ ind, rank: v4Rank(ind.field, ind.higherIsBetter) })).filter(x => x.rank);
  const best = ranks.filter(x => x.rank!.rank === 1).map(x => x.ind.label);
  const worst = ranks.filter(x => x.rank!.rank === x.rank!.of).map(x => x.ind.label);
  return <>
    <section className="finance-rank" aria-labelledby="compare-title">
      <h2 id="compare-title">Slovensko, susedia a eurozóna</h2>
      <p>Rok {year}, posledný, za ktorý má Eurostat údaje pre všetky krajiny. Rebríčky sú zoradené od najlepšej hodnoty; poradie Slovenska počítame v rámci V4 ({compareV4.map(geoLabel).join(', ')}).{best.length > 0 && ` Najlepšie z V4: ${best.join(', ')}.`}{worst.length > 0 && ` Najhoršie z V4: ${worst.join(', ')}.`}</p>
    </section>
    <div className="compare-grid">{indicators.map(ind => <CompareCard key={ind.field} ind={ind}/>)}</div>
    <p className="finance-method-note">Eurozóna a EÚ 27 sú vážené priemery celku, nie krajiny. Saldo: menší deficit alebo prebytok je lepšie; dlh, inflácia a nezamestnanosť: nižšie je lepšie; rast a HDP na obyvateľa: vyššie je lepšie. Ide o jeden rok, nie o hodnotenie dlhodobej politiky.</p>
  </>;
}

/* ---------- Metodika ---------- */

function Method() {
  return <details className="finance-method">
    <summary>Odkiaľ sú čísla, ako priraďujeme roky vládam a čo znamená dlhová brzda</summary>
    <h3>Zdroje</h3>
    <p>Všetky ročné rady preberáme z Eurostatu, ktorý zverejňuje údaje zostavené Štatistickým úradom SR podľa európskej metodiky ESA 2010. Saldo aj dlh sú za celú verejnú správu (štát, samosprávy, Sociálna poisťovňa, zdravotné poisťovne a ďalšie subjekty), nie iba za štátny rozpočet. Dlh je hrubý „maastrichtský“ dlh ku koncu roka. Údaje k {date(financeFetched)}; Eurostat ich reviduje pri každej notifikácii (apríl a október), preto sa staršie roky môžu mierne meniť. Sumy v eurách pred rokom 2009 sú prepočítané zo slovenských korún (dlh kurzom ku koncu roka, HDP priemerným kurzom), preto sa dlh v € a v % HDP v tých rokoch nezhodujú presne — smerodajný je podiel na HDP.</p>
    <ul>{financeSources.map(s => <li key={s.url + s.name}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.name} <ArrowUpRight size={11}/><span className="sr-only"> (nová karta)</span></a>{s.note && <> — {s.note}</>}</li>)}</ul>
    <h3>Ako priraďujeme roky vládam</h3>
    <p>Rok, v ktorom sa vlády striedali, delíme medzi ne podľa dní vo funkcii; deň výmeny patrí novej vláde. Priemerné saldo, súčet salda aj zmena dlhu za vládu sú vážené týmto podielom. Je to jednoduché a kontrolovateľné pravidlo, nie súd o tom, kto za čo môže: rozpočet na daný rok schvaľuje spravidla predchádzajúca vláda, veľká časť výdavkov je daná zákonmi a krízové roky (bankové sanácie 1999–2000, finančná kríza 2009, pandémia 2020–2021, energetická kríza 2022–2023) zasahujú bez ohľadu na to, kto vládne. V tabuľke po rokoch preto ostáva pri každom čísle aj kontext.</p>
    <p>Pri každej vláde uvádzame koaličné strany v čase jej vymenovania. Logá sú dnešné logá strán z ich webov (zdroje sú v záložke O dátach); OĽANO nesie logo dnešného Hnutia Slovensko, ktoré je tou istou stranou. Strany, ktoré už neexistujú alebo sa zlúčili, majú namiesto loga monogram.</p>
    <h3>Životná úroveň</h3>
    <p>HDP na obyvateľa v parite kúpnej sily porovnáva, koľko sa dá za príjem kúpiť, s priemerom EÚ (= 100). Minimálna mzda je stav v januári daného roka. Medián príjmu a miera rizika chudoby pochádzajú z výberového zisťovania EU-SILC (rad od 2005; hodnoty za rok zisťovania sa vzťahujú na príjmy predchádzajúceho roka a v posledných ročníkoch rástli výrazne, čo je v dátach Eurostatu, nie náš prepočet). Priemernú ani čistú mzdu nezobrazujeme: Eurostatov rad čistých príjmov má v roku 2024 zlom metodiky a roky by neboli porovnateľné. Pri vládach uvádzame stav na začiatku a na konci rovnakého rozpätia rokov ako pri dlhu.</p>
    <h3>Porovnanie s EÚ</h3>
    <p>Porovnávame Slovensko so susedmi a s priemerom eurozóny a EÚ za posledný rok, ktorý má Eurostat pre všetky celky. Poradie počítame len v rámci V4, aby sa neporovnávali krajiny s celkami. Ide o momentku jedného roka; dlhodobý pohľad dávajú rady po rokoch.</p>
    <h3>Čo je saldo bez úrokov</h3>
    <p>Primárne saldo je saldo bez zaplatených úrokov z dlhu. Hovorí, či štát hospodári vyrovnane ešte pred splácaním starých dlhov; ak je záporné, dlh rastie aj bez úrokov.</p>
    <h3>Dlhová brzda</h3>
    <p>{debtBrake.law} určuje horný limit dlhu verejnej správy: pôvodne 60 % HDP, od roku 2018 každý rok o jeden percentuálny bod nižší, až kým v roku 2027 nedosiahne 50 % HDP. Pod limitom sú štyri pásma, pri ktorých prekročení nastupujú postupne prísnejšie opatrenia — od vysvetlenia vlády parlamentu cez zmrazenie výdavkov až po hlasovanie o dôvere vláde. Zjednodušené; presné znenie vrátane výnimiek (napr. hlboká recesia, náklady krízy) je v zákone, jeho plnenie hodnotí Rada pre rozpočtovú zodpovednosť. Maastrichtské referenčné hodnoty Paktu stability a rastu sú deficit {Math.abs(maastricht.deficitPct)} % a dlh {maastricht.debtPct} % HDP; čiarkovaná hranica v grafe je −3 %.</p>
    <h3>Kontext krízových rokov</h3>
    <ul>{financeEvents.map(e => <li key={`${e.year}-${e.label}`}><b>{e.year}</b> — {e.label}</li>)}</ul>
    <p>* Nezamestnanosť pred rokom 2009 pochádza z historického radu Eurostatu (pred zmenou metodiky výberového zisťovania); roky pred 1997 rad nemá.</p>
  </details>;
}

const views = [['years', 'Po rokoch'], ['governments', 'Po vládach'], ['living', 'Životná úroveň'], ['compare', 'EÚ a susedia']] as const;

export default function PublicFinance({ view, onView }: { view: string; onView: (view: string) => void }) {
  const active = views.some(v => v[0] === view) ? view : 'years';
  const chartRows = financeYears.map(r => {
    const lead = leadingCabinet(r.year);
    return { year: r.year, deficitPct: r.deficitPct, debtPct: r.debtPct, limit: r.year >= debtBrake.effectiveFrom ? debtBrake.upperLimit(r.year) : null, color: lead?.color ?? '#999', cabinet: lead?.short ?? '', events: eventsForYear(r.year) };
  });
  const first = financeYears[0], last = latestFinanceYear;
  const financeViews = active === 'years' || active === 'governments';
  return <section className="finance-page" aria-labelledby="finance-title">
    <header className="news-heading"><div><h1 id="finance-title">Ako hospodári štát.</h1><p>Koľko verejná správa každý rok minie nad svoje príjmy, koľko dlhu sa nazbieralo, ako sa žije a ako sme na tom oproti susedom. Roky {first.year}–{last.year} podľa Eurostatu a Štatistického úradu SR.</p></div><span className="news-selection">Eurostat · údaje k {date(financeFetched)}</span></header>
    <div className="finance-switch" role="group" aria-label="Pohľad na hospodárenie">
      {views.map(([id, label]) => <button key={id} type="button" aria-pressed={active === id} onClick={() => onView(id)}>{label}</button>)}
    </div>
    {financeViews && <>
      <Kpis row={last}/>
      <div className="finance-chart-wrap">
        <Suspense fallback={<p className="chart-loading">Načítavame graf…</p>}><FinanceChart rows={chartRows}/></Suspense>
        <ChartLegend line="dlh, % HDP (pravá os)" dash="horný limit dlhu (ústavný zákon)" note="stĺpce: saldo, % HDP · bodkovaná −3 %: maastrichtská hranica"/>
      </div>
      {active === 'governments' ? <CabinetsView/> : <YearsTable/>}
    </>}
    {active === 'living' && <LivingView/>}
    {active === 'compare' && <CompareView/>}
    <Method/>
  </section>;
}
