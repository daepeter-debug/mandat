"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Check, Download, Plus, RotateCcw, Share2 } from "lucide-react";
import { aggregateAsPoll, aggregateLastDate } from "@/lib/aggregate";
import { MAJORITY } from "@/lib/blocs";
import { minimalMajorities } from "@/lib/coalitions";
import { hemicycleSeats, scenarioFromPoll } from "@/lib/parliament";
import { date } from "@/lib/polls";
import "@/app/coalition-lab.css";

/*
  Úvod: zostavte vlastnú koalíciu. Polkruh sa pri výbere vyfarbí vlnou zľava doprava, pri 76 kreslách
  zasvieti väčšina. Pod ním sú cesty k väčšine (najmenšie väčšinové kombinácie, lib/coalitions.ts),
  ktoré obsahujú vybrané strany, a obrázok výberu na stiahnutie alebo zdieľanie.
*/
const scenario = scenarioFromPoll(aggregateAsPoll());
const rows = scenario.rows;
const points = hemicycleSeats(150, 6);
const allPaths = minimalMajorities(rows);
const byId = Object.fromEntries(rows.map(r => [r.id, r]));

function drawImage(selected: string[], count: number): HTMLCanvasElement {
  const W = 1200, H = 630, canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const css = getComputedStyle(document.documentElement);
  const deep = css.getPropertyValue("--mag-deep").trim() || "#1f3a30";
  const font = `"IBM Plex Sans Variable", "Segoe UI", sans-serif`;
  ctx.fillStyle = deep; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#c3d6c9"; ctx.font = `600 26px ${font}`; ctx.fillText("MOJA KOALÍCIA", 64, 92);
  ctx.fillStyle = "#f3f8ed"; ctx.font = `600 150px ${font}`; ctx.fillText(String(count), 58, 250);
  ctx.fillStyle = "#c3d6c9"; ctx.font = `500 30px ${font}`; ctx.fillText("zo 150 kresiel", 64, 300);
  ctx.fillStyle = count >= MAJORITY ? "#dcf59b" : "#f0c9a8"; ctx.font = `650 30px ${font}`;
  ctx.fillText(count >= MAJORITY ? `väčšina ${MAJORITY} ✓` : `do väčšiny chýba ${MAJORITY - count}`, 64, 350);
  let y = 420;
  ctx.font = `600 28px ${font}`;
  for (const id of selected) {
    const r = byId[id]; if (!r) continue;
    ctx.fillStyle = r.color; ctx.beginPath(); ctx.arc(76, y - 9, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#f3f8ed"; ctx.fillText(`${r.short}  ${r.seats}`, 98, y); y += 44;
  }
  const ordered = [...rows.filter(r => selected.includes(r.id)), ...rows.filter(r => !selected.includes(r.id))];
  const colours = ordered.flatMap(r => Array.from({ length: r.seats }, () => selected.includes(r.id) ? r.color : "#3d5a4d"));
  const cx = 860, cy = 440, R = 290;
  points.forEach((p, i) => { ctx.fillStyle = colours[i] ?? "#3d5a4d"; ctx.beginPath(); ctx.arc(cx + p.x * R, cy + p.y * R, 10.5, 0, Math.PI * 2); ctx.fill(); });
  ctx.fillStyle = "#9fb8a8"; ctx.font = `500 20px ${font}`;
  ctx.fillText(`Model Mandát k ${date(aggregateLastDate)} · scenár, nie predpoveď · ${location.host}`, 64, 590);
  return canvas;
}

export default function CoalitionLab({ onNavigate }: { onNavigate: (view: string) => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const count = rows.filter(r => selected.includes(r.id)).reduce((a, r) => a + r.seats, 0);
  const reached = count >= MAJORITY;
  const ordered = [...rows.filter(r => selected.includes(r.id)), ...rows.filter(r => !selected.includes(r.id))];
  const colours = ordered.flatMap(r => Array.from({ length: r.seats }, () => selected.includes(r.id) ? r.color : null));
  const paths = useMemo(() => (selected.length ? allPaths.filter(p => selected.every(id => p.ids.includes(id))) : allPaths).slice(0, 6), [selected]);
  const toggle = (id: string) => { setMessage(""); setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]); };

  async function share() {
    const canvas = drawImage(selected, count);
    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, "image/png"));
    if (!blob) return;
    const file = new File([blob], "moja-koalicia.png", { type: "image/png" });
    try {
      if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: "Moja koalícia · Mandát" }); return; }
    } catch { return; }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = file.name; a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("Obrázok je uložený medzi stiahnutými súbormi.");
  }

  return <section className="mag-lab coalition-lab" id="koalicia">
    <div className="mag-lab-copy"><h2>Zostavte <br/>vlastnú <br/><span>koalíciu.</span></h2><p>Vyberte ľubovoľné strany alebo jednu z ciest k väčšine. Zistite, koľko kresiel by spolu získali v scenári z Modelu Mandát.</p><button className="mag-button lime" onClick={() => onNavigate("model")}>Vyskúšať vlastný model <ArrowUpRight size={20}/></button><p className="mag-lab-disclaimer">Výber je čisto matematický. Nehovorí nič o ochote strán spolupracovať.</p></div>
    <div className="mag-lab-play">
      <div className={`cl-top ${reached ? "is-majority" : ""}`}>
        <div className="mag-coalition-count" role="status"><b key={reached ? "yes" : "no"}>{count}</b><span>zo 150 kresiel<br/>{selected.length === 0 ? "Začnite výberom strán" : reached ? <em className="cl-badge">Väčšina {MAJORITY} ✓</em> : `Do ${MAJORITY} chýba ${MAJORITY - count}`}</span></div>
        <svg className="cl-hemi" viewBox="-1.06 -1.08 2.12 1.12" aria-hidden="true">
          <line x1="0" y1="-1.07" x2="0" y2="-0.36" className="cl-hemi-line"/>
          {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={0.036} style={{ fill: colours[i] ?? undefined, transitionDelay: `${i * 3}ms` }} className={colours[i] ? "is-on" : ""}/>)}
        </svg>
      </div>
      <div className="mag-coalition-buttons">{rows.map(p => <button key={p.id} aria-pressed={selected.includes(p.id)} onClick={() => toggle(p.id)}>{selected.includes(p.id) ? <Check size={17}/> : <Plus size={17}/>}<span>{p.short}</span><b>{p.seats}</b></button>)}</div>
      <div className="cl-paths">
        <h3>{selected.length ? "Cesty k väčšine s vaším výberom" : "Najkratšie cesty k väčšine"}</h3>
        {paths.length ? <ul>{paths.map(p => <li key={p.ids.join()}><button type="button" onClick={() => { setMessage(""); setSelected(p.ids); }} aria-label={`Vybrať ${p.ids.map(id => byId[id]?.short).join(", ")}, ${p.seats} kresiel`}>
          <span className="cl-path-bar" aria-hidden="true">{p.ids.map(id => <i key={id} style={{ flexGrow: byId[id]?.seats, background: byId[id]?.color }}/>)}</span>
          <span className="cl-path-names">{p.ids.map(id => byId[id]?.short).join(" + ")}</span>
          <b>{p.seats}</b>
        </button></li>)}</ul> : <p className="cl-none">S týmto výberom nevedie k {MAJORITY} kreslám žiadna najmenšia väčšina; skúste niektorú stranu odobrať.</p>}
      </div>
      <div className="cl-actions">
        {selected.length > 0 && <><button type="button" className="cl-share" onClick={share}>{typeof navigator !== "undefined" && "share" in navigator ? <Share2 size={16}/> : <Download size={16}/>} Obrázok výberu</button><button type="button" className="cl-reset" onClick={() => { setSelected([]); setMessage(""); }}><RotateCcw size={15}/> Vymazať</button></>}
        {message && <span role="status">{message}</span>}
        <button className="mag-text-link" onClick={() => onNavigate("method")}>Metodika agregátora <ArrowUpRight size={15}/></button>
      </div>
    </div>
  </section>;
}
