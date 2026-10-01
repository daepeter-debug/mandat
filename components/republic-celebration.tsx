"use client";

import { useEffect, useRef, useState } from "react";
import { celebrationFrame, CELEBRATION_SECONDS, type Celebration } from "@/lib/republic-celebration";
import { ResidentSprite, mapPoint } from "@/components/republic-living";

export function useCelebrationOpening(scene: Celebration | null, active: boolean, replay: number) {
  const [seconds,setSeconds] = useState(CELEBRATION_SECONDS);
  const previous = useRef({key:scene?.key,opened:scene?.opened,replay:0});
  const elapsed = useRef(CELEBRATION_SECONDS);
  useEffect(() => {
    const old=previous.current;
    if(scene?.opened && (old.key===scene.key && !old.opened || old.replay!==replay)) elapsed.current=0;
    previous.current={key:scene?.key,opened:scene?.opened,replay};
    if(!scene?.opened || !active)return;
    let id=0,last=0,paint=0;
    const tick=(now:number) => {
      if(last)elapsed.current=Math.min(CELEBRATION_SECONDS,elapsed.current+(now-last)/1000);
      last=now;
      if(elapsed.current===CELEBRATION_SECONDS||now-paint>=83){setSeconds(elapsed.current);paint=now;}
      if(elapsed.current<CELEBRATION_SECONDS)id=requestAnimationFrame(tick);
    };
    id=requestAnimationFrame(tick);return()=>cancelAnimationFrame(id);
  },[scene?.key,scene?.opened,active,replay]);
  return active ? seconds : CELEBRATION_SECONDS;
}

export function CelebrationGuests({scene,seconds,active}:{scene:Celebration;seconds:number;active:boolean}) {
  const frame=celebrationFrame(scene,seconds);
  return <g aria-hidden="true" pointerEvents="none" className="festival-guests" data-running={active&&frame.performing} data-festival-guests={frame.guests.length}>
    {frame.guests.slice().sort((a,b)=>a.point.x+a.point.y-b.point.x-b.point.y||a.offset.y-b.offset.y).map((g,i)=>{
      const p=mapPoint(g.point),dance=g.activity==="dance"&&frame.performing;
      return <g key={g.key} transform={`translate(${p.x+g.offset.x} ${p.y+g.offset.y})`}>
        <g className={dance?"festival-guest-dance":undefined} style={{animationDelay:`${-(i%4)*.18}s`}}>
          <ResidentSprite kind={g.kind} frame={dance?i%3:1}/>
          {g.activity==="read"&&<g transform="translate(-3 -10)"><path d="M0 0L4 1L8 0V5L4 6L0 5Z" fill="#f4e5bd" stroke="#7c5a3a" strokeWidth=".7"/><path d="M4 1v5" stroke="#7c5a3a" strokeWidth=".6"/></g>}
          {g.activity==="picnic"&&<ellipse cx="2" cy="-9" rx="3.5" ry="1.5" fill="#f7efe0" stroke="#a87149" strokeWidth=".5"/>}
        </g>
      </g>;
    })}
  </g>;
}

export function CelebrationLanterns({scene,seconds,active}:{scene:Celebration;seconds:number;active:boolean}) {
  if(!scene.opened)return null;
  const p=mapPoint(scene.site),frame=celebrationFrame(scene,seconds);
  return <g transform={`translate(${p.x} ${p.y})`} pointerEvents="none" aria-hidden="true" data-festival-lanterns={frame.lit}>
    <path d="M-43 4v-56M43 4v-56" stroke="#685239" strokeWidth="1.8"/>
    <path d="M-43-51Q0-32 43-51" fill="none" stroke="#685239" strokeWidth="1"/>
    {[-32,-16,0,16,32].map((x,i)=>{const y=-42-Math.abs(x)*.16;return <g key={x} transform={`translate(${x} ${y})`}>
      {frame.lit&&<circle r="7.5" fill="#ffe3a1" opacity=".25"/>}
      <rect x="-3.4" y="-2" width="6.8" height="8" rx="2.4" fill={frame.lit?i%2?"#f4c878":"#efaf71":"#ab8561"} stroke="#b78548" strokeWidth=".6"/>
      <path d="M-2-2h4M-2 6h4" stroke="#795e3c" strokeWidth=".7"/>
      {frame.lit&&<path d="M0 0v4" stroke="#fff6cf" strokeWidth="1.2"/>}
    </g>;})}
    {scene.theme==="music"&&frame.performing&&<g className="festival-music-rhythm" data-running={active} fill="none" stroke="#f1d295" strokeWidth="1.6" strokeLinecap="round"><path d="M-15-26q-5 4 0 8M15-26q5 4 0 8"/></g>}
  </g>;
}
