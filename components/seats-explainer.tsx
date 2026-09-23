"use client";

import { useId, useState } from "react";
import { currentAggregate } from "@/lib/aggregate";
import { MAJORITY } from "@/lib/blocs";
import { allocateSeats, validVotes2023 } from "@/lib/parliament";
import { fmt, parties } from "@/lib/polls";
import { thresholdStatus } from "@/lib/uncertainty";
import "@/app/seats-explainer.css";
import ListenButton from "@/components/listen-button";
import seatsAudio from "@/lib/audio/seats.json";
import { voiceItem } from "@/lib/voice";
const seatsVoice = voiceItem(seatsAudio, "kroky");

/*
  Ako sa z hlasov stanú kreslá (§ 68 zákona 180/2014 Z. z.), krok za krokom na dnešnom Modeli Mandát:
  hranica 5 % → republikové volebné číslo (súčet hlasov postupujúcich strán / 151) → celé kreslá
  podľa podielu → zvyšné kreslá podľa najväčších zvyškov. Posuvník mení podporu jednej strany,
  ostatné ostávajú, aby bolo vidieť, čo s parlamentom urobí prekročenie hranice.
*/
const base = Object.values(currentAggregate.values).filter(v => v.value >= 0.5).sort((a, b) => b.value - a.value);
const edge = base.find(v => thresholdStatus(v) === "edge") ?? base.find(v => v.value < 5) ?? base[base.length - 1];
const nameOf = (id: string) => parties.find(p => p.id === id);
const baseSeats = allocateSeats(base.map(v => ({ id: v.partyId, share: v.value, kind: "party" as const }))).seats;

