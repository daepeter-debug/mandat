"use client";

import { ArrowDown, ArrowRight, ArrowUpRight, ExternalLink } from "lucide-react";
import { aggregatePolls, aggregatePollWeight, aggregateLastDate, aggregateUpdated, aggregateWindowDays, aggregateHalfLifeDays, currentAggregate } from "@/lib/aggregate";
import { date, fmt, parties } from "@/lib/polls";
import "@/app/model-origins.css";

const ordered = [...aggregatePolls].sort((a,b)=>(b.published??b.end).localeCompare(a.published??a.end));
const weights = aggregatePolls.map(p=>aggregatePollWeight(p,aggregateLastDate));
const total = weights.reduce((sum,w)=>sum+w,0);
const leaders = Object.values(currentAggregate.values).sort((a,b)=>b.value-a.value).slice(0,3);
const curve = Array.from({length:61},(_,day)=>`${day?'L':'M'}${20+day*4},${82-64*Math.pow(.5,day/aggregateHalfLifeDays)}`).join(' ');

export default function ModelOrigins({onMethod}:{onMethod:()=>void}) {
  return <section id="model-mandat" className="model-origins" aria-labelledby="model-origin-title" tabIndex={-1}>
    <div className="model-origin-explanation">
      <h2 id="model-origin-title">{aggregatePolls.length===5?'Päť':aggregatePolls.length} pohľadov.<br/><span>Jeden Model Mandát.</span></h2>
      <p>Spájame najnovšie merania agentúr do <strong>váženého priemeru</strong>. Novšie meranie má väčší vplyv; zohľadňujeme aj veľkosť vzorky.</p>
      <div className="model-origin-flow">
        <div className="model-age-chart"><b>Novšie má väčšiu váhu</b>
          <svg viewBox="0 0 280 116" role="img" aria-label={`Váha podľa veku merania: dnes plná, po ${aggregateHalfLifeDays} dňoch polovica, po ${aggregateWindowDays} dňoch štvrtina.`}>
            <path d={`${curve} L260 82 H20 Z`} fill="currentColor" opacity=".08"/>
            <path d="M20 82 H260" fill="none" stroke="currentColor" opacity=".2"/>
            <path d={curve} fill="none" stroke="currentColor" strokeWidth="2.5"/>
            {[0,30,60].map(day=><g key={day}><circle cx={20+day*4} cy={82-64*Math.pow(.5,day/aggregateHalfLifeDays)} r="4" fill="currentColor"/><text x={20+day*4} y="101" textAnchor="middle">{day===0?'dnes':`${day} dní`}</text>{day===30&&<text x="146" y="39">½ váhy</text>}</g>)}
          </svg>
          <span>Najviac {aggregateWindowDays} dní staré · posledné meranie každej agentúry</span>
        </div>
        <ArrowDown className="model-flow-arrow" size={20} aria-hidden="true"/>
        <div className="model-average-result"><b>Výsledok: priemer podpory</b><div>{leaders.map(value=>{const party=parties.find(p=>p.id===value.partyId)!;return <span key={value.partyId}><i style={{background:party.color}} aria-hidden="true"/>{party.short}<strong>{fmt(value.value)} %</strong></span>;})}</div></div>
      </div>
      <p className="model-origin-caution">Je to náš výpočet z prieskumov, nie ďalší prieskum ani predpoveď volieb. Z priemeru potom počítame scenár 150 kresiel.</p>
      <button className="mag-text-link" onClick={onMethod}>Presný postup a obmedzenia <ArrowRight size={16}/></button>
    </div>
    <div className="model-origin-inputs"><header><h3>Najnovšie prieskumy v modeli</h3><span>Aktualizované {date(aggregateUpdated)}</span></header>
      <ul>{ordered.map((poll,index)=>{const share=aggregatePollWeight(poll,aggregateLastDate)/total*100;return <li key={poll.id}>
        <div className="model-input-heading"><a href={`/?v=polls&d=${encodeURIComponent(poll.id)}`}><b>{poll.agency}</b>{index===0&&<span>Najnovší</span>}<ArrowUpRight size={15}/></a><span>{poll.published?<>Zverejnené <time dateTime={poll.published}>{date(poll.published)}</time></>:<>Zber do <time dateTime={poll.end}>{date(poll.end)}</time></>}</span></div>
        <div className="model-input-weight"><div aria-hidden="true"><i style={{width:`${share}%`}}/></div><span>{fmt(share)} % váhy</span></div>
        <div className="model-input-source"><span>{poll.sample?`n = ${poll.sample.toLocaleString('sk-SK')}`:'Vzorka neuvedená'} · zber do {date(poll.end)}</span><a href={poll.source} target="_blank" rel="noopener noreferrer" aria-label={`${poll.agency}: pôvodný zdroj (nová karta)`}>Zdroj <ExternalLink size={13}/></a></div>
      </li>;})}</ul>
      <p className="model-input-note">Zaokrúhlené základné váhy meraní. Ak agentúra neuvádza niektorú stranu, jej priemer rátame len z dostupných hodnôt; vyžadujeme väčšinu meraní.</p>
    </div>
  </section>;
}
