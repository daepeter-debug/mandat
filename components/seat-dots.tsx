"use client";

import { useEffect, useRef, useState } from "react";
import { DOTS, SIMULATIONS } from "@/lib/uncertainty";
import "@/app/seat-dots.css";

/*
  Bodkový graf neistoty (kvantilový dot plot): 20 bodiek, každá zastupuje 5 % z 2 000 prepočtov kresiel
  (lib/uncertainty.ts). Rovnaké hodnoty sa ukladajú na seba, takže je vidno, kde prepočty padali najčastejšie.
  Voliteľná zvislá čiara (napr. väčšina 76) ukáže, koľko bodiek ju prekročilo.
*/
export type DotRow = { key: string; label: string; dots: number[]; color?: string; tone?: "coalition" | "opposition" };
const W = 320, PAD = 18, MAX_STACK = 6;

export default function SeatDots({ rows, line, caption, zeroNote }: { rows: DotRow[]; line?: { value: number; label: string }; caption: string; zeroNote?: boolean }) {
  const values = rows.flatMap(r => r.dots).concat(line ? [line.value] : []);
  const lo = Math.min(...values) - 1, hi = Math.max(...values) + 1;
  const step = (W - PAD * 2) / Math.max(1, hi - lo);
  const r = Math.max(2.4, Math.min(5.5, step / 2 - 0.6));
  const gap = r * 2 + 1.4;
  const x = (v: number) => PAD + (v - lo) * step;
  const stacks = rows.map(row => {
    const counts = new Map<number, number>(), seen = new Map<number, number>();
    for (const v of row.dots) counts.set(v, (counts.get(v) ?? 0) + 1);
    return row.dots.map(v => {
      const n = seen.get(v) ?? 0; seen.set(v, n + 1);
      const cols = Math.ceil((counts.get(v) ?? 1) / MAX_STACK), col = Math.floor(n / MAX_STACK);
      return { v, k: n % MAX_STACK, dx: (col - (cols - 1) / 2) * gap };
    });
  });
  const rowHeights = stacks.map(s => (Math.max(...s.map(d => d.k)) + 1) * gap + (rows.length > 1 ? 16 : 4));
  const tops = rowHeights.map((_, i) => rowHeights.slice(0, i).reduce((a, b) => a + b, 0));
  const y0 = rowHeights.reduce((a, b) => a + b, 0);
  const H = y0 + 22;
  const tickStep = hi - lo <= 12 ? 2 : hi - lo <= 30 ? 5 : 10;
  const ticks = Array.from({ length: Math.floor(hi / tickStep) - Math.ceil(lo / tickStep) + 1 }, (_, i) => (Math.ceil(lo / tickStep) + i) * tickStep).filter(t => t > lo && t < hi && (!line || Math.abs(t - line.value) >= tickStep / 2));
  const perDot = SIMULATIONS / DOTS;
  const summary = rows.map(row => {
    const sorted = [...row.dots].sort((a, b) => a - b);
    const zeros = sorted.filter(v => v === 0).length;
    const over = line ? sorted.filter(v => v >= line.value).length : null;
    return `${row.label}: od ${sorted[0]} do ${sorted.at(-1)} kresiel${zeros ? `, ${zeros} z ${DOTS} bodiek mimo parlamentu` : ""}${over !== null ? `, ${over} z ${DOTS} bodiek na ${line!.value} a viac` : ""}`;
  }).join("; ");
  return <figure className="seat-dots">
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${caption} ${summary}.`}>
      {rows.map((row, ri) => {
        const top = tops[ri], base = top + rowHeights[ri] - 4;
        return <g key={row.key}>
          {rows.length > 1 && <text x={PAD} y={top + 10} className={`seat-dots-label${row.tone ? ` is-${row.tone}` : ""}`} fill={row.color}>{row.label}</text>}
          {stacks[ri].map((d, i) => <circle key={i} cx={x(d.v) + d.dx} cy={base - r - d.k * gap} r={r} className={d.v === 0 && zeroNote ? "is-zero" : row.tone ? `is-${row.tone}` : undefined} fill={d.v === 0 && zeroNote || row.tone ? undefined : row.color} style={{ animationDelay: `${i * 18}ms` }}/>)}
        </g>;
      })}
      <line x1={PAD - 6} x2={W - PAD + 6} y1={y0 + 2} y2={y0 + 2} className="seat-dots-axis"/>
      {ticks.map(t => <text key={t} x={x(t)} y={y0 + 16} textAnchor="middle" className="seat-dots-tick">{t}</text>)}
      {line && <g className="seat-dots-line"><line x1={x(line.value)} x2={x(line.value)} y1={0} y2={y0 + 4}/><text x={x(line.value)} y={y0 + 17} textAnchor="middle">{line.label}</text></g>}
    </svg>
    <figcaption>{caption} Každá bodka = {perDot.toLocaleString("sk-SK")} z {SIMULATIONS.toLocaleString("sk-SK")} prepočtov.{zeroNote && rows.some(r => r.dots.includes(0)) ? " Bodky na nule: strana v tom prepočte nepresiahla 5 %." : ""}</figcaption>
  </figure>;
}

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Číslo, ktoré sa pri zmene plynulo pretočí na novú hodnotu (pri prvom zobrazení a pri obmedzení pohybu hneď). */
export function RollNumber({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    const from = prev.current;
    prev.current = value;
    let frame = 0;
    const start = performance.now(), duration = reducedMotion() || from === value ? 0 : 480;
    const step = (t: number) => {
      const k = duration ? Math.min(1, (t - start) / duration) : 1;
      setShown(Math.round(from + (value - from) * (1 - (1 - k) ** 3)));
      if (k < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <><span aria-hidden="true">{shown}</span><span className="sr-only">{value}</span></>;
}