export default function SeatsExplainer() {
  const uid = useId().replace(/:/g, "");
  const [focus, setFocus] = useState(edge.partyId);
  const [share, setShare] = useState(currentAggregate.values[edge.partyId].value);
  const focusBase = currentAggregate.values[focus].value;
  const input = base.map(v => ({ id: v.partyId, share: v.partyId === focus ? share : v.value, kind: "party" as const }));
  const a = allocateSeats(input);
  const rows = input.map(s => {
    const q = a.number ? s.share / a.number : 0;
    const whole = a.qualifying.includes(s.id) ? Math.floor(q) : 0;
    const seats = a.seats[s.id] ?? 0;
    return { ...s, q, whole, rest: a.qualifying.includes(s.id) ? q - whole : 0, extra: seats - whole, seats, change: seats - (baseSeats[s.id] ?? 0) };
  });
  const wasted = rows.filter(r => !a.qualifying.includes(r.id)).reduce((sum, r) => sum + r.share, 0);
  const votesPerSeat = Math.round(validVotes2023 * a.number / 100 / 100) * 100;
  const remainderSeats = rows.reduce((sum, r) => sum + r.extra, 0);
  const pick = (id: string) => { setFocus(id); setShare(currentAggregate.values[id].value); };
  return <section className="seats-explainer" id="ako-kresla" aria-labelledby={`${uid}-title`}>
    <div className="se-head"><h2 id={`${uid}-title`}>Ako sa z hlasov stanú kreslá</h2><p>Štyri kroky podľa volebného zákona na dnešnom Modeli Mandát. Posuňte podporu jednej strany a sledujte, čo s parlamentom urobí hranica 5 %.</p><ListenButton id="kresla" src={seatsVoice?.src} ms={seatsVoice?.ms} label="Vypočuj si vysvetlenie" credit={seatsAudio.credit}/></div>
    <div className="se-control">
      <label htmlFor={`${uid}-party`}>Strana</label>
      <select id={`${uid}-party`} value={focus} onChange={e => pick(e.target.value)}>{base.map(v => <option key={v.partyId} value={v.partyId}>{nameOf(v.partyId)?.short ?? v.partyId}</option>)}</select>
      <label htmlFor={`${uid}-share`} className="sr-only">Podpora strany v percentách</label>
      <input id={`${uid}-share`} type="range" min="0.5" max={Math.max(12, Math.ceil(focusBase + 5))} step="0.1" value={share} onChange={e => setShare(e.target.valueAsNumber)} aria-valuetext={`${fmt(share)} percenta`} style={{ accentColor: nameOf(focus)?.color }}/>
      <output htmlFor={`${uid}-share`}><b>{fmt(share)} %</b>{share !== focusBase && <button type="button" onClick={() => setShare(focusBase)}>späť na {fmt(focusBase)} %</button>}</output>
    </div>
    <ol className="se-steps">
      <li><h3><span>1</span> Hranica</h3><p>Do rozdeľovania postupujú len strany s aspoň 5 % hlasov (koalícia dvoch alebo troch strán 7 %, štyroch a viac 10 %). Hlasy pre ostatné, dnes <b>{fmt(wasted)} %</b>, nezískajú žiadne kreslo.</p></li>
      <li><h3><span>2</span> Volebné číslo</h3><p>Hlasy postupujúcich strán ({fmt(a.qualifyingShare)} %) sa vydelia číslom 151. Jedno kreslo tak „stojí“ <b>{a.number.toLocaleString("sk-SK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} % hlasov</b>, pri účasti ako v roku 2023 asi <b>{votesPerSeat.toLocaleString("sk-SK")} hlasov</b>.</p></li>
      <li><h3><span>3</span> Celé kreslá</h3><p>Podiel každej strany sa vydelí volebným číslom; celá časť výsledku sú jej kreslá. Takto sa rozdá {rows.reduce((s, r) => s + r.whole, 0)} zo 150 kresiel.</p></li>
      <li><h3><span>4</span> Zvyšky</h3><p>Zvyšné {remainderSeats} {remainderSeats === 1 ? "kreslo dostane strana" : remainderSeats < 5 ? "kreslá dostanú strany" : "kresiel dostanú strany"} s najväčším zvyškom po delení. Väčšina je {MAJORITY} kresiel.</p></li>
    </ol>
    <div className="se-table-wrap" tabIndex={0}><table className="se-table">
      <caption className="sr-only">Prepočet kresiel podľa § 68 pre zvolenú podporu</caption>
      <thead><tr><th scope="col">Strana</th><th scope="col" className="num">Podpora</th><th scope="col" className="num">÷ volebné číslo</th><th scope="col" className="num">Celé kreslá</th><th scope="col" className="num">Zvyšok</th><th scope="col" className="num">Kreslá spolu</th><th scope="col" className="num">Oproti dnešku</th></tr></thead>
      <tbody>{rows.map(r => { const p = nameOf(r.id); const out = !a.qualifying.includes(r.id); return <tr key={r.id} className={`${out ? "is-out" : ""} ${r.id === focus ? "is-focus" : ""}`}>
        <th scope="row"><i style={{ background: p?.color }} aria-hidden="true"/>{p?.short ?? r.id}</th>
        <td className="num">{fmt(r.share)} %</td>
        <td className="num">{out ? "pod hranicou" : r.q.toLocaleString("sk-SK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        <td className="num">{out ? "—" : r.whole}</td>
        <td className="num">{out ? "—" : <>{r.rest.toLocaleString("sk-SK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{r.extra > 0 && <em> +{r.extra}</em>}</>}</td>
        <td className="num"><b>{r.seats}</b></td>
        <td className={`num ${r.change > 0 ? "up" : r.change < 0 ? "down" : ""}`}>{r.change === 0 ? "—" : `${r.change > 0 ? "+" : "−"}${Math.abs(r.change)}`}</td>
      </tr>; })}</tbody>
    </table></div>
    <p className="se-note">Zjednodušenie: podporu berieme ako podiel z platných hlasov a všetky subjekty ako samostatné strany. Skutočný prepočet robí Štátna komisia z presných počtov hlasov; pri zhodnom zvyšku rozhoduje väčší počet hlasov.</p>
  </section>;
}
