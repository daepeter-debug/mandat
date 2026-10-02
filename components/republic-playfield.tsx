"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, BookOpen, Boxes, Check, ChevronLeft, Coins, ListTodo, Minimize2, PanelRightClose, PanelRightOpen, RotateCw, Smartphone, Sparkles } from "lucide-react";
import RepublicArt from "@/components/republic-art";
import { actionLabel } from "@/components/republic-plan";
import { catalog, type ItemId, type RepublicState } from "@/lib/republic";
import { info } from "@/lib/republic-info";
import { type PlanAction, type PlanItem, type playerPlan } from "@/lib/republic-plan";
import "@/app/republic-playfield.css";

const PlayfieldContext=createContext<{expanded:boolean;open:(trigger:HTMLElement)=>void}|null>(null);
export const usePlayfield=()=>useContext(PlayfieldContext);
const legend:ItemId[]=["house","school","library","clinic","park","garden","market","workshop","plaza","town-hall","station"];
const focusable='button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),summary,[tabindex="0"]';

/** The same mounted map and game controls expand; the town and pending move never get copied. */
export default function RepublicPlayfield({town,plan,blocked,onAction,children,taskContent,resources,kind="town"}:{
  town:RepublicState;plan?:ReturnType<typeof playerPlan>;blocked:boolean;
  onAction?:(a:PlanAction)=>void;children:ReactNode|((expanded:boolean)=>ReactNode);
  taskContent?:ReactNode;resources?:ReactNode;kind?:"town"|"festival";
}) {
  const [expanded,setExpanded]=useState(false),[tab,setTab]=useState<"tasks"|"legend">("tasks"),[rail,setRail]=useState(true);
  const host=useRef<HTMLDivElement>(null),closeButton=useRef<HTMLButtonElement>(null),trigger=useRef<HTMLElement|null>(null);
  const displayWanted=useRef(false),nativeEntered=useRef(false),orientationLocked=useRef(false);
  const close=useCallback(()=>{
    displayWanted.current=false;
    if(nativeEntered.current&&document.fullscreenElement===document.documentElement)void document.exitFullscreen().catch(()=>{});
    nativeEntered.current=false;
    if(orientationLocked.current){screen.orientation.unlock();orientationLocked.current=false;}
    setExpanded(false);
  },[]);
  const open=useCallback((button:HTMLElement)=>{
    trigger.current=button;
    displayWanted.current=true;
    setExpanded(true);
    // Native fullscreen is progressive: iPhone/standalone still use the entire page viewport.
    if(Math.min(window.innerWidth,window.innerHeight)>600||document.fullscreenElement||!document.fullscreenEnabled)return;
    void document.documentElement.requestFullscreen({navigationUI:"hide"}).then(async()=>{
      if(!displayWanted.current){if(document.fullscreenElement===document.documentElement)await document.exitFullscreen();return;}
      nativeEntered.current=true;
      const orientation=screen.orientation as ScreenOrientation&{lock?:(value:"landscape")=>Promise<void>};
      try{if(orientation.lock){await orientation.lock("landscape");orientationLocked.current=true;if(!displayWanted.current){orientation.unlock();orientationLocked.current=false;}}}catch{/* Manual rotation remains available. */}
    }).catch(()=>{/* Unsupported/denied fullscreen never prevents opening the map. */});
  },[]);
  useEffect(()=>{
    if(!expanded)return;
    const el=host.current;if(!el)return;
    const previousBody=document.body.style.overflow,previousHtml=document.documentElement.style.overflow,scrollY=window.scrollY;
    document.body.style.overflow="hidden";document.documentElement.style.overflow="hidden";
    document.body.classList.add("republic-playfield-open");
    // Inert only existing background branches. Radix reward dialogs can still open above the plan.
    const background:{el:HTMLElement;inert:boolean}[]=[];
    let branch:HTMLElement=el;
    while(branch.parentElement){
      for(const sibling of Array.from(branch.parentElement.children))if(sibling!==branch&&sibling instanceof HTMLElement&&!['SCRIPT','STYLE','LINK'].includes(sibling.tagName)){
        background.push({el:sibling,inert:sibling.inert});sibling.inert=true;
      }
      if(branch.parentElement===document.body)break;
      branch=branch.parentElement;
    }
    closeButton.current?.focus({preventScroll:true});
    const nestedDialog=(target:Element|null)=>{const dialog=target?.closest('[role="dialog"]');return !!dialog&&dialog!==el;};
    function key(e:KeyboardEvent){
      if(e.defaultPrevented||e.composedPath().some(node=>node instanceof Element&&node.getAttribute("role")==="dialog"&&node!==el)||nestedDialog(e.target instanceof Element?e.target:null)||nestedDialog(document.activeElement))return;
      if(e.key==="Escape"){e.preventDefault();close();return;}
      if(e.key!=="Tab")return;
      const nodes=Array.from(el!.querySelectorAll<HTMLElement>(focusable)).filter(n=>n.getClientRects().length&&getComputedStyle(n).visibility!=="hidden");
      const first=nodes[0],last=nodes[nodes.length-1];
      if(e.shiftKey&&(document.activeElement===first||!el!.contains(document.activeElement))){e.preventDefault();last?.focus();}
      else if(!e.shiftKey&&(document.activeElement===last||!el!.contains(document.activeElement))){e.preventDefault();first?.focus();}
    }
    document.addEventListener("keydown",key);
    const fullscreenChanged=()=>{if(nativeEntered.current&&!document.fullscreenElement)close();};
    document.addEventListener("fullscreenchange",fullscreenChanged);
    return()=>{
      displayWanted.current=false;
      document.removeEventListener("fullscreenchange",fullscreenChanged);
      document.removeEventListener("keydown",key);
      if(nativeEntered.current&&document.fullscreenElement===document.documentElement)void document.exitFullscreen().catch(()=>{});
      nativeEntered.current=false;
      if(orientationLocked.current){screen.orientation.unlock();orientationLocked.current=false;}
      background.forEach(b=>{b.el.inert=b.inert;});
      document.body.style.overflow=previousBody;document.documentElement.style.overflow=previousHtml;
      document.body.classList.remove("republic-playfield-open");
      window.scrollTo({top:scrollY,behavior:"instant"});
      // The toolbar trigger is conditionally rendered, so closing may create a new node.
      const returnTo=trigger.current?.isConnected?trigger.current:el.querySelector<HTMLButtonElement>("[data-playfield-open]")??el.querySelector<HTMLButtonElement>("[data-playfield-return]");
      returnTo?.focus({preventScroll:true});
    };
  },[expanded,close]);
  const items=[plan?.step,...(plan?.tasks??[]),plan?.parcel,plan?.story].filter((x):x is PlanItem=>!!x);
  function act(item:PlanItem){
    if(["story","branch","final"].includes(item.action.type)){close();requestAnimationFrame(()=>onAction?.(item.action));}
    else onAction?.(item.action);
  }
  return <PlayfieldContext.Provider value={{expanded,open}}>
    <div ref={host} className={`${kind==="festival"?"festival-playfield":"republic-layout"} republic-playfield`} data-kind={kind} data-expanded={expanded||undefined} data-rail={rail||undefined} role={expanded?"dialog":undefined} aria-modal={expanded?true:undefined} aria-label={expanded?"Herný plán Malej republiky":undefined}>
      {expanded&&<>
        <header className="playfield-header">
          <strong>{town.name}</strong>
          <div className="playfield-funds">{resources??<><span><Coins size={15} aria-hidden="true"/><b>{town.coins}</b><span className="sr-only">mincí</span></span><span><Boxes size={15} aria-hidden="true"/><b>{town.materials}</b><span className="sr-only">materiálov</span></span></>}</div>
          <button className="playfield-panel-toggle" type="button" onClick={()=>setRail(v=>!v)} aria-label={rail?"Zbaliť panel úloh":"Rozbaliť panel úloh"} aria-expanded={rail}>{rail?<PanelRightClose size={20}/>:<PanelRightOpen size={20}/>}</button>
          <button ref={closeButton} type="button" onClick={close} aria-label="Zavrieť herný plán"><Minimize2 size={20}/></button>
        </header>
        <div className="playfield-rotate" role="status"><div className="playfield-rotate-icon"><Smartphone size={54} aria-hidden="true"/><RotateCw size={24} aria-hidden="true"/></div><h2>Otoč telefón na šírku</h2><p>Celá štvrť bude na mape a úlohy vpravo. Ak sa obraz neotočí, vypni zámok otáčania telefónu.</p><button type="button" onClick={close}>Späť k bežnej mape</button></div>
        <aside className="playfield-rail" aria-label="Úlohy a legenda herného plánu">
          <nav aria-label="Panel herného plánu"><button type="button" aria-pressed={tab==="tasks"} aria-label="Úlohy" onClick={()=>{setTab("tasks");setRail(true);}}><ListTodo size={18}/><span>Úlohy</span></button><button type="button" aria-pressed={tab==="legend"} aria-label="Legenda" onClick={()=>{setTab("legend");setRail(true);}}><BookOpen size={18}/><span>Legenda</span></button></nav>
          {rail&&<div className="playfield-rail-content">
            {tab==="tasks"?taskContent??<>
              <h2>Dnes v štvrti</h2><p className="playfield-project">Projekt <b>{town.completed.length}/7</b></p>
              {plan?.blockers.map(b=><p className="playfield-blocker" key={b.key}>{b.title} {b.detail}</p>)}
              <ol className="playfield-tasks">{items.map(item=><li key={item.key} data-status={item.status}>
                <div className="playfield-task-title">{item.status==="done"||item.status==="later"?<Check size={14} aria-hidden="true"/>:item.status==="ready"?<Sparkles size={14} aria-hidden="true"/>:null}<h3>{item.title}</h3></div>
                <p>{item.detail}{item.progress&&` (${item.progress.have}/${item.progress.need})`}</p>
                {item.reward&&item.status!=="done"&&<span className="playfield-reward">+{item.reward.coins} {item.reward.coins===1?"minca":item.reward.coins<5?"mince":"mincí"} · +{item.reward.materials} mat.</span>}
                {item.action.type!=="none"&&item.status!=="done"&&item.status!=="later"&&<button type="button" disabled={blocked} onClick={()=>act(item)} aria-label={`${actionLabel(item.action,item)}: ${item.title}`}>{item.action.type==="build"?`Postaviť ${catalog[item.action.id].name.toLocaleLowerCase("sk")}`:actionLabel(item.action,item)}<ArrowRight size={13} aria-hidden="true"/></button>}
              </li>)}</ol>
            </>:<>
              <h2>Čo je na mape</h2><p>Ťukni na budovu a pozri jej účinky.</p>
              <ul className="playfield-legend">{legend.map(id=><li key={id}><RepublicArt id={id} branch={id==="station"?town.branch:null} finished={town.completed.includes("opening")}/><div><b>{catalog[id].name}</b><span>{info[id].tagline}</span></div></li>)}</ul>
              <p>{kind==="festival"?"Označené políčka: dostupné miesto programu alebo zázemia. Výber na mape ešte potvrď v Úlohách. Hnedá bodka: chýba cesta.":"Hnedá bodka: chýba cesta. Bublina nad domom: prianie susedov. Fajka pri stavaní: odporúčané miesto."}</p>
            </>}
            <button type="button" className="playfield-return" onClick={close}><ChevronLeft size={14}/>Späť na stránku</button>
          </div>}
        </aside>
      </>}
      {typeof children==="function"?children(expanded):children}
    </div>
  </PlayfieldContext.Provider>;
}
