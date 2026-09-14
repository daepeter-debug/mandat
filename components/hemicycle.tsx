"use client";

import { useId, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";
import { hemicycleSeats, type ScenarioRow } from "@/lib/parliament";

const logoAssets = import.meta.glob<string>("/public/logos/*.svg", { eager: true, query: "?url", import: "default" });
const percent = (value: number) => value.toLocaleString("sk-SK", { maximumFractionDigits: 2, minimumFractionDigits: 1 });

/** The same ordered rows drive both the coloured seats and their textual equivalent. */
export default function Hemicycle({ label, seats, total = 150, caption }: {
  label: string; seats: ScenarioRow[]; total?: number; caption: ReactNode;
}) {
  const titleId = useId();
  const ordered = [...seats].sort((a, b) => b.seats - a.seats || b.share - a.share || a.name.localeCompare(b.name, "sk"));
  const colours = ordered.flatMap(subject => Array.from({ length: subject.seats }, () => subject));
  const points = hemicycleSeats(total, 6);
  const assigned = colours.length;
  const summary = `${label}. ${assigned} kresiel. ${ordered.map(s => `${s.name}: ${s.seats} kresiel, ${percent(s.share)} percent`).join("; ")}. Poradie podľa počtu kresiel, nie podľa politickej osi.`;

  return <figure className="hemicycle" aria-labelledby={titleId}>
    <h2 id={titleId}>{label}</h2>
    <div className="hemicycle-drawing">
      <svg viewBox="-1.08 -1.08 2.16 1.2" role="img" aria-label={summary}>
        {points.map((point, index) => <circle key={index} className="hemicycle-seat" cx={point.x} cy={point.y} r={0.032}
          fill={colours[index]?.color ?? "var(--border)"} style={{ "--seat-delay": `${index * 3}ms` } as CSSProperties}/>) }
      </svg>
      <div className="hemicycle-total" aria-hidden="true"><strong>{assigned}</strong><span>kresiel</span></div>
    </div>
    <div className="hemicycle-legend-head" aria-hidden="true"><span>Politický subjekt</span><span>Kreslá</span><span>Podpora</span></div>
    <ul className="hemicycle-legend" aria-label={`Výsledky: ${label}`}>
      {ordered.map(s => <li key={s.id}>
        <span className="hemicycle-subject"><span className="hemicycle-monogram" aria-hidden="true" style={{ "--party-color": s.color } as CSSProperties}>
          {logoAssets[`/public/logos/${s.id}.svg`] ? <Image src={logoAssets[`/public/logos/${s.id}.svg`]} alt="" width={28} height={28} unoptimized/> : s.short.replace(/[^\p{L}\p{N}]/gu, "").slice(0, 2)}
        </span><span title={s.name}>{s.short}<span className="sr-only"> · {s.name}</span></span></span>
        <strong>{s.seats}<span className="sr-only"> kresiel</span></strong><span className="hemicycle-share">{percent(s.share)} %</span>
      </li>)}
    </ul>
    <figcaption>{caption}</figcaption>
  </figure>;
}
