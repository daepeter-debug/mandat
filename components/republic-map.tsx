"use client";

import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from "react";
import { AlertTriangle, Grid2X2, LocateFixed, Minus, Plus } from "lucide-react";
import { catalog, connected, distance, network, type ItemId, type Placed, type Point, type RepublicState } from "@/lib/republic";
import type { Gathering } from "@/lib/republic-living";
import { TownPiece, seg, type V } from "@/components/republic-art";
import { LivingWalkers, NightWindows, ResidentSprite, SeasonalScene, RiverFlow, useLivingScene } from "@/components/republic-living";
import { CelebrationGuests, CelebrationLanterns, useCelebrationOpening } from "@/components/republic-celebration";
import { celebrationScene, CELEBRATION_SECONDS } from "@/lib/republic-celebration";
import { needs, type Need } from "@/lib/republic-trust";
import type { Highlight } from "@/lib/republic-info";

/** Čo je vybrané na mape (budova alebo políčko) a čo k tomu zvýrazniť. */
export type MapInspect = { key: string; point: Point; highlight: Highlight; selected: string | null };

const at=(p:Point)=>({x:280+(p.x-p.y)*43,y:100+(p.x+p.y)*24});
const diamond=(p:Point,inset=0)=>{const c=at(p);return `${c.x},${c.y-24+inset} ${c.x+43-inset},${c.y} ${c.x},${c.y+24-inset} ${c.x-43+inset},${c.y}`;};
const cells=Array.from({length:36},(_,i)=>({x:i%6,y:Math.floor(i/6)}));
// Geometry stays independent of artwork and saved coordinates.
const hash=(s:string)=>{let h=7;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return h;};
const coords=(p:Point)=>`${String.fromCharCode(65+p.x)}${p.y+1}`;
type Layer={kind:"piece";piece:Placed;depth:number;tie:number}|{kind:"person";person:Gathering;depth:number;tie:number};
/** Budovy a ľudia pri nich v jednom poradí kreslenia: človek stojí v prednej časti svojho políčka (hĺbka + 0,5). */
const layers=(town:RepublicState,people:Gathering[]):Layer[]=>[
  ...town.placed.map(piece=>({kind:"piece" as const,piece,depth:piece.x+piece.y,tie:piece.x})),
  ...people.map(person=>({kind:"person" as const,person,depth:person.point.x+person.point.y+.5,tie:person.point.x})),
].sort((a,b)=>a.depth-b.depth||a.tie-b.tie);
/** Small illustrated wish medallions reuse the exact artwork of the playable buildings. */
function WishGlyph({wish}:{wish:string}) {
  const items:Record<string,ItemId>={zelen:"park",lekar:"clinic",skola:"school",obchod:"market"};
  return <g>
    <path d="M-14-20h28a6 6 0 0 1 6 6v24a6 6 0 0 1-6 6h-9l-5 5-5-5h-9a6 6 0 0 1-6-6v-24a6 6 0 0 1 6-6z" fill="#fffaf0" stroke="#a89877" strokeWidth="1"/>
    {items[wish]?<svg x="-18" y="-19" width="36" height="34" viewBox="-50 -76 100 110"><TownPiece id={items[wish]}/></svg>:<g stroke="#9c8e77" strokeWidth=".6"><path d="M-12 2L0-5 12 2 0 9Z" fill="#d9cdb6"/><path d="M-12-4L0-11 12-4 0 3Z" fill="#e7dcc8"/><path d="M-12 8L0 1 12 8 0 15Z" fill="#c5b79c"/><path d="M0-11V-5M0 1V9M-6-7L6 0M-6 4L6 11" fill="none"/></g>}
  </g>;
}function GatheringPerson({person,active}:{person:Gathering;active:boolean}) {
  const p=at(person.point);
  return <g className="republic-gatherings" data-running={active}><g transform={`translate(${p.x-10+person.offset*14} ${p.y+18})`} data-activity={person.activity}>
    <g transform={person.offset?"scale(-1 1)":undefined}><ResidentSprite kind={person.kind}/></g>
    {person.activity==="play"&&person.offset===0&&<circle className="republic-play-ball" cx="7" cy="0" r="2.2" fill="#efe3b0" stroke="#a97246" strokeWidth=".7"/>}
  </g></g>;
}

