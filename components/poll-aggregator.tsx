"use client";

import {lazy,Suspense,useId,useMemo,useState,type CSSProperties} from "react";
import {ArrowRight,ArrowUpRight,Info,ChartNoAxesCombined,ListOrdered,RotateCcw} from "lucide-react";
import {aggregatePolls,aggregateSeries,currentAggregate,aggregateLastDate} from "@/lib/aggregate";
import {parties,fmt,date} from "@/lib/polls";

const ranked=parties.filter(p=>currentAggregate.values[p.id]?.value>1).sort((a,b)=>currentAggregate.values[b.id].value-currentAggregate.values[a.id].value);
const primary=ranked.filter(p=>currentAggregate.values[p.id].value>=5);
const belowThreshold=ranked.filter(p=>currentAggregate.values[p.id].value<5);
const fullDate=(value:string)=>new Date(`${value}T12:00:00Z`).toLocaleDateString("sk-SK",{day:"numeric",month:"long",year:"numeric"});
const timestamp=(value:string)=>Date.parse(`${value}T12:00:00Z`);
// Recharts sa načíta až pri prepnutí na Trend; predvolené Poradie ho nepotrebuje.
const TrendChart=lazy(()=>import("@/components/trend-chart"));

export default function PollAggregator({onMethod}:{onMethod:()=>void}) {
  const [focus,setFocus]=useState("ps");
  const [period,setPeriod]=useState(0);
  const [mode,setMode]=useState<"trend"|"ranking">("ranking");
  const [compare,setCompare]=useState(false);
  const [showBand,setShowBand]=useState(true);
  const [showMonths,setShowMonths]=useState(true);
  const [pinned,setPinned]=useState<string|null>(null);
  const [hovered,setHovered]=useState<number|null>(null);
  const uid=useId().replace(/:/g,"");
  const focused=parties.find(p=>p.id===focus)??parties[0];
  const points=useMemo(()=>{
    const cutoff=new Date(`${aggregateLastDate}T12:00:00Z`);
    if(period)cutoff.setUTCMonth(cutoff.getUTCMonth()-period);
    return aggregateSeries.filter(p=>!period||timestamp(p.date)>=cutoff.getTime());
  },[period]);
  const pinnedIndex=pinned?points.findIndex(p=>p.date===pinned):-1;
  const index=hovered!==null&&hovered<points.length?hovered:pinnedIndex>=0?pinnedIndex:points.length-1;
  const point=points[index];
  const current=point.values[focus];
  const start=points.find(p=>p.values[focus])?.values[focus];
  const change=current&&start?Math.round((current.value-start.value)*10)/10:null;
  const pointRanking=ranked.filter(p=>point.values[p.id]).sort((a,b)=>point.values[b.id].value-point.values[a.id].value);
  const chartParties=compare?ranked:ranked.filter(p=>p.id===focus);
  const data=useMemo(()=>points.map(p=>({date:p.date,time:timestamp(p.date),...Object.fromEntries(ranked.map(party=>[party.id,p.values[party.id]?.value])),range:p.values[focus]?[p.values[focus].lower,p.values[focus].upper]:undefined})),[points,focus]);
  const monthTicks=useMemo(()=>{
    const result:number[]=[];
    for(const p of points)if(!result.length||new Date(timestamp(p.date)).getUTCMonth()!==new Date(result.at(-1)!).getUTCMonth())result.push(timestamp(p.date));
    return result;
  },[points]);
  const monthlyPoints=useMemo(()=>Array.from(new Map(points.map(p=>[p.date.slice(0,7),p])).values()),[points]);
  const maxValue=Math.max(5,...points.flatMap(p=>chartParties.map(party=>showBand&&party.id===focus?p.values[party.id]?.upper??0:p.values[party.id]?.value??0)));
  const yMax=Math.ceil(maxValue/5)*5;
  const focusValues=points.flatMap(p=>p.values[focus]?[showBand?p.values[focus].lower:p.values[focus].value]:[]);
  const yMin=compare||!focusValues.length?0:Math.max(0,Math.min(yMax-5,Math.floor(Math.min(...focusValues)/5)*5));
  const moveToPoint=(state:{activeTooltipIndex?:number|string|null})=>{
    if(state.activeTooltipIndex===null||state.activeTooltipIndex===undefined)return;
    const next=Number(state.activeTooltipIndex);
    if(Number.isInteger(next)&&next>=0&&next<points.length)setHovered(next);
  };
  return <section className="aggregate poll-studio" aria-labelledby="aggregate-title" style={{"--series-color":focused.color} as CSSProperties}>
    <div className="aggregate-head"><div><h2 id="aggregate-title">Ako sa mení podpora strán.</h2><p>Vážený priemer meraní AKO, FOCUS, INFOSTAT, IPSOS a NMS. Vyberte stranu a preskúmajte jej vývoj.</p></div><button className="studio-method" onClick={onMethod}>Model Mandát <span>{date(aggregateLastDate)}</span><ArrowUpRight size={15}/></button></div>
    <div className="studio-surface">
      <div className="studio-toolbar"><div className="studio-segment" role="group" aria-label="Zobrazenie agregátora"><button aria-pressed={mode==="ranking"} onClick={()=>{setMode("ranking");setHovered(null);}}><ListOrdered size={16}/> Poradie</button><button aria-pressed={mode==="trend"} onClick={()=>{setMode("trend");setHovered(null);}}><ChartNoAxesCombined size={16}/> Trend</button></div>{mode==="trend"&&<div className="studio-period" role="group" aria-label="Obdobie trendu">{[{value:3,label:"3 mesiace"},{value:6,label:"6 mesiacov"},{value:0,label:"Celé obdobie"}].map(p=><button key={p.value} aria-pressed={period===p.value} onClick={()=>{setPeriod(p.value);setPinned(null);setHovered(null);}}>{p.label}</button>)}</div>}</div>
      <div className="studio-workspace">
        <div className="studio-main">
          <div className="studio-chart-heading"><div>{mode==="trend"?<label className="studio-inline-select"><span className="sr-only">Vybraná strana</span><select value={focus} onChange={e=>setFocus(e.target.value)}>{ranked.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>:<h3>Podpora strán v jednom pohľade</h3>}<span className="studio-date">{fullDate(point.date)}{mode==="trend"&&!compare&&` · Detail, os ${yMin} – ${yMax} %`}</span></div>{mode==="trend"&&<div className="studio-layer-controls"><label><input type="checkbox" checked={compare} onChange={e=>setCompare(e.target.checked)}/> Ostatné strany</label><label><input type="checkbox" checked={showBand} onChange={e=>setShowBand(e.target.checked)}/> Pásmo neistoty</label><label><input type="checkbox" checked={showMonths} onChange={e=>setShowMonths(e.target.checked)}/> Mesačné hodnoty</label></div>}</div>
          {mode==="trend"?<div className="studio-plot" role="img" aria-label={`Trend: ${focused.name}. K ${date(point.date)} ${current?`${fmt(current.value)} percenta, orientačné modelové pásmo ${fmt(current.lower)} až ${fmt(current.upper)} percenta`:"bez údaja"}. Presné hodnoty sú aj v paneli strán a dostupné časovým posuvníkom.`}>
            <Suspense fallback={<div className="studio-plot-loading" aria-hidden="true"/>}><TrendChart uid={uid} data={data} ranked={ranked} chartParties={chartParties} focus={focus} focused={focused} points={points} point={point} current={current} monthTicks={monthTicks} monthlyPoints={monthlyPoints} yMin={yMin} yMax={yMax} showBand={showBand} showMonths={showMonths} onMove={moveToPoint} onLeave={()=>setHovered(null)} onPick={d=>{setPinned(d);setHovered(null);}}/></Suspense>
          </div>:<div className="studio-ranking" aria-label={`Poradie strán k ${date(point.date)}`}>{pointRanking.map((p,i)=>{const value=point.values[p.id].value;const maximum=Math.max(5,...pointRanking.map(party=>point.values[party.id].value));return <div key={p.id} className={value<5?"studio-ranking-small":""}>{value<5&&i>0&&point.values[pointRanking[i-1].id].value>=5&&<div className="studio-ranking-threshold">Pod hranicou 5 % pre samostatnú stranu</div>}<button aria-pressed={p.id===focus} onClick={()=>setFocus(p.id)}><span>{p.short}</span><div className="studio-rank-track"><i style={{width:`${value/maximum*100}%`,background:p.color}}/><em style={{left:`${5/maximum*100}%`}}/></div><b>{fmt(value)} <small>%</small></b></button></div>;})}</div>}
          {mode==="trend"&&showMonths&&<div className="studio-months" aria-label="Mesačné body vybranej strany">{monthlyPoints.map(p=><button key={p.date} aria-pressed={point.date===p.date} onClick={()=>{setPinned(p.date);setHovered(null);}} aria-label={`${fullDate(p.date)}: ${p.values[focus]?fmt(p.values[focus].value)+" percent":"bez údaja"}`}><span>{new Date(`${p.date}T12:00:00Z`).toLocaleDateString("sk-SK",{month:"short"})}</span><b>{p.values[focus]?fmt(p.values[focus].value)+" %":"—"}</b></button>)}</div>}{mode==="trend"&&showMonths&&<p className="studio-months-note">Posledný bod v každom zobrazenom mesiaci, nie mesačný priemer. Presný dátum zobrazíte kliknutím.</p>}<div className="studio-time"><div><label htmlFor={`${uid}-time`}>Preskúmať dátum</label><output htmlFor={`${uid}-time`}>{date(point.date)}</output><button onClick={()=>{setPinned(null);setHovered(null);}} disabled={pinned===null&&hovered===null} aria-label="Vrátiť sa k najnovším údajom"><RotateCcw size={13}/> Najnovšie</button></div><input id={`${uid}-time`} type="range" min="0" max={points.length-1} step="1" value={index} aria-valuetext={fullDate(point.date)} onChange={e=>{setPinned(points[e.target.valueAsNumber].date);setHovered(null);}}/><div className="studio-time-ends"><span>{date(points[0].date)}</span><span>{date(points.at(-1)!.date)}</span></div></div>
        </div>
        <aside className="studio-sidebar"><div className="studio-readout"><span >{focused.short}</span><strong>{current?fmt(current.value):"—"}<small> %</small></strong><p>{change===null?"Bez porovnateľných údajov":`${change>0?"+":""}${fmt(change)} p. b. od začiatku obdobia`}</p><div className="studio-interval"><span>Modelové pásmo</span><b>{current?`${fmt(current.lower)} – ${fmt(current.upper)} %`:"Bez údaja"}</b></div></div><div className="studio-party-heading">Porovnať s ostatnými <span>%</span></div><div className="studio-party-list">{primary.map(p=><button key={p.id} aria-pressed={focus===p.id} onClick={()=>setFocus(p.id)}><i style={{background:p.color}}/><span>{p.short}</span><b>{point.values[p.id]?fmt(point.values[p.id].value):"—"}</b></button>)}</div><p className="studio-sidebar-note">Hodnoty k {date(point.date)}. Ďalšie strany nájdete vo výbere a v pohľade Poradie.</p></aside>
      </div>
      <div className="studio-small"><span>Aktuálne pod 5 %</span>{belowThreshold.map(p=><button key={p.id} aria-pressed={focus===p.id} onClick={()=>{setFocus(p.id);setPinned(null);setHovered(null);}}><i style={{background:p.color}}/>{p.short}<b>{fmt(currentAggregate.values[p.id].value)} %</b></button>)}</div>
    </div>
    <div className="aggregate-notes"><div><Info size={18}/><p><strong>Agregát nie je prieskum ani predpoveď.</strong> Pásmo je orientačný modelový odhad neistoty. Týždenné body spájame plynulou čiarou; medzi nimi nejde o nové merania. Chýbajúca hodnota nie je nula.</p></div><button className="mag-text-link" onClick={onMethod}>Výpočet a obmedzenia <ArrowRight size={17}/></button></div>
    <div className="aggregate-sources" aria-label="Vstupné merania najnovšieho agregátu">{aggregatePolls.map(p=><a key={p.id} href={p.source} target="_blank" rel="noopener noreferrer"><span>{p.agency}</span><small>zber do {date(p.end)}</small><ArrowUpRight size={14}/><span className="sr-only"> (nová karta)</span></a>)}</div>
  </section>;
}



