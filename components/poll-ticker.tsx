"use client";

import { useState } from "react";
import { Pause, Play } from "lucide-react";
import { agencies, archive, fmt, rank } from "@/lib/polls";
import "@/app/poll-ticker.css";

/*
  Pás najnovších meraní na úvode: posledný prieskum každej agentúry s prvými tromi stranami.
  Plynulo beží, zastaví sa pod prstom alebo myšou a tlačidlom; pri „obmedziť pohyb“ stojí
  a dá sa posúvať prstom. Ťuknutie otvorí detail merania v archíve.
*/
const latest = agencies
  .map(a => archive.filter(p => p.agency === a).sort((x, y) => y.end.localeCompare(x.end))[0])
  .filter(p => p !== undefined)
  .sort((a, b) => b.end.localeCompare(a.end));
const short = (d: string) => `${Number(d.slice(8, 10))}. ${Number(d.slice(5, 7))}.`;

export default function PollTicker({ onOpen }: { onOpen: (pollId: string) => void }) {
  const [paused, setPaused] = useState(false);
  const items = (copy: boolean) => latest.map(p => <li key={`${copy ? "b" : "a"}-${p.id}`} aria-hidden={copy || undefined}>
    <button type="button" tabIndex={copy ? -1 : undefined} onClick={() => onOpen(p.id)} aria-label={copy ? undefined : `${p.agency}, zber do ${short(p.end)}: ${rank(p).slice(0, 3).map(x => `${x.short} ${fmt(p.values[x.id])} %`).join(", ")}. Otvoriť meranie.`}>
      <b>{p.agency}</b><time dateTime={p.end}>{short(p.end)}</time>
      {rank(p).slice(0, 3).map(x => <span key={x.id}><i style={{ background: x.color }} aria-hidden="true"/>{x.short} <em>{fmt(p.values[x.id])}</em></span>)}
    </button>
  </li>);
  return <section className={`ticker ${paused ? "is-paused" : ""}`} aria-label="Najnovšie merania agentúr">
    <span className="ticker-label"><i aria-hidden="true"/>Najnovšie</span>
    <div className="ticker-viewport"><ul className="ticker-track">{items(false)}{items(true)}</ul></div>
    <button type="button" className="ticker-toggle" onClick={() => setPaused(p => !p)} aria-pressed={paused} aria-label={paused ? "Spustiť pás meraní" : "Zastaviť pás meraní"}>{paused ? <Play size={14}/> : <Pause size={14}/>}</button>
  </section>;
}
