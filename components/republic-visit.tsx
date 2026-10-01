"use client";

import { useState } from "react";
import { ArrowLeft, Copy, House, Share2, Users } from "lucide-react";
import { catalog, branchNames, type RepublicState } from "@/lib/republic";
import { decodeVisit, visitUrl } from "@/lib/republic-visit";
import { homeWishes } from "@/lib/republic-trust";
import RepublicMap from "@/components/republic-map";
import { RepublicIllustrations } from "@/components/republic-art";
import "@/app/republic-visit.css";

export function ShareNeighbourhood({ town }: { town: RepublicState }) {
  const [url, setUrl] = useState(""), [message, setMessage] = useState("");
  async function share() {
    try {
      const link = visitUrl(town); setUrl(link);
      if (navigator.share) {
        try { await navigator.share({ title: town.name, text: "Príď sa pozrieť do mojej Malej republiky.", url: link }); setMessage("Odkaz pripravený na návštevu."); return; }
        catch (error) { if (error instanceof Error && error.name === "AbortError") return; }
      }
      await copy(link);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Odkaz sa nepodarilo pripraviť."); }
  }
  async function copy(link = url) {
    try { await navigator.clipboard.writeText(link); setMessage("Odkaz skopírovaný. Sused uvidí iba podobu štvrte."); }
    catch { setMessage("Skopíruj odkaz z poľa. Tvoj postup ani zásoby sa nezdieľajú."); }
  }
  return <div className="republic-share">
    <button type="button" className="republic-share-button" onClick={()=>void share()}><Share2 size={16} aria-hidden="true"/> Pozvať suseda</button>
    {url && <div className="republic-share-link"><label htmlFor="republic-visit-link">Odkaz na tvoju štvrť</label><div><input id="republic-visit-link" readOnly value={url} onFocus={e=>e.target.select()}/><button type="button" onClick={()=>void copy()} aria-label="Skopírovať odkaz"><Copy size={17}/></button></div><small>Je to snímka štvrte v tejto chvíli. Nové stavby vytvoria nový odkaz.</small></div>}
    {message && <p role="status">{message}</p>}
  </div>;
}

/** Deliberately mounts no storage adapter, election component or game-command handler. */
export default function RepublicVisit({ code, onReturn }: { code: string; onReturn: ()=>void }) {
  const town = decodeVisit(code), [selected, setSelected] = useState<string|null>(null);
  const object = town?.placed.find(p=>p.instanceId===selected);
  return <RepublicIllustrations.Provider value><section className="republic republic-visit" data-focus="true">
    <header className="republic-visit-heading"><div><h1>{town?.name ?? "Odkaz je poškodený"}</h1><p><Users size={17} aria-hidden="true"/> Štvrť od suseda · iba na prezeranie</p></div><button type="button" className="republic-share-button" onClick={onReturn}><ArrowLeft size={16}/> Späť do mojej štvrte</button></header>
    {town ? <><p className="republic-visit-note">Prezri si, čo sused postavil. Jeho štvrť tu neupravuješ a tvoj vlastný postup ostáva nedotknutý.</p>
      <RepublicMap town={town} editing={false} selected={null} target={null} onCell={()=>setSelected(null)} onObject={setSelected} wishes={homeWishes(town)}/>
      <div className="republic-visit-caption"><p>Projekt <b>{town.completed.length} zo 7 krokov</b>{town.branch && <> · {branchNames[town.branch]}</>}</p>{object && <p role="status">{catalog[object.id].name} · {String.fromCharCode(65+object.x)}{object.y+1}</p>}</div>
    </> : <p className="republic-visit-note" role="alert">Tento odkaz je neúplný alebo neplatný. Vyžiadaj si od suseda nový. Tvoja uložená štvrť sa nezmenila.</p>}
    <div className="republic-visit-footer"><div><h2>Aká bude tvoja štvrť?</h2><p>Postav domy, prepoj susedov a priprav vlastnú slávnosť.</p></div><button type="button" className="plan-now-button" onClick={onReturn}><House size={18}/> Postaviť si vlastnú</button></div>
  </section></RepublicIllustrations.Provider>;
}
