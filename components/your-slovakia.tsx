"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { durationLabel, formatTenureDate } from "@/lib/government-tenure";
import { birthYears, governmentsLabel, isBirthYear, lifeHeadline, lifeSummary, priceFactor, type LifeSummary } from "@/lib/your-slovakia";

// Tvoje Slovensko: rok narodenia → vlády počas života, najdlhšia strana a premiér, 18. narodeniny,
// dlh, minimálna mzda a ceny. Rok je v adrese (?rok=), aby sa výsledok dal poslať ďalej.
const nf = (n: number, digits = 0) => n.toLocaleString("sk-SK", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const plural = (n: number, one: string, few: string, many: string) => n === 1 ? one : n >= 2 && n <= 4 ? few : many;
const times = (f: number) => `${nf(f, f < 10 ? 1 : 0)}-krát`;
const picks = [1970, 1990, 2005];
const example = lifeSummary(1990).cabinets.length;

function Strip({ s }: { s: LifeSummary }) {
  const total = s.totalDays || 1;
  const adult = s.adulthood.status === "slovakia" ? (Date.parse(`${s.adulthood.year}-07-01T00:00:00Z`) - Date.parse(`${s.from}T00:00:00Z`)) / 86_400_000 / total : null;
  return <figure className="you-strip" aria-label={`Vlády od ${formatTenureDate(s.from)} do ${formatTenureDate(s.asOf)}: ${s.cabinets.map(c => c.cabinet.short).join(", ")}`}>
    <div className="you-strip-bar">
      {s.cabinets.map(c => <span key={c.cabinet.id} style={{ flexGrow: c.days, background: c.cabinet.color }} title={`${c.cabinet.name}: ${formatTenureDate(c.start)} – ${c.cabinet.end ? formatTenureDate(c.end) : "dnes"}`}>
        {c.days / total > 0.085 && <b>{c.cabinet.short}</b>}
      </span>)}
      {adult !== null && adult > 0 && adult < 1 && <i className="you-strip-adult" style={{ left: `${adult * 100}%` }}><em>18</em></i>}
    </div>
    <figcaption><span>{s.from.slice(0, 4)}</span><span>dnes</span></figcaption>
  </figure>;
}

export default function YourSlovakia({ year, onYear }: { year: number | null; onYear: (year: number | null) => void }) {
  const [draft, setDraft] = useState(year ? String(year) : "");
  const [message, setMessage] = useState("");
  const s = year && isBirthYear(year) ? lifeSummary(year) : null;
  const commit = (value: string) => {
    setDraft(value);
    setMessage("");
    const n = Number(value);
    if (value === "") onYear(null);
    else if (/^\d{4}$/.test(value) && isBirthYear(n)) onYear(n);
  };
  const invalid = /^\d{4}$/.test(draft) && !isBirthYear(Number(draft));
  const wagePrices = s?.minWage ? priceFactor(s.minWage.fromYear, s.minWage.toYear) : null;

  async function share() {
    if (!s) return;
    const debt = s.debt ? ` Dlh na obyvateľa stúpol z ${nf(s.debt.from)} € na ${nf(s.debt.to)} €.` : "";
    const text = `Ročník ${s.year}: ${lifeHeadline(s)}.${debt} Pozri sa na svoj ročník:`;
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: "Tvoje Slovensko · Mandát", text, url });
      else { await navigator.clipboard.writeText(`${text} ${url}`); setMessage("Text s odkazom je skopírovaný."); }
    } catch { /* zdieľanie zrušené */ }
  }

  return <section className="resp-block you-sk" aria-labelledby="you-title">
    <div className="resp-block-head"><div><h2 id="you-title">Tvoje Slovensko</h2><p>Zadaj rok narodenia a pozri sa, kto vládol počas tvojho života a ako sa medzitým zmenil dlh, mzdy a ceny.</p></div></div>
    <div className="you-card">
      <div className="you-input">
        <label htmlFor="you-year">Rok narodenia</label>
        <input id="you-year" type="text" inputMode="numeric" autoComplete="off" maxLength={4} placeholder="napr. 1990" value={draft} aria-invalid={invalid || undefined} aria-describedby="you-year-hint" onChange={e => commit(e.target.value.replace(/\D/g, "").slice(0, 4))}/>
        <p id="you-year-hint" className={invalid ? "is-error" : ""}>{invalid ? `Zadaj rok ${birthYears.min} až ${birthYears.max}.` : "Údaje o vládach máme od roku 1993, o hospodárení od roku 1995."}</p>
        <div className="you-picks"><span>Skús</span>{picks.map(p => <button key={p} type="button" aria-pressed={year === p} onClick={() => commit(String(p))}>{p}</button>)}</div>
      </div>
      {s ? <div className="you-result" aria-live="polite">
        <p className="you-lead"><span>Ročník {s.year}:</span> {lifeHeadline(s)}.</p>
        {s.ageAtIndependence !== null && <p className="you-note">V roku 1993 ti bolo {s.ageAtIndependence} {plural(s.ageAtIndependence, "rok", "roky", "rokov")}. Rátame od vzniku samostatného Slovenska 1. 1. 1993.</p>}
        <Strip s={s}/>
        <dl className="you-facts">
          {s.topParty && <div><dt>Najdlhšie vo vláde</dt><dd><span className="brief-party"><i style={{ background: s.topParty.color }} aria-hidden="true"/>{s.topParty.short}</span></dd><small>{durationLabel(s.topParty.days)} · {nf(s.topParty.share * 100)} % {s.ageAtIndependence !== null ? "tohto času" : "tvojho života"}</small></div>}
          {s.topPremier && <div><dt>Najdlhšie premiérom</dt><dd>{s.topPremier.name}</dd><small>{durationLabel(s.topPremier.days)}</small></div>}
          <div><dt>Tvoje 18. narodeniny</dt><dd>{s.adulthood.year}</dd><small>{s.adulthood.status === "czechoslovakia" ? "ešte v Česko-Slovensku" : s.adulthood.status === "future" ? "vtedy budeš môcť prvýkrát voliť" : s.adulthood.cabinet?.name ?? "—"}</small></div>
          {s.debt && <div><dt>Dlh na obyvateľa</dt><dd>{nf(s.debt.from)} € → {nf(s.debt.to)} €</dd><small>{s.debt.fromYear} – {s.debt.toYear} · {times(s.debt.to / s.debt.from)} viac</small></div>}
          {s.minWage && <div><dt>Minimálna mzda</dt><dd>{nf(s.minWage.from)} € → {nf(s.minWage.to)} €</dd><small>{s.minWage.fromYear} – {s.minWage.toYear}{wagePrices ? ` · ceny medzitým ${times(wagePrices)}` : ""}</small></div>}
          {s.living && <div><dt>Životná úroveň</dt><dd>{nf(s.living.from, 1)} → {nf(s.living.to, 1)} %</dd><small>HDP na obyvateľa v kúpnej sile, priemer EÚ = 100 · {s.living.fromYear} – {s.living.toYear}</small></div>}
        </dl>
        {!s.debt && <p className="you-note">Hospodárske údaje Eurostatu zatiaľ máme len do roku {birthYears.max - 1}.</p>}
        <div className="you-actions"><button type="button" className="text-button" onClick={share}><Share2 size={16} aria-hidden="true"/> Zdieľať môj ročník</button>{message && <span role="status">{message}</span>}</div>
        <p className="you-method">Obdobie rátame od 1. 1. roku narodenia. Čas strán vo vláde je rovnaký ako v prehľade nižšie. Sumy sú v bežných eurách podľa Eurostatu, bez očistenia o infláciu. Ceny: harmonizovaný index spotrebiteľských cien.</p>
      </div> : <p className="you-empty">Napríklad ročník 1990 zažil {governmentsLabel(example)}. Koľko ich zažil tvoj?</p>}
    </div>
  </section>;
}
