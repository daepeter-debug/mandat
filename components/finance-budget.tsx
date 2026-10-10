"use client";
import { useState } from 'react';
import { financeYears } from '@/lib/public-finance';
import '@/app/finance-budget.css';
const years=[...financeYears].reverse().filter(r=>r.revenuePct!==undefined&&r.expenditurePct!==undefined).slice(0,2);
const max=Math.ceil(Math.max(...years.flatMap(r=>[r.revenuePct!,r.expenditurePct!]))/10)*10;
const fmt=(v:number)=>v.toLocaleString('sk-SK',{minimumFractionDigits:1,maximumFractionDigits:1});
export default function FinanceBudget(){
  const [year,setYear]=useState(years[0]?.year);
  const row=years.find(r=>r.year===year);if(!row)return null;
  const items=[{label:'Príjmy',value:row.revenuePct!,kind:'revenue'},{label:'Výdavky',value:row.expenditurePct!,kind:'expense'}];
  return <section className="finance-budget" aria-labelledby="budget-title"><header><div><h2 id="budget-title">Príjmy a výdavky vedľa seba</h2><p>Celá verejná správa · rovnaká stupnica v % HDP</p></div><div role="group" aria-label="Rok porovnania príjmov a výdavkov">{years.map(r=><button key={r.year} aria-pressed={r.year===year} onClick={()=>setYear(r.year)}>{r.year}</button>)}</div></header>
    <div className="finance-budget-bars">{items.map(item=><div key={item.kind} data-kind={item.kind}><span>{item.label}</span><div aria-hidden="true"><i style={{width:`${item.value/max*100}%`}}/></div><b>{fmt(item.value)} %</b></div>)}<div className="finance-budget-axis" aria-hidden="true"><span>0</span><span>{max} % HDP</span></div></div>
    <p className="finance-budget-result" role="status">Saldo {row.year}: <strong>{row.deficitPct>0?'+':''}{fmt(row.deficitPct)} % HDP</strong><span>Eurostat · ročné údaje, nejde o plán rozpočtu</span></p>
  </section>;
}
