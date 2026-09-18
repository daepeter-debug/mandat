"use client";
import { useEffect, useState } from 'react';
import { ArrowUpRight, Search } from 'lucide-react';
import { politicalCases, caseStatuses, casesChecked, casesForParty, severityScale, severityBand, partyCaseSummaries, type PoliticalCase } from '@/lib/political-cases';
import { parties, date } from '@/lib/polls';
const normalize=(s:string)=>s.normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const PAGE_SIZE=10;

/** Číslo závažnosti so slovným pásmom; farba nikdy nie je jediný nositeľ významu. */
export function SeverityChip({value,compact=false}:{value:number;compact?:boolean}){
  const band=severityBand(value);
  return <span className={`case-severity tone-${band.tone}${compact?' compact':''}`} title={`${severityScale.label}: ${value} z 10, ${band.label}`}>
    <b>{value}<span aria-hidden="true">/10</span></b><span className="sr-only"> z 10, </span><small>{band.label}{compact?'':' · redakčné hodnotenie'}</small>
  </span>;
}

export function CaseCard({c,onParty}:{c:PoliticalCase;onParty:(id:string)=>void}){
  return <article className="case-entry">
    <div className="case-status-column">
      <span className={`case-status ${c.status}`}>{caseStatuses[c.status]}</span>
      <time dateTime={c.statusAsOf}>Stav v zdroji {date(c.statusAsOf)}</time>
      <SeverityChip value={c.severity}/>
    </div>
    <div className="case-copy">
      <div className="case-period">{c.period}</div>
      <h2>{c.title}</h2>
      <p>{c.summary}</p>
      <div className="case-party-tags">{c.parties.map(id=><button key={id} onClick={()=>onParty(id)} aria-label={`Otvoriť profil strany ${parties.find(p=>p.id===id)?.short ?? id}`}>{parties.find(p=>p.id===id)?.short ?? id}<ArrowUpRight size={11} aria-hidden="true"/></button>)}</div>
      <p className="case-relationship">{c.relationship}</p>
      <details><summary>Prečo závažnosť {c.severity} z 10</summary><p>{c.severityWhy}</p></details>
      <details><summary>Reakcia a kontext</summary><p>{c.response}</p></details>
      <a className="news-source" href={c.source} target="_blank" rel="noopener noreferrer">{c.sourceName}<ArrowUpRight size={12}/><span className="sr-only"> (nová karta)</span></a>
    </div>
  </article>;
}

/** Prehľad podľa strán: počet prípadov v registri a najvyššia závažnosť. Nie je to rebríček viny. */
export function PartyCaseOverview({active,onSelect}:{active:string;onSelect:(id:string)=>void}){
  const rows=partyCaseSummaries();
  const withCases=rows.filter(r=>r.count>0);
  const without=rows.filter(r=>r.count===0);
  return <section className="case-parties" aria-labelledby="case-parties-title">
    <div className="case-parties-head"><h2 id="case-parties-title">Prehľad podľa strán</h2><p>Počet prípadov v našom registri a najvyššia závažnosť. Register je výber, nie úplný zoznam, preto čísla neporovnávajte ako rebríček viny.</p></div>
    <ul className="case-parties-grid">
      {withCases.map(r=>{const band=severityBand(r.maxSeverity);return <li key={r.id}><button className={`case-party-card${active===r.id?' is-active':''}`} aria-pressed={active===r.id} onClick={()=>onSelect(active===r.id?'all':r.id)}>
        <span className="case-party-name"><i style={{background:r.color}} aria-hidden="true"/>{r.short}</span>
        <span className="case-party-count"><b>{r.count}</b><small>{r.count===1?'prípad':r.count<5?'prípady':'prípadov'}</small></span>
        <span className={`case-party-max tone-${band.tone}`}>najvyššia {r.maxSeverity}<span aria-hidden="true">/10</span></span>
        <span className="case-party-status">{Object.entries(r.byStatus).map(([s,n])=>`${n}× ${caseStatuses[s as keyof typeof caseStatuses].toLowerCase()}`).join(' · ')}</span>
      </button></li>;})}
    </ul>
    {without.length>0&&<p className="case-parties-without">Bez prípadu v registri: {without.map(r=>r.short).join(', ')}. Neznamená to, že tieto strany kauzy nemajú.</p>}
  </section>;
}

