"use client";

import { useEffect, useMemo, useState, type RefObject } from "react";
import { livingScene, walkerPosition, type ResidentKind, type Walker } from "@/lib/republic-living";
import type { Point, RepublicState } from "@/lib/republic";

export const mapPoint=(p:Point)=>({x:280+(p.x-p.y)*43,y:100+(p.x+p.y)*24});
/** Ripples follow the visible stream, below every playable map layer. */
export function RiverFlow({active}:{active:boolean}) {
  return <g className="republic-river" data-running={active} pointerEvents="none" aria-hidden="true" fill="none" stroke="#e4f5dd" strokeLinecap="round">
    <path className="republic-river-current" d="M-25 354C20 376 65 375 115 397S195 426 258 440S366 468 450 474" strokeWidth="1.1" strokeDasharray="5 35 2 34" opacity=".5"/>
    <path className="republic-river-current" d="M1 367C52 388 93 389 141 411S217 431 280 448S376 471 452 481" strokeWidth=".8" strokeDasharray="3 47 6 20" opacity=".45" style={{animationDelay:"-4s",animationDuration:"16s"}}/>
    <path className="republic-river-current" d="M77 391C115 405 174 421 214 433S298 451 358 465" strokeWidth=".65" strokeDasharray="2 40 4 30" opacity=".6" style={{animationDelay:"-7s",animationDuration:"11s"}}/>
  </g>;
}
export function useLivingScene(town:RepublicState,host:RefObject<HTMLDivElement|null>,preview:string) {
  const [now,setNow]=useState<Date|null>(null),[visible,setVisible]=useState(false),[reduced,setReduced]=useState(true);
  useEffect(()=>{
    const element=host.current;if(!element)return;
    let intersecting=false;
    const motion=matchMedia("(prefers-reduced-motion: reduce)");
    const update=()=>{const active=intersecting&&!document.hidden;setVisible(active);setReduced(motion.matches);if(active)setNow(new Date());};
    const observer=new IntersectionObserver(entries=>{intersecting=entries.some(e=>e.isIntersecting);update();});
    observer.observe(element);document.addEventListener("visibilitychange",update);motion.addEventListener("change",update);
    const timer=setInterval(()=>{if(intersecting&&!document.hidden)setNow(new Date());},30000);
    return()=>{observer.disconnect();clearInterval(timer);document.removeEventListener("visibilitychange",update);motion.removeEventListener("change",update);};
  },[host]);
  const scene=useMemo(()=>{
    if(!now)return null;
    // Explicit, labelled visual preview only. Default always follows the real Slovak clock.
    const time=preview?new Date(`${preview}:00Z`):now;
    return livingScene(town,time);
  },[town,now,preview]);
  return {scene,active:visible&&!reduced,visible};
}
export function ResidentSprite({kind,frame=1}:{kind:ResidentKind;frame?:number}) {
  const row={child:0,adult:1,senior:2,dog:3}[kind];
  return <svg x="-12" y="-27.375" width="24" height="30" viewBox={`${frame*128} ${row*160} 128 160`} overflow="hidden" aria-hidden="true">
    <image href="/images/games/republic/residents-v1.webp" x="0" y="0" width="384" height="640"/>
  </svg>;
}
function WalkingResident({walker,seconds,active}:{walker:Walker;seconds:number;active:boolean}) {
  const position=walkerPosition(walker,seconds),point=mapPoint(position),frame=active&&position.moving?Math.floor((seconds+walker.phase)*4)%3:1;
  // Mirror is decorative orientation only; route coordinates stay unaltered.
  const reverse=position.left;
  return <g transform={`translate(${point.x} ${point.y+3})`} data-resident={walker.kind}>
    <g transform={reverse?"scale(-1 1)":undefined}><ResidentSprite kind={walker.kind} frame={frame}/></g>
    {walker.dog&&<g transform={`translate(${reverse?-12:12} 5)`}><ResidentSprite kind="dog" frame={frame}/></g>}
  </g>;
}
export function LivingWalkers({scene,active}:{scene:ReturnType<typeof livingScene>;active:boolean}) {
  const [seconds,setSeconds]=useState(0);
  useEffect(()=>{
    if(!active)return;
    let frame=0,last=0;
    const animate=(stamp:number)=>{if(stamp-last>=83){last=stamp;setSeconds(Date.now()/1000);}frame=requestAnimationFrame(animate);};
    frame=requestAnimationFrame(animate);return()=>cancelAnimationFrame(frame);
  },[active]);
  return <g className="republic-residents" pointerEvents="none" aria-hidden="true" data-running={active}>
    {scene.walkers.map(w=><WalkingResident key={w.key} walker={w} seconds={active?seconds:0} active={active}/>)}
  </g>;
}
export function LivingGatherings({scene,active}:{scene:ReturnType<typeof livingScene>;active:boolean}) {
  return <g pointerEvents="none" aria-hidden="true" className="republic-gatherings" data-running={active}>{scene.gatherings.map(person=>{
    const p=mapPoint(person.point);
    return <g key={person.key} transform={`translate(${p.x-10+person.offset*14} ${p.y+18})`} data-activity={person.activity}>
      <g transform={person.offset?"scale(-1 1)":undefined}><ResidentSprite kind={person.kind}/></g>
      {person.activity==="play"&&person.offset===0&&<circle className="republic-play-ball" cx="7" cy="0" r="2.2" fill="#efe3b0" stroke="#a97246" strokeWidth=".7"/>}
    </g>;
  })}</g>;
}
export function SeasonalScene({scene,active}:{scene:ReturnType<typeof livingScene>;active:boolean}) {
  return <g pointerEvents="none" aria-hidden="true" className={`republic-season republic-season-${scene.effect}`} data-running={active}>
    {scene.particles.map((p,i)=><g key={i} transform={`translate(${p.x} ${p.y})`}>
      <g className="republic-season-particle" style={{animationDelay:`${-p.phase*12}s`,animationDuration:`${9+p.phase*7}s`}}>
        {scene.effect==="leaves"?<path d={`M${-p.size} 0Q0 ${-p.size*2} ${p.size} 0Q0 ${p.size*2} ${-p.size} 0`} fill={["#b67032","#dab65e","#9c653c"][i%3]} stroke="#8b632f" strokeWidth=".4"/>:scene.effect==="flowers"?<g><path d="M0 0v4" stroke="#637d42" strokeWidth=".8"/><path d="M0-3Q-4-4-3 0Q-4 4 0 3Q4 4 3 0Q4-4 0-3" fill={i%2?"#f6dc9a":"#e5b9be"}/><circle r="1" fill="#ac8542"/></g>:<circle r={p.size} fill={scene.effect==="snow"?"#fffef7":"#f6eaa4"} opacity=".8"/>}
      </g>
    </g>)}
  </g>;
}
const litWindows:Partial<Record<string,Point[]>>={
  house:[{x:-7,y:-27},{x:-1,y:-9},{x:20,y:-11}],school:[{x:-23,y:-30},{x:2,y:-22},{x:-23,y:-13},{x:2,y:-2},{x:19,y:-19},{x:28,y:-25},{x:19,y:-4},{x:28,y:-8}],
};
export function NightWindows({town,night}:{town:RepublicState;night:number}) {
  return <g aria-hidden="true" pointerEvents="none" opacity={night*.84} className="republic-night-windows">{town.placed.map(o=>{
    const p=mapPoint(o);
    return <g key={o.instanceId} transform={`translate(${p.x} ${p.y})`}>{(litWindows[o.id]??[]).map((w,i)=><path key={i} d={`M${w.x-1.8} ${w.y-3}l3.6 1.1v5l-3.6-1.1z`} fill="#ffd894"/>)}</g>;
  })}</g>;
}
