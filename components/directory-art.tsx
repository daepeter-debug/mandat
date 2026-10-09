"use client";
import Image from "next/image";
import { BookOpen, FileCheck2, Files, Scale } from "lucide-react";
import MiniHemicycle from "@/components/mini-hemicycle";
import { seated2023 } from "@/lib/parliament";
import { edition } from "@/lib/edition";
import { aggregateSeries, currentAggregate } from "@/lib/aggregate";
import { parties } from "@/lib/polls";
import { financeYears } from "@/lib/public-finance";
import { cabinets } from "@/lib/cabinets";
import { politicalNews, newsChecked, newsDayGroups } from "@/lib/political-news";
import partyLogos from "@/lib/party-logos.json";
const logos = partyLogos as Record<string, { src: string }>;
const rows = edition.now.rows;
const colors = rows.flatMap(r => Array.from({ length: r.seats }, () => r.color));
const leaders = [...parties].sort((a,b) => (currentAggregate.values[b.id]?.value ?? 0)-(currentAggregate.values[a.id]?.value ?? 0));
const latest = newsDayGroups(politicalNews, newsChecked)[0];
const line = (id: string) => {
  const values = aggregateSeries.flatMap((p, i) => p.values[id] ? [{ i, value: p.values[id].value }] : []);
  return values.map(p => `${Math.round(12+p.i/Math.max(1,aggregateSeries.length-1)*176)},${Math.round(72-p.value/30*64)}`).join(" ");
};

export default function DirectoryArt({ view }: { view: string }) {
  if (view === "parliament" || view === "model" || view === "data") return <div className={`directory-seats is-${view}`}>
    <MiniHemicycle colors={colors} label="" majority={view !== "data"}/>
    {view === "data" && <MiniHemicycle colors={seated2023.flatMap(p=>Array.from({length:p.seats},()=>p.color))} label=""/>}
    {view === "model" && <svg className="directory-slider" viewBox="0 0 200 16"><path d="M20 8H180" stroke="var(--border)" strokeWidth="3"/><path d="M20 8H112" stroke="currentColor" strokeWidth="3"/><circle cx="112" cy="8" r="6" fill="var(--card)" stroke="currentColor" strokeWidth="2"/></svg>}
  </div>;
  if (view === "polls") return <svg viewBox="0 0 200 88"><path d="M12 24H188M12 48H188M12 72H188" stroke="var(--border)" strokeWidth="1" strokeDasharray="2 4"/>{leaders.slice(0,3).map(p => <polyline key={p.id} points={line(p.id)} fill="none" stroke={p.color} strokeWidth="2.5" strokeLinejoin="round"/>)}<text x="12" y="86">2026</text><text x="188" y="86" textAnchor="end">Model Mandát</text></svg>;
  if (view === "parties") return <div className="directory-logos">{leaders.slice(0,5).map(p => <span key={p.id}>{logos[p.id] ? <Image src={logos[p.id].src} width={42} height={42} alt="" unoptimized loading="lazy"/> : p.short}</span>)}</div>;
  if (view === "finance") {
    const years = financeYears.slice(-8), scale = Math.max(...years.map(y => Math.abs(y.deficitPct)), 1);
    return <svg viewBox="0 0 200 88"><path d="M12 22H188" stroke="var(--text-3)" strokeWidth="1"/>{years.map((y,i) => <rect key={y.year} x={14+i*22} y={y.deficitPct > 0 ? 22-y.deficitPct/scale*48 : 22} width="14" height={Math.max(1,Math.abs(y.deficitPct)/scale*48)} rx="2" fill={y.deficitPct < 0 ? "#af6856" : "#527960"}/>)}<text x="12" y="86">{years[0]?.year}</text><text x="188" y="86" textAnchor="end">{years.at(-1)?.year} · % HDP</text></svg>;
  }
  if (view === "responsibility") {
    const start = Date.parse("1993-01-01"), end = Date.parse(newsChecked), scale = 176/(end-start);
    return <svg viewBox="0 0 200 88">{cabinets.map(c => <rect key={c.id} x={12+Math.max(0,Date.parse(c.start)-start)*scale} y="25" width={Math.max(1,(Date.parse(c.end ?? newsChecked)-Math.max(start,Date.parse(c.start)))*scale)} height="28" fill={c.color}/>)}<text x="12" y="78">1993</text><text x="188" y="78" textAnchor="end">{newsChecked.slice(0,4)}</text></svg>;
  }
  if (view === "news") return <div className="directory-news"><b>{latest ? Number(latest.date.slice(8)) : "—"}</b><span>{latest ? new Date(`${latest.date}T12:00:00Z`).toLocaleDateString("sk-SK",{month:"long",timeZone:"Europe/Bratislava"}) : "Súhrn pripravujeme"}<small>{latest ? `${latest.items.length} správ · posledný súhrn` : ""}</small></span></div>;
  if (view === "game") return <Image className="directory-game" src="/images/games/republic-cover-v2-small.webp" alt="" width={400} height={225} unoptimized loading="lazy"/>;
  const Icon = view === "programmes" ? Files : view === "method" ? FileCheck2 : view === "cases" ? Scale : BookOpen;
  return <div className="directory-document"><Icon strokeWidth={1.2}/><i/><i/><i/></div>;
}
