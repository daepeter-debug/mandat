"use client";

import { useEffect, useRef, useState } from "react";
import { Dialog } from "radix-ui";
import { Archive, ArrowRight, Check, Coins, Hammer, MapPinned, PackageOpen, X, Boxes, Move, Undo2, List, Map, Download, AlertCircle } from "lucide-react";
import RepublicMap from "@/components/republic-map";
import RepublicArt from "@/components/republic-art";
import { accrue, branchNames, branches, catalog, combos, connected, currentStep, decorationIds, distance, execute, homesServed, pools, rarityNames, slovakDay, stepCost, taskClaimed, taskNames, taskReady, tasksFor, type Command, type DecorationId, type ItemId, type Point } from "@/lib/republic";
import { browserStore, republicKey, type Snapshot } from "@/lib/republic-storage";
import "@/app/republic-game.css";

const buildings:ItemId[]=["house","school","library","clinic","park","market","workshop","garden"];
type Intent = {kind:"build";id:ItemId}|{kind:"move";id:ItemId;instanceId:string}|{kind:"road"};
const comboNames={school:"Školská štvrť",craft:"Remeselná štvrť",centre:"Živé centrum"};
const comboHints={school:"Škola + knižnica do 2 políčok",craft:"Škola + dielňa do 2 políčok",centre:"Tržnica do 2 políčok od námestia"};
const roles={Eva:"učiteľka",Milan:"správca stanice",Nina:"susedská organizátorka"};
const coords=(p:Point)=>`${String.fromCharCode(65+p.x)}${p.y+1}`;
function offerRarity(id:DecorationId){return (Object.keys(pools) as (keyof typeof pools)[]).find(r=>pools[r].includes(id))!;}
function downloadBackup(raw:string) {
  const url=URL.createObjectURL(new Blob([raw],{type:"application/json"})),a=document.createElement("a");
  a.href=url;a.download="mala-republika-zaloha.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export default function RepublicGame() {
  const store=useRef<ReturnType<typeof browserStore>|null>(null),inFlight=useRef(false),parcelButton=useRef<HTMLButtonElement>(null);
  const [snapshot,setSnapshot]=useState<Snapshot|null>(null),[busy,setBusy]=useState(false),[conflict,setConflict]=useState(false);
  const [notice,setNotice]=useState(""),[saveError,setSaveError]=useState(false),[retry,setRetry]=useState<Command|null>(null);
  const [intent,setIntent]=useState<Intent|null>(null),[target,setTarget]=useState<Point|null>(null),[objectId,setObjectId]=useState<string|null>(null);
  const [panel,setPanel]=useState<"build"|"collection"|null>(null),[view,setView]=useState<"map"|"list">("map");
  const [parcelOpen,setParcelOpen]=useState(false),[finalOpen,setFinalOpen]=useState(false),[card,setCard]=useState<DecorationId|null>(null);
  const [resetOpen,setResetOpen]=useState(false),[today,setToday]=useState(slovakDay),[name,setName]=useState("");

  useEffect(()=>{
    let active=true;store.current=browserStore();
    const initial=store.current.load();
    const initialise=async()=>{
      if(initial.problem){if(active)setSnapshot(initial);return;}
      const result=await store.current!.write(initial,null);
      if(active){setSnapshot(result.ok?result.snapshot:initial);setSaveError(!result.ok);if(!result.ok)setNotice(result.message);setParcelOpen(!!initial.state?.pending);}
    };
    void initialise();
    const changed=(e:StorageEvent)=>{if(e.key===republicKey||e.key===null){setConflict(true);setNotice("Novší postup je otvorený v inej karte. Načítaj ho pred ďalším ťahom.");}};
    const clock=()=>setToday(slovakDay());
    window.addEventListener("storage",changed);window.addEventListener("focus",clock);
    const timer=window.setInterval(clock,60000);
    return()=>{active=false;clearInterval(timer);window.removeEventListener("storage",changed);window.removeEventListener("focus",clock);};
  },[]);
  const town=snapshot?.state?accrue(snapshot.state,today):null;
  const step=town?currentStep(town):null;
  const dailyDone=!!town?.lastProjectDay&&town.lastProjectDay>=today;

  async function refresh() {
    if(!store.current||inFlight.current)return;
    const next=store.current.load();setSnapshot(next);setConflict(false);setIntent(null);setTarget(null);setObjectId(null);
    setNotice(next.problem?"Uloženie potrebuje pozornosť.":"Načítaný najnovší uložený postup.");setSaveError(false);setRetry(null);
    setParcelOpen(!!next.state?.pending);
  }
  async function run(command:Command|null,reset=false) {
    if(!snapshot||!store.current||inFlight.current||conflict)return false;
    inFlight.current=true;setBusy(true);
    try {
      const result=await store.current.write(snapshot,command,reset);
      setNotice(result.message);
      if(!result.ok){setConflict(result.kind==="conflict");setSaveError(result.kind==="storage");setRetry(command);return false;}
      setSnapshot(result.snapshot);setSaveError(false);setRetry(null);
      if(reset){setIntent(null);setTarget(null);setObjectId(null);setPanel(null);setResetOpen(false);}
      return true;
    } finally {inFlight.current=false;setBusy(false);}
  }
  function selectBuild(id:ItemId){setIntent({kind:"build",id});setTarget(null);setObjectId(null);setPanel(null);}
  function selectCell(p:Point) {
    if(intent){setTarget(p);return;}
    const obj=town?.placed.find(o=>distance(o,p)===0);setObjectId(obj?.instanceId??null);
    if(!obj)setNotice(`Políčko ${coords(p)}. Vyber Stavať alebo Cesty.`);
  }
  function cancel(){setIntent(null);setTarget(null);}
  function backup(){if(snapshot?.raw)downloadBackup(snapshot.raw);}
  if(!snapshot)return <p className="chart-loading" role="status">Načítavame tvoju štvrť…</p>;
  if(!town)return <section className="republic republic-recovery">
    <h1>Štvrť ostala v bezpečí.</h1><p>{snapshot.problem==="unavailable"?"Prehliadač momentálne nepovolil prístup k uloženému mestu. Povoľ ukladanie pre túto stránku a skús znova.":"Uloženie je poškodené alebo pochádza z neznámej verzie. Pôvodný súbor sme neprepísali."}</p>
    <div className="republic-button-row"><button onClick={()=>void refresh()}>Skúsiť znova</button>{snapshot.raw&&<button onClick={backup}><Download size={16}/> Stiahnuť pôvodné uloženie</button>}</div>
    {snapshot.problem==="corrupt"&&<button onClick={()=>setResetOpen(true)}>Začať novú štvrť…</button>}
    {resetOpen&&<div className="republic-confirm"><p>Nový začiatok nahradí aktuálne uloženie. Najprv ho automaticky zálohujeme v tomto zariadení.</p><button disabled={busy} onClick={()=>void run(null,true)}>Potvrdiť nový začiatok</button><button onClick={()=>setResetOpen(false)}>Zrušiť</button></div>}
    <p role="status">{notice}</p>
  </section>;
  const blocked=busy||conflict;
  const object=town.placed.find(o=>o.instanceId===objectId);
  const command:Command|null=intent&&target?(intent.kind==="road"?{type:"road",target}:intent.kind==="move"?{type:"move",instanceId:intent.instanceId,target}:{type:"build",id:intent.id,target}):null;
  const preview=command?execute(town,command,today):null;
  const previewTown=preview?.ok?preview.state:town;
  const cost=intent?.kind==="build"&&!town.inventory.some(p=>p.id===intent.id)?catalog[intent.id]:{coins:0,materials:0};
  const selected=intent&&intent.kind!=="road"?intent.id:null;
  const connectedPreview=target?connected(previewTown,target):false;
  const served=target?homesServed(previewTown,target).length:0;
  const [stepCoins,stepMaterials]=stepCost(step?.id);
  const ready=!!step&&step.done(town)&&town.coins>=stepCoins&&town.materials>=stepMaterials&&!dailyDone;
  const collection=decorationIds.filter(id=>town.unlocked.includes(id));
  const activeCombos=combos(town);
  const parcel=town.pending;

  return <section className="republic" onKeyDown={e=>{if(e.key==="Escape"){cancel();setPanel(null);setObjectId(null);}}}>
    <header className="republic-heading"><div><h1>Malá republika<span>.</span></h1><p>Veľké veci začínajú v malej štvrti.</p></div><span className={saveError?"republic-save has-error":"republic-save"}>{saveError?<AlertCircle size={15}/>:<Check size={15}/>} {busy?"Ukladám…":saveError?"Neuložené":conflict?"Novší postup v inej karte":"Uložené v zariadení"}</span></header>
    {(conflict||saveError)&&<div className="republic-storage-alert" role="alert"><p>{conflict?"Iná karta zmenila mesto. Tvoj nepotvrdený ťah sa nezapísal.":notice}</p><button disabled={busy} onClick={()=>conflict?void refresh():void run(retry)}>{conflict?"Načítať novší postup":"Skúsiť uložiť znova"}</button></div>}
    <div className="republic-topline"><div><strong>{town.name}</strong><span>Projekt {town.completed.length} / 7</span></div><div className="republic-resources"><span><Coins size={16}/><b>{town.coins}</b> mincí</span><span><Boxes size={16}/><b>{town.materials}</b> materiálov</span></div></div>
    <div className="republic-layout">
      <div className="republic-stage">
        <div className="republic-view-switch" role="group" aria-label="Zobrazenie štvrte"><button aria-pressed={view==="map"} onClick={()=>setView("map")}><Map size={15}/> Mapa</button><button aria-pressed={view==="list"} onClick={()=>setView("list")}><List size={15}/> Zoznam a políčka</button><span>6 × 6 políčok</span></div>
        {view==="map"?<RepublicMap town={town} editing={!!intent} selected={selected} target={target} onCell={selectCell} onObject={setObjectId}/>:<div className="republic-list-view">
          <p>{intent?"Vyber cieľové políčko. Stavbu potvrdíš pod mapou.":"Vyber budovu na mriežke alebo v zozname."}</p>
          <div className="republic-coordinate-grid">{Array.from({length:36},(_,i)=>({x:i%6,y:Math.floor(i/6)})).map(p=>{const obj=town.placed.find(o=>distance(p,o)===0),road=town.roads.some(r=>distance(p,r)===0);return <button key={coords(p)} className={obj?"occupied":road?"road":""} aria-pressed={target?distance(target,p)===0:false} aria-label={`${coords(p)}: ${obj?catalog[obj.id].name:road?"cesta":"voľné"}`} onClick={()=>selectCell(p)}>{coords(p)}<small>{obj?catalog[obj.id].name:road?"cesta":"voľné"}</small></button>;})}</div>
          <ul className="republic-building-list">{town.placed.map(o=><li key={o.instanceId}><button onClick={()=>setObjectId(o.instanceId)}><RepublicArt id={o.id} branch={o.id==="station"?town.branch:null}/><span><b>{catalog[o.id].name}</b><small>{coords(o)} · {o.id==="plaza"?"začiatok siete":connected(town,o)?"napojené":"bez spojenia"}</small></span><ArrowRight size={16}/></button></li>)}</ul>
        </div>}
        {intent&&<div className="republic-placement">
          <div><b>{intent.kind==="road"?"Upraviť cestu":`${intent.kind==="move"?"Presunúť":"Umiestniť"}: ${catalog[intent.id].name}`}</b><button aria-label="Zrušiť umiestňovanie" onClick={cancel}><X size={18}/></button></div>
          {target?<><p>{preview?.ok?`${coords(target)} · ${connectedPreview?"napojené na námestie":"bez cesty k námestiu"}${selected&&["clinic","park","garden"].includes(selected)?` · domy v dosahu: ${served}`:""}`:preview&&!preview.ok?preview.message:""}</p>
            <div className="republic-placement-footer"><span>{cost.coins||cost.materials?`${cost.coins} mincí · ${cost.materials} materiály`:"Zadarmo"}</span><button className="republic-primary" disabled={!preview?.ok||blocked} onClick={async()=>{if(command&&await run(command)){if(intent.kind==="road")setTarget(null);else cancel();}}}>Potvrdiť {intent.kind==="move"?"presun":intent.kind==="road"?"cestu":"stavbu"}<Check size={16}/></button></div>
          </>:<p>Vyber políčko na mape alebo v zozname. {intent.kind==="move"?"Pôvodná budova zatiaľ zostáva na mieste.":intent.kind==="road"?"Klepnutie na cestu ju odstráni. Režim ostáva zapnutý, kým ho nezavrieš.":"Pred potvrdením uvidíš cenu a napojenie."}</p>}
        </div>}
        {object&&!intent&&<div className="republic-object-detail"><RepublicArt id={object.id} branch={object.id==="station"?town.branch:null} finished={town.completed.includes("opening")}/><div><h3>{object.id==="station"&&town.branch?branchNames[town.branch]:catalog[object.id].name}</h3><p>{coords(object)} · {object.id==="plaza"?"Tu začína cestná sieť.":connected(town,object)?"Napojené na námestie.":"Chýba susedná cesta vedúca k námestiu."}</p>
          {!object.fixed&&<div className="republic-button-row"><button onClick={()=>{setIntent({kind:"move",id:object.id,instanceId:object.instanceId});setTarget(null);}}><Move size={15}/> Presunúť</button><button disabled={blocked} onClick={async()=>{if(await run({type:"store",instanceId:object.instanceId}))setObjectId(null);}}><Archive size={15}/> Odložiť</button></div>}
        </div><button aria-label="Zavrieť detail budovy" onClick={()=>setObjectId(null)}><X size={17}/></button></div>}
        <div className="republic-actions">
          <button aria-expanded={panel==="build"} onClick={()=>setPanel(panel==="build"?null:"build")}><Hammer size={18}/> Stavať</button>
          <button aria-pressed={intent?.kind==="road"} onClick={()=>{setIntent(intent?.kind==="road"?null:{kind:"road"});setTarget(null);setPanel(null);}}><MapPinned size={18}/> Cesty</button>
          <button ref={parcelButton} className={town.charges||parcel?"parcel-ready":""} disabled={blocked} onClick={async()=>{setCard(null);if(parcel||await run({type:"parcel-open"}))setParcelOpen(true);}}><PackageOpen size={18}/> Zásielka <b>{parcel?"otvorená":town.charges}</b></button>
          <button aria-expanded={panel==="collection"} onClick={()=>setPanel(panel==="collection"?null:"collection")}><Archive size={18}/> Zbierka</button>
        </div>
        {panel&&<div className="republic-catalog"><div className="republic-panel-title"><h2>{panel==="build"?"Čo dnes postavíme?":"Malé detaily, vlastný svet."}</h2><button aria-label="Zavrieť katalóg" onClick={()=>setPanel(null)}><X size={18}/></button></div>
          {panel==="collection"&&collection.length===0?<p>V prvej zásielke si vyber dekoráciu. Potom ju môžeš umiestňovať opakovane.</p>:<div className="republic-build-grid">{(panel==="build"?[...buildings,...(town.completed.includes("opening")?["culture" as ItemId]:[])]:collection).map(id=>{
            const entry=catalog[id],count=town.inventory.filter(o=>o.id===id).length,affordable=!!count||town.coins>=entry.coins&&town.materials>=entry.materials;
            return <button key={id} onClick={()=>selectBuild(id)}><RepublicArt id={id}/><b>{entry.name}</b><span>{count?`V zásobe: ${count} · zadarmo`:entry.kind==="decoration"?"Odomknuté · zadarmo":`${entry.coins} mincí · ${entry.materials} mat.`}</span>{!affordable&&<small>Chýbajú zdroje</small>}</button>;
          })}</div>}
        </div>}
        <p className="republic-notice" role="status" aria-live="polite">{notice||"Tip na začiatok: postav park pri škole a pripoj ho k ceste."}</p>
      </div>
      <aside className="republic-side">
        <article className="republic-project">
          {step?<><div className="republic-person"><span aria-hidden="true">{step.speaker.slice(0,1)}</span><p><b>{step.speaker}</b><small>{roles[step.speaker as keyof typeof roles]}</small></p><span className="republic-step">Krok {town.completed.length+1}/7</span></div><h2>{step.name}</h2><p>{step.text}</p>
            <ol className="republic-progress" aria-label="Postup kapitoly">{Array.from({length:7},(_,i)=><li key={i} className={i<town.completed.length?"done":i===town.completed.length?"current":""} aria-label={`Krok ${i+1}: ${i<town.completed.length?"hotový":i===town.completed.length?"aktuálny":"neskôr"}`}/>)}</ol>
            {dailyDone&&<p className="republic-tomorrow"><Check size={16}/> Dnešný krok je hotový. Tento dokončíš zajtra; štvrť môžeš ďalej upravovať.</p>}
            <p className="republic-goal">{step.goal}{step.id==="preparation"&&<strong> {town.branch==="museum"?"Knižnica":town.branch==="market-hall"?"Tržnica":"Park alebo záhrada"} pri stanici.</strong>}</p>
            {step.id==="discovery"?<div className="republic-branches">{branches.map(branch=><button key={branch} disabled={blocked||dailyDone} onClick={()=>void run({type:"branch",branch})}><RepublicArt id="station" branch={branch}/><span><b>{branchNames[branch]}</b><small>{branch==="museum"?"Knihy a príbehy":branch==="market-hall"?"Stretnutia na trhu":"Priestor pre susedov"}</small></span><ArrowRight size={16}/></button>)}</div>:<><button className="republic-primary republic-complete" disabled={!ready||blocked} onClick={()=>void run({type:"step"})}>{step.id==="opening"?"Otvoriť stanicu":step.id==="preparation"?"Pripraviť halu":"Potvrdiť krok"}<Check size={16}/></button><small className="republic-step-cost">{stepCoins?`Cena: ${stepCoins} mincí · ${stepMaterials} materiály`:"Odmena: 2 mince · 1 materiál"}</small></>}
          </>:<div className="republic-postcard"><RepublicArt id="station" branch={town.branch} finished/><h2>Stanica znova žije.</h2><p>{town.name}<br/>{town.branch&&branchNames[town.branch]}</p><span>Sedem malých krokov. Tvoje miesto na mape.</span>{!town.finalReward&&<button className="republic-primary" onClick={()=>{setCard(null);setFinalOpen(true);}}>Vybrať finálnu dekoráciu</button>}</div>}
        </article>
        <section className="republic-orders"><h2>Dnes v štvrti</h2><p>Tri malé objednávky. Každá za 2 mince a 1 materiál.</p>{tasksFor(town).map(t=>{const claimed=taskClaimed(town,t),available=taskReady(town,t);return <button key={t} disabled={blocked||claimed||!available} onClick={()=>void run({type:"task",task:t})}><span className={claimed?"done":""}>{claimed?<Check size={15}/>:<span className="republic-dot"/>}</span><b>{taskNames[t]}</b><small>{claimed?"hotovo":available?"vyzdvihnúť":"pripraviť"}</small></button>;})}</section>
        <section className="republic-combos"><h2>Čo spolu funguje</h2>{(Object.keys(activeCombos) as (keyof typeof activeCombos)[]).map(k=><div key={k} className={activeCombos[k]?"is-ready":""}><Check size={15}/><p><b>{comboNames[k]}</b><small>{comboHints[k]}</small></p></div>)}</section>
      </aside>
    </div>
    <details className="republic-help"><summary>Pravidlá, názov štvrte a uloženie</summary><div>
      <p>Budovy potrebujú susednú cestu spojenú s námestím. Dosah 2 sa počíta po vodorovných a zvislých políčkach, nie diagonálne. Zelená bodka znamená napojenie; hnedá s pomlčkou chýbajúcu cestu.</p>
      <p>Každý deň v slovenskom čase pribudne zásielka, najviac tri do zásoby. Každá dá 8 mincí a 4 materiály; duplicitná ozdoba pridá 2 materiály navyše. Triedy zásielok: bežná 60 %, neobvyklá 25 %, vzácna 12 %, epická 3 %. Dekorácie nemenia ekonomiku.</p>
      <p>Jeden krok projektu denne. Vynechanie dní mesto nepoškodí. Hosť používa dátum zariadenia. Postup je len v tomto prehliadači; vymazanie dát stránky ho odstráni. Limit zdrojov je 999.</p>
      <form onSubmit={async e=>{e.preventDefault();if(await run({type:"rename",name}))setName("");}}><label htmlFor="republic-name">Názov štvrte</label><div className="republic-button-row"><input id="republic-name" value={name} placeholder={town.name} maxLength={40} onChange={e=>setName(e.target.value)}/><button disabled={blocked||!name.trim()}>Uložiť názov</button></div></form>
      <div className="republic-button-row"><button onClick={backup}><Download size={16}/> Stiahnuť zálohu</button><button onClick={()=>setResetOpen(true)}><Undo2 size={16}/> Nová štvrť…</button></div>
      {resetOpen&&<div className="republic-confirm"><p>Nahradiť aktuálnu štvrť novou? Súčasné uloženie najprv automaticky zálohujeme.</p><button disabled={blocked} onClick={()=>void run(null,true)}>Potvrdiť nový začiatok</button><button onClick={()=>setResetOpen(false)}>Zrušiť</button></div>}
    </div></details>
    <Dialog.Root open={parcelOpen&&!!parcel||finalOpen} onOpenChange={open=>{setParcelOpen(open&&!!parcel);setFinalOpen(open&&!parcel);if(!open)setCard(null);}}>
      <Dialog.Portal><Dialog.Overlay className="republic-dialog-overlay"/><Dialog.Content className="republic-dialog" onCloseAutoFocus={e=>{e.preventDefault();parcelButton.current?.focus();}}>
        <Dialog.Close className="republic-dialog-close" aria-label="Odložiť výber na neskôr"><X size={20}/></Dialog.Close>
        <div className="republic-parcel-heading"><PackageOpen size={26}/><span>{parcel?`${rarityNames[parcel.rarity]} zásielka`:"Dar za obnovenú stanicu"}</span></div>
        <Dialog.Title>{parcel?"Jeden detail pre tvoju štvrť.":"Vyber si svoj podpis."}</Dialog.Title>
        <Dialog.Description>{parcel?"Vyber ozdobu a potvrď. Dostaneš 8 mincí a 4 materiály, za duplikát ešte 2 materiály navyše. Ponuka na teba počká aj po zatvorení.":"Kapitola je hotová. Vyber ľubovoľnú z dvanástich dekorácií — aj epickú."}</Dialog.Description>
        <div className="republic-offer">{(parcel?parcel.cards:decorationIds).map(id=><button key={id} aria-pressed={card===id} onClick={()=>setCard(id)}><RepublicArt id={id}/><b>{catalog[id].name}</b><small>{rarityNames[offerRarity(id)]}{town.unlocked.includes(id)?parcel?" · duplikát +2 mat.":" · už v zbierke":""}</small>{card===id&&<Check size={17}/>}</button>)}</div>
        <button className="republic-primary" disabled={!card||blocked} onClick={async()=>{if(card&&await run(parcel?{type:"parcel-claim",id:card}:{type:"final",id:card})){setParcelOpen(false);setFinalOpen(false);setCard(null);}}}>{card?`Vybrať: ${catalog[card].name}`:"Vyber jednu dekoráciu"}<Check size={17}/></button>
        {saveError&&<p role="alert">Odmena sa nepotvrdila. Skús výber znova; pôvodná ponuka je zachovaná.</p>}
      </Dialog.Content></Dialog.Portal>
    </Dialog.Root>
  </section>;
}
