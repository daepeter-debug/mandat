"use client";

import { useId, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, ChevronDown, ChevronUp } from 'lucide-react';
import { aggregateLastDate, currentAggregate } from '@/lib/aggregate';
import { agencyComparison, pollImpact } from '@/lib/poll-impact';
import { date, fmt, parties, type Party } from '@/lib/polls';
import partyLogos from '@/lib/party-logos.json';
import MiniHemicycle from '@/components/mini-hemicycle';
import '@/app/model-lens.css';

const impact = pollImpact();
const availableParties = parties.filter(p => currentAggregate.values[p.id]?.value >= 1)
  .sort((a,b) => currentAggregate.values[b.id].value - currentAggregate.values[a.id].value);
const logos: Record<string,{src:string}> = partyLogos;
const signed = (n:number) => n === 0 ? '0,0' : `${n > 0 ? '+' : '−'}${fmt(Math.abs(n))}`;
function Logo({party}:{party:Party}) {
  return <span className="model-lens-logo" aria-hidden="true">{logos[party.id] && <Image src={logos[party.id].src} alt="" width={24} height={24} unoptimized/>}</span>;
}

function PollImpact() {
  const uid = useId();
  const [include, setInclude] = useState(true);
  const [expanded, setExpanded] = useState(false);
  if (!impact) return <article className="model-impact"><h2>Čo prinieslo najnovšie meranie?</h2><p>Na porovnanie potrebujeme meranie so známym dátumom zverejnenia. V archíve zatiaľ taký vstup nemáme.</p><Link href="/?v=polls">Otvoriť prieskumy <ArrowUpRight size={15}/></Link></article>;
  const scenario = include ? impact.afterSeats : impact.beforeSeats;
  const colors = parties.flatMap(p => Array.from({length:scenario.rows.find(r=>r.id===p.id)?.seats ?? 0},()=>p.color));
  const moved = impact.rows.reduce((sum,r)=>sum+Math.max(0,r.seatDelta),0);
  const complete = impact.beforeSeats.rows.reduce((sum,r)=>sum+r.seats,0) === 150;
  const maxDelta = Math.max(.5,...impact.rows.map(r=>Math.abs(r.delta ?? 0)));
  const rows = expanded ? impact.rows : impact.rows.slice(0,5);
  const inputLabel = impact.added.map(p=>p.agency).join(' + ');
  return <article className="model-impact" aria-labelledby={`${uid}-title`}>
    <header><h2 id={`${uid}-title`}>Čo prinieslo<br/><span>najnovšie meranie?</span></h2><p>{impact.added.map(p=><a key={p.id} href={`/?v=polls&d=${encodeURIComponent(p.id)}`}>{p.agency}<ArrowUpRight size={14}/></a>)}<span>zverejnené <time dateTime={impact.published}>{date(impact.published)}</time></span></p></header>
    <div className="impact-switch" role="group" aria-label={`Prepočet Modelu Mandát ${inputLabel}`}>
      <button type="button" aria-pressed={!include} onClick={()=>setInclude(false)}>Bez nového merania</button>
      <button type="button" aria-pressed={include} onClick={()=>setInclude(true)}>S novým meraním</button>
    </div>
    <div className="impact-parliament">
      <MiniHemicycle className="impact-arc" colors={colors} majority label={`${include?'S novým meraním':'Bez nového merania'}, scenár k ${date(impact.asOf)}. ${scenario.rows.map(r=>`${r.short} ${r.seats} kresiel`).join(', ')}. Poradie strán nie je politická os.`}/>
      <div aria-live="polite"><b>{include ? 'S novým meraním' : 'Bez nového merania'}</b><p>{complete ? moved===0 ? 'Rozdelenie 150 kresiel ostalo rovnaké.' : `${moved} ${moved===1?'kreslo pripadlo':moved<5?'kreslá pripadli':'kresiel pripadlo'} iným stranám.` : 'Bez nového merania nemáme úplný scenár 150 kresiel.'}</p><span>Oba výpočty k {date(impact.asOf)}</span></div>
    </div>
    <div className="impact-change-head"><span>Podpora bez → s meraním</span><span>Posun v p. b.</span></div>
    <div className="impact-delta-scale" aria-hidden="true"><span>−{fmt(maxDelta)}</span><span>0</span><span>+{fmt(maxDelta)}</span></div>
    <ul className="impact-changes" id={`${uid}-changes`} aria-label="Rozdiel v podpore a kreslách pri zaradení nového merania">
      {rows.map(p=><li key={p.id}>
        <div className="impact-party"><Logo party={p}/><span><b>{p.short}</b><small>{p.from===null?'—':fmt(p.from)} <ArrowRight size={10} aria-hidden="true"/> {p.to===null?'—':fmt(p.to)} %</small></span></div>
        <div className="impact-delta-plot" aria-hidden="true"><svg viewBox="0 0 100 24" preserveAspectRatio="none"><path className="impact-delta-track" d="M5 12 H95 M50 5 V19"/>{p.delta!==null&&<path d={`M50 12 H${50+p.delta/maxDelta*45}`} stroke={p.color} strokeWidth="3"/>}</svg>{p.delta!==null&&<i style={{left:`${50+p.delta/maxDelta*45}%`,background:p.color}}/>}</div>
        <div className="impact-delta"><b>{p.delta===null?'—':signed(p.delta)}</b><small>{p.seatDelta===0?'kreslá bez zmeny':`${signed(p.seatDelta).replace(',0','')} kresiel`}</small></div>
      </li>)}
    </ul>
    {impact.rows.length>5&&<button type="button" className="lens-expand" aria-expanded={expanded} aria-controls={`${uid}-changes`} onClick={()=>setExpanded(!expanded)}>{expanded?'Zobraziť najväčšie posuny':`Všetky strany (${impact.rows.length})`}{expanded?<ChevronUp size={15}/>:<ChevronDown size={15}/>}</button>}
    <details className="lens-method"><summary>Ako čítať toto porovnanie</summary><p>Ide o porovnanie dvoch výpočtov pri rovnakom dátume, nie o archív predchádzajúcej publikovanej verzie. Bez nového merania použijeme predchádzajúce meranie tej istej agentúry, ak sa zmestí do 60-dňového okna. Ostatné vstupy a pravidlá ostávajú rovnaké. Posun priemeru sám osebe nedokazuje zmenu nálad voličov.</p><p>Vstupy bez nového merania: {impact.previousInputs.length?impact.previousInputs.map((p,i)=><span key={p.id}>{i>0?' · ':''}<a href={`/?v=polls&d=${encodeURIComponent(p.id)}`}>{p.agency} {date(p.end)}</a></span>):'žiadne dostupné merania'}.</p></details>
  </article>;
}

