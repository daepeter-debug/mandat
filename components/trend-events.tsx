"use client";
import { politicalNews } from '@/lib/political-news';
import { timelineEvents } from '@/lib/discovery';
import { date } from '@/lib/polls';
import { ArrowUpRight, CalendarDays } from 'lucide-react';
import '@/app/visual-discovery.css';

export default function TrendEvents({start,end,selected,onSelect,compare}:{start:string;end:string;selected:string|null;onSelect:(date:string)=>void;compare:boolean}) {
  const events=timelineEvents(politicalNews,start,end);
  const event=events.find(n=>n.published===selected);
  const span=Math.max(1,Date.parse(end)-Date.parse(start));
  if(!events.length)return <p className="trend-events-empty">Pre toto obdobie ešte nemáme udalosti v archíve správ.</p>;
  return <section className="trend-events" data-compare={compare} aria-label="Politické udalosti popri trende">
    <div className="trend-events-heading"><CalendarDays size={16} aria-hidden="true"/><h4>Čo sa dialo v politike</h4><span>Výber z nášho archívu</span></div>
    <div className="trend-events-scale" aria-hidden="true"><div>{events.map(n=><i key={n.id} data-selected={event?.id===n.id} style={{left:`${(Date.parse(n.published)-Date.parse(start))/span*100}%`}}/>)}<span>{date(start)}</span><span>{date(end)}</span></div></div>
    <div className="trend-events-picks" role="group" aria-label="Vybrať udalosť pri grafe">{events.map(n=><button key={n.id} type="button" aria-pressed={event?.id===n.id} onClick={()=>onSelect(n.published)}><time dateTime={n.published}>{date(n.published)}</time><span>{n.title}</span></button>)}</div>
    {event&&<article className="trend-event-detail"><h4>{event.title}</h4><p>{event.summary}</p><a href={event.source} target="_blank" rel="noopener noreferrer">{event.sourceName} · pôvodný článok<ArrowUpRight size={14} aria-hidden="true"/><span className="sr-only"> (nová karta)</span></a></article>}
    <p className="trend-events-note">Dátum je dátumom správy. Udalosti sú kontext; časová súvislosť nedokazuje vplyv na podporu strán. Z každej dostupnej sedemdňovej skupiny vyberáme správu s najvyššou redakčnou prioritou, najviac osem.</p>
  </section>;
}
