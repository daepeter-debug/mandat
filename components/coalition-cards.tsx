"use client";
import { useId, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import Image from 'next/image';
import { Check, GripVertical, Plus } from 'lucide-react';
import logos from '@/lib/party-logos.json';
import { coalitionSelection } from '@/lib/discovery';
import '@/app/visual-discovery.css';
type Member={id:string;short:string;color:string;seats:number};
const partyLogos=logos as Record<string,{src:string}>;

/** The grip owns drag gestures; the rest of each card leaves vertical page scrolling intact. */
export default function CoalitionCards({parties,selected,onChange,disabled=false}:{parties:Member[];selected:string[];onChange:(ids:string[])=>void;disabled?:boolean}) {
  const uid=useId();
  const root=useRef<HTMLDivElement>(null);
  const dragging=useRef<string|null>(null);
  const [ghost,setGhost]=useState<{id:string;x:number;y:number}|null>(null);
  const [over,setOver]=useState<string|null>(null);
  const ids=parties.map(p=>p.id), members=parties.filter(p=>selected.includes(p.id));
  const seats=members.reduce((sum,p)=>sum+p.seats,0);
  const move=(id:string,into:boolean)=>{if(!disabled)onChange(coalitionSelection(selected,ids,id,into));};
  const zoneAt=(x:number,y:number)=>{const el=document.elementFromPoint(x,y)?.closest<HTMLElement>('[data-coalition-zone]');return el&&root.current?.contains(el)?el.dataset.coalitionZone??null:null;};
  const begin=(e:PointerEvent<HTMLButtonElement>,id:string)=>{if(disabled||e.button!==0)return;dragging.current=id;e.currentTarget.setPointerCapture(e.pointerId);setGhost({id,x:e.clientX,y:e.clientY});};
  const finish=(e:PointerEvent<HTMLButtonElement>)=>{if(dragging.current){const zone=zoneAt(e.clientX,e.clientY);if(zone)move(dragging.current,zone==='selected');}dragging.current=null;setGhost(null);setOver(null);};
  const moving=ghost?parties.find(p=>p.id===ghost.id):null;
  return <div className="coalition-cards" ref={root}>
    <p className="coalition-cards-help">Ťuknite na stranu alebo ju za úchyt presuňte do výberu. Farby kresiel a súčet sledujú váš výber.</p>
    {(['selected','available'] as const).map(zone=>{
      const chosen=zone==='selected', rows=parties.filter(p=>selected.includes(p.id)===chosen);
      return <section key={zone} className="coalition-card-zone" data-coalition-zone={zone} data-over={over===zone} aria-labelledby={`${uid}-${zone}`} onDragOver={e=>{if(disabled)return;e.preventDefault();setOver(zone);}} onDragLeave={()=>setOver(null)} onDrop={e=>{e.preventDefault();const id=e.dataTransfer.getData('text/plain');if(ids.includes(id))move(id,chosen);setOver(null);}}>
        <header><h3 id={`${uid}-${zone}`}>{chosen?'Váš výber':'Dostupné strany'}</h3>{chosen&&<output aria-live="polite">{seats} / 76 <span>{seats>=76?'väčšina':`chýba ${76-seats}`}</span></output>}</header>
        <div className="coalition-card-row">{rows.map(p=><div className="coalition-card" key={p.id} style={{'--member-color':p.color} as CSSProperties}>
          <button type="button" className="coalition-card-choice" disabled={disabled} aria-pressed={chosen} aria-label={`${chosen?'Odobrať':'Pridať'} ${p.short}, ${p.seats} kresiel`} onClick={()=>move(p.id,!chosen)}>
            <span className="coalition-card-logo">{partyLogos[p.id]?<Image src={partyLogos[p.id].src} alt="" width={32} height={28} unoptimized loading="lazy"/>:<i style={{background:p.color}}/>}</span><span><b>{p.short}</b><small>{p.seats} kresiel</small></span>{chosen?<Check size={15} aria-hidden="true"/>:<Plus size={15} aria-hidden="true"/>}
          </button>
          <button type="button" className="coalition-card-grip" disabled={disabled} draggable={!disabled} aria-label={`Presunúť ${p.short}; Enter ${chosen?'odoberie':'pridá'} stranu`} onClick={e=>{if(e.detail===0)move(p.id,!chosen);}} onDragStart={e=>{e.dataTransfer.setData('text/plain',p.id);e.dataTransfer.effectAllowed='move';}} onDragEnd={()=>setOver(null)} onPointerDown={e=>{if(e.pointerType!=='mouse')begin(e,p.id);}} onPointerMove={e=>{if(dragging.current){setGhost({id:dragging.current,x:e.clientX,y:e.clientY});setOver(zoneAt(e.clientX,e.clientY));}}} onPointerUp={finish} onPointerCancel={()=>{dragging.current=null;setGhost(null);setOver(null);}}><GripVertical size={17} aria-hidden="true"/></button>
        </div>)}</div>
        {!rows.length&&<p className="coalition-card-empty">{chosen?'Sem presuňte prvú stranu. Alebo ju vyberte tlačidlom nižšie.':'Všetky dostupné strany sú vo vašom výbere.'}</p>}
      </section>;
    })}
    {ghost&&moving&&<div className="coalition-drag-ghost" aria-hidden="true" style={{left:ghost.x,top:ghost.y}}>{partyLogos[moving.id]&&<Image src={partyLogos[moving.id].src} alt="" width={30} height={24} unoptimized/>}<b>{moving.short}</b><span>{moving.seats}</span></div>}
  </div>;
}
