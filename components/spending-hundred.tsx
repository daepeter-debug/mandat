"use client";
import {useState} from 'react';
import {ArrowUpRight} from 'lucide-react';
import {receiptRows,spendingYear,spendingTotalMeur} from '@/lib/tax-receipt';
import {cofogData} from '@/lib/cofog.data';
import '@/app/visual-discovery.css';
const rows=receiptRows(100);
const cells=rows.flatMap(r=>Array.from({length:r.amount},()=>r));
export default function SpendingHundred(){
  const [selected,setSelected]=useState(rows[0].code);
  const current=rows.find(r=>r.code===selected)!;
  const amount=(n:number)=>n.toLocaleString('sk-SK',{minimumFractionDigits:2,maximumFractionDigits:2});
  return <section className="spending-hundred" aria-labelledby="hundred-title">
    <header><h2 id="hundred-title">Kam ide 100 € verejných výdavkov?</h2><p>Slovensko · celá verejná správa · skutočné výdavky za {spendingYear}</p></header>
    <div className="spending-hundred-layout"><div><div className="spending-hundred-grid" role="img" aria-label={`100 políčok rozdelených podľa výdavkov. Vybraná oblasť: ${current.label}, ${amount(current.share*100)} eura zo 100. Presné hodnoty sú v zozname vedľa.`}>{cells.map((r,i)=><i key={i} data-selected={r.code===selected} style={{background:r.color}}/>)}</div><p className="spending-hundred-scale">1 políčko ≈ 1 € · hodnoty políčok sú zaokrúhlené</p></div>
      <div className="spending-hundred-detail" aria-live="polite"><span>{current.label}</span><strong>{amount(current.share*100)} <small>€ zo 100</small></strong><p>{current.hint}.</p>{current.sub&&current.subShare!==undefined&&<p className="spending-hundred-sub">{current.sub.label}: <b>{amount(current.subShare*100)} €</b> z celých 100 €.</p>}<span className="spending-hundred-total">Spolu verejná správa v {spendingYear}: {(spendingTotalMeur/1000).toLocaleString('sk-SK',{maximumFractionDigits:1})} mld. €</span></div></div>
    <div className="spending-hundred-areas" role="group" aria-label="Vybrať oblasť verejných výdavkov">{rows.map(r=><button key={r.code} type="button" aria-pressed={r.code===selected} onClick={()=>setSelected(r.code)}><i style={{background:r.color}} aria-hidden="true"/><span>{r.label}</span><b>{amount(r.share*100)} €</b></button>)}</div>
    <footer><a href={cofogData.url} target="_blank" rel="noopener noreferrer">Eurostat · COFOG<ArrowUpRight size={14} aria-hidden="true"/><span className="sr-only"> (nová karta)</span></a><p>Rozdelenie výdavkov, nie vašej konkrétnej dane ani plánu štátneho rozpočtu. Posledný rok v našich funkčných dátach: {spendingYear}; stiahnuté {cofogData.fetched}. Celková suma a kategórie sa môžu mierne líšiť pre zaokrúhlenie zdroja.</p></footer>
  </section>;
}
