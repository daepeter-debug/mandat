"use client";
import {useState} from "react";
import {ArrowUpRight,BookOpen,FileText,Info,Check,Clock3} from "lucide-react";
import {parties,date} from "@/lib/polls";
import {programmes,programmeTopics,positions,statusLabel,type Programme} from "@/lib/programmes";
import {MobileCollapse} from "@/components/mobile-fold";
import "@/app/programmes-mobile.css";

function DocumentLink({document}:{document:Programme}) {
  return <a className="document-open" href={document.url} target="_blank" rel="noopener noreferrer">Otvoriť pôvodný {document.format==="PDF"?"dokument":"zdroj"}<ArrowUpRight size={17}/><span className="sr-only"> v novej karte</span></a>;
}

function Status({document}:{document:Programme}) {
  return <span className={`programme-status status-${document.status}`}>{document.status==="archive-2023"&&<Clock3 size={13}/>} {statusLabel[document.status]}</span>;
}

export function PartyDocuments({partyId}:{partyId:string}) {
  const docs=programmes.filter(p=>p.partyId===partyId).sort((a,b)=>Number(a.status==="archive-2023")-Number(b.status==="archive-2023"));
  return <section className="profile-documents"><h3>Programové dokumenty</h3>{docs.length ? docs.map(d=><article key={d.url}><Status document={d}/><h4>{d.title}</h4><p>{d.note}</p><DocumentLink document={d}/></article>) : <div className="editor-note"><BookOpen size={22}/><h3>Dokument zatiaľ nie je overený</h3><p>V archíve ešte nemáme overený program tejto strany. Neznamená to, že ho strana nemá.</p></div>}</section>;
}

function ProgrammeMatrix() {
  const availablePartyIds=[...new Set(programmes.map(p=>p.partyId))];
  const [selected,setSelected]=useState(["ps","kdh","dem"]);
  const [topic,setTopic]=useState("Ekonomika a dane");
  const toggle=(id:string)=>setSelected(current=>current.includes(id)?(current.length>2?current.filter(x=>x!==id):current):(current.length<3?[...current,id]:current));
  return <section className="programme-matrix" aria-labelledby="matrix-title">
    <div className="matrix-intro"><div><h2 id="matrix-title">Porovnajte ich vedľa seba.</h2><p>Vyberte dve alebo tri strany a jednu tému. Každý bod je skrátený z označeného pôvodného zdroja.</p></div><div className="matrix-rule"><Info size={18}/><p>Aktuálna iniciatíva nie je automaticky volebný program 2027. Prázdne miesto znamená, že sme pre túto tému zatiaľ nenašli overený aktuálny dokument.</p></div></div>
    <div className="matrix-controls"><div role="group" aria-label="Vybrať dve alebo tri strany" className="matrix-parties">{availablePartyIds.map(id=>{const p=parties.find(x=>x.id===id)!;const chosen=selected.includes(id);return <button key={id} aria-pressed={chosen} aria-disabled={!chosen&&selected.length===3} onClick={()=>toggle(id)}><i style={{background:p.color}}/>{chosen&&<Check size={14}/>} {p.short}</button>})}</div><div role="group" aria-label="Vybrať tému" className="matrix-topics">{programmeTopics.map(t=><button key={t} aria-pressed={topic===t} onClick={()=>setTopic(t)}>{t}</button>)}</div></div>
    <div className="matrix-grid">{selected.map(id=>{const party=parties.find(p=>p.id===id)!;const position=positions.find(p=>p.partyId===id&&p.topic===topic);return <article key={id}><header><span className="party-label"><i style={{background:party.color}}/>{party.name}</span>{position&&<span className={`programme-status status-${position.status}`}>{statusLabel[position.status]}</span>}</header>{position?<><ul>{position.bullets.map(b=><li key={b}>{b}</li>)}</ul><a className="source-link" href={position.source} target="_blank" rel="noopener noreferrer">{position.sourceTitle}<ArrowUpRight size={14}/></a><time dateTime={position.asOf}>Stav zdroja {date(position.asOf)}</time></>:<div className="matrix-empty"><BookOpen size={22}/><strong>Zatiaľ bez overeného aktuálneho postoja</strong><p>Starší program môže byť v archíve nižšie, ale nebudeme ho vydávať za dnešný návrh.</p></div>}</article>})}</div>
  </section>;
}

function ProgrammeCard({document}:{document:Programme}) {
  const party=parties.find(p=>p.id===document.partyId)!;
  return <article className="programme-card"><div className="document-meta"><span className="party-label"><i style={{background:party.color}}/>{document.author}</span><span><FileText size={14}/>{document.format}</span></div><Status document={document}/><div className="programme-title"><h3>{document.title}</h3></div><p className="programme-description">{document.description}</p><div className="programme-topics">{document.topics.map(t=><span key={t}>{t}</span>)}</div><div className="document-context"><Info size={15}/><p>{document.note}</p></div><DocumentLink document={document}/><div className="document-verified"><span>{new URL(document.url).hostname.replace("www.","")}</span><span>Overené {date(document.verified)}</span></div>{document.contextUrl&&<a className="source-link" href={document.contextUrl} target="_blank" rel="noopener noreferrer">Kontext a časové zaradenie<ArrowUpRight size={13}/></a>}</article>;
}

export default function ProgrammeLibrary() {
  const current=programmes.filter(p=>p.status!=="archive-2023");
  const archive=programmes.filter(p=>p.status==="archive-2023");
  return <>
    <section className="intro programme-hero"><div><h1>Programy strán <em>vtedy a dnes.</em></h1><p className="intro-description">Oddelený archív volieb 2023, priebežne overované nové návrhy a porovnanie konkrétnych tém bez predstierania, že každá strana už má hotový program 2027.</p></div><div className="programme-legend"><span><i className="current"/>Aktuálne návrhy</span><span><i className="archive"/>Archív 2023</span><p>Žiadny dokument tu neoznačíme ako program 2027, kým ho tak neoznačí samotná strana.</p></div></section>
    <ProgrammeMatrix/>
    <section className="programme-shelf"><div className="programme-shelf-head"><h2>Aktuálne návrhy a rozpracované programy</h2><p>{current.length} overených zdrojov · rôzny rozsah a stav rozpracovania</p></div><div className="programme-grid">{current.map(d=><ProgrammeCard key={d.url} document={d}/>)}</div></section>
    <MobileCollapse label="Archív volieb 2023" hint={`${archive.length} dokumentov na kontrolu a porovnanie`}><section className="programme-shelf archive-shelf"><div className="programme-shelf-head"><h2>Archív volieb 2023</h2><p>Historické dokumenty pre kontrolu a porovnanie. Nie sú prezentované ako dnešné sľuby.</p></div><div className="programme-grid">{archive.map(d=><ProgrammeCard key={d.url} document={d}/>)}</div></section></MobileCollapse>
    <div className="program-coverage"><h3>Pokrytie rastie priebežne</h3><p>Aktuálny dokument zatiaľ chýba pri: {parties.filter(p=>!programmes.some(d=>d.partyId===p.id&&d.status!=="archive-2023")).map(p=>p.short).sort((a,b)=>a.localeCompare(b,"sk")).join(", ")}. Je to stav nášho archívu, nie tvrdenie, že tieto subjekty nemajú návrhy.</p></div>
  </>;
}
