"use client";

import { useId, useSyncExternalStore } from "react";
import { ArrowDown, ArrowUpRight, CalendarDays } from "lucide-react";
import outline from "@/lib/slovakia-outline.json";
import PoliticalNewsFeed from "@/components/news-room";
import ParliamentNow from "@/components/parliament-now";
import ResponsibilityScale from "@/components/responsibility-scale";
import { edition, signed, signedInt } from "@/lib/edition";
import { date } from "@/lib/polls";

// Natural Earth 1:50m (public domain), equirectangular projection at 49° N.
const coordinates = outline.coordinates[0];
const west = Math.min(...coordinates.map(p => p[0]));
const north = Math.max(...coordinates.map(p => p[1]));
const scale = 530 / ((Math.max(...coordinates.map(p => p[0])) - west) * Math.cos(49 * Math.PI / 180));
const mapPath = coordinates.map((p, i) => `${i ? "L" : "M"}${(25 + (p[0] - west) * Math.cos(49 * Math.PI / 180) * scale).toFixed(2)},${(15 + (north - p[1]) * scale).toFixed(2)}`).join(" ") + "Z";
const subscribeDay = (notify: () => void) => {
  const interval = window.setInterval(notify, 60_000);
  window.addEventListener("focus", notify);
  return () => { window.clearInterval(interval); window.removeEventListener("focus", notify); };
};
const currentDay = () => new Intl.DateTimeFormat("en-CA", {timeZone:"Europe/Bratislava",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
const serverDay = () => "";

export default function NationalIntro({ onNavigate }: { onNavigate: (view: string) => void }) {
  const uid = useId().replace(/:/g, "");
  const today = useSyncExternalStore(subscribeDay, currentDay, serverDay);
  const [year, month] = today.split("-").map(Number);
  // Only a month-level planning horizon is known. Never invent an election day.
  const months = today ? Math.max(0, (2027-year)*12+9-month) : null;
  const monthLabel = months === 1 ? "mesiac" : months !== null && months >= 2 && months <= 4 ? "mesiace" : "mesiacov";
  const dCoalition = edition.now.coalition - edition.before.coalition;
  const dOpposition = edition.now.opposition - edition.before.opposition;
  const dOthers = edition.now.others - edition.before.others;
  const headline = edition.now.coalition >= edition.majority
    ? <>Koalícia by si dnes udržala väčšinu: <b>{edition.now.coalition}</b> kresiel, opozícia <b>{edition.now.opposition}</b>.</>
    : edition.now.opposition >= edition.majority
      ? <>Opozícia by dnes mala väčšinu: <b>{edition.now.opposition}</b> kresiel, koalícia <b>{edition.now.coalition}</b>.</>
      : <>Koalícia by dnes mala <b>{edition.now.coalition}</b> kresiel, opozícia <b>{edition.now.opposition}</b>.</>;
  const others = edition.now.othersMembers.map(m => `${m.short} (${m.seats})`).join(" a ");
  const lead = (edition.now.coalition >= edition.majority || edition.now.opposition >= edition.majority
    ? `Väčšina je ${edition.majority} kresiel zo 150. `
    : `Väčšinu ${edition.majority} kresiel nemá ani jeden blok. `)
    + (edition.now.others > 0 ? `O zvyšných ${edition.now.others} kreslách by rozhodovali ${others}. ` : "")
    + `Koalícia + ${edition.withPartners.coalitionPartners.join(" + ")}: ${edition.withPartners.coalition} kresiel, opozícia + ${edition.withPartners.oppositionPartners.join(" + ")}: ${edition.withPartners.opposition} (redakčný predpoklad, nie dohoda strán).`;
  const kpis = [
    { label: `Koalícia ${edition.coalitionLabel.join(", ")}`, value: edition.now.coalition, delta: dCoalition, note: `${signedInt(dCoalition)} za 30 dní` },
    { label: `Opozícia ${edition.oppositionLabel.join(", ")}`, value: edition.now.opposition, delta: dOpposition, note: `${signedInt(dOpposition)} za 30 dní` },
    { label: "Ostatní", value: edition.now.others, delta: dOthers, note: `${signedInt(dOthers)} za 30 dní` },
    { label: "Väčšina", value: edition.majority, delta: 0, note: "kresiel zo 150" },
  ];
  const explore = () => document.getElementById("aggregate-title")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });

  return <section className="national-intro" aria-labelledby="national-title">
    <div className="national-copy">
      <p className="edition-kicker"><span>Vydanie {edition.month} {edition.year}</span><span>Model Mandát k {date(edition.asOf)} · {edition.agencies.length} agentúr · scenár kresiel, nie predpoveď</span></p>
      <h1 id="national-title">{headline}</h1>
      <p className="edition-lead">{lead}</p>
      <dl className="edition-kpis" aria-label="Kreslá podľa blokov v scenári Modelu Mandát">
        {kpis.map(k => <div key={k.label}><dt>{k.label}</dt><dd>{k.value}</dd><small className={k.delta > 0 ? "up" : k.delta < 0 ? "down" : ""}>{k.note}</small></div>)}
      </dl>
      <ul className="edition-changes" aria-label={`Čo sa zmenilo od ${date(edition.monthAgo)}`}>
        <li><b>Kreslá</b><span>koalícia {signedInt(dCoalition)}, opozícia {signedInt(dOpposition)}, ostatní {signedInt(dOthers)} od {date(edition.monthAgo)}</span></li>
        {edition.movers.length > 0 && <li><b>Podpora</b><span>{edition.movers.slice(0, 3).map((m, i) => <span key={m.id}>{i > 0 && ", "}{m.short} <span className={m.delta > 0 ? "up" : "down"}>{signed(m.delta)}</span></span>)} p. b.</span></li>}
        {edition.crossings.map(c => <li key={c.id}><b>Hranica 5 %</b><span>{c.short}: {c.direction === "down" ? "pokles pod 5 %" : "prekročenie 5 %"} ({c.value.toLocaleString("sk-SK", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %), z {c.seatsBefore} kresiel na {c.seatsNow}</span></li>)}
        <li><b>Merania</b><span>{edition.newPolls.length} {edition.newPolls.length === 1 ? "nové meranie" : edition.newPolls.length < 5 ? "nové merania" : "nových meraní"} za 30 dní: {[...new Set(edition.newPolls.map(p => p.agency))].join(", ")}</span></li>
      </ul>
      <div className="national-actions"><button className="mag-button" onClick={explore}>Preskúmať prieskumy <ArrowDown size={17}/></button><button className="mag-text-link" onClick={()=>onNavigate("model")}>Zostaviť scenár <ArrowUpRight size={17}/></button></div>
      <div className="national-principles"><span>Nezávisle</span><span>So zdrojmi</span><span>Bez reklamy</span></div>
    <aside className="election-countdown" aria-labelledby="countdown-title">
      <div className="election-countdown-head"><h2 id="countdown-title">Voľby 2027</h2>
        <svg className="slovakia-mark" width="104" height="52" viewBox="0 0 580 285" role="img" aria-label="Malá mapa Slovenska v národných farbách">
          <defs><clipPath id={`${uid}-clip`}><path d={mapPath}/></clipPath></defs>
          <g clipPath={`url(#${uid}-clip)`}><path d={mapPath} fill="#fffefa"/><path className="slovakia-blue" d="M0 95 Q145 65 290 105 T600 95 V300 H0Z" fill="#315b9a"/><path className="slovakia-red" d="M0 172 Q145 142 290 182 T600 172 V300 H0Z" fill="#c94d58"/></g><path d={mapPath} fill="none" stroke="#47614e" strokeWidth="3" strokeOpacity=".2"/>
        </svg>
      </div>
      {months !== null && months > 0 ? <div className="election-clock" aria-label={`Orientačne ${months} ${monthLabel} do septembra 2027`}><span className="election-approx">približne</span><div className="election-digits" aria-hidden="true">{String(months).padStart(2,"0").split("").map((digit,i)=><span key={i}>{digit}</span>)}</div><span className="election-unit">{monthLabel}</span></div> : <div className="election-pending">{months===null ? "Načítavam odpočet…" : "Čakáme na potvrdený termín"}</div>}
      <p className="election-horizon"><CalendarDays size={14}/> Orientačný horizont: september 2027</p>
      <p className="election-unconfirmed">Presný deň volieb zatiaľ nemáme potvrdený.</p>
      <details className="election-explanation"><summary>O odpočte a zdrojoch</summary><p>Odpočítavame kalendárne mesiace do septembra 2027, nie dni do vyhlásených volieb. Ide o orientačný horizont riadnych volieb. Po overení oficiálneho termínu môžeme zobraziť presné odpočítavanie.</p><a href="https://www.minv.sk/?volby-nrsr" target="_blank" rel="noopener noreferrer">Voľby do NR SR · Ministerstvo vnútra <ArrowUpRight size={12}/><span className="sr-only"> (nová karta)</span></a><a href="https://www.naturalearthdata.com/about/terms-of-use/" target="_blank" rel="noopener noreferrer">Obrys mapy · Natural Earth <ArrowUpRight size={12}/><span className="sr-only"> (nová karta)</span></a><p>Mapa je grafický motív. Farby nezobrazujú regionálnu podporu strán.</p></details>
    </aside>
    </div>
    <ResponsibilityScale onNavigate={onNavigate}/>
    <ParliamentNow onNavigate={onNavigate}/>
    <PoliticalNewsFeed compact onOpen={()=>onNavigate('news')}/>
  </section>;
}