export default function RepublicMap({town,editing,selected,target,suggested=[],onCell,onObject,captureRef,festivalReplay=0,festivalStill=false,notice=null,wishes=[],inspect=null,suggestHint,children}:{town:RepublicState;editing:boolean;selected:ItemId|null;target:Point|null;suggested?:Point[];onCell:(p:Point)=>void;onObject:(id:string)=>void;captureRef?:RefObject<SVGSVGElement|null>;festivalReplay?:number;festivalStill?:boolean;notice?:{title:string;detail:string}|null;wishes?:{instanceId:string;x:number;y:number;wish:string|null}[];inspect?:MapInspect|null;suggestHint?:string;children?:ReactNode}) {
  const [zoom,setZoom]=useState(()=>typeof window!=="undefined"&&window.matchMedia?.("(max-width: 560px)").matches?1.5:1),[focus,setFocus]=useState(14),[grid,setGrid]=useState(false);
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
  // Vybraná budova mimo výrezu priblíženej mapy sa posunie do zorného poľa (ťuknutie v zozname alebo z plánu).
  const inspectKey=inspect?`${inspect.point.x}-${inspect.point.y}`:"";
  useEffect(()=>{
    const el=viewport.current,s=svg.current;if(!inspectKey||!el||!s)return;
    const [x,y]=inspectKey.split("-").map(Number),scale=s.getBoundingClientRect().width/640,c=at({x,y});
    const px=(c.x+40)*scale,py=c.y*scale,margin=48;
    const visible=px>el.scrollLeft+margin&&px<el.scrollLeft+el.clientWidth-margin&&py>el.scrollTop+margin&&py<el.scrollTop+el.clientHeight-margin;
    if(!visible)el.scrollTo({left:px-el.clientWidth/2,top:py-el.clientHeight/2,behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});
  },[inspectKey]);
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
  const inspectedWish=wishes.find(w=>w.instanceId===inspectedObject?.instanceId)?.wish;
  const inspectedLabel=inspected?`${coords(inspected)} · ${inspectedObject?catalog[inspectedObject.id].name:isRoad(inspected.x,inspected.y)?"Cesta":"Voľný pozemok"}${inspectedWish?` · ${needs[inspectedWish as Need].wish}`:""}`:"6 × 6 pozemkov";
  const clock=scene?`${String(scene.time.hour).padStart(2,"0")}:${String(scene.time.minute).padStart(2,"0")}`:"";
  const periods={morning:"Ráno",afternoon:"Popoludnie",evening:"Večer",night:"Noc"};
  const timeLabel=(time:number)=>new Intl.DateTimeFormat("sk",{timeZone:"Europe/Bratislava",hour:"2-digit",minute:"2-digit"}).format(new Date(time));
  return <div className="republic-map republic-landscape" data-editing={editing} data-scene-period={scene?.time.period}>
    <div className="republic-landscape-heading"><strong>{town.name}</strong><span>{inspectedLabel}</span></div>
    {notice&&<div className="republic-map-notice" role="alert"><AlertTriangle size={20} aria-hidden="true"/><div><b>{notice.title}</b><span>{notice.detail}</span></div></div>}
    <div className="republic-map-stage" data-detail-side={inspect&&at(inspect.point).x>280?"left":"right"}>
    <div className="republic-map-window" ref={viewport} tabIndex={0} aria-label="Mapa štvrte. Šípkami vyber políčko; Enter otvorí detail. Pri priblížení posúvaj mapu prstom.">
      <svg ref={el=>{svg.current=el;if(captureRef)captureRef.current=el;}} onPointerLeave={()=>setHover(null)} viewBox="-40 0 640 480" style={{width:`${zoom*100}%`,minWidth:editing?640:undefined}} role="group" aria-label={`${town.name}, interaktívna mapa 6 krát 6`}>
        <defs>
          <pattern id={`${uid}-paving`} width="8" height="6" patternUnits="userSpaceOnUse" patternTransform="matrix(1 .558 -1 .558 0 0)">
            <rect width="8" height="6" fill="#d9cdb6"/><path d="M0 0H8M0 3H8M0 0V3M4 3V6" stroke="#b7aa94" strokeWidth=".45"/><path d="M.6.7H7.5M.6 3.7H7.5" stroke="#f4e9d2" strokeWidth=".5" opacity=".8"/>
          </pattern>
        </defs>
        <g aria-hidden="true" pointerEvents="none">
          <rect x="-40" width="640" height="480" fill="#b5c58c"/>
          {(terrainReady||festivalStill)&&!terrainFailed&&<image href="/images/games/republic-terrain-v1.webp" x="-40" y="0" width="640" height="480" preserveAspectRatio="none" onError={()=>setTerrainFailed(true)}/>}
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
            {!editing&&inspect?.highlight.reach.some(r=>distance(r,p)===0)&&<polygon points={diamond(p,3)} className="republic-plot-reach"/>}
            {!editing&&inspect?.highlight.good.some(r=>distance(r,p)===0)&&<polygon points={diamond(p,2)} className="republic-plot-helped"/>}
            {!editing&&inspect?.highlight.bad.some(r=>distance(r,p)===0)&&<polygon points={diamond(p,2)} className="republic-plot-unlinked"/>}
            {!editing&&inspect&&distance(inspect.point,p)===0&&<polygon points={diamond(p,1)} className="republic-plot-focus"/>}
          </g>;
        })}
        {scene&&visible&&<LivingWalkers scene={scene} active={active}/>}
        {celebration&&(visible||festivalStill)&&<CelebrationGuests scene={celebration} seconds={celebrationSeconds} active={active&&!festivalStill}/>}
        <g pointerEvents="none" aria-hidden="true">
          {layers(town,scene&&visible?scene.gatherings:[]).map(layer=>{if(layer.kind==="person")return <GatheringPerson key={layer.person.key} person={layer.person} active={active}/>;const o=layer.piece,c=at(o);return <g className="republic-piece" key={o.instanceId} transform={`translate(${c.x} ${c.y})`}>
            <TownPiece id={o.id} branch={o.id==="station"?town.branch:null} finished={town.completed.includes("opening")} variant={hash(o.instanceId)}/>
            {!o.fixed&&catalog[o.id].kind==="building"&&!connected(town,o)&&<g transform="translate(30 10)"><circle r="5" fill="#a86343" stroke="#fff9df" strokeWidth="1.6"/><path d="M-2.2 0h4.4" stroke="#fff9df" strokeWidth="1.3"/></g>}
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
          {visible&&<SeasonalScene scene={scene} active={active}/>}
        </>}
        {celebration&&(visible||festivalStill)&&<CelebrationLanterns scene={celebration} seconds={celebrationSeconds} active={active&&!festivalStill}/>}
        {wishes.filter(w=>w.wish).map(w=>{const p=at(w);return <g key={w.instanceId} className="republic-wish" data-wish={w.wish} transform={`translate(${p.x+18} ${p.y-60})`} aria-hidden="true" pointerEvents="none"><WishGlyph wish={w.wish!}/></g>;})}
        <g className="republic-input-layer">
          {[...cells].sort((a,b)=>a.x+a.y-b.x-b.y||a.x-b.x).map(p=>{const i=p.y*6+p.x,o=town.placed.find(x=>distance(x,p)===0),road=town.roads.some(x=>distance(x,p)===0);
            const wish=wishes.find(w=>w.instanceId===o?.instanceId)?.wish;
            return <g key={i} role="button" tabIndex={focus===i?0:-1} data-cell={`${p.x}-${p.y}`} aria-label={`${String.fromCharCode(65+p.x)}${p.y+1}: ${o?catalog[o.id].name:road?"cesta":"voľné miesto"}${wish?`, ${needs[wish as Need].wish}`:""}${suggested.some(s=>distance(s,p)===0)?", odporúčané pre úlohu":""}`} aria-pressed={editing?(target?distance(p,target)===0:false):inspect?.point?distance(p,inspect.point)===0:false} onFocus={()=>{setFocus(i);setHover(p);}} onPointerEnter={()=>setHover(p)} onClick={()=>pick(p)} onKeyDown={e=>keyDown(e,p)}>
              <polygon points={diamond(p,1)} className="republic-hit"/>
              {!editing&&o&&catalog[o.id].kind==="building"&&!["plaza","park","garden"].includes(o.id)&&<path transform={`translate(${at(p).x} ${at(p).y})`} d={`M0 ${o.id==="station"?-84:-64}l32 18v48L0 20-32 2v-48Z`} className="republic-building-hit"/>}
              {editing&&<text x={at(p).x} y={at(p).y+4} className="republic-cell-mark">{suggested.some(s=>distance(s,p)===0)?"✓":o||road?"·":"+"}</text>}
            </g>;})}
        </g>
      </svg>
    </div>
    {children&&<div className="republic-map-detail">{children}</div>}
    </div>
    <div className="republic-map-tools"><span>{editing?suggested.length?suggestHint??"Políčka s fajkou: tu stavba hneď pomôže.":"Vyber pozemok. Stavbu ešte potvrdíš.":"Ťukni na budovu: uvidíš, čo robí a komu pomáha."}</span><div>
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
