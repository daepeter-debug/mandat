"use client";

import { useEffect, useState } from "react";
import { debtPerCapita, financeYears, latestFinanceYear } from "@/lib/public-finance";
import "@/app/debt-clock.css";

/*
  Dlhové hodiny: odhad dnešného dlhu verejnej správy. Východisko je posledný údaj Eurostatu
  (dlh ku koncu roka), ďalej rátame rovnomerne tempom, akým dlh rástol v tom roku. Skutočný dlh
  sa mení skokovo (emisie dlhopisov, hotovostná rezerva), preto je to vždy označené ako odhad.
*/
const last = latestFinanceYear;
const prev = financeYears.find(r => r.year === last.year - 1)!;
const yearSeconds = 365 * 86_400;
const perSecond = (last.debtMeur - prev.debtMeur) * 1e6 / yearSeconds;
const start = Date.UTC(last.year + 1, 0, 1) - 3_600_000; // polnoc 1. januára v Bratislave (SEČ)
const population = last.population ?? 5_400_000;
const eur = (v: number) => `${Math.round(v).toLocaleString("sk-SK")} €`;

export default function DebtClock() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, calm ? 1000 : 100);
    return () => window.clearInterval(id);
  }, []);
  const debt = now === null ? null : last.debtMeur * 1e6 + Math.max(0, (now - start) / 1000) * perSecond;
  const summary = debt === null ? "" : `Odhad dnes: približne ${(debt / 1e9).toLocaleString("sk-SK", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mld. €`;
  return <section className="debt-clock" aria-labelledby="debt-clock-title">
    <div className="debt-clock-main">
      <h2 id="debt-clock-title">Dlhové hodiny <span>odhad</span></h2>
      <p className="debt-clock-value" aria-hidden="true">{debt === null ? "…" : eur(debt)}</p>
      <p className="sr-only">{summary}</p>
      <p className="debt-clock-note">Posledný údaj Eurostatu: {(last.debtMeur / 1000).toLocaleString("sk-SK", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mld. € ku koncu roka {last.year}. Ďalej rátame tempom, akým dlh rástol v roku {last.year}. Skutočný dlh sa mení skokovo, podľa predaja dlhopisov a hotovosti štátu.</p>
    </div>
    <dl className="debt-clock-rates">
      <div><dt>Na obyvateľa</dt><dd>{debt === null ? eur(debtPerCapita(last) ?? 0) : eur(debt / population)}</dd></div>
      <div><dt>Za sekundu</dt><dd>+{eur(perSecond)}</dd></div>
      <div><dt>Za deň</dt><dd>+{(perSecond * 86_400 / 1e6).toLocaleString("sk-SK", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}&nbsp;mil. €</dd></div>
      <div><dt>Na obyvateľa za deň</dt><dd>+{(perSecond * 86_400 / population).toLocaleString("sk-SK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}&nbsp;€</dd></div>
    </dl>
  </section>;
}
