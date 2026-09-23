"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { ArrowRight, ArrowUpRight, ChartNoAxesCombined } from "lucide-react";
import { currentAggregate, aggregateLastDate } from "@/lib/aggregate";
import { parties, fmt, date, type Party } from "@/lib/polls";
import logos from "@/lib/party-logos.json";

const ranked = parties.filter(p=>currentAggregate.values[p.id]?.value>1).sort((a,b)=>currentAggregate.values[b.id].value-currentAggregate.values[a.id].value||a.name.localeCompare(b.name,"sk"));
const logoMap:Record<string,{src:string;source:string;verified:string}>=logos;

export function PartyLogoSources() {
  return <section className="party-logo-sources"><h2>Logá politických strán</h2><p>Identifikačné logá preberáme z webov jednotlivých subjektov; logo ĽSNS je z Wikimedia Commons, lebo strana nemá funkčný web. Zobrazujeme ich v pôvodných farbách a pomeroch; ich použitie nevyjadruje podporu strany. Zdrojová kontrola: 12. 9. 2026.</p><div>{ranked.map(p=><a key={p.id} href={logoMap[p.id]?.source} target="_blank" rel="noopener noreferrer"><Image src={logoMap[p.id].src} alt="" width={34} height={34} unoptimized/><span>{p.short}</span><ArrowUpRight size={14}/><span className="sr-only"> (nová karta)</span></a>)}</div></section>;
}

export default function PartyRail({selected,onSelect,onMethod}:{selected:string|null;onSelect:(party:Party,logo?:HTMLElement|null)=>void;onMethod:()=>void}) {
  return <aside className="party-rail" aria-label="Politické strany zoradené podľa Modelu Mandát">
    <div className="party-rail-head"><div className="party-rail-title"><ChartNoAxesCombined size={18}/><h2>Strany v číslach</h2></div><p>Model Mandát <span>{date(aggregateLastDate)}</span></p></div>
    <div className="party-rail-scroll"><div className="party-rail-colheads" aria-hidden="true"><span>Politický subjekt</span><span>Podpora</span></div>
      {ranked.map((p,i)=>{const value=currentAggregate.values[p.id].value;const boundary=value<5&&i>0&&currentAggregate.values[ranked[i-1].id].value>=5;return <div className={boundary?"party-rail-boundary":""} key={p.id}>
        {boundary&&<div className="party-rail-divider"><span>Pod hranicou 5 %</span></div>}
        <button className="party-rail-item" aria-pressed={selected===p.id} aria-controls={selected===p.id?"party-profile":undefined} onClick={e=>onSelect(p,e.currentTarget.querySelector<HTMLElement>(".party-rail-logo"))} title={`${p.name} · ${fmt(value)} % · ${selected===p.id?"zatvoriť":"otvoriť"} profil`} aria-label={`${p.name}, agregát ${fmt(value)} percent. ${selected===p.id?"Zatvoriť":"Otvoriť"} profil.`}>
          <span className="party-rail-logo">{logoMap[p.id]?<Image src={logoMap[p.id].src} alt="" width={40} height={40} unoptimized/>:<span>{p.short.slice(0,2)}</span>}</span>
          <span className="party-rail-name">{p.short}<span className="party-rail-line" aria-hidden="true"><i style={{width:`${value/ranked.reduce((max,p)=>Math.max(max,currentAggregate.values[p.id].value),0)*100}%`,background:p.color}}/></span></span>
          <span className="party-rail-value">{fmt(value)}<small> %</small></span>
        </button>
      </div>;})}
    </div>
    <div className="party-rail-foot"><p>Vážený priemer, nie predpoveď.<br/>Zobrazené subjekty nad 1 %.</p><button onClick={onMethod}>Zdroje a metodika <ArrowUpRight size={14}/></button></div>
  </aside>;
}

/* Mobil: vodorovný pás strán na začiatku prehľadu namiesto fixnej spodnej lišty (šetrí výšku obrazovky). Monogram je viditeľný, kým sa logo nenačíta. */
export function PartyStrip({selected,onSelect,onMore}:{selected:string|null;onSelect:(party:Party,logo?:HTMLElement|null)=>void;onMore:()=>void}) {
  return <section className="party-strip" aria-label="Politické strany podľa Modelu Mandát">
    <div className="party-strip-head"><span>Model Mandát · {date(aggregateLastDate)}</span><button type="button" onClick={onMore} aria-label="Všetky strany a profily">Všetky strany <ArrowRight size={14} aria-hidden="true"/></button></div>
    <div className="party-strip-scroll">{ranked.map(p=>{const value=currentAggregate.values[p.id].value;return <button key={p.id} type="button" className="party-strip-item" aria-pressed={selected===p.id} aria-label={`${p.name}: ${fmt(value)} percent, ${selected===p.id?"zatvoriť":"otvoriť"} profil`} onClick={e=>onSelect(p,e.currentTarget.querySelector<HTMLElement>(".party-strip-logo"))}>
      <span className="party-strip-logo" style={{"--party-color":p.color} as CSSProperties}><span aria-hidden="true">{p.short.slice(0,2)}</span>{logoMap[p.id]&&<Image src={logoMap[p.id].src} alt="" width={36} height={36} unoptimized loading="eager"/>}</span>
      <span className="party-strip-name">{p.short}</span><b className="party-strip-value">{fmt(value)}<small> %</small></b>
    </button>;})}</div>
  </section>;
}
