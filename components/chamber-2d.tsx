"use client";

import { useRef, type CSSProperties, type PointerEvent } from "react";
import { chamberSeats, rowRadius, CHAMBER } from "@/lib/parliament-model";

/*
  Sála zhora v 2D: tých istých 150 miest ako v 3D modeli (chamberSeats, aj s uličkami medzi sektormi), takže kreslo
  poslanca je na rovnakom mieste v 2D aj v 3D. Ľahký úvod stránky Parlament a záloha bez WebGL.
  - Pri prvom zobrazení sa kreslá zbehnú od rečníckeho pultu na miesta; zmena farieb ide vlnou zľava doprava
    (rovnaké časovanie ako vlna v 3D, lib/parliament-experience.ts). Pri obmedzenom pohybe bez animácií.
  - Ťuknutie vyberie najbližšie kreslo (body sú malé, preto výber podľa vzdialenosti, nie po bodoch).
*/
const S = 1000, R = 9.6;
const seats = chamberSeats.map(s => ({ x: Math.round(s.x * S * 10) / 10, y: Math.round(s.z * S * 10) / 10 }));
const rows = Array.from({ length: CHAMBER.ROWS }, (_, k) => Math.round((rowRadius(k) + .004) * S));
const arc = (r: number) => `M ${-r} 0 A ${r} ${r} 0 0 1 ${r} 0`;

export default function Chamber2D({ colors, label, spotlight = null, rings, dim, onSeat, className = "" }: {
  colors: string[]; label: string; spotlight?: number | null; rings?: ReadonlySet<number>; dim?: ReadonlySet<number> | null;
  onSeat?: (seat: number) => void; className?: string;
}) {
  const svg = useRef<SVGSVGElement>(null);
  const press = useRef<{ x: number; y: number } | null>(null);
  const pick = (e: PointerEvent<SVGSVGElement>) => {
    const start = press.current; press.current = null;
    if (!onSeat || !start || Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) return;
    const m = svg.current?.getScreenCTM();
    if (!m) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse());
    let best = -1, dist = 22 ** 2;
    seats.forEach((s, i) => { const d = (s.x - p.x) ** 2 + (s.y - p.y) ** 2; if (d < dist) { dist = d; best = i; } });
    if (best >= 0) onSeat(best);
  };
  return <svg ref={svg} className={`chamber2d ${className}`} viewBox="-322 -322 644 372" role="img" aria-label={label}
    onPointerDown={e => { press.current = { x: e.clientX, y: e.clientY }; }} onPointerUp={pick} onPointerCancel={() => { press.current = null; }}>
    <g className="chamber2d-floor" aria-hidden="true">
      <path className="chamber2d-rim" d="M -312 0 A 312 312 0 0 1 312 0 L 312 40 L -312 40 Z"/>
      {rows.map(r => <path key={r} d={arc(r)}/>)}
      <rect x="-46" y="14" width="92" height="18" rx="5"/>
      <rect x="-20" y="-4" width="40" height="11" rx="3"/>
    </g>
    <g className="chamber2d-seats">
      {seats.map((s, i) => <g key={i} className="chamber2d-seat" data-dim={dim?.has(i) || undefined}
        style={{ "--d": `${Math.round(i / 149 * 650)}ms`, "--fx": `${-s.x}px`, "--fy": `${22 - s.y}px` } as CSSProperties}>
        <circle className="chamber2d-dot" cx={s.x} cy={s.y} r={R} fill={colors[i] ?? "#7d857f"}/>
        <path className="chamber2d-back" d={`M ${s.x - 5} ${s.y + 2} Q ${s.x} ${s.y + 5.5} ${s.x + 5} ${s.y + 2}`} aria-hidden="true"/>
      </g>)}
    </g>
    {rings && <g className="chamber2d-rings" aria-hidden="true">{[...rings].map(i => seats[i] && <circle key={i} cx={seats[i].x} cy={seats[i].y} r={R + 4.2}/>)}</g>}
    {spotlight !== null && seats[spotlight] && <g className="chamber2d-spot" aria-hidden="true">
      <circle cx={seats[spotlight].x} cy={seats[spotlight].y} r={R + 7}/>
      <circle className="chamber2d-spot-pulse" cx={seats[spotlight].x} cy={seats[spotlight].y} r={R + 7}/>
    </g>}
  </svg>;
}
