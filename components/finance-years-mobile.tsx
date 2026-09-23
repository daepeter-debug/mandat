"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { debtPerCapita, eventsForYear, financeYears, leadingCabinet } from "@/lib/public-finance";
import "@/app/finance-years-mobile.css";

/*
  Hospodárenie na mobile: namiesto širokej tabuľky (13 stĺpcov, čísla až po posunutí do strany)
  zoznam rokov. Pri každom roku vláda, stĺpček salda, dlh v % HDP a na obyvateľa a nezamestnanosť.
  Predvolene posledných 10 rokov, ďalšie sa rozbalia. Na počítači ostáva tabuľka.
*/
const rows = [...financeYears].reverse();
const maxDeficit = Math.max(...rows.map(r => Math.abs(r.deficitPct)));
const n1 = (v: number | undefined) => v === undefined ? "—" : v.toLocaleString("sk-SK", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export default function FinanceYearsMobile() {
  const [all, setAll] = useState(false);
  const shown = all ? rows : rows.slice(0, 10);
  return <section className="fy-mobile" aria-label="Verejné financie po rokoch">
    <div className="fy-legend" aria-hidden="true"><span>rok · vláda</span><span>saldo, % HDP</span><span>dlh</span></div>
    <ol>
      {shown.map(r => {
        const cab = leadingCabinet(r.year);
        const events = eventsForYear(r.year);
        return <li key={r.year}>
          <div className="fy-year"><b>{r.year}</b><span><i style={{ background: cab?.color }} aria-hidden="true"/>{cab?.short ?? "—"}</span>{events.length > 0 && <small>{events[0]}</small>}</div>
          <div className="fy-deficit" aria-label={`saldo ${n1(r.deficitPct)} % HDP`}>
            <span className="fy-bar" aria-hidden="true"><s className={r.deficitPct < -3 ? "is-over" : ""} style={{ width: `${Math.abs(r.deficitPct) / maxDeficit * 100}%` }}/></span>
            <b className={r.deficitPct < 0 ? "neg" : "pos"}>{n1(r.deficitPct)}</b>
          </div>
          <div className="fy-debt"><b>{n1(r.debtPct)} %</b><small>{(debtPerCapita(r) ?? 0).toLocaleString("sk-SK")} €/obyv.</small>{r.unemployment !== undefined && <small>nezam. {n1(r.unemployment)} %</small>}</div>
        </li>;
      })}
    </ol>
    {rows.length > 10 && <button type="button" className="fy-more" aria-expanded={all} onClick={() => setAll(a => !a)}>{all ? "Zobraziť len posledných 10 rokov" : `Zobraziť všetky roky od ${rows.at(-1)!.year}`} <ChevronDown size={16} aria-hidden="true" style={{ transform: all ? "rotate(180deg)" : undefined }}/></button>}
    <p className="fy-note">Červený stĺpček: deficit nad 3 % HDP (maastrichtská hranica). Všetky stĺpce, príjmy, výdavky, rast HDP a infláciu nájdete v tabuľke na počítači a v pohľade Po vládach.</p>
  </section>;
}
