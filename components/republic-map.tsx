"use client";

import { Building2, Bus, Cross, House, Landmark, Library, School, Store, Trees, Wrench } from "lucide-react";
import { catalog, connected, type ItemId, type Point, type RepublicState } from "@/lib/republic";

function Icon({ id }: { id: ItemId }) {
  const props = { size: 18, strokeWidth: 1.8, "aria-hidden": true as const };
  if (id === "house") return <House {...props} />;
  if (id === "school") return <School {...props} />;
  if (id === "library") return <Library {...props} />;
  if (id === "clinic") return <Cross {...props} />;
  if (id === "market") return <Store {...props} />;
  if (id === "workshop") return <Wrench {...props} />;
  if (id === "park" || id === "garden" || id === "linden") return <Trees {...props} />;
  if (id === "station") return <Bus {...props} />;
  if (id === "town-hall" || id === "plaza") return <Landmark {...props} />;
  return <Building2 {...props} />;
}

const at = (p: Point) => ({ cx: 300 + (p.x - p.y) * 46, cy: 50 + (p.x + p.y) * 25 });

export default function RepublicMap({ town, mode, selected, onCell, onObject }: { town: RepublicState; mode: "build" | "roads" | "browse"; selected: ItemId | null; onCell: (p: Point) => void; onObject: (id: string) => void }) {
  const cells = Array.from({ length: 36 }, (_, i) => ({ x: i % 6, y: Math.floor(i / 6) }));
  const cellLabel = (p: Point) => mode === "roads" ? `Upraviť cestu na súradnici ${p.x + 1}, ${p.y + 1}` : selected ? `Umiestniť ${catalog[selected].name} na súradnici ${p.x + 1}, ${p.y + 1}` : undefined;
  return <div className={`republic-map mode-${mode}`}>
    <svg viewBox="0 0 600 355" role="img" aria-label="Interaktívna mapa Lipovej štvrte. Vyber stavbu a potom dlaždicu na mape." preserveAspectRatio="xMidYMid meet">
      <defs><linearGradient id="grass" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#dfe8c9" /><stop offset="1" stopColor="#c3d3a3" /></linearGradient><filter id="shadow"><feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#34503e" floodOpacity=".2" /></filter></defs>
      <path d="M88 35h424a28 28 0 0 1 28 28v229a28 28 0 0 1-28 28H88a28 28 0 0 1-28-28V63a28 28 0 0 1 28-28Z" fill="url(#grass)" />
      {cells.map(p => <Cell key={`${p.x}-${p.y}`} point={p} mode={mode} occupied={town.placed.some(o => o.x === p.x && o.y === p.y)} road={town.roads.some(o => o.x === p.x && o.y === p.y)} label={cellLabel(p)} onCell={onCell} />)}
      {town.placed.slice().sort((a, b) => (a.x + a.y) - (b.x + b.y)).map(o => <TownObject key={o.instanceId} town={town} object={o} onObject={onObject} />)}
    </svg>
    <p className="republic-map-caption">{mode === "roads" ? "Ťukni na voľné miesto a polož alebo odstráň cestu." : selected ? `Vybrané: ${catalog[selected].name}. Ťukni na voľné políčko.` : "Ťukni na budovu a pozri si jej stav. Zelená bodka znamená napojenie."}</p>
  </div>;
}

function Cell({ point, mode, occupied, road, label, onCell }: { point: Point; mode: "build" | "roads" | "browse"; occupied: boolean; road: boolean; label?: string; onCell: (p: Point) => void }) {
  const { cx, cy } = at(point);
  const keyDown = (e: React.KeyboardEvent<SVGGElement>) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onCell(point); } };
  return <g className={`republic-cell${occupied ? " is-occupied" : ""}${road ? " is-road" : ""}`} onClick={() => onCell(point)} tabIndex={mode === "browse" ? -1 : 0} role={mode === "browse" ? undefined : "button"} aria-label={label} onKeyDown={keyDown}>
    <polygon points={`${cx},${cy - 25} ${cx + 46},${cy} ${cx},${cy + 25} ${cx - 46},${cy}`} fill={road ? "#ccb88b" : "#d4dfb8"} />
    <polygon points={`${cx},${cy - 22} ${cx + 40},${cy} ${cx},${cy + 22} ${cx - 40},${cy}`} fill={road ? "#eee3c8" : "#e8efd8"} />
    {mode !== "browse" && !occupied && <polygon className="republic-cell-focus" points={`${cx},${cy - 18} ${cx + 32},${cy} ${cx},${cy + 18} ${cx - 32},${cy}`} fill="transparent" />}
  </g>;
}

function TownObject({ town, object, onObject }: { town: RepublicState; object: RepublicState["placed"][number]; onObject: (id: string) => void }) {
  const { cx, cy } = at(object); const active = connected(town, object);
  const keyDown = (e: React.KeyboardEvent<SVGGElement>) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onObject(object.instanceId); } };
  const roof = object.id === "school" ? "#b84e3a" : object.id === "library" ? "#345f77" : object.id === "clinic" ? "#c85b50" : object.id === "station" ? "#78614d" : "#b96845";
  return <g className={`republic-object object-${object.id}${active ? " is-connected" : ""}`} transform={`translate(${cx} ${cy})`} onClick={e => { e.stopPropagation(); onObject(object.instanceId); }} role="button" tabIndex={0} aria-label={`${catalog[object.id].name}${object.fixed ? ", pevný bod" : ""}${active ? ", zapojené" : ""}`} onKeyDown={keyDown} filter="url(#shadow)">
    <ellipse cy="9" rx="31" ry="13" fill="#6e845f" opacity=".24" />
    {object.id === "park" || object.id === "garden" ? <><circle cx="-12" cy="-13" r="16" fill="#567a4c" /><circle cx="8" cy="-18" r="20" fill="#6b914f" /><rect x="-3" y="-4" width="8" height="19" rx="2" fill="#795b36" /></> : object.id === "plaza" ? <><path d="M-30 0 0-18 30 0 0 18Z" fill="#e9e0c7" /><circle cy="-2" r="7" fill="#84a4a2" /></> : <><path d="M-25 2v-28L0-40 25-26V2Z" fill={object.id === "clinic" ? "#f2e8dc" : object.id === "station" ? "#d8c2a3" : object.id === "town-hall" ? "#f1dfbd" : "#f4eddd"} /><path d="M-30-25 0-46 30-25 0-10Z" fill={roof} /><rect x="-7" y="-13" width="14" height="15" rx="2" fill="#72583e" /><Icon id={object.id} /></>}
    <text y="30" textAnchor="middle" className="republic-object-label">{catalog[object.id].name}</text>
    {!object.fixed && <circle className="republic-object-dot" cx="25" cy="-28" r="5" fill={active ? "#325f4d" : "#b15c47"} />}
  </g>;
}
