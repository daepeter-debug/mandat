"use client";

import { useEffect, useRef, useState } from "react";
import { LocateFixed, Minus, Plus } from "lucide-react";
import { catalog, connected, distance, network, type ItemId, type Point, type RepublicState } from "@/lib/republic";
import { Bush, Lamp, TownPiece, Tree, iso, pts, seg, type V } from "@/components/republic-art";

const at=(p:Point)=>({x:280+(p.x-p.y)*43,y:100+(p.x+p.y)*24});
const diamond=(p:Point,inset=0)=>{const c=at(p);return `${c.x},${c.y-24+inset} ${c.x+43-inset},${c.y} ${c.x},${c.y+24-inset} ${c.x-43+inset},${c.y}`;};
const cells=Array.from({length:36},(_,i)=>({x:i%6,y:Math.floor(i/6)}));
// Doska diorámy: okraj M okolo mriežky 6 × 6 a hrúbka T (zemina + drevo).
const M=.28, A=-.5-M, B=5.5+M, T=16;
const hash=(s:string)=>{let h=7;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return h;};
const meadow=["#b3c98a","#adc585","#b7cb8e","#a9c181"];
const tuftSpots=[[-.28,-.05],[.12,.25],[.02,-.3],[.3,.05],[-.1,.3],[-.22,-.3]] as const;
const quad=(x0:number,y0:number,x1:number,y1:number,z=0)=>pts([x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z]);
const setts=(x:number,y:number)=>[-.3,-.1,.1,.3].map(t=>seg([x+t,y-.5],[x+t,y+.5])+seg([x-.5,y+t],[x+.5,y+t])).join("");
// Stromy lesa za štvrťou (zadné okraje dosky), zoradené odzadu dopredu.
const backTrees=[
  ...[-.55,.35,1.2,2.85,3.7,4.55,5.35].map((y,i)=>({x:-.5-M*.55,y,kind:i%3===0?"pine":"round",s:.72+(i%3)*.1,tone:i%3,gap:y>1.4&&y<2.6})),
  ...[.3,1.15,2.05,3,3.9,4.75,5.45].map((x,i)=>({x,y:-.5-M*.55,kind:i%3===1?"pine":"round",s:.7+((i+1)%3)*.1,tone:(i+1)%3,gap:false})),
  {x:A+.08,y:A+.08,kind:"round",s:1,tone:2,gap:false},
].sort((a,b)=>(a.x+a.y)-(b.x+b.y));

