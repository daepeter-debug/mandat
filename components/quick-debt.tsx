"use client";

import { useEffect, useState } from "react";
import { financeYears, latestFinanceYear } from "@/lib/public-finance";

// Rýchla odpoveď „Aký veľký je dlh?“: rovnaký odhad ako Dlhové hodiny v Hospodárení.
const last = latestFinanceYear;
const prev = financeYears.find(r => r.year === last.year - 1)!;
const perSecond = (last.debtMeur - prev.debtMeur) * 1e6 / (365 * 86_400);
const start = Date.UTC(last.year + 1, 0, 1) - 3_600_000;
const population = last.population ?? 5_400_000;

export default function QuickDebt() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1000 : 100);
    return () => window.clearInterval(id);
  }, []);
  const debt = now === null ? last.debtMeur * 1e6 : last.debtMeur * 1e6 + Math.max(0, (now - start) / 1000) * perSecond;
  return <div className="qa-card qa-debt">
    <div className="qa-big"><strong aria-hidden="true">{(debt / 1e9).toLocaleString("sk-SK", { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</strong><span>mld. € dnes<br/>(odhad)</span></div>
    <div className="qa-debt-person"><span><b>{Math.round(debt / population).toLocaleString("sk-SK")} €</b> na každého obyvateľa</span></div>
    <p className="qa-say">Dlh rastie asi o <b>{Math.round(perSecond)} € za sekundu</b>, tempom roku {last.year}. Posledný údaj Eurostatu: {(last.debtMeur / 1000).toLocaleString("sk-SK", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mld. € ku koncu roka {last.year}.</p>
  </div>;
}
