import { hemicycleSeats } from "@/lib/parliament";
import type { CSSProperties } from "react";
const points = hemicycleSeats(150);
/** A shared, hydration-safe 150-seat drawing. No model calculations live in the view. */
export default function MiniHemicycle({ colors, label, className = "", majority = false }: {
  colors: string[]; label: string; className?: string; majority?: boolean;
}) {
  return <svg className={`mini-hemicycle ${className}`} viewBox="-1.08 -1.17 2.16 1.29" role="img" aria-label={label}>
    {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={.028} fill={colors[i] ?? "var(--border)"} style={{ "--seat-delay": `${Math.round(i / 149 * 690)}ms` } as CSSProperties}/>)}
    {majority && <g fill="currentColor"><path d="M0 -1.09v-.07" stroke="currentColor" strokeWidth=".012"/><text x="0" y="-.13" textAnchor="middle" fontSize=".125" fontWeight="600">76</text><text x="0" y="-.015" textAnchor="middle" fontSize=".07">väčšina</text></g>}
  </svg>;
}
