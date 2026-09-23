"use client";

import { useState, type CSSProperties } from "react";
import { ArrowRight, ArrowUpRight, Check, Plus, RotateCcw } from "lucide-react";
import { archive, parties, rank, fmt, date, type Poll } from "@/lib/polls";
import { aggregateAsPoll, aggregatePolls } from "@/lib/aggregate";
import { scenarioFromPoll, wastedVotes } from "@/lib/parliament";
import Hemicycle from "@/components/hemicycle";
import PollAggregator from "@/components/poll-aggregator";
import NationalIntro from "@/components/national-intro";
import OverviewDirectory from "@/components/overview-directory";
import SectionArt from "@/components/section-art";
import QuickAnswers from "@/components/quick-answers";

const agencies = ["AKO", "FOCUS", "INFOSTAT", "IPSOS", "NMS"];
function Publication({poll}:{poll:Poll}) {
  return <a className="publication" href={poll.source} target="_blank" rel="noopener noreferrer">{poll.sourceName}<ArrowUpRight size={14}/><span className="sr-only"> (nová karta)</span></a>;
}
export function AgencyPicker({value,onChange}:{value:string;onChange:(value:string)=>void}) {
  return <div className="mag-agencies" role="group" aria-label="Vybrať agentúru">{agencies.map(a=><button key={a} aria-pressed={value===a} onClick={()=>onChange(a)}>{a}{value===a&&<Check size={14}/>}</button>)}</div>;
}

export function MandatMagazine({poll,onAgency,onNavigate,onYear,parliament,onParliament,parliamentPartners,onParliamentPartners,onOpenNews}:{poll:Poll;onAgency:(a:string)=>void;onNavigate:(v:string)=>void;onYear:(year:number)=>void;parliament:string;onParliament:(v:string)=>void;parliamentPartners:boolean;onParliamentPartners:(v:boolean)=>void;onOpenNews:(id:string)=>void}) {
  const modelPoll=aggregateAsPoll();
  const scenario=scenarioFromPoll(modelPoll);
  const [selected,setSelected]=useState<string[]>([]);
  const count=scenario.rows.filter(p=>selected.includes(p.id)).reduce((a,p)=>a+p.seats,0);
  const rows=rank(poll).filter(p=>poll.values[p.id]>1);
  const small=rows.filter(p=>poll.values[p.id]<5);
  const large=rows.filter(p=>poll.values[p.id]>=5);
  return <div className="magazine">
    <NationalIntro onNavigate={onNavigate} parliament={parliament} onParliament={onParliament} parliamentPartners={parliamentPartners} onParliamentPartners={onParliamentPartners} onOpenNews={onOpenNews}/>
    <QuickAnswers onYear={onYear}/>
    <OverviewDirectory onNavigate={onNavigate}/>
    <div className="mag-edition"><span>Slovensko · volebné prieskumy</span><span>{archive.length} meraní v archíve</span><button onClick={()=>onNavigate("method")}>Ako pracujeme so zdrojmi <ArrowUpRight size={16}/></button></div>
    <PollAggregator onMethod={()=>onNavigate("method")}/>
    <section className="mag-pulse" aria-labelledby="pulse-title"><div className="mag-section-head"><div><h2 id="pulse-title">Posledné meranie každej agentúry</h2><p>Agregát je hlavný pohľad. Tu si môžete skontrolovať každú agentúru osobitne.</p></div><AgencyPicker value={poll.agency} onChange={onAgency}/></div><div className="mag-poll-meta"><b>{poll.agency} · {poll.month.toLowerCase()} {poll.end.slice(0,4)}</b><span>Zber {date(poll.start)} – {date(poll.end)} · n = {poll.sample?.toLocaleString("sk-SK")??"neuvedené"}</span></div>
      <div className="mag-bars">{large.map(p=><div className="mag-bar-row" key={p.id} style={{"--party-color":p.color,"--bar":`${poll.values[p.id]/Math.max(...large.map(x=>poll.values[x.id]))}`} as CSSProperties}><span>{p.short}</span><div className="mag-bar-track"><i/></div><b>{fmt(poll.values[p.id])}<small> %</small></b></div>)}</div>
      <div className="mag-threshold"><span>5 %</span><p>Hranica pre samostatnú stranu</p></div><div className="mag-small-parties" aria-label="Strany nad 1 % a pod 5 %">{small.map(p=><div key={p.id}><span>{p.short}</span><b>{fmt(poll.values[p.id])}<small> %</small></b></div>)}</div>
      <div className="mag-poll-source"><Publication poll={poll}/><p>Zobrazujeme dostupné presné hodnoty nad 1 %. Chýbajúca hodnota nie je nula. Koalície majú odlišné volebné hranice.</p><button className="mag-text-link" onClick={()=>onNavigate("data")}>Trendy a všetky merania <ArrowRight size={18}/></button></div>
    </section>
    <section className="mag-lab"><div className="mag-lab-copy"><h2>Zostavte<br/>vlastnú<br/><span>koalíciu.</span></h2><p>Vyberte ľubovoľné strany. Zistite, koľko kresiel by spolu získali v scenári z Modelu Mandát.</p><button className="mag-button lime" onClick={()=>onNavigate("model")}>Vyskúšať vlastný model <ArrowUpRight size={20}/></button><p className="mag-lab-disclaimer">Výber je čisto matematický. Nehovorí nič o ochote strán spolupracovať.</p></div><div className="mag-lab-play"><div className="mag-coalition-count" role="status"><b>{count}</b><span>zo 150 kresiel<br/>{selected.length===0?"Začnite výberom strán":count>=76?"Dosiahnutých aspoň 76 kresiel":`Do 76 chýba ${76-count}`}</span></div><div className="mag-seat-strip" aria-hidden="true">{scenario.rows.map(p=><i key={p.id} style={{flex:p.seats,background:p.color,opacity:selected.includes(p.id)?1:.2}}/>)}</div><div className="mag-coalition-buttons">{scenario.rows.map(p=><button key={p.id} aria-pressed={selected.includes(p.id)} onClick={()=>setSelected(selected.includes(p.id)?selected.filter(id=>id!==p.id):[...selected,p.id])}>{selected.includes(p.id)?<Check size={17}/>:<Plus size={17}/>}<span>{p.short}</span><b>{p.seats}</b></button>)}</div><button className="mag-text-link" onClick={()=>onNavigate("method")}>Metodika agregátora <ArrowUpRight size={15}/></button></div></section>
    <section className="mag-explore"><h2>Ďalšie<br/>pohľady</h2><div>{[{title:"Prieskumy v čase",text:"Od jedného čísla k dlhšiemu príbehu. Porovnajte merania a ich zdroje.",view:"polls"},{title:"Politické strany",text:"Podpora, jednotlivé merania a dokumenty na jednom mieste.",view:"parties"},{title:"Čo majú v programe",text:"Aktuálne návrhy, porovnávač tém a jasne oddelený archív 2023.",view:"programmes"}].map(x=><button key={x.view} onClick={()=>onNavigate(x.view)}><span><b>{x.title}</b><span>{x.text}</span></span><ArrowUpRight size={26}/></button>)}</div></section>
  </div>;
}