function AgencyAgreement() {
  const uid = useId();
  const [partyId,setPartyId] = useState(availableParties[0]?.id ?? 'ps');
  const [selectedId,setSelectedId] = useState(impact?.added[0]?.id ?? '');
  const party = parties.find(p=>p.id===partyId)!;
  const {model,readings,min,max} = agencyComparison(partyId);
  const selected = readings.find(r=>r.poll.id===selectedId) ?? readings[0];
  const coordinate = (value:number) => 5+(value-min)/(max-min)*90;
  const modelX = model ? coordinate(model.value) : null;
  const ticks = [min,(min+max)/2,max];
  return <article className="agency-agreement" aria-labelledby={`${uid}-title`}>
    <header><h2 id={`${uid}-title`}>Ako sa agentúry<br/><span>zhodujú?</span></h2><p>Ich posledné merania v aktuálnom modeli. Ťuknite na agentúru a pozrite si zdroj.</p></header>
    <div className="agreement-picker"><Logo party={party}/><label className="sr-only" htmlFor={`${uid}-party`}>Strana na porovnanie agentúr</label><select id={`${uid}-party`} value={partyId} onChange={e=>setPartyId(e.target.value)}>{availableParties.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
    <div className="agreement-key"><span><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="4"/></svg>Meranie agentúry</span><span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2L14 8L8 14L2 8Z"/></svg>Model Mandát</span></div>
    <div className="agreement-axis" aria-hidden="true"><span/><div>{ticks.map((tick,i)=><span key={tick} style={{left:`${5+i*45}%`}}>{fmt(tick)} %</span>)}</div><span/></div>
    <div className="agreement-readings" role="group" aria-label={`Posledné merania agentúr pre ${party.name}. Os od ${fmt(min)} do ${fmt(max)} percent.`}>
      {readings.map(({poll,value})=><button type="button" className="agreement-row" key={poll.id} aria-pressed={selected?.poll.id===poll.id} onClick={()=>setSelectedId(poll.id)} aria-label={`${poll.agency}, ${party.short}: ${value===null?'hodnota neuvedená':`${fmt(value)} percent`}, koniec zberu ${date(poll.end)}. Zobraziť podrobnosti.`}>
        <span className="agreement-agency"><b>{poll.agency}</b><small>{date(poll.end)}</small></span>
        <div className="agreement-plot" aria-hidden="true"><svg viewBox="0 0 100 44" preserveAspectRatio="none">
          <path className="agreement-track" d="M5 22 H95"/>
          {ticks.map((_,i)=><path className="agreement-grid" key={i} d={`M${5+i*45} 0 V44`}/>)}
          {modelX!==null&&<path className="agreement-model-line" d={`M${modelX} 0 V44`}/>}
        </svg>{value!==null&&<i className="agreement-dot" style={{left:`${coordinate(value)}%`}}/>}</div><strong>{value===null?'—':fmt(value)}<small>{value!==null&&' %'}</small></strong>
      </button>)}
    </div>
    <div className="agreement-row agreement-model"><span className="agreement-agency"><b>Model</b><small>{date(aggregateLastDate)}</small></span><div className="agreement-plot" aria-hidden="true"><svg viewBox="0 0 100 44" preserveAspectRatio="none"><path className="agreement-track" d="M5 22 H95"/></svg>{modelX!==null&&<i className="agreement-diamond" style={{left:`${modelX}%`}}/>}</div><strong>{model?fmt(model.value):'—'}<small>{model&&' %'}</small></strong></div>
    {selected&&<div className="agreement-detail" aria-live="polite"><div><b>{selected.poll.agency} · {party.short} {selected.value===null?'bez údaja':`${fmt(selected.value)} %`}</b><span>Zber {date(selected.poll.start)} – {date(selected.poll.end)}</span><span>{selected.poll.method} · {selected.poll.sample?`n = ${selected.poll.sample.toLocaleString('sk-SK')}`:'vzorka neuvedená'}</span></div><a href={selected.poll.source} target="_blank" rel="noopener noreferrer">Pôvodný zdroj <ArrowUpRight size={14}/><span className="sr-only"> (nová karta)</span></a></div>}
    <p className="agreement-note">Os sa prispôsobuje strane a nezačína vždy od nuly. Bodky sú zverejnené hodnoty, nie pásma chyby. Merania majú rôzne dátumy aj metódy; ich rozdiel nie je hodnotenie kvality agentúr. Model je vážený priemer, nie predpoveď.</p>
  </article>;
}

export default function ModelLens() {
  return <section className="model-lens" aria-label="Vplyv najnovšieho merania a porovnanie agentúr"><PollImpact/><AgencyAgreement/></section>;
}
