"use client";

import { useEffect, useRef, useState } from "react";
import { LocateFixed, Minus, Plus } from "lucide-react";
import { catalog, connected, distance, network, type ItemId, type Point, type RepublicState } from "@/lib/republic";
import { TownPiece } from "@/components/republic-art";

const at=(p:Point)=>({x:280+(p.x-p.y)*43,y:100+(p.x+p.y)*24});
const diamond=(p:Point,inset=0)=>{const c=at(p);return `${c.x},${c.y-24+inset} ${c.x+43-inset},${c.y} ${c.x},${c.y+24-inset} ${c.x-43+inset},${c.y}`;};
const cells=Array.from({length:36},(_,i)=>({x:i%6,y:Math.floor(i/6)}));
export default function RepublicMap({town,editing,selected,target,onCell,onObject}:{town:RepublicState;editing:boolean;selected:ItemId|null;target:Point|null;onCell:(p:Point)=>void;onObject:(id:string)=>void}) {
  const [zoom,setZoom]=useState(1),[focus,setFocus]=useState(14);
  const viewport=useRef<HTMLDivElement>(null),svg=useRef<SVGSVGElement>(null);
  const roads=network(town);
  function centre(){const el=viewport.current;if(el)el.scrollTo({left:(el.scrollWidth-el.clientWidth)/2,top:(el.scrollHeight-el.clientHeight)/2,behavior:"instant"});}
  useEffect(()=>{centre();},[zoom,editing]);
  function keyDown(event:React.KeyboardEvent<SVGGElement>,p:Point) {
    const offsets:Record<string,Point>={ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0},ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1}};
    if(offsets[event.key]) {
      event.preventDefault();const d=offsets[event.key],x=Math.max(0,Math.min(5,p.x+d.x)),y=Math.max(0,Math.min(5,p.y+d.y)),i=y*6+x;
      setFocus(i);svg.current?.querySelector<SVGGElement>(`[data-cell="${x}-${y}"]`)?.focus();
    }
    if(event.key==="Enter"||event.key===" "){event.preventDefault();pick(p);}
  }
  function pick(p:Point) {
    const object=town.placed.find(o=>o.x===p.x&&o.y===p.y);
    if(editing||!object)onCell(p);else onObject(object.instanceId);
  }
  return <div className="republic-map">
    <div className="republic-map-window" ref={viewport} tabIndex={0} aria-label="Mapa štvrte. Šípkami vyber políčko; Enter otvorí detail. Pri priblížení posúvaj mapu prstom.">
      <svg ref={svg} viewBox="0 0 560 405" style={{width:`${zoom*100}%`,minWidth:editing?640:undefined}} role="group" aria-label="Lipová štvrť, interaktívna mapa 6 krát 6">
        <defs><filter id="republic-shadow" x="-50%" y="-40%" width="200%" height="200%"><feDropShadow dx="3" dy="5" stdDeviation="3" floodColor="#344637" floodOpacity=".17"/></filter></defs>
        <path d="M22 218 279 73 539 218v15L280 379 22 234Z" fill="#aab68d"/>
        <path d="M22 218 279 73 539 218 280 363Z" fill="#c2cea6"/>
        <path d="m35 236 245 138 245-138" fill="none" stroke="#879d79" strokeWidth="2"/>
        {cells.map(p=>{
          const road=town.roads.some(r=>r.x===p.x&&r.y===p.y),joined=roads.some(r=>r.x===p.x&&r.y===p.y);
          const reach=target&&selected&&distance(p,target)<=2;
          return <g key={`${p.x}-${p.y}`} aria-hidden="true">
            <polygon points={diamond(p,1)} fill={road?joined?"#e9ddbf":"#bfb9a0":(p.x+p.y)%2?"#d3ddbb":"#dce4c7"} stroke="#c3cdaa" strokeWidth=".6"/>
            {road&&<path d={`m${at(p).x-13} ${at(p).y} 13-7 13 7-13 7Z`} stroke="#d1c6a9" strokeWidth=".6" fill="none"/>}
            {reach&&<polygon points={diamond(p,3)} fill="#3e8b78" opacity=".2"/>}
            {target&&distance(p,target)===0&&<polygon points={diamond(p,2)} fill="#eaf6b0" stroke="#245c48" strokeWidth="2"/>}
          </g>;
        })}
        <g pointerEvents="none" aria-hidden="true" filter="url(#republic-shadow)">
          {town.placed.slice().sort((a,b)=>(a.x+a.y)-(b.x+b.y)||a.x-b.x).map((o,i)=>{const c=at(o);return <g key={o.instanceId} transform={`translate(${c.x} ${c.y-2}) scale(.9)`}>
            <TownPiece id={o.id} branch={o.id==="station"?town.branch:null} finished={town.completed.includes("opening")} variant={i}/>
            {!o.fixed&&<g transform="translate(29 9)"><circle r="4.5" fill={connected(town,o)?"#315e4b":"#a86343"} stroke="#fff9df" strokeWidth="1.5"/>{!connected(town,o)&&<path d="M-2 0h4" stroke="#fff9df" strokeWidth="1.2"/>}</g>}
          </g>;})}
          {target&&selected&&!town.placed.some(p=>distance(p,target)===0)&&<g opacity=".65" transform={`translate(${at(target).x} ${at(target).y-2}) scale(.9)`}><TownPiece id={selected}/></g>}
        </g>
        <g className="republic-input-layer">
          {cells.map((p,i)=>{const o=town.placed.find(x=>distance(x,p)===0),road=town.roads.some(x=>distance(x,p)===0);
            return <g key={i} role="button" tabIndex={focus===i?0:-1} data-cell={`${p.x}-${p.y}`} aria-label={`${String.fromCharCode(65+p.x)}${p.y+1}: ${o?catalog[o.id].name:road?"cesta":"voľné miesto"}`} aria-pressed={target?distance(p,target)===0:undefined} onFocus={()=>setFocus(i)} onClick={()=>pick(p)} onKeyDown={e=>keyDown(e,p)}>
              <polygon points={diamond(p,1)} className="republic-hit"/>
              {editing&&<text x={at(p).x} y={at(p).y+4} className="republic-cell-mark">{o||road?"·":"+"}</text>}
            </g>;})}
        </g>
        <text x="36" y="387" className="republic-map-sign">LIPOVÁ ŠTVRŤ / MALÁ REPUBLIKA</text>
        <path d="m504 365 0 21m-6-14 6-7 6 7" stroke="#597258" strokeWidth="1.5" fill="none"/>
        <text x="504" y="398" textAnchor="middle" className="republic-map-sign">S</text>
      </svg>
    </div>
    <div className="republic-map-tools"><span>{editing?"Vyber políčko. Ťah ešte nie je potvrdený.":"Ťukni na políčko s budovou."}</span><div>
      <button type="button" aria-label="Oddialiť mapu" disabled={zoom<=1} onClick={()=>setZoom(z=>Math.max(1,z-.5))}><Minus size={16}/></button>
      <button type="button" aria-label="Priblížiť mapu" disabled={zoom>=2} onClick={()=>setZoom(z=>Math.min(2,z+.5))}><Plus size={16}/></button>
      <button type="button" aria-label="Centrovať mapu" onClick={centre}><LocateFixed size={17}/></button>
    </div></div>
  </div>;
}