export function ElectionLab({poll,onMethod}:{poll:Poll;onMethod:()=>void}) {
  const [values,setValues]=useState<Record<string,number>>({...poll.values});
  const [selected,setSelected]=useState<string[]>([]);
  const edited=parties.some(p=>values[p.id]!==poll.values[p.id]);
  const total=Math.round(Object.values(values).reduce((a,b)=>a+b,0)*10)/10;
  const valid=total<=100 && Object.values(values).some(v=>v>=5);
  const scenario=scenarioFromPoll({...poll,values});
  const selectedSeats=valid?scenario.rows.filter(p=>selected.includes(p.id)).reduce((a,p)=>a+p.seats,0):0;
  const setValue=(id:string,n:number)=>{if(Number.isFinite(n))setValues({...values,[id]:Math.max(0,Math.min(100,Math.round(n*10)/10))});};
  return <section className="election-lab"><header className="lab-intro"><div><h1>Vlastný model<br/><span>parlamentu</span></h1><p>Posuňte podporu strán. Poskladajte vlastnú väčšinu. Sledujte, ako aj malá zmena pri hranici 5 % mení parlament.</p><span className="lab-baseline">Východisko: Model Mandát · vážený priemer {aggregatePolls.length} agentúr · {date(poll.end)}</span><button className="mag-text-link" onClick={onMethod}>Ako vznikol východiskový model <ArrowUpRight size={16}/></button></div><SectionArt name="volby"/></header>
    <div className="lab-workspace"><div className="lab-sticky" role="status" aria-live="polite">{valid?<><span className="lab-sticky-seats">{scenario.rows.slice(0,4).map(p=><b key={p.id} style={{"--party-color":p.color} as CSSProperties}>{p.short} {p.seats}</b>)}{scenario.rows.length>4&&<small>+{scenario.rows.length-4}</small>}</span><span className="lab-sticky-majority">{selected.length?`Výber ${selectedSeats} / 76`:"Väčšina 76"}</span></>:<span className="lab-sticky-error">{total>100?"Súčet nad 100 %":"Žiadna strana nad 5 %"}</span>}</div><div className="lab-controls"><div className="lab-controls-head"><h2>Vlastné percentá</h2><button className="mag-text-link" onClick={()=>{setValues({...poll.values});setSelected([]);}}><RotateCcw size={16}/>Obnoviť meranie</button></div><p>Chýbajúce hodnoty sú prázdne. Ich zadaním vytvárate vlastný predpoklad.</p><div className={`lab-total ${total>100?"invalid":""}`} role="status">Zadaná podpora <b>{fmt(total)} % / 100 %</b></div>{parties.map(p=><div className="lab-input-row" key={p.id}><label htmlFor={`share-${p.id}`}><i style={{background:p.color}}/>{p.short}<small>{poll.values[p.id]===undefined?"V meraní nemáme údaj":`Meranie: ${fmt(poll.values[p.id])} %`}</small></label><input aria-label={`Posuvník podpory ${p.short}`} type="range" min="0" max="100" step="0.1" value={values[p.id]??0} onChange={e=>setValue(p.id,e.target.valueAsNumber)}/><div><input id={`share-${p.id}`} type="number" min="0" max="100" step="0.1" inputMode="decimal" placeholder="—" value={values[p.id]??""} onChange={e=>{if(e.target.value===""){const next={...values};delete next[p.id];setValues(next);}else setValue(p.id,e.target.valueAsNumber);}}/><span>%</span></div></div>)}</div>
    <div className="lab-result"><div className="lab-result-state">{edited?"Váš upravený scenár":"Scenár z východiskového merania"}</div>{valid?<><Hemicycle label="Váš parlament" seats={scenario.rows} caption={<p>Orientačný prepočet, nie predpoveď. Každý subjekt považujeme za samostatnú stranu s hranicou 5 %. {fmt(Math.max(0,100-total))} % nerozdelenej podpory do výpočtu nevstupuje. Bez zastúpenia by ostalo {fmt(wastedVotes(scenario).wastedShare)} % hlasov; jedno kreslo ≈ {(wastedVotes(scenario).votesPerSeat??0).toLocaleString("sk-SK")} hlasov pri účasti ako v roku 2023.</p>}/><div className="lab-majority" role="status"><strong>{selectedSeats}</strong><span>kresiel vo vašom výbere<br/>{selectedSeats>=76?"Výber dosiahol aspoň 76 kresiel":`Do 76 kresiel chýba ${76-selectedSeats}`}</span></div><div className="lab-partner-list" role="group" aria-label="Strany vo vlastnej koalícii">{scenario.rows.map(p=><button key={p.id} aria-pressed={selected.includes(p.id)} onClick={()=>setSelected(selected.includes(p.id)?selected.filter(id=>id!==p.id):[...selected,p.id])}>{selected.includes(p.id)?<Check size={16}/>:<Plus size={16}/>} {p.short}<b>{p.seats}</b></button>)}</div><div className="lab-excluded"><h3>Pod hranicou 5 %</h3><p>{scenario.belowThreshold.filter(p=>p.share>1).map(p=>`${p.short} ${fmt(p.share)} %`).join(" · ")||"Žiadny zadaný subjekt nad 1 %."}</p></div></>:<div className="lab-error" role="alert"><h2>{total>100?"Podpora presiahla 100 %":"Žiadna strana nedosiahla 5 %"}</h2><p>{total>100?`Znížte podporu aspoň o ${fmt(total-100)} percentuálneho bodu. Kreslá zobrazíme po oprave súčtu.`:"Zvýšte podporu aspoň jednej strany na 5 %. Tento zjednodušený scenár neuplatňuje mimoriadne znižovanie hranice podľa § 67."}</p></div>}<button className="mag-text-link" onClick={onMethod}>Pravidlá a obmedzenia výpočtu <ArrowRight size={18}/></button><p className="lab-neutral">Žiadnu kombináciu neodporúčame. Ide o váš matematický výber, nie dohodu politických strán. Vlastné úpravy sa po odchode z modelu obnovia z merania.</p></div></div>
  </section>;
}


