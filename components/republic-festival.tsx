"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Check, CloudRain, Flag, List, Map, Music, BookOpen, Utensils, Star, Tent, Armchair, Users, Zap, Undo2, Share2, Download, Play } from "lucide-react";
import RepublicMap from "@/components/republic-map";
import RepublicArt from "@/components/republic-art";
import { catalog, distance, type Point, type RepublicState } from "@/lib/republic";
import { activeFestival, preparationImpact, preparedMood, festivalLayoutReady, festivalBrief, journeyDays, festivalBudget, festivalResult, festivalSites, incidents, neighbours, prepSites, responses, siteReport, supports, themes, type FestivalCommand, type Mood, type Support, type Theme } from "@/lib/republic-festival";
import "@/app/republic-festival.css";
import { festivalPostcardData } from "@/lib/republic-celebration";
import { downloadPostcard, festivalPostcardImage } from "@/components/republic-postcard";
import { FestivalGaps } from "@/components/republic-plan";
import { InfoCard } from "@/components/republic-info";
import { objectReport } from "@/lib/republic-info";

const icons={books:BookOpen,food:Utensils,music:Music};
const supportIcons={shelter:Tent,welcome:Users,quiet:Armchair};
const coords=(p:Point)=>`${String.fromCharCode(65+p.x)}${p.y+1}`;
function Impact({mood}:{mood:Mood}) {return <span className="festival-impact">{mood.map((n,i)=><span key={i}>{neighbours[i]} {n>0?"+":""}{n}</span>)}</span>;}
export default function RepublicFestival({town,blocked:saving,onCommand,onClose,onReward}:{town:RepublicState;blocked:boolean;onCommand:(c:FestivalCommand)=>Promise<boolean>;onClose:()=>void;onReward:()=>void}) {
  const [target,setTarget]=useState<Point|null>(null),[support,setSupport]=useState<Support|null>(null),[list,setList]=useState(false);
  const [answer,setAnswer]=useState<number|null>(null);
  const [objectId,setObjectId]=useState<string|null>(null);
  const [replay,setReplay]=useState(0),[exporting,setExporting]=useState(false),[card,setCard]=useState<{blob:Blob;url:string;filename:string}|null>(null),[cardError,setCardError]=useState("");
  const capture=useRef<SVGSVGElement|null>(null);
  const mounted=useRef(false);
  useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
  const blocked=saving||exporting;
  useEffect(()=>()=>{if(card)URL.revokeObjectURL(card.url);},[card]);
  const f=activeFestival(town);
  const done=f.response!==null,brief=festivalBrief(f),budget=festivalBudget(f);
  const journey=f.mode==="journey",stage=f.stage??0,graduated=town.festivalJourney?.stage===7;
  const phase=!f.theme?0:!f.site?1:f.preparations.length<2?2:done?4:3;
  const choices=phase===1?festivalSites(town):phase===2&&support?prepSites(town,f):[];
  const objectDetail=objectId?objectReport(town,objectId):null;
  const valid=!!target&&choices.some(p=>distance(p,target)===0);
  const report=target&&f.theme&&phase===1?siteReport(town,f.theme,target):null;
  const result=festivalResult(f),preview=answer===null?null:festivalResult(f,answer);
  const moodNow=done?result.mood:preview?preview.mood:phase===3?result.mood:preparedMood(f);
  const layoutReady=festivalLayoutReady(town,f);
  const placedLocations=f.site&&f.theme
    ? [{key:"program",point:f.site,name:themes[f.theme].name,role:"Hlavný program"},...f.preparations.map(p=>({key:p.kind,point:p,name:supports[p.kind].name,role:"Pripravené zázemie"}))]
    : town.placed.map(p=>({key:p.instanceId,point:p,name:catalog[p.id].name,role:catalog[p.id].kind==="decoration"?"Ozdoba štvrte":"Miesto v štvrti"}));
  const EventIcon=f.incident==="rain"?CloudRain:f.incident==="power"?Zap:Users;
  function clearCard(){setCard(null);setCardError("");}
  async function send(c:FestivalCommand){if(await onCommand(c)){setTarget(null);setSupport(null);setAnswer(null);setObjectId(null);clearCard();const newDay=c.type==="festival-next"||c.type==="festival-journey"||c.type==="festival-start";requestAnimationFrame(()=>document.querySelector(newDay?".festival-heading":c.type==="festival-response"?".festival-scene":".festival-decisions")?.scrollIntoView({block:"start",behavior:"instant"}));}}
  async function makeCard(){
    const data=festivalPostcardData(town);if(!data||exporting)return;
    setList(false);setObjectId(null);setExporting(true);clearCard();
    try {
      await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
      document.querySelector(".festival-scene")?.scrollIntoView({block:"start",behavior:"instant"});
      await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
      if(!capture.current)throw new Error("Najprv otvor mapu slávnosti a skús znova.");
      const blob=await festivalPostcardImage(capture.current,data);
      if(!mounted.current)return;
      setCard({blob,url:URL.createObjectURL(blob),filename:data.filename});
    }catch(error){setCardError(error instanceof Error?error.message:"Pohľadnica sa nepodarila. Skús znova.");}
    finally{setExporting(false);}
  }
  async function shareCard(){
    if(!card)return;
    const file=new File([card.blob],card.filename,{type:"image/png"});
    if(navigator.canShare?.({files:[file]})){
      try{await navigator.share({files:[file],title:`${town.name} · Malá republika`});return;}
      catch(error){if(error instanceof DOMException&&error.name==="AbortError")return;}
    }
    downloadPostcard(card.blob,card.filename);
  }
  function pick(p:Point){
    if(exporting)return;
    const available=choices.some(c=>distance(c,p)===0),object=town.placed.find(o=>distance(o,p)===0);
    // Platné stanovište má prednosť (námestie môže byť miestom programu); ostatné budovy iba skúmame.
    if(object&&!available){setObjectId(old=>old===object.instanceId?null:object.instanceId);setTarget(null);return;}
    setObjectId(null);setTarget(p);
    if(available)requestAnimationFrame(()=>document.querySelector(".festival-place-confirm")?.scrollIntoView({block:"center",behavior:"instant"}));
  }
  function selectSupport(id:Support){setSupport(id);setTarget(null);setObjectId(null);requestAnimationFrame(()=>document.querySelector(".festival-scene")?.scrollIntoView({block:"start",behavior:"instant"}));}
  return <section className="festival" aria-label={journey?"Príbeh štvrte: sedem herných dní":"Denná výzva: susedská slávnosť"} onKeyDown={e=>{if(e.key==="Escape")setObjectId(null);}}>
    <header className="festival-heading"><div><h2>{brief.title}</h2><p>{journey?`Príbeh štvrte · deň ${stage+1} zo 7 · bez čakania na zajtra`:`Denná výzva na ${Number(f.day.slice(8,10))}. ${Number(f.day.slice(5,7))}. ${f.day.slice(0,4)}`} · postup sa ukladá</p></div><button disabled={exporting} onClick={onClose}><ArrowLeft size={16}/> Späť do štvrte</button></header>
    {journey&&<div className="festival-journey"><div><ol aria-label="Sedem dní príbehu">{journeyDays.map((d,i)=><li key={d.title} aria-current={i===stage&&!graduated?"step":undefined} className={(town.festivalJourney?.scores[i]??0)===3?"is-complete":""} title={d.title}><span>{(town.festivalJourney?.scores[i]??0)===3?<Check size={15}/>:i+1}</span><span className="sr-only">{d.title}: {(town.festivalJourney?.scores[i]??0)===3?"splnené":i===stage?"aktuálny deň":"zamknuté"}</span></li>)}</ol><p>{graduated?"Sedem dní hotových. Štvrť má svoju slávnostnú bránu.":"Splň 3 ciele a posuň sa na ďalší herný deň. Kalendár ani zásielky tým nemeníš."}</p></div><div className="festival-journey-prize"><RepublicArt id="ceremonial-gate"/><strong>Slávnostná brána<span>Odmena za 7 dní</span></strong></div></div>}
    <p className="festival-story">{brief.story}</p>
    <div className="festival-mission"><Flag size={21}/><div><strong>{brief.goal}</strong><span>Dve rôzne stanovištia · {brief.happy} spokojní susedia · rezerva aspoň {brief.reserve} {brief.reserve===1?"bod":"body"}. Spokojný sused = 3 z 5.</span></div><span className="festival-budget"><b>{budget}</b> / {brief.budget}<span>prípravné body</span></span></div>
    <ol className="festival-steps" aria-label="Priebeh výzvy">{["Program","Miesto","Zázemie","Udalosť","Slávnosť"].map((name,i)=><li key={name} aria-current={i===phase?"step":undefined} className={i<phase?"is-done":""}>{i<phase?<Check size={14}/>:<span>{i+1}</span>}{name}{i===2&&phase===2&&<b>{f.preparations.length}/2</b>}</li>)}</ol>
    <div className="festival-readiness" aria-label="Spokojnosť susedov"><span>{done?"Výsledná spokojnosť":preview?"Po vybranom riešení":phase===3?"Po príchode komplikácie":"Spokojnosť pred komplikáciou"}</span>{neighbours.map((name,i)=><div key={name}><b>{name}</b><span>{Math.max(0,Math.min(5,moodNow[i]))}/5{moodNow[i]>5?` (+${moodNow[i]-5} rezerva)`:""}</span><progress max={5} value={Math.max(0,Math.min(5,moodNow[i]))} aria-label={`Spokojnosť: ${name}`}/></div>)}</div>
    <div className="festival-layout" data-complete={done}>
      <div className="festival-decisions" aria-live="polite">
        {phase===0&&<><h3>Čím pozveme susedov von?</h3><p>Nina: „Jedno popoludnie, tri predstavy. Vyber program, okolo ktorého postavíme celý deň.“</p><div className="festival-options">{(Object.keys(themes) as Theme[]).map(id=>{const t=themes[id],Icon=icons[id];return <button key={id} disabled={blocked} onClick={()=>void send({type:"festival-theme",theme:id})}><Icon size={23}/><span><b>{t.name}</b><small>{t.description}</small><Impact mood={t.mood}/></span><strong>{t.cost}<small>body</small></strong></button>;})}</div><p className="festival-tip">Každý sused začína s 2 bodmi spokojnosti. Miesto, zázemie aj nečakaná udalosť výsledok zmenia.</p></>}
        {phase===1&&<><h3>Kam dáme {f.theme==="books"?"čítanie":f.theme==="food"?"piknik":"koncert"}?</h3><p>{themes[f.theme!].wish} Vyber označené miesto na mape. V jeho okolí budeš potrebovať ešte dve voľné stanovištia.</p>{valid&&report?<div className="festival-site-preview festival-place-confirm"><strong>Miesto {coords(target!)}</strong>{report.notes.map(n=><p key={n}>{n}</p>)}{report.discovery&&<p className="festival-discovery">{report.discovery}</p>}<button className="republic-primary" disabled={blocked} onClick={()=>void send({type:"festival-site",target:target!})}>Rozložiť program tu<Check size={17}/></button></div>:<p className="festival-tip">Najprv porovnaj viac miest. Výber sa uloží až po potvrdení.</p>}</>}
        {phase===2&&<><h3>Zázemie robí dobrú slávnosť.</h3><p>Priprav dve rôzne stanovištia pri programe. Rozpočet budeš potrebovať aj pri komplikácii. Stanovište vyber tu, miesto potom na mape.</p><div className="festival-options">{(Object.keys(supports) as Support[]).map(id=>{const t=supports[id],Icon=supportIcons[id],placed=f.preparations.some(p=>p.kind===id);return <button key={id} aria-pressed={support===id} disabled={blocked||placed||budget<t.cost} onClick={()=>selectSupport(id)}><Icon size={22}/><span><b>{t.name}{placed?" · pripravené":""}</b><small>{t.hint}</small></span><strong>{placed?<Check size={17}/>:t.cost}<small>{placed?"":t.cost===1?"bod":"body"}</small></strong></button>;})}</div>{support&&<p className="festival-tip">{choices.length?"Vyber označené miesto do dvoch políčok od programu.":"Tu sa už zázemie nezmestí. Preplánuj slávnosť alebo v štvrti uvoľni miesto pri ceste."}</p>}{valid&&support&&<p className="festival-place-confirm">Vplyv tohto miesta na spokojnosť:<Impact mood={preparationImpact(f,{...target!,kind:support})}/></p>}{valid&&support&&<button className="republic-primary festival-place-confirm" disabled={blocked} onClick={()=>void send({type:"festival-prep",kind:support,target:target!})}>Pripraviť {supports[support].name.toLocaleLowerCase("sk")} na {coords(target!)}<Check size={17}/></button>}</>}
        {phase===3&&<><div className="festival-incident"><EventIcon size={28}/><h3>{incidents[f.incident].title}</h3></div><p>{incidents[f.incident].text}</p><Impact mood={incidents[f.incident].mood}/>{f.incident==="rain"&&f.preparations.some(p=>p.kind==="shelter")&&<p className="festival-discovery">Stan sa oplatil: Eva +1 a Nina +1 zmiernia dážď.</p>}{f.incident==="crowd"&&f.preparations.some(p=>p.kind==="welcome")&&<p className="festival-discovery">Uvítací stolík pomáha s návalom: Eva +1.</p>}<div className="festival-options">{responses(f).map((r,i)=><button key={r.name} disabled={blocked||r.cost>budget} aria-pressed={answer===i} onClick={()=>setAnswer(i)}><span><b>{r.name}</b><small>{r.description}</small><Impact mood={r.mood}/></span><strong>{r.cost}<small>{r.cost>budget?"chýbajú body":r.cost===0?"zadarmo":r.cost===1?"bod":"body"}</small></strong></button>)}</div>{!layoutReady&&<p role="alert">Rozloženie štvrte sa zmenilo. Uvoľni stanovištia pri cestách alebo preplánuj slávnosť.</p>}{preview&&<div className="festival-plan"><p>Po tejto voľbe: <b>{preview.happy} z 3 susedov spokojných</b>, rezerva: {preview.reserve}.</p><button className="republic-primary" disabled={blocked||!layoutReady} onClick={()=>void send({type:"festival-response",choice:answer!})}>Takto otvoríme slávnosť<ArrowRight size={17}/></button></div>}</>}
        {done&&<>
          <h3>{result.title}</h3><div className="festival-stars" aria-label={`${result.stars} z 3 cieľov splnených`}>{[0,1,2].map(i=><Star key={i} size={30} fill={i<result.stars?"currentColor":"none"}/>)}</div>
          <ul className="festival-results"><li>{result.happy>=brief.happy?<Check size={16}/>:<Flag size={16}/>}Spokojní susedia: {result.happy}/3 · treba {brief.happy}</li><li>{result.special?<Check size={16}/>:<Flag size={16}/>} {brief.specialLabel}: {result.special?"splnené":"ešte chýba"}</li><li>{result.reserve>=brief.reserve?<Check size={16}/>:<Flag size={16}/>}Rezerva: {result.reserve} · treba aspoň {brief.reserve}</li></ul>
          <div className="festival-reactions">{neighbours.map((n,i)=><p key={n}><b>{n}<span>{result.mood[i]}/5</span></b>{result.reactions[i]}</p>)}</div>
          {f.discovery&&<p className="festival-discovery">Objavené spojenie · {f.discovery}</p>}
          <p className="festival-tip">Najlepší výsledok tohto {journey?"herného":"kalendárneho"} dňa: {f.best}/3. Ďalší pokus má rovnakú komplikáciu.{journey&&f.best<3?" Na ďalší deň potrebuješ všetky tri ciele. Zmeň program, polohu alebo zázemie.":""}</p>
          {journey&&!graduated&&f.best<3&&<FestivalGaps festival={f} nextDay={stage+2}/>}
          {journey&&!graduated&&<div className="festival-next-day"><p>{stage<6?`Ďalej: ${journeyDays[stage+1].title}`:"Sedem dní je za tebou. Prevezmi odmenu do zbierky."}</p><button className="republic-primary" disabled={blocked||f.best<3} onClick={()=>void send({type:"festival-next"})}>{stage<6?`Prejsť na deň ${stage+2}`:"Prevziať slávnostnú bránu"}<ArrowRight size={17}/></button>{f.best<3&&<small>Najprv splň 3/3 cieľov. Pokus zopakuješ hneď.</small>}</div>}
          {journey&&graduated&&<div className="festival-gift"><RepublicArt id="ceremonial-gate"/><div><h4>Tvoja štvrť si ju zaslúžila.</h4><p>Slávnostná brána je odomknutá. Postav ju zadarmo na voľné miesto.</p><button className="republic-primary" disabled={blocked} onClick={onReward}>Umiestniť bránu do štvrte<ArrowRight size={17}/></button></div></div>}
          <div className="festival-result-actions"><button disabled={blocked} onClick={()=>void send({type:"festival-retry"})}><Undo2 size={16}/> Skúsiť iný plán</button>
            {(journey&&graduated||!journey&&f.day!==town.lastDay)&&<button disabled={blocked} onClick={()=>void send({type:"festival-start"})}>Hrať dnešnú výzvu<ArrowRight size={16}/></button>}
            {!journey&&!graduated&&<button className="republic-primary" disabled={blocked} onClick={()=>void send({type:"festival-journey"})}>Pokračovať príbehom štvrte<ArrowRight size={17}/></button>}
          </div>
        </>}
        {!done&&f.theme&&<button className="festival-replan" disabled={blocked} onClick={()=>void send({type:"festival-replan"})}><Undo2 size={14}/> Preplánovať od začiatku · body sa vrátia</button>}
      </div>
      <div className="festival-scene"><div className="festival-scene-heading"><span>{f.theme?themes[f.theme].name:"Tvoja štvrť, tvoja slávnosť"}</span><button aria-pressed={list} disabled={exporting} onClick={()=>setList(!list)}>{list?<Map size={16}/>:<List size={16}/>} {list?"Mapa":"Miesta"}</button></div>
        {done&&<div className="festival-celebration-caption"><p><strong>Slávnosť sa začala.</strong> {f.theme==="books"?"Deti otvárajú knihy a susedia sa pristavujú pri čítaní.":f.theme==="food"?"Susedia prinášajú jedlo a stretávajú sa pri pikniku.":"Koncert rozozvučal štvrť. Pod lampiónmi sa už tancuje."}</p><button disabled={exporting} onClick={()=>{setList(false);setReplay(n=>n+1);}}><Play size={15}/> Prehrať scénu</button></div>}
        {list?<div className="festival-place-list">
          <h4>{f.site?"Pripravené miesta slávnosti":"Miesta v tvojej štvrti"}</h4>
          <ul>{placedLocations.map(place=><li key={place.key}><span className="festival-place-coordinate">{coords(place.point)}</span><div><b>{place.name}</b><small>{place.role}</small></div></li>)}</ul>
          {choices.length>0?<><h4>Dostupné miesta na výber</h4><div className="festival-locations">{choices.map(p=><button key={coords(p)} disabled={blocked} aria-pressed={!!target&&distance(p,target)===0} onClick={()=>pick(p)}>{coords(p)}<span>{town.placed.find(o=>distance(o,p)===0)?.id==="plaza"?"Námestie":"Miesto pri ceste"}</span></button>)}</div></>:!done&&<p>{phase===2&&!support?"Vyber druh zázemia. Potom tu uvidíš dostupné miesta.":phase===0?"Najprv vyber program slávnosti.":phase===2?"Pre toto zázemie teraz nie je voľné miesto. Zvoľ iné zázemie alebo preplánuj slávnosť.":"Stanovištia sú pripravené. Pokračuj riešením udalosti."}</p>}
        </div>:<RepublicMap town={town} editing={choices.length>0} inspectBuildingsWhileEditing selected={null} target={target} suggested={choices} captureRef={capture} festivalReplay={replay} festivalStill={exporting} inspect={objectDetail?{key:objectDetail.key,point:objectDetail.point,highlight:objectDetail.highlight,selected:objectId}:null} onCell={pick} onObject={id=>{const p=town.placed.find(o=>o.instanceId===id);if(p)pick(p);}}>
          {objectDetail&&!exporting&&<InfoCard report={objectDetail} readOnly branch={town.branch} finished={town.completed.includes("opening")} onClose={()=>setObjectId(null)}/>}
        </RepublicMap>}
        {done&&<div className="festival-postcard"><h4>Pohľadnica zo slávnosti</h4><p>Tvoja štvrť, výsledok a odkazy od susedov na jednom obrázku.</p>
          {card?<><Image unoptimized src={card.url} alt={`Pohľadnica: ${town.name}, ${themes[f.theme!].name}, ${result.stars} z 3 cieľov`} width={1080} height={1350}/><div className="festival-postcard-actions"><button onClick={()=>void shareCard()}><Share2 size={16}/> Zdieľať pohľadnicu</button><button onClick={()=>downloadPostcard(card.blob,card.filename)}><Download size={16}/> Stiahnuť PNG</button></div></>:<button disabled={exporting} onClick={()=>void makeCard()}><Share2 size={16}/>{exporting?"Pripravujem pohľadnicu…":"Vytvoriť pohľadnicu"}</button>}
          {cardError&&<p role="alert">{cardError}</p>}<span role="status" className="sr-only">{card?"Pohľadnica je pripravená na zdieľanie alebo stiahnutie.":exporting?"Pripravujem obrázok slávnosti.":""}</span>
        </div>}
        {target&&!valid&&choices.length>0&&<p className="festival-map-hint" role="status">Tu program ani zázemie teraz neumiestniš. Vyber označené miesto.</p>}
        <div className="festival-prepared"><h4>Čo už stojí</h4>{f.site?<ul><li><Check size={14}/>{themes[f.theme!].name} · {coords(f.site)}</li>{f.preparations.map(p=><li key={p.kind}><Check size={14}/>{supports[p.kind].name} · {coords(p)}</li>)}</ul>:<p>Najprv vyber program. Potom sa prípravy objavia priamo na mape.</p>}</div>
      </div>
    </div>
  </section>;
}