export default function RepublicMap({town,editing,selected,target,onCell,onObject}:{town:RepublicState;editing:boolean;selected:ItemId|null;target:Point|null;onCell:(p:Point)=>void;onObject:(id:string)=>void}) {
  const [zoom,setZoom]=useState(1),[focus,setFocus]=useState(14);
  const viewport=useRef<HTMLDivElement>(null),svg=useRef<SVGSVGElement>(null);
  const roads=network(town);
  const isRoad=(x:number,y:number)=>town.roads.some(r=>r.x===x&&r.y===y);
  const westRoad=isRoad(0,2), eastRoad=isRoad(5,2);
  const paved=(x:number,y:number)=>isRoad(x,y)||x===2&&y===2||x===-1&&y===2&&westRoad||x===6&&y===2&&eastRoad;
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
  // Tráva: drobné trsy a sem-tam kvet, deterministicky podľa políčka.
  let tufts="";const blooms:[number,number,string][]=[];
  for(const p of cells) {
    if(isRoad(p.x,p.y)||town.placed.some(o=>o.x===p.x&&o.y===p.y))continue;
    const h=hash(`${p.x}:${p.y}`);
    for(let k=0;k<3;k++){const [ox,oy]=tuftSpots[(h+k*2)%6],[sx,sy]=iso(p.x+ox,p.y+oy);tufts+=`M${sx-2} ${sy}l1-2.8 1 2.8 1-2.2`;}
    if(h%3===0){const [sx,sy]=iso(p.x+.18,p.y-.12);blooms.push([sx,sy,"#fbf6e8"],[sx+3,sy+1.4,h%2?"#f0c64a":"#e79ab0"]);}
  }
  const [lx,ly]=iso(A,B,-T),[bx,by]=iso(B,B,-T),[rx,ry]=iso(B,A,-T);
  const [nx,ny]=iso(A+.62,B,-13.1),[mx,my]=iso(B,B-.62,-13.1);
  let sleepers="";for(let y=A+.07;y<B-.05;y+=.085)sleepers+=seg([5.555,y],[B-.065,y]);
  let ripples="";for(let x=A+.3;x<5.3;x+=.62)ripples+=seg([x,5.64],[x+.16,5.64])+seg([x+.3,5.71],[x+.42,5.71]);
  const board=town.name.toLocaleUpperCase("sk");
  return <div className="republic-map">
    <div className="republic-map-window" ref={viewport} tabIndex={0} aria-label="Mapa štvrte. Šípkami vyber políčko; Enter otvorí detail. Pri priblížení posúvaj mapu prstom.">
      <svg ref={svg} viewBox="-6 16 572 386" style={{width:`${zoom*100}%`,minWidth:editing?640:undefined}} role="group" aria-label={`${town.name}, interaktívna mapa 6 krát 6`}>
        <defs><linearGradient id="republic-sun" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff6d6" stopOpacity=".34"/><stop offset=".5" stopColor="#fff6d6" stopOpacity="0"/><stop offset="1" stopColor="#23391f" stopOpacity=".1"/></linearGradient></defs>
        <g aria-hidden="true">
          <g transform="translate(280 100)">
            <polygon points={`${lx},${ly} ${bx},${by} ${rx},${ry} ${rx+10},${ry+7} ${bx+7},${by+11} ${lx+13},${ly+7}`} fill="#3d4a33" opacity=".13"/>
            {/* bočné steny dosky: zemina a drevo */}
            <polygon points={pts([A,B,0],[B,B,0],[B,B,-6],[A,B,-6])} fill="#7b5a3c"/>
            <polygon points={pts([B,A,0],[B,B,0],[B,B,-6],[B,A,-6])} fill="#654a31"/>
            <polygon points={pts([A,B,-6],[B,B,-6],[B,B,-T],[A,B,-T])} fill="#b98b57"/>
            <polygon points={pts([B,A,-6],[B,B,-6],[B,B,-T],[B,A,-T])} fill="#99703f"/>
            <path d={seg([A+.4,B,-9.2],[B-.9,B,-9.2])+seg([A+1.6,B,-13.6],[B-.3,B,-13.6])+seg([B,A+.5,-10.5],[B,B-1.2,-10.5])+seg([B,A+1.8,-14],[B,B-.4,-14])} stroke="#a3784a" strokeWidth=".7" opacity=".55" fill="none"/>
            <path d={seg([A,B,-6],[B,B,-6],[B,A,-6])} stroke="#d6aa72" strokeWidth=".8" fill="none"/>
            <path d={[.9,2.3,3.7,5.1].map(x=>seg([x,B,-6.4],[x,B,-T+.4])).join("")+[.2,1.6,3,4.4].map(y=>seg([B,y,-6.4],[B,y,-T+.4])).join("")} stroke="#8e6538" strokeWidth=".6" opacity=".6" fill="none"/>
            <text transform={`matrix(.874 .488 0 1 ${nx} ${ny+.7})`} className="republic-map-sign is-shade">{board}</text>
            <text transform={`matrix(.874 .488 0 1 ${nx} ${ny})`} className="republic-map-sign">{board}</text>
            <text transform={`matrix(.874 -.488 0 1 ${mx} ${my+.7})`} className="republic-map-sign is-shade">MALÁ REPUBLIKA</text>
            <text transform={`matrix(.874 -.488 0 1 ${mx} ${my})`} className="republic-map-sign">MALÁ REPUBLIKA</text>
            {/* vrch dosky */}
            <polygon points={quad(A,A,B,B)} fill="#a2ba78"/>
            <path d={seg([A,B],[B,B],[B,A])} stroke="#cfe0a6" strokeWidth="1.2" fill="none"/>
            {/* potok vpredu vľavo */}
            <polygon points={quad(A+.04,5.56,5.5,B-.04)} fill="#86b8c5"/>
            <path d={seg([A+.04,5.56],[5.5,5.56])} stroke="#6d98a3" strokeWidth="1.3" fill="none"/>
            <path d={seg([A+.04,B-.04],[5.5,B-.04])} stroke="#c3d9c2" strokeWidth="1.1" fill="none"/>
            <path d={ripples} stroke="#c9e5ea" strokeWidth=".9" strokeLinecap="round" fill="none"/>
            {[[.6,5.6],[2.2,5.72],[3.9,5.6],[4.8,5.73]].map(([x,y])=>{const [sx,sy]=iso(x,y);return <ellipse key={x} cx={sx} cy={sy} rx="3.2" ry="1.6" fill="#b9b19c"/>;})}
            <path d={[-.3,1.4,3.1,4.4].map(x=>{const [sx,sy]=iso(x,5.58);return `M${sx} ${sy}v-6M${sx+2} ${sy+1}v-4.5M${sx-2} ${sy+.6}v-4`;}).join("")} stroke="#6e8f4d" strokeWidth=".9" strokeLinecap="round"/>
            {/* železnica vpredu vpravo */}
            <polygon points={quad(5.5,A+.03,B-.02,B-.03)} fill="#c8bfa9"/>
            <path d={sleepers} stroke="#7f6147" strokeWidth="2.3" fill="none"/>
            {eastRoad&&<><polygon points={quad(5.5,1.5,B-.02,2.5)} fill="#dfd1aa"/><path d={[1.7,1.9,2.1,2.3].map(y=>seg([5.5,y],[B-.02,y])).join("")} stroke="#cdbb91" strokeWidth=".5"/></>}
            <path d={seg([5.6,A+.03],[5.6,B-.03])+seg([5.705,A+.03],[5.705,B-.03])} stroke="#80878b" strokeWidth="1.4" fill="none"/>
            <path d={seg([5.6,A+.03,.7],[5.6,B-.03,.7])+seg([5.705,A+.03,.7],[5.705,B-.03,.7])} stroke="#e1e4e3" strokeWidth=".5" fill="none"/>
            {/* cesta von zo štvrte vzadu vľavo */}
            {westRoad&&<><polygon points={quad(A,1.5,-.5,2.5)} fill="#e3d4ad"/><path d={seg([A,1.8],[-.5,1.8])+seg([A,2.2],[-.5,2.2])+seg([-.66,1.5],[-.66,2.5])} stroke="#cdbb91" strokeWidth=".55"/><path d={seg([A,1.5],[-.5,1.5])+seg([A,2.5],[-.5,2.5])} stroke="#f1e8cf" strokeWidth="1.3"/></>}
          </g>
        </g>
        {cells.map(p=>{
          const road=isRoad(p.x,p.y),joined=roads.some(r=>r.x===p.x&&r.y===p.y);
          const reach=target&&selected&&distance(p,target)<=2;
          const sides:{d:readonly [number,number];e:[V,V]}[]=[{d:[-1,0],e:[[p.x-.5,p.y-.5],[p.x-.5,p.y+.5]]},{d:[1,0],e:[[p.x+.5,p.y-.5],[p.x+.5,p.y+.5]]},{d:[0,-1],e:[[p.x-.5,p.y-.5],[p.x+.5,p.y-.5]]},{d:[0,1],e:[[p.x-.5,p.y+.5],[p.x+.5,p.y+.5]]}];
          const edges=road?sides.filter(side=>!paved(p.x+side.d[0],p.y+side.d[1])).map(side=>side.e):[];
          return <g key={`${p.x}-${p.y}`} aria-hidden="true">
            <polygon points={diamond(p)} fill={road?joined?"#e3d4ad":"#cbc5b0":meadow[(hash(`${p.x}${p.y}`)+(p.x+p.y)%2*2)%4]} stroke={road?"none":"#9db676"} strokeWidth=".6"/>
            {road&&<g transform="translate(280 100)"><path d={setts(p.x,p.y)} stroke={joined?"#cdbb91":"#b3ac97"} strokeWidth=".55" fill="none"/>{edges.length>0&&<path d={edges.map(e=>seg(...e)).join("")} stroke={joined?"#f3eacf":"#e2ddcd"} strokeWidth="1.4" fill="none"/>}</g>}
            {reach&&<polygon points={diamond(p,3)} fill="#3e8b78" opacity=".2"/>}
            {target&&distance(p,target)===0&&<polygon points={diamond(p,2)} fill="#eaf6b0" stroke="#245c48" strokeWidth="2"/>}
          </g>;
        })}
        <g aria-hidden="true" transform="translate(280 100)">
          <polygon points={quad(A,A,B,B)} fill="url(#republic-sun)"/>
          <path d={tufts} stroke="#8eaa66" strokeWidth=".8" fill="none" strokeLinejoin="round"/>
          {blooms.map(([x,y,c],i)=><circle key={i} cx={x} cy={y} r="1.1" fill={c}/>)}
          {backTrees.filter(t=>!(t.gap&&westRoad)).map((t,i)=>t.kind==="pine"?<Tree key={i} x={t.x} y={t.y} s={t.s} kind="pine"/>:<Tree key={i} x={t.x} y={t.y} s={t.s} tone={t.tone}/>)}
          <Bush x={A+.12} y={3.3} s={.7} tone={1}/><Bush x={2.6} y={A+.12} s={.65} flowers="#fbf6e8"/>
        </g>
        <g pointerEvents="none" aria-hidden="true">
          {town.placed.slice().sort((a,b)=>(a.x+a.y)-(b.x+b.y)||a.x-b.x).map(o=>{const c=at(o);return <g key={o.instanceId} transform={`translate(${c.x} ${c.y})`}>
            <TownPiece id={o.id} branch={o.id==="station"?town.branch:null} finished={town.completed.includes("opening")} variant={hash(o.instanceId)}/>
            {!o.fixed&&catalog[o.id].kind==="building"&&<g transform="translate(30 10)"><circle r="5" fill={connected(town,o)?"#315e4b":"#a86343"} stroke="#fff9df" strokeWidth="1.6"/>{!connected(town,o)&&<path d="M-2.2 0h4.4" stroke="#fff9df" strokeWidth="1.3"/>}</g>}
          </g>;})}
          {target&&selected&&!town.placed.some(p=>distance(p,target)===0)&&<g opacity=".65" transform={`translate(${at(target).x} ${at(target).y})`}><TownPiece id={selected} variant={0}/></g>}
        </g>
        <g aria-hidden="true" transform="translate(280 100)" pointerEvents="none">
          {eastRoad&&<g transform={`translate(${iso(B-.05,2.62)[0]} ${iso(B-.05,2.62)[1]})`}><path d="M0 0V-15" stroke="#4a4f4c" strokeWidth="1.1"/><path d="M-4-17.5l8-4.5M-4-22l8 4.5" stroke="#fff" strokeWidth="2.4"/><path d="M-4-17.5l8-4.5M-4-22l8 4.5" stroke="#c8443a" strokeWidth="2.4" strokeDasharray="2.2 2"/></g>}
          <g transform={`translate(${iso(B-.05,A+.2)[0]} ${iso(B-.05,A+.2)[1]})`}><path d="M0 0V-17" stroke="#4a4f4c" strokeWidth="1.1"/><rect x="-2" y="-22" width="4" height="7" rx="1.2" fill="#39403d"/><circle cy="-20" r="1.1" fill="#e35b4c"/><circle cy="-17" r="1.1" fill="#7fc37d"/></g>
          <polygon points={pts([5.57,B-.12,0],[5.74,B-.12,0],[5.74,B-.12,4.5],[5.57,B-.12,4.5])} fill="#c8443a"/><path d={seg([5.6,B-.12,2.2],[5.71,B-.12,2.2])} stroke="#fff" strokeWidth="1.3" strokeDasharray="1.8 1.6"/>
          <Lamp x={-.5-M*.4} y={1.42}/>
        </g>
        <g className="republic-input-layer">
          {cells.map((p,i)=>{const o=town.placed.find(x=>distance(x,p)===0),road=town.roads.some(x=>distance(x,p)===0);
            return <g key={i} role="button" tabIndex={focus===i?0:-1} data-cell={`${p.x}-${p.y}`} aria-label={`${String.fromCharCode(65+p.x)}${p.y+1}: ${o?catalog[o.id].name:road?"cesta":"voľné miesto"}`} aria-pressed={target?distance(p,target)===0:undefined} onFocus={()=>setFocus(i)} onClick={()=>pick(p)} onKeyDown={e=>keyDown(e,p)}>
              <polygon points={diamond(p,1)} className="republic-hit"/>
              {editing&&<text x={at(p).x} y={at(p).y+4} className="republic-cell-mark">{o||road?"·":"+"}</text>}
            </g>;})}
        </g>
      </svg>
    </div>
    <div className="republic-map-tools"><span>{editing?"Vyber políčko. Ťah ešte nie je potvrdený.":"Ťukni na políčko s budovou."}</span><div>
      <button type="button" aria-label="Oddialiť mapu" disabled={zoom<=1} onClick={()=>setZoom(z=>Math.max(1,z-.5))}><Minus size={16}/></button>
      <button type="button" aria-label="Priblížiť mapu" disabled={zoom>=2} onClick={()=>setZoom(z=>Math.min(2,z+.5))}><Plus size={16}/></button>
      <button type="button" aria-label="Centrovať mapu" onClick={centre}><LocateFixed size={17}/></button>
    </div></div>
  </div>;
}
