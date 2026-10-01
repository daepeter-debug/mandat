"use client";

import { useEffect, useId, useRef, useState, type RefObject } from "react";
import { Grid2X2, LocateFixed, Minus, Plus } from "lucide-react";
import { catalog, connected, distance, network, type ItemId, type Point, type RepublicState } from "@/lib/republic";
import { TownPiece, seg, type V } from "@/components/republic-art";
import { LivingWalkers, LivingGatherings, NightWindows, SeasonalScene, RiverFlow, useLivingScene } from "@/components/republic-living";
import { CelebrationGuests, CelebrationLanterns, useCelebrationOpening } from "@/components/republic-celebration";
import { celebrationScene, CELEBRATION_SECONDS } from "@/lib/republic-celebration";

const at=(p:Point)=>({x:280+(p.x-p.y)*43,y:100+(p.x+p.y)*24});
const diamond=(p:Point,inset=0)=>{const c=at(p);return `${c.x},${c.y-24+inset} ${c.x+43-inset},${c.y} ${c.x},${c.y+24-inset} ${c.x-43+inset},${c.y}`;};
const cells=Array.from({length:36},(_,i)=>({x:i%6,y:Math.floor(i/6)}));
// Geometry stays independent of artwork and saved coordinates.
const hash=(s:string)=>{let h=7;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return h;};
const coords=(p:Point)=>`${String.fromCharCode(65+p.x)}${p.y+1}`;