export default function PoliticalCases({onParty,party='all',onPartyChange}:{onParty:(id:string)=>void;party?:string;onPartyChange?:(id:string)=>void}){
  const [status,setStatus]=useState('all');
  const [query,setQuery]=useState('');
  const [localParty,setLocalParty]=useState('all');
  const [visibleCount,setVisibleCount]=useState(PAGE_SIZE);
  const [compactList,setCompactList]=useState(false);
  useEffect(()=>{
    const media=window.matchMedia('(max-width: 760px)');
    const sync=()=>setCompactList(media.matches);
    sync();
    media.addEventListener('change',sync);
    return ()=>media.removeEventListener('change',sync);
  },[]);
  const activeParty=onPartyChange?party:localParty;
  const changeParty=(id:string)=>{setVisibleCount(PAGE_SIZE);if(onPartyChange)onPartyChange(id);else setLocalParty(id);};
  const rows=politicalCases.filter(c=>(activeParty==='all'||c.parties.includes(activeParty))&&(status==='all'||c.status===status)&&normalize(c.title+' '+c.summary+' '+c.relationship).includes(normalize(query)));
  const visibleRows=compactList?rows.slice(0,visibleCount):rows;
  const partyLabel=parties.find(p=>p.id===activeParty)?.short;
  return <section className="cases-page">
    <header className="news-heading"><div><h1>Kauzy v súvislostiach.</h1><p>Čo sa stalo, koho sa prípad týka, čo je doložené a ako závažné to podľa našej stupnice je.</p></div><span className="news-selection">Register {politicalCases.length} prípadov</span></header>
    <div className="cases-intro">
      <p>Väzba na stranu znamená konkrétneho predstaviteľa, nominanta alebo rezort, nie automaticky vinu celej strany. Uvádzame aj prípady, ktoré sa skončili bez odsúdenia; stav podkladov je pri každom prípade s dátumom informácie v zdroji.</p>
      <details><summary>Ako počítame závažnosť 1–10 a odkiaľ sú zdroje</summary>
        <p>{severityScale.label} je naše hodnotenie, nie miera viny. Východisko dáva stav podkladov: kontroverzia {severityScale.base.controversy}, ukončené bez odsúdenia {severityScale.base.closed}, zistenia investigatívy {severityScale.base.report}, obvinenie alebo obžaloba {severityScale.base.indictment}, právoplatný rozsudok {severityScale.base.conviction}. Potom: {severityScale.adjustments.join('; ')}. Číslo sa počíta automaticky z týchto faktorov a pri každom prípade je výpočet vidieť. Rovnaké pravidlá platia pre každú stranu.</p>
        <p className="severity-legend" aria-label="Pásma závažnosti">{severityScale.bands.map(b=><span key={b.tone} className={`case-severity compact tone-${b.tone}`}><b>{b.min}–{b.max}</b><small>{b.label}</small></span>)}</p>
        <p>Vychádzame z prehľadov <a href="https://zastavmekorupciu.sk/kauzy/" target="_blank" rel="noopener noreferrer">Nadácie Zastavme korupciu</a>, <a href="https://transparency.sk/sk/znacka/kauzy/" target="_blank" rel="noopener noreferrer">Transparency International Slovensko</a> a slovenskej Wikipédie; súdne výsledky dokladáme správami o rozhodnutiach. Jeden prípad evidujeme raz, aj keď má viac článkov. Dátum pri stave označuje informáciu v citovanom zdroji, nie potvrdenie, že odvtedy nenastal vývoj.</p>
      </details>
    </div>
    <PartyCaseOverview active={activeParty} onSelect={changeParty}/>
    <div className="case-filters">
      <label className="case-search"><Search size={16}/><span className="sr-only">Hľadať kauzu</span><input value={query} onChange={e=>{setQuery(e.target.value.slice(0,80));setVisibleCount(PAGE_SIZE);}} placeholder="Hľadať v prípadoch…" autoComplete="off" spellCheck={false}/></label>
      <label>Strana<select value={activeParty} onChange={e=>changeParty(e.target.value)}><option value="all">Všetky strany</option>{parties.map(p=><option key={p.id} value={p.id}>{p.short}</option>)}</select></label>
      <label>Stav<select value={status} onChange={e=>{setStatus(e.target.value);setVisibleCount(PAGE_SIZE);}}><option value="all">Všetky stavy</option>{Object.entries(caseStatuses).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
    </div>
    <div className="case-count" role="status">{rows.length} z {politicalCases.length} prípadov{partyLabel?` · strana ${partyLabel}`:''} · zoradené podľa závažnosti · kontrola zdrojov {date(casesChecked)}</div>
    <div className="case-list">{visibleRows.map(c=><CaseCard key={c.id} c={c} onParty={onParty}/>)}</div>
    {compactList&&visibleCount<rows.length&&<button className="case-more" type="button" onClick={()=>setVisibleCount(count=>Math.min(count+PAGE_SIZE,rows.length))}>Zobraziť ďalšie prípady <span>{visibleRows.length} z {rows.length}</span></button>}
    {!rows.length&&<div className="news-empty"><h2>V tomto výbere zatiaľ nemáme prípad.</h2><p>Nejde o potvrdenie, že strana nemá kauzy. Register postupne dopĺňame.</p><button onClick={()=>{changeParty('all');setStatus('all');setQuery('');setVisibleCount(PAGE_SIZE);}}>Zrušiť filtre</button></div>}
  </section>;
}

export function PartyCases({partyId,onCases}:{partyId:string;onCases?:(partyId:string)=>void}) {
  const rows=casesForParty(partyId);
  const counts=Object.entries(caseStatuses).map(([id,label])=>[label,rows.filter(c=>c.status===id).length] as const).filter(([,n])=>n>0);
  return <section className="profile-cases" aria-labelledby="profile-cases-title">
    <div className="profile-section-heading"><h2 id="profile-cases-title">Kauzy v registri</h2><span>{rows.length===0?'Pilotný register':rows.length===1?'1 prípad':`${rows.length} prípady`}</span></div>
    {rows.length>0?<>
      <p className="profile-cases-summary">{counts.map(([label,n])=>`${n}× ${label.toLowerCase()}`).join(' · ')} · najvyššia závažnosť {Math.max(...rows.map(c=>c.severity))} z 10.</p>
      <ul className="profile-case-list">{rows.map(c=><li key={c.id}><SeverityChip value={c.severity} compact/><div><strong>{c.title}</strong><span>{caseStatuses[c.status]} · {c.period}</span></div><a href={c.source} target="_blank" rel="noopener noreferrer" aria-label={`Zdroj: ${c.sourceName}`}><ArrowUpRight size={13}/></a></li>)}</ul>
    </>:<p className="profile-cases-empty">V pilotnom registri zatiaľ bez prípadu. Neznamená to, že strana kauzy nemá; register má {politicalCases.length} prípadov a dopĺňame ho ručne.</p>}
    <p className="profile-cases-foot">Väzba na stranu znamená konkrétneho predstaviteľa alebo rezort, nie vinu celej strany. Závažnosť je redakčné hodnotenie podľa zverejnenej stupnice, kontrola zdrojov {date(casesChecked)}.{onCases&&<> <button className="profile-cases-link" onClick={()=>onCases(partyId)}>Otvoriť kauzy strany <ArrowUpRight size={12}/></button></>}</p>
  </section>;
}
