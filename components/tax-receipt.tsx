"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { ChevronDown } from "lucide-react";
import { PAYROLL_YEAR, payroll, payroll2026, payrollSources, receiptRows, spendingTotalMeur, spendingYear } from "@/lib/tax-receipt";
import { track } from "@/lib/track";
import "@/app/tax-receipt.css";

// „Kam idú tvoje dane“: hrubá mzda → čistá mzda, daň a odvody (sadzby 2026) → daňový bloček podľa toho,
// na čo verejná správa míňa (Eurostat COFOG). Výpočet a zdroje: lib/tax-receipt.ts.
const eur = (v: number, digits = 0) => `${v.toLocaleString("sk-SK", { minimumFractionDigits: digits, maximumFractionDigits: digits })} €`;
const pct = (v: number) => `${(v * 100).toLocaleString("sk-SK", { maximumFractionDigits: 1, minimumFractionDigits: 1 })} %`;
const presets = [
  { label: "Minimálna", value: payroll2026.minWage },
  { label: "Priemerná", value: payroll2026.averageWage2024 },
  { label: "Vyššia", value: 2500 },
  { label: "Vysoká", value: 5000 },
];
const MIN = 0, MAX = 50000, SLIDER_MAX = 8000;
const SHOWN = 6;

export default function TaxReceipt() {
  const [gross, setGross] = useState<number>(payroll2026.averageWage2024);
  const [text, setText] = useState(String(payroll2026.averageWage2024));
  const [yearly, setYearly] = useState(false);
  const [all, setAll] = useState(false);
  const [counted, setCounted] = useState(false);
  const p = useMemo(() => payroll(gross), [gross]);
  const k = yearly ? 12 : 1;
  const rows = useMemo(() => receiptRows(p.toState * k), [p, k]);
  const period = yearly ? "ročne" : "mesačne";
  const set = (value: number) => {
    const g = Math.min(MAX, Math.max(MIN, Math.round(value)));
    setGross(g); setText(String(g));
    if (!counted) { track("tax"); setCounted(true); }
  };
  const onText = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, "").slice(0, 5);
    setText(digits);
    if (digits !== "") set(Number(digits));
  };
  const shown = all ? rows : rows.slice(0, SHOWN);
  const top = rows[0]?.share ?? 1;

  return <section className="tax-receipt" aria-labelledby="tax-title">
    <header className="tax-head">
      <p className="tax-kicker">Kalkulačka · sadzby {PAYROLL_YEAR}</p>
      <h2 id="tax-title">Kam idú tvoje dane</h2>
      <p>Zadaj hrubú mesačnú mzdu. Ukážeme, koľko štátu odvediete ty a tvoj zamestnávateľ a na čo verejná správa tieto peniaze minie.</p>
    </header>

    <div className="tax-input">
      <label htmlFor="tax-gross">Hrubá mesačná mzda</label>
      <div className="tax-field"><input id="tax-gross" inputMode="numeric" autoComplete="off" value={text} onChange={e => onText(e.target.value)} onBlur={() => { if (text === "") set(0); }} aria-describedby="tax-gross-note"/><span aria-hidden="true">€</span></div>
      <input type="range" className="tax-slider" min={500} max={SLIDER_MAX} step={10} value={Math.min(Math.max(gross, 500), SLIDER_MAX)} onChange={e => set(Number(e.target.value))} aria-label="Hrubá mesačná mzda, posuvník" style={{ "--fill": `${(Math.min(Math.max(gross, 500), SLIDER_MAX) - 500) / (SLIDER_MAX - 500) * 100}%` } as CSSProperties}/>
      <div className="tax-presets" role="group" aria-label="Rýchly výber mzdy">
        {presets.map(b => <button key={b.label} type="button" aria-pressed={gross === b.value} onClick={() => set(b.value)}>{b.label}<small>{eur(b.value)}</small></button>)}
      </div>
      <p id="tax-gross-note" className="tax-note">Minimálna mzda {PAYROLL_YEAR}: {eur(payroll2026.minWage)}. Priemerná mzda v hospodárstve za rok 2024: {eur(payroll2026.averageWage2024)}.</p>
    </div>

    <div className="tax-split">
      <div className="tax-bar" role="img" aria-label={`Cena práce ${eur(p.labourCost, 2)}: čistá mzda ${eur(p.net, 2)}, tvoja daň a odvody ${eur(p.employeeTotal, 2)}, odvody zamestnávateľa ${eur(p.employerTotal, 2)}.`}>
        <i className="is-net" style={{ flexGrow: p.net }}/><i className="is-you" style={{ flexGrow: p.employeeTotal }}/><i className="is-firm" style={{ flexGrow: p.employerTotal }}/>
      </div>
      <dl className="tax-legend">
        <div className="is-net"><dt>Čistá mzda</dt><dd>{eur(p.net * k)}</dd></div>
        <div className="is-you"><dt>Tvoja daň a odvody</dt><dd>{eur(p.employeeTotal * k)}</dd></div>
        <div className="is-firm"><dt>Odvody zamestnávateľa</dt><dd>{eur(p.employerTotal * k)}</dd></div>
      </dl>
      <p className="tax-total">Štátu spolu <b>{eur(p.toState * k)}</b> {period}, teda {pct(p.labourCost ? p.toState / p.labourCost : 0)} z celkovej ceny tvojej práce ({eur(p.labourCost * k)}).</p>
    </div>

    <div className="tax-bill">
      <div className="tax-bill-head">
        <h3>Tvoj daňový bloček</h3>
        <div className="tax-unit" role="group" aria-label="Obdobie">
          <button type="button" aria-pressed={!yearly} onClick={() => setYearly(false)}>mesačne</button>
          <button type="button" aria-pressed={yearly} onClick={() => setYearly(true)}>ročne</button>
        </div>
      </div>
      <p className="tax-bill-intro">Tak by sa tvoje peniaze rozdelili, keby šli rovnakým dielom ako všetky výdavky verejnej správy v roku {spendingYear} ({(spendingTotalMeur / 1000).toLocaleString("sk-SK", { maximumFractionDigits: 1 })} mld. €).</p>
      <ol className="tax-rows">
        {shown.map(r => <li key={r.code} style={{ "--c": r.color, "--w": r.share / top } as CSSProperties}>
          <div className="tax-row-main"><span className="tax-area"><i aria-hidden="true"/><span>{r.label}<small>{r.hint}</small></span></span><b>{eur(r.amount)}</b></div>
          <div className="tax-row-bar" aria-hidden="true"><s/></div>
          {r.sub && r.subAmount !== undefined && <p className="tax-sub"><span>{r.sub.label}</span><b>{eur(r.subAmount)}</b></p>}
        </li>)}
      </ol>
      {rows.length > SHOWN && <button type="button" className="tax-more" aria-expanded={all} onClick={() => setAll(v => !v)}>{all ? "Menej oblastí" : `Všetky oblasti (${rows.length})`}<ChevronDown size={16} aria-hidden="true"/></button>}
      <p className="tax-bill-sum"><span>Spolu {period}</span><b>{eur(rows.reduce((s, r) => s + r.amount, 0))}</b></p>
    </div>

    <details className="tax-how">
      <summary>Ako počítame</summary>
      <ul>
        <li>Zamestnanec bez detí a iných úľav, sadzby na rok {PAYROLL_YEAR}. Zo mzdy platíš sociálne poistenie 9,4 % (najviac z 16 764 € mesačne), zdravotné poistenie 5 % a daň z príjmu 19 % až 35 % zo základu zníženého o nezdaniteľnú časť 497,23 € mesačne (pri vyšších príjmoch klesá až na nulu).</li>
        <li>Zamestnávateľ navyše platí sociálne poistenie 25,2 % a zdravotné 11 %. Aj tieto peniaze sú súčasťou ceny tvojej práce, preto ich rátame.</li>
        <li>Rozdelenie podľa oblastí je názorné priblíženie. Odvody zo zákona idú najmä do Sociálnej poisťovne a zdravotných poisťovní, daň do rozpočtov štátu, obcí a krajov. Verejná správa ako celok minula v roku {spendingYear} viac, než vybrala, a rozdiel si požičala.</li>
        <li>Nerátame DPH a spotrebné dane v cenách tovarov a služieb, daňový bonus na deti ani ročné zúčtovanie.</li>
        <li>Zhoda s bežnými mzdovými kalkulačkami: pri hrubej mzde 1 500 € je čistá mzda 1 134,51 € a preddavok na daň 149,49 €.</li>
      </ul>
      <p className="tax-sources">{payrollSources.map((s, i) => <span key={s.url}>{i > 0 && " · "}<a href={s.url} target="_blank" rel="noopener noreferrer">{s.name}</a></span>)}</p>
    </details>
  </section>;
}