export default function RepublicMap({town,editing,selected,target,suggested=[],onCell,onObject,captureRef,festivalReplay=0,festivalStill=false}:{town:RepublicState;editing:boolean;selected:ItemId|null;target:Point|null;suggested?:Point[];onCell:(p:Point)=>void;onObject:(id:string)=>void;captureRef?:RefObject<SVGSVGElement|null>;festivalReplay?:number;festivalStill?:boolean}) {
  const [zoom,setZoom]=useState(1),[focus,setFocus]=useState(14),[grid,setGrid]=useState(false);
  const [hover,setHover]=useState<Point|null>(null),[terrainFailed,setTerrainFailed]=useState(false);
  const [terrainReady,setTerrainReady]=useState(false);
  const [scenePreview,setScenePreview]=useState("");
  const uid=useId().replaceAll(":","");
  const showGrid=grid||editing;
  const viewport=useRef<HTMLDivElement>(null),svg=useRef<SVGSVGElement>(null);
  const {scene,active,visible}=useLivingScene(town,viewport,scenePreview);
  const celebration=celebrationScene(town);
  const openingSeconds=useCelebrationOpening(celebration,active,festivalReplay);
  const celebrationSeconds=festivalStill?CELEBRATION_SECONDS:openingSeconds;
  const roads=network(town);
  const isRoad=(x:number,y:number)=>town.roads.some(r=>r.x===x&&r.y===y);
  const paved=(x:number,y:number)=>isRoad(x,y)||x===2&&y===2;
  function centre(){const el=viewport.current;if(el)el.scrollTo({left:(el.scrollWidth-el.clientWidth)/2,top:(el.scrollHeight-el.clientHeight)/2,behavior:"instant"});}
  useEffect(()=>{centre();},[zoom,editing]);
  useEffect(()=>{
    const host=viewport.current;if(!host)return;
    const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setTerrainReady(true);observer.disconnect();}},{rootMargin:"200px"});
    observer.observe(host);return()=>observer.disconnect();
  },[]);
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
  const inspected=target??hover;
  const inspectedObject=inspected?town.placed.find(o=>distance(o,inspected)===0):null;
  const inspectedLabel=inspected?`${coords(inspected)} · ${inspectedObject?catalog[inspectedObject.id].name:isRoad(inspected.x,inspected.y)?"Cesta":"Voľný pozemok"}`:"6 × 6 pozemkov";
  const clock=scene?`${String(scene.time.hour).padStart(2,"0")}:${String(scene.time.minute).padStart(2,"0")}`:"";
  const periods={morning:"Ráno",afternoon:"Popoludnie",evening:"Večer",night:"Noc"};
  const timeLabel=(time:number)=>new Intl.DateTimeFormat("sk",{timeZone:"Europe/Bratislava",hour:"2-digit",minute:"2-digit"}).format(new Date(time));
  return <div className="republic-map republic-landscape" data-editing={editing} data-scene-period={scene?.time.period}>
    <div className="republic-landscape-heading"><strong>{town.name}</strong><span>{inspectedLabel}</span></div>
    <div className="republic-map-window" ref={viewport} tabIndex={0} aria-label="Mapa štvrte. Šípkami vyber políčko; Enter otvorí detail. Pri priblížení posúvaj mapu prstom.">
      <svg ref={el=>{svg.current=el;if(captureRef)captureRef.current=el;}} onPointerLeave={()=>setHover(null)} viewBox="-40 0 640 480" style={{width:`${zoom*100}%`,minWidth:editing?640:undefined}} role="group" aria-label={`${town.name}, interaktívna mapa 6 krát 6`}>
        <defs>
          <pattern id={`${uid}-paving`} width="8" height="6" patternUnits="userSpaceOnUse" patternTransform="matrix(1 .558 -1 .558 0 0)">
            <rect width="8" height="6" fill="#d9cdb6"/><path d="M0 0H8M0 3H8M0 0V3M4 3V6" stroke="#b7aa94" strokeWidth=".45"/><path d="M.6.7H7.5M.6 3.7H7.5" stroke="#f4e9d2" strokeWidth=".5" opacity=".8"/>
          </pattern>
        </defs>
        <g aria-hidden="true" pointerEvents="none">
          <rect x="-40" width="640" height="480" fill="#b5c58c"/>
          {terrainReady&&!terrainFailed&&<image href="/images/games/republic-terrain-v1.webp" x="-40" y="0" width="640" height="480" preserveAspectRatio="none" onError={()=>setTerrainFailed(true)}/>}
        </g>
        {terrainReady&&!terrainFailed&&visible&&<RiverFlow active={active}/>}
        {cells.map(p=>{
          const road=isRoad(p.x,p.y),joined=roads.some(r=>r.x===p.x&&r.y===p.y);
          const reach=target&&selected&&distance(p,target)<=2;
          const sides:{d:readonly [number,number];e:[V,V]}[]=[{d:[-1,0],e:[[p.x-.5,p.y-.5],[p.x-.5,p.y+.5]]},{d:[1,0],e:[[p.x+.5,p.y-.5],[p.x+.5,p.y+.5]]},{d:[0,-1],e:[[p.x-.5,p.y-.5],[p.x+.5,p.y-.5]]},{d:[0,1],e:[[p.x-.5,p.y+.5],[p.x+.5,p.y+.5]]}];
          const edges=road?sides.filter(side=>!paved(p.x+side.d[0],p.y+side.d[1])).map(side=>side.e):[];
          return <g key={`${p.x}-${p.y}`} aria-hidden="true">
            {road&&<polygon points={diamond(p)} fill={`url(#${uid}-paving)`}/>}
            {showGrid&&<polygon points={diamond(p)} className="republic-plot-grid"/>}
            {road&&<g transform="translate(280 100)">{edges.length>0&&<path d={edges.map(e=>seg(...e)).join("")} stroke={joined?"#f3eacf":"#e2ddcd"} strokeWidth="1.4" fill="none"/>}</g>}
            {reach&&<polygon points={diamond(p,3)} fill="#b2dcce" opacity=".32"/>}
            {suggested.some(s=>distance(s,p)===0)&&<polygon points={diamond(p,3)} className="republic-plot-suggested"/>}
            {target&&distance(p,target)===0&&<polygon points={diamond(p,2)} className="republic-plot-selected"/>}
          </g>;
        })}
        {scene&&visible&&<LivingWalkers scene={scene} active={active}/>}
        {celebration&&visible&&<CelebrationGuests scene={celebration} seconds={celebrationSeconds} active={active&&!festivalStill}/>}
        <g pointerEvents="none" aria-hidden="true">
          {town.placed.slice().sort((a,b)=>(a.x+a.y)-(b.x+b.y)||a.x-b.x).map(o=>{const c=at(o);return <g className="republic-piece" key={o.instanceId} transform={`translate(${c.x} ${c.y})`}>
            <TownPiece id={o.id} branch={o.id==="station"?town.branch:null} finished={town.completed.includes("opening")} variant={hash(o.instanceId)}/>
            {!o.fixed&&catalog[o.id].kind==="building"&&<g transform="translate(30 10)"><circle r="5" fill={connected(town,o)?"#315e4b":"#a86343"} stroke="#fff9df" strokeWidth="1.6"/>{!connected(town,o)&&<path d="M-2.2 0h4.4" stroke="#fff9df" strokeWidth="1.3"/>}</g>}
          </g>;})}
          {target&&selected&&!town.placed.some(p=>distance(p,target)===0)&&<g opacity=".65" transform={`translate(${at(target).x} ${at(target).y})`}><TownPiece id={selected} variant={0}/></g>}
        </g>
        {town.festival?.site&&<g aria-hidden="true" pointerEvents="none" className="festival-map-scene">
          {town.festival.preparations.map(p=><g key={p.kind} transform={`translate(${at(p).x} ${at(p).y}) scale(.62)`}><TownPiece id={p.kind==="shelter"?"pergola":p.kind==="quiet"?"bench":"flower-bed"}/></g>)}
          <g transform={`translate(${at(town.festival.site).x} ${at(town.festival.site).y})`}>
            <ellipse rx="35" ry="16" fill="#ecd69a" opacity=".75"/>
            <g transform="scale(.7)"><TownPiece id={town.festival.theme==="music"?"bandstand":town.festival.theme==="food"?"market":"book-kiosk"}/></g>
          </g>
        </g>}
        {scene&&<>
          <rect aria-hidden="true" pointerEvents="none" x="-40" y="0" width="640" height="480" fill="#172641" opacity={scene.time.night*.48}/>
          <NightWindows town={town} night={scene.time.night}/>
          {visible&&<LivingGatherings scene={scene} active={active}/>}
          {visible&&<SeasonalScene scene={scene} active={active}/>}
        </>}
        {celebration&&visible&&<CelebrationLanterns scene={celebration} seconds={celebrationSeconds} active={active&&!festivalStill}/>}
        <g className="republic-input-layer">
          {cells.map((p,i)=>{const o=town.placed.find(x=>distance(x,p)===0),road=town.roads.some(x=>distance(x,p)===0);
            return <g key={i} role="button" tabIndex={focus===i?0:-1} data-cell={`${p.x}-${p.y}`} aria-label={`${String.fromCharCode(65+p.x)}${p.y+1}: ${o?catalog[o.id].name:road?"cesta":"voľné miesto"}${suggested.some(s=>distance(s,p)===0)?", odporúčané pre úlohu":""}`} aria-pressed={target?distance(p,target)===0:undefined} onFocus={()=>{setFocus(i);setHover(p);}} onPointerEnter={()=>setHover(p)} onClick={()=>pick(p)} onKeyDown={e=>keyDown(e,p)}>
              <polygon points={diamond(p,1)} className="republic-hit"/>
              {editing&&<text x={at(p).x} y={at(p).y+4} className="republic-cell-mark">{suggested.some(s=>distance(s,p)===0)?"✓":o||road?"·":"+"}</text>}
            </g>;})}
        </g>
      </svg>
    </div>
    <div className="republic-map-tools"><span>{editing?suggested.length?"Miesta s fajkou pomôžu splniť úlohu.":"Vyber pozemok. Stavbu ešte potvrdíš.":"Ťukni na budovu a preskúmaj ju."}</span><div>
      <button type="button" aria-label={editing?"Mriežka je pri výbere miesta zapnutá":"Zobraziť mriežku pozemkov"} aria-pressed={showGrid} disabled={editing} onClick={()=>setGrid(v=>!v)}><Grid2X2 size={16}/></button>
      <button type="button" aria-label="Oddialiť mapu" disabled={zoom<=1} onClick={()=>setZoom(z=>Math.max(1,z-.5))}><Minus size={16}/></button>
      <button type="button" aria-label="Priblížiť mapu" disabled={zoom>=2} onClick={()=>setZoom(z=>Math.min(2,z+.5))}><Plus size={16}/></button>
      <button type="button" aria-label="Centrovať mapu" onClick={centre}><LocateFixed size={17}/></button>
    </div></div>
    {scene&&<details className="republic-daylight"><summary><span className={`republic-daylight-dot ${scene.time.period}`}/>{scenePreview?"Náhľad scény": "Živá štvrť"}<span>{periods[scene.time.period]} · {clock}</span></summary>
      <div><p>Čas v Bratislave · východ {timeLabel(scene.time.sunrise)} · západ {timeLabel(scene.time.sunset)}. Napojené domy a budovy ožívajú podľa dennej doby.</p>
        <label>Prezrieť deň a noc<select value={scenePreview} onChange={e=>setScenePreview(e.target.value)}><option value="">Teraz · skutočný čas</option>
          <option value={new Date(scene.time.sunrise+90*60000).toISOString().slice(0,16)}>Ráno</option><option value={`${scene.time.day}T12:00`}>Popoludnie</option>
          <option value={new Date(scene.time.sunset+15*60000).toISOString().slice(0,16)}>Súmrak</option><option value={`${scene.time.day}T21:30`}>Noc</option>
        </select></label><p className="republic-daylight-note">Náhľad mení iba vzhľad. Sezónne efekty sú herná dekorácia, nie predpoveď počasia.</p>
      </div>
    </details>}
  </div>;
}
