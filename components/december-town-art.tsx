"use client";

import { useRef, useState } from "react";
import { Check, GraduationCap, HeartPulse, Route, X } from "lucide-react";
import { seasonOf, type Flag } from "@/lib/december-game";
import "@/app/december-town-art.css";

const improvements: Partial<Record<Flag, string>> = {
  "bridge-fixed": "Most opravený", "bridge-temp": "Most dočasne zabezpečený", playground: "Nové ihrisko",
  "gym-tarp": "Strecha pod plachtou", "gym-roof": "Nová strecha telocvične", "clinic-wing": "Nový ultrazvuk",
  ambulance: "Stanovište záchranky", led: "Úsporné osvetlenie", bus: "Podporená doprava", fountain: "Pitné fontánky",
  market: "Mestské trhy", tree: "Vianočný stromček", "flood-wall": "Protipovodňová hrádza", flooded: "Zaplavené ulice",
  "bike-path": "Nová cyklotrasa", trees: "Obnovená alej", boiler: "Nový školský kotol", pool: "Opravené kúpalisko", path: "Chodník ku škole",
};
const places = [
  { id: "school", name: "Škola", Icon: GraduationCap, flags: ["playground", "gym-tarp", "gym-roof", "boiler", "pool", "path"] as Flag[] },
  { id: "clinic", name: "Poliklinika", Icon: HeartPulse, flags: ["clinic-wing", "ambulance", "fountain", "trees"] as Flag[] },
  { id: "bridge", name: "Mesto a doprava", Icon: Route, flags: ["bridge-fixed", "bridge-temp", "led", "bus", "flood-wall", "flooded", "bike-path", "market", "tree"] as Flag[] },
];
export default function DecemberTown({ month, flags, decorative = false, className = "", label = "Ilustrované Mandátovce" }: { month: number; flags: Flag[]; decorative?: boolean; className?: string; label?: string }) {
  const [selected, setSelected] = useState<string | null>(null);
  const markers = useRef<Record<string, HTMLButtonElement | null>>({});
  const closeDetail = () => {
    if (selected) markers.current[selected]?.focus();
    setSelected(null);
  };
  const season = seasonOf(month);
  const place = places.find(p => p.id === selected);
  return <div className={`december-town town-art ${className}`}>
    <div className={`town-art-scene town-season-${season}`} role={decorative ? undefined : "img"} aria-hidden={decorative || undefined} aria-label={decorative ? undefined : `${label} Ilustrácia mesta v ročnom období; investície zobrazujú značky budov.`}/>
    {!decorative && <>
      <div className="town-art-controls" aria-label="Preskúmaj investície v meste">{places.map(p => {
        const count = flags.filter(f => p.flags.includes(f)).length;
        return <button type="button" key={p.id} ref={node => { markers.current[p.id] = node; }} className={`town-marker town-marker-${p.id}${count ? " has-investment" : ""}`} aria-expanded={selected === p.id} aria-label={`${p.name}: ${count} zmien. Zobraziť detail.`} onClick={() => setSelected(selected === p.id ? null : p.id)}><p.Icon size={17} aria-hidden="true"/>{count > 0 && <span>{count}</span>}</button>;
      })}</div>
      {place && <div className="town-detail" onKeyDown={e => { if (e.key === "Escape") closeDetail(); }}><div><b>{place.name}</b><button type="button" aria-label="Zavrieť detail budovy" onClick={closeDetail}><X size={16}/></button></div>{flags.some(f => place.flags.includes(f)) ? <ul>{flags.filter(f => place.flags.includes(f)).map(f => <li key={f}><Check size={13} aria-hidden="true"/>{improvements[f]}</li>)}</ul> : <p>Zatiaľ bez zaznamenanej investície.</p>}</div>}
      <p className="town-caption">Ťukni na značku a pozri, čo sa v meste zmenilo.</p>
    </>}
  </div>;
}
