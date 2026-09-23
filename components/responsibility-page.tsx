"use client";

import Image from "next/image";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { cabinets, cabinetsSource, type Cabinet } from "@/lib/cabinets";
import { durationLabel, formatTenureDate, tenureAsOf, tenureMethodology } from "@/lib/government-tenure";
import { inactiveTenureNote } from "@/lib/government-tenure-inactive";
import { cabinetsServed, inactiveResponsibilityRows, RESPONSIBILITY_START, responsibilityGroups, responsibilityRows, responsibilityTiers, responsibilityTotalDays, type ResponsibilityRow } from "@/lib/responsibility";
import { currentAggregate } from "@/lib/aggregate";
import { fmt } from "@/lib/polls";
import { cabinetSummary } from "@/lib/public-finance";
import logos from "@/lib/party-logos.json";
import "@/app/responsibility.css";
import SectionArt from "@/components/section-art";
import YourSlovakia from "@/components/your-slovakia";

/*
  Sekcia Zodpovednosť za stav krajiny: koľko času strávila každá strana vo vláde od 1. 1. 1993,
  v ktorých vládach sedela a kedy viedla vládu. Časová os, škála pre dnešné aj zaniknuté strany,
  zoznam vlád a metodika. Meradlom je čas pri moci, nie hodnotenie výsledkov (tie sú v Hospodárení).
*/
const logoMap: Record<string, { src: string }> = logos;
const DAY = 86_400_000;
// Vláda v číslach: to isté zhrnutie ako v Hospodárení → Po vládach (saldo a nezamestnanosť vážené dňami vo funkcii).
const summaries = Object.fromEntries(cabinets.map(c => [c.id, cabinetSummary(c)]));
const n1 = (v: number | null) => v === null ? "—" : v.toLocaleString("sk-SK", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const pct = (v: number) => v.toLocaleString("sk-SK", { maximumFractionDigits: v >= 10 ? 0 : 1 });
const at = (iso: string | null) => Date.parse(`${iso ?? tenureAsOf}T00:00:00Z`);
const q = (n: number) => Math.round(n * 10) / 10;
const inCabinets = (n: number) => n === 1 ? "v 1 vláde" : `v ${n} vládach`;
const overlapDays = (a0: string, a1: string | null, b0: string, b1: string | null) => (Math.min(at(a1), at(b1)) - Math.max(at(a0), at(b0))) / DAY;
const initials = (short: string) => short.replace(/[^A-ZĽŠČŽÁÉÍÓÚÝŤĎŇÄÔ]/g, "").slice(0, 3);
const list = (items: string[]) => items.length > 1 ? `${items.slice(0, -1).join(", ")} a ${items.at(-1)}` : items.join("");

function Mark({ row }: { row: Pick<ResponsibilityRow, "id" | "short" | "color" | "active"> }) {
  const logo = row.active ? logoMap[row.id] : undefined;
  return logo
    ? <span className="resp-mark"><Image src={logo.src} alt="" width={26} height={26} unoptimized/></span>
    : <span className="resp-mark is-mono" style={{ background: row.color }} aria-hidden="true">{initials(row.short)}</span>;
}

function Kpis({ rows }: { rows: ResponsibilityRow[] }) {
  const longest = rows[0];
  const leader = [...rows].sort((a, b) => b.led - a.led)[0];
  const leaderPms = [...new Set(cabinetsServed(leader.periods.filter(p => p.led)).map(c => c.pm))];
  const never = rows.filter(r => r.days === 0);
  const neverSupport = never.reduce((sum, r) => sum + (currentAggregate.values[r.id]?.value ?? 0), 0);
  const current = cabinets[cabinets.length - 1];
  const joined = rows.filter(r => r.periods.some(p => p.basis === "cabinet" && p.end === null));
  const pms = new Set(cabinets.map(c => c.pm)).size;
  return <dl className="finance-kpis resp-kpis">
    <div><dt>Najdlhšie vo vláde</dt><dd>{longest.short} · {pct(longest.share)} %<small>{longest.label} {inCabinets(longest.cabinets.length)}</small></dd></div>
    <div><dt>Najdlhšie na čele vlády</dt><dd>{leader.short} · {pct(leader.ledShare)} %<small>{leaderPms.length > 1 ? "premiéri" : "premiér"} {list(leaderPms)}</small></dd></div>
    <div><dt>Vlády od roku 1993</dt><dd>{cabinets.length} vlád<small>{pms} premiérov, z toho 1 úradnícka vláda</small></dd></div>
    <div><dt>Nikdy nevládli</dt><dd>{never.length} dnešných strán<small>spolu {fmt(neverSupport)} % v Modeli Mandát</small></dd></div>
    <div><dt>Súčasná vláda</dt><dd>{current.short}<small>od {formatTenureDate(current.start)} · {durationLabel(Math.round((at(null) - at(current.start)) / DAY))} · {current.parties.map(p => p.short).join(", ")}{joined.length > 0 && `, v kabinete aj ${joined.map(r => r.short).join(", ")}`}</small></dd></div>
  </dl>;
}

/* Časová os: pás pre každú stranu, plné pole = premiér zo strany, podklad = striedanie vlád. */
function Timeline({ active, inactive }: { active: ResponsibilityRow[]; inactive: ResponsibilityRow[] }) {
  const W = 1000, L = 118, R = 14, plot = W - L - R, T0 = at(RESPONSIBILITY_START), T1 = at(null);
  const x = (iso: string | null) => q(L + (at(iso) - T0) / (T1 - T0) * plot);
  const bandTop = 38, bandH = 12, rowH = 17, headH = 22;
  type Item = { kind: "head"; label: string; y: number } | { kind: "row"; row: ResponsibilityRow; y: number };
  const items: Item[] = [];
  let y = bandTop + bandH + 10;
  const add = (label: string, rows: ResponsibilityRow[]) => { items.push({ kind: "head", label, y: y + 14 }); y += headH; for (const row of rows) { items.push({ kind: "row", row, y: y + rowH / 2 }); y += rowH; } y += 6; };
  add("Dnešné strany", active.filter(r => r.days > 0));
  add("Už nekandidujú", inactive);
  const bottom = y, H = bottom + 26;
  const years = [1995, 2000, 2005, 2010, 2015, 2020, 2025];
  const label = (c: Cabinet) => Math.min(W - R - 22, Math.max(L + 24, (x(c.start) + x(c.end)) / 2));
  const names = items.map(item => item.kind === "head"
    ? <text key={item.label} x={4} y={item.y} className="resp-tl-head">{item.label.toUpperCase()}</text>
    : <g key={item.row.id}><rect x={4} y={item.y - 4.5} width={9} height={9} rx={2} fill={item.row.color}/><text x={19} y={item.y + 4} className="resp-tl-party">{item.row.short}</text></g>);
  return <>
  {/* Na mobile sa os posúva; stĺpec s názvami ostáva na mieste ako prekryv v rovnakej mierke. */}
  <div className="resp-timeline-names" aria-hidden="true"><svg viewBox={`0 0 ${L} ${H}`}>{names}</svg></div>
  <svg className="resp-timeline" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Časová os vlád od ${formatTenureDate(RESPONSIBILITY_START)} do ${formatTenureDate(tenureAsOf)}: pre každú stranu obdobia vo vláde. Rovnaké údaje sú v tabuľkách nižšie.`}>
    {cabinets.map((c, i) => <rect key={c.id} x={x(c.start)} y={bandTop} width={q(x(c.end) - x(c.start))} height={bottom - bandTop} fill={i % 2 ? "#f4f6ef" : "#fbfcf8"}/>)}
    {cabinets.slice(1).map(c => <line key={c.id} x1={x(c.start)} x2={x(c.start)} y1={bandTop} y2={bottom} stroke="#dfe5d6" strokeWidth="1"/>)}
    {cabinets.map((c, i) => <g key={c.id}>
      <rect x={x(c.start)} y={bandTop} width={Math.max(1, q(x(c.end) - x(c.start) - 1))} height={bandH} fill={c.color}><title>{`${c.name} · ${formatTenureDate(c.start)} – ${c.end ? formatTenureDate(c.end) : "úraduje"} · premiér ${c.pm}`}</title></rect>
      <text x={label(c)} y={i % 2 ? 29 : 14} textAnchor="middle" className="resp-tl-cab">{c.short}</text>
      <line x1={q((x(c.start) + x(c.end)) / 2)} x2={q((x(c.start) + x(c.end)) / 2)} y1={i % 2 ? 32 : 17} y2={bandTop - 1} stroke="#b9c4b2" strokeWidth=".8"/>
    </g>)}
    {names}
    {items.map(item => item.kind === "head" ? null
      : <g key={item.row.id}>
        {item.row.periods.map(p => <rect key={p.start} x={x(p.start)} y={item.y - 4.5} width={Math.max(2, q(x(p.end) - x(p.start)))} height={9} rx={2.5} fill={item.row.color} fillOpacity={p.led ? 1 : .4} stroke={item.row.color} strokeWidth={p.led ? 0 : .9}>
          <title>{`${item.row.short}: ${p.government} · ${formatTenureDate(p.start)} – ${p.end ? formatTenureDate(p.end) : "dodnes"}${p.led ? " · premiér zo strany" : ""}`}</title>
        </rect>)}
      </g>)}
    <line x1={x(null)} x2={x(null)} y1={bandTop} y2={bottom + 4} stroke="#8b9a86" strokeWidth="1" strokeDasharray="3 3"/>
    {years.map(yr => <g key={yr}><line x1={x(`${yr}-01-01`)} x2={x(`${yr}-01-01`)} y1={bottom} y2={bottom + 5} stroke="#9aa797"/><text x={x(`${yr}-01-01`)} y={bottom + 17} textAnchor="middle" className="resp-tl-year">{yr}</text></g>)}
    <text x={L} y={bottom + 17} className="resp-tl-year">1993</text>
    <text x={W - R} y={bottom + 17} textAnchor="end" className="resp-tl-year is-now">dnes</text>
  </svg>
  </>;
}

function ScaleRow({ row, maxShare, onParty }: { row: ResponsibilityRow; maxShare: number; onParty: (id: string) => void }) {
  const body = <>
    <Mark row={row}/>
    <span className="resp-name"><b>{row.short}</b><small>{row.name}</small></span>
    <span className="resp-meter" aria-hidden="true"><i style={{ width: `${row.share / maxShare * 100}%`, background: row.color }}/>{row.led > 0 && <b style={{ width: `${row.ledShare / maxShare * 100}%`, background: row.color }}/>}</span>
    <span className="resp-figure"><b>{pct(row.share)} %</b><small>{row.label}</small></span>
    <span className="resp-sub">{inCabinets(row.cabinets.length)}{row.led > 0 && <> · <b>na čele vlády {pct(row.ledShare)} % času</b></>}</span>
    {row.fate && <small className="resp-fate">{row.fate}</small>}
  </>;
  return row.active
    ? <button type="button" className="resp-row" onClick={() => onParty(row.id)} aria-label={`${row.name}: ${pct(row.share)} % času vo vláde, ${row.label} ${inCabinets(row.cabinets.length)}${row.led > 0 ? `, na čele vlády ${pct(row.ledShare)} % času` : ""}. Otvoriť profil strany.`}>{body}</button>
    : <div className="resp-row">{body}</div>;
}

function Scale({ id, title, text, rows, maxShare, onParty, children, muted }: { id: string; title: string; text: string; rows: ResponsibilityRow[]; maxShare: number; onParty: (id: string) => void; children?: React.ReactNode; muted?: boolean }) {
  return <section className={`resp-scale${muted ? " is-muted" : ""}`} aria-labelledby={id}>
    <h3 id={id}>{title}</h3><p>{text}</p>
    {responsibilityGroups(rows).map(g => <div className="resp-tier" key={g.label}>
      <h4><span>{g.label}</span><small>{g.hint}</small></h4>
      <ol>{g.rows.map(r => <li key={r.id}><ScaleRow row={r} maxShare={maxShare} onParty={onParty}/></li>)}</ol>
    </div>)}
    {children}
  </section>;
}

function Coalition({ cabinet, rows }: { cabinet: Cabinet; rows: ResponsibilityRow[] }) {
  if (!cabinet.parties.length) return <span className="resp-coalition-none">úradnícka vláda bez straníckeho zloženia</span>;
  // Strany, ktoré vstúpili do kabinetu až počas vlády (bez podpisu koaličnej zmluvy).
  const joined = rows.filter(r => r.periods.some(p => p.basis === "cabinet" && overlapDays(p.start, p.end, cabinet.start, cabinet.end) >= 30));
  const chip = (key: string, mark: React.ReactNode, text: string, title?: string, later?: boolean) => <li key={key} className={later ? "is-later" : undefined} title={title}>{mark}<span>{text}</span></li>;
  return <ul className="resp-coalition" aria-label="Koaličné strany">
    {cabinet.parties.map(p => {
      const row = p.party ? rows.find(r => r.id === p.party) : undefined;
      const logo = p.party ? logoMap[p.party] : undefined;
      const inactive = p.inactive ? inactiveResponsibilityRows().find(r => r.id === p.inactive) : undefined;
      const mark = logo ? <Image src={logo.src} alt="" width={20} height={20} unoptimized/> : <i style={{ background: inactive?.color ?? "#9aa39a" }} aria-hidden="true">{initials(p.short).slice(0, 2)}</i>;
      return chip(p.short, mark, p.short, row?.name ?? inactive?.name);
    })}
    {joined.map(r => { const p = r.periods.find(x => x.basis === "cabinet")!; return chip(r.id, logoMap[r.id] ? <Image src={logoMap[r.id].src} alt="" width={20} height={20} unoptimized/> : <i style={{ background: r.color }} aria-hidden="true">{initials(r.short).slice(0, 2)}</i>, `${r.short} od ${formatTenureDate(p.start)}`, p.note, true); })}
  </ul>;
}

function Governments({ rows, onFinance }: { rows: ResponsibilityRow[]; onFinance: () => void }) {
  return <section className="resp-block" aria-labelledby="resp-govs-title">
    <div className="resp-block-head"><div><h2 id="resp-govs-title">Vlády od roku 1993</h2><p>Od súčasnej po prvú vládu samostatnej SR. Koalícia je uvedená v čase vymenovania; strany, ktoré do kabinetu vstúpili neskôr, sú odlíšené.</p></div><button type="button" className="text-button" onClick={onFinance}>Ako tieto vlády hospodárili <ArrowRight size={16}/></button></div>
    <div className="resp-table-wrap" tabIndex={0} aria-label="Zoznam vlád"><table className="resp-table">
      <caption className="sr-only">Vlády Slovenskej republiky od 1. 1. 1993</caption>
      <thead><tr><th scope="col">Vláda</th><th scope="col">Premiér</th><th scope="col">Obdobie</th><th scope="col" className="num">Trvanie</th><th scope="col">Koalícia</th><th scope="col">V číslach<small>Eurostat, % HDP</small></th></tr></thead>
      <tbody>{[...cabinets].reverse().map(c => <tr key={c.id}>
        <th scope="row"><span className="resp-cab"><i style={{ background: c.color }} aria-hidden="true"/>{c.name}</span>{c.note && <small>{c.note}</small>}</th>
        <td>{c.pm}</td>
        <td className="resp-dates">{formatTenureDate(c.start)} – {c.end ? formatTenureDate(c.end) : "úraduje"}</td>
        <td className="num">{durationLabel(Math.round((at(c.end) - at(c.start)) / DAY))}</td>
        <td><Coalition cabinet={c} rows={rows}/></td>
        <td className="resp-numbers">{summaries[c.id].years.length ? <><span>saldo <b className={(summaries[c.id].avgDeficitPct ?? 0) < -3 ? "is-bad" : ""}>{n1(summaries[c.id].avgDeficitPct)}</b> ročne</span><span>dlh <b>{n1(summaries[c.id].debtStartPct)} → {n1(summaries[c.id].debtEndPct)}</b></span><span>nezamestnanosť <b>{n1(summaries[c.id].avgUnemployment)} %</b></span><button type="button" onClick={onFinance}>detail</button></> : <span className="resp-muted">údaje Eurostatu od roku 1995</span>}</td>
      </tr>)}</tbody>
    </table></div>
  </section>;
}

function Method({ rows, inactive }: { rows: ResponsibilityRow[]; inactive: ResponsibilityRow[] }) {
  const notes = [...rows, ...inactive].flatMap(r => r.periods.filter(p => p.note).map(p => ({ key: `${r.id}${p.start}`, who: r.short, government: p.government, note: p.note!, source: p.source })));
  const partyNotes = rows.filter(r => r.predecessorNote || r.note).map(r => ({ key: r.id, who: r.short, note: r.predecessorNote ?? r.note! }));
  const tiers = responsibilityTiers.filter(t => t.min > 0).map(t => `${t.label} ${t.hint}`).join(", ");
  return <details className="finance-method resp-method">
    <summary>Ako počítame zodpovednosť a odkiaľ sú údaje</summary>
    <p>{tenureMethodology.description}</p>
    <p>Podiel je počet dní vo vláde vydelený všetkými dňami od {formatTenureDate(RESPONSIBILITY_START)} do {formatTenureDate(tenureAsOf)} ({responsibilityTotalDays.toLocaleString("sk-SK")} dní). Obdobie trvá od vymenovania vlády po vymenovanie ďalšej; skorší odchod z koalície je uvedený v poznámkach. Strany vládnu súčasne, preto súčet podielov nie je 100 %. Plná farba znamená, že vládu viedol premiér z danej strany.</p>
    <p>Stupne škály sú redakčné: {tiers}. Ide o meradlo času pri moci, nie o hodnotenie toho, ako strany vládli; výsledky hospodárenia jednotlivých vlád sú v záložke Hospodárenie.</p>
    <p>{inactiveTenureNote}</p>
    <h3>Poznámky k obdobiam</h3>
    <ul>{notes.map(n => <li key={n.key}><b>{n.who}</b>, {n.government.charAt(0).toLowerCase() + n.government.slice(1)}: {n.note} <a href={n.source} target="_blank" rel="noopener noreferrer">zdroj<ArrowUpRight size={11} aria-hidden="true"/><span className="sr-only"> (nová karta)</span></a></li>)}
      {partyNotes.map(n => <li key={n.key}><b>{n.who}</b>: {n.note}</li>)}</ul>
    <h3>Zdroje</h3>
    <ul><li><a href={cabinetsSource} target="_blank" rel="noopener noreferrer">Úrad vlády SR · história vlád<ArrowUpRight size={11} aria-hidden="true"/><span className="sr-only"> (nová karta)</span></a> — dátumy vymenovania a konca vlád</li><li>Pri každom období je odkaz na konkrétny zdroj (Úrad vlády, NR SR, prezident SR, STVR, slovenská Wikipédia pre vlády 90. rokov). Údaje sú k {formatTenureDate(tenureAsOf)}.</li></ul>
  </details>;
}

export default function ResponsibilityPage({ birthYear, onBirthYear, onParty, onFinance }: { birthYear: number | null; onBirthYear: (year: number | null) => void; onParty: (id: string) => void; onFinance: () => void }) {
  const rows = responsibilityRows();
  const inactive = inactiveResponsibilityRows();
  const governed = rows.filter(r => r.days > 0);
  // Strany bez účasti zoradené podľa dnešnej podpory: najsilnejšie z nich nikdy nevládli.
  const never = rows.filter(r => r.days === 0).sort((x, y) => (currentAggregate.values[y.id]?.value ?? -1) - (currentAggregate.values[x.id]?.value ?? -1));
  const maxShare = Math.max(...rows.map(r => r.share), ...inactive.map(r => r.share));
  return <section className="resp-page" aria-labelledby="resp-title">
    <div className="section-hero"><header className="news-heading"><div><h1 id="resp-title">Kto nesie zodpovednosť za stav krajiny.</h1><p>Koľko času strávila každá strana vo vláde od vzniku samostatného Slovenska 1. 1. 1993, v ktorých vládach sedela a kedy mala premiéra. Meriame čas pri moci, nie výsledky vládnutia.</p></div><span className="news-selection">Údaje k {formatTenureDate(tenureAsOf)}</span></header><SectionArt name="zodpovednost"/></div>
    <Kpis rows={rows}/>
    <YourSlovakia year={birthYear} onYear={onBirthYear}/>
    <section className="resp-block" aria-labelledby="resp-timeline-title">
      <div className="resp-block-head"><div><h2 id="resp-timeline-title">{Math.floor(responsibilityTotalDays / 365.25)} rokov vlád na jednej osi</h2><p>Každý riadok je strana, každý pás jedno obdobie vo vláde. Svetlé pozadie oddeľuje jednotlivé vlády. Presné dátumy sú pri páse a v zozname vlád nižšie.</p></div></div>
      <div className="resp-timeline-box"><div className="resp-timeline-wrap" tabIndex={0} aria-label="Časová os; na úzkej obrazovke sa posúva vodorovne"><Timeline active={governed} inactive={inactive}/></div></div>
      <p className="resp-legend"><span><i className="is-coalition" aria-hidden="true"/>vo vláde ako koaličný partner</span><span><i className="is-led" aria-hidden="true"/>na čele vlády, premiér zo strany</span><span className="resp-scroll-hint">Potiahnite os do strany <ArrowRight size={13} aria-hidden="true"/></span></p>
    </section>
    <section className="resp-block" aria-labelledby="resp-scale-title">
      <div className="resp-block-head"><div><h2 id="resp-scale-title">Škála zodpovednosti</h2><p>Podiel času vo vláde od roku 1993. Strany vládnu súčasne, preto súčet nie je 100 %. Čas zaniknutých strán nástupcom nepripočítavame.</p></div></div>
      <div className="resp-columns">
        <Scale id="resp-active" title="Dnešné strany" text="Subjekty, ktoré sledujeme v prieskumoch. Ťuknutím otvoríte profil strany." rows={governed} maxShare={maxShare} onParty={onParty}>
          <div className="resp-never"><h4><span>bez účasti</span><small>0 % · spolu {fmt(never.reduce((s, r) => s + (currentAggregate.values[r.id]?.value ?? 0), 0))} % v Modeli Mandát</small></h4>
            <ul>{never.map(r => <li key={r.id}><button type="button" onClick={() => onParty(r.id)} title={r.predecessorNote ?? r.note}><Mark row={r}/><span><b>{r.short}{r.predecessorNote && "*"}</b><small>{currentAggregate.values[r.id] ? `${fmt(currentAggregate.values[r.id].value)} % v prieskumoch` : "bez hodnoty v agregáte"}</small></span></button></li>)}</ul>
            {never.some(r => r.predecessorNote) && <p>* {never.filter(r => r.predecessorNote).map(r => r.predecessorNote).join(" ")}</p>}
          </div>
        </Scale>
        <Scale id="resp-inactive" title="Strany, ktoré už nekandidujú" text="Zaniknuté alebo zlúčené strany, ktoré boli vo vláde. Rovnaká mierka ako vľavo." rows={inactive} maxShare={maxShare} onParty={onParty} muted/>
      </div>
    </section>
    <Governments rows={rows} onFinance={onFinance}/>
    <Method rows={rows} inactive={inactive}/>
  </section>;
}
