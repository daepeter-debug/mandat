"use client";
import Image from 'next/image';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import type { CSSProperties } from 'react';
import { parties, fmt, type Poll } from '@/lib/polls';
import logos from '@/lib/party-logos.json';
import '@/app/model-ballot.css';

const partyLogos = logos as Record<string,{src:string}>;
export default function ModelBallot({poll,values,total,seats,valid,onChange,onReset}:{poll:Poll;values:Record<string,number>;total:number;seats:ReadonlyMap<string,number>;valid:boolean;onChange:(id:string,value:number|null)=>void;onReset:()=>void}) {
  return <div className="model-ballot">
    <header className="ballot-heading"><h2>Váš modelový lístok</h2><button type="button" onClick={onReset}><RotateCcw size={15} aria-hidden="true"/>Obnoviť</button></header>
    <p className="ballot-explanation">Upravte percentá pri stranách. Parlament sa prepočíta hneď. Toto je simulácia, nie skutočný hlasovací lístok.</p>
    <div className="ballot-budget" data-invalid={total>100 || undefined}><div><span>Zadaná podpora</span><output aria-live="polite">{fmt(total)} <small>/ 100 %</small></output></div><div className="ballot-budget-track" aria-hidden="true"><i style={{transform:`scaleX(${Math.min(total,100)/100})`}}/></div><p>{total>100?`Znížte súčet o ${fmt(total-100)} p. b.`:`${fmt(Math.max(0,100-total))} % nerozdelenej podpory`}</p></div>
    <div className="ballot-columns" aria-hidden="true"><span>Politický subjekt</span><span>Podpora</span></div>
    <div className="ballot-rows">{parties.map(p=>{
      const value=values[p.id], baseline=poll.values[p.id], delta=value!==undefined&&baseline!==undefined?Math.round((value-baseline)*10)/10:null;
      return <div className="ballot-row" key={p.id} style={{'--ballot-party':p.color} as CSSProperties} data-edited={value!==baseline || undefined}>
        <span className="ballot-logo">{partyLogos[p.id]?<Image src={partyLogos[p.id].src} alt="" width={42} height={36} unoptimized loading="lazy"/>:<i style={{background:p.color}}/>}</span>
        <label htmlFor={`share-${p.id}`} className="ballot-name"><b>{p.short}</b><small>{baseline===undefined?'Vo východisku chýba údaj':`Model Mandát ${fmt(baseline)} %`}</small></label>
        <div className="ballot-number"><input id={`share-${p.id}`} aria-label={`Podpora ${p.name}`} type="number" min="0" max="100" step="0.1" inputMode="decimal" placeholder="—" value={value??''} onChange={e=>onChange(p.id,e.target.value===''?null:e.target.valueAsNumber)}/><span>%</span></div>
        <div className="ballot-adjust"><button type="button" aria-label={`Znížiť podporu ${p.short} o 0,5 bodu`} disabled={value===undefined||value<=0} onClick={()=>onChange(p.id,(value??0)-.5)}><Minus size={15} aria-hidden="true"/></button><input type="range" aria-label={`Posuvník podpory ${p.short}`} min="0" max="100" step="0.1" value={value??0} onChange={e=>onChange(p.id,e.target.valueAsNumber)}/><button type="button" aria-label={`Zvýšiť podporu ${p.short} o 0,5 bodu`} disabled={value!==undefined&&value>=100} onClick={()=>onChange(p.id,(value??0)+.5)}><Plus size={15} aria-hidden="true"/></button></div>
        <div className="ballot-outcome"><span>{value===undefined?'Nezadané':!valid?'Prepočet pozastavený':value<5?'Pod hranicou 5 %':`${seats.get(p.id)??0} kresiel`}</span>{delta!==null&&delta!==0&&<span>{delta>0?'+':'−'}{fmt(Math.abs(delta))} p. b.</span>}</div>
      </div>;
    })}</div>
    <p className="ballot-footnote">Poradie je pracovný zoznam Mandátu. Chýbajúce percento nie je nula; jeho zadaním vytvárate vlastný predpoklad.</p>
  </div>;
}

