"use client";
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import { ArrowUpRight, BarChart3, Newspaper, Vote, Play } from 'lucide-react';
import { archive, dataVerified, date, fmt, parties } from '@/lib/polls';
import { politicalNews, newsChecked } from '@/lib/political-news';
import { coverSources, readCoverVotes, type CoverKind } from '@/lib/magazine-cover';
import { hemicycleSeats } from '@/lib/parliament';
import { markColors, voteSource, voteTopic, type VoteSummary } from '@/lib/votes';
import logos from '@/lib/party-logos.json';
import '@/app/magazine-cover.css';

const partyLogos=logos as Record<string,{src:string}>;
const points=hemicycleSeats(150,6);
const modes=[{id:'news',label:'Deň v politike',icon:Newspaper},{id:'poll',label:'Prieskum',icon:BarChart3},{id:'vote',label:'Hlasovanie',icon:Vote}] as const;

export default function MagazineCover({today,onNavigate,onOpenNews,onOpenNewsDay,onPlayDay}:{today:string;onNavigate:(view:string)=>void;onOpenNews:(id:string)=>void;onOpenNewsDay?:(day:string)=>void;onPlayDay?:(day:string)=>void}) {
  const root=useRef<HTMLDivElement>(null);
  const [votes,setVotes]=useState<VoteSummary[]>([]),[load,setLoad]=useState<'loading'|'ready'|'error'>('loading'),[retry,setRetry]=useState(0);
  const [chosen,setChosen]=useState<CoverKind|null>(null);
  useEffect(()=>{
    const controller=new AbortController();
    const get=()=>fetch('/data/hlasovania/index.json',{signal:controller.signal}).then(r=>{if(!r.ok)throw Error('archive');return r.json();}).then(data=>{const parsed=readCoverVotes(data);if(!parsed)throw Error('archive');setVotes(parsed);setLoad('ready');}).catch(()=>{if(!controller.signal.aborted)setLoad('error');});
    const el=root.current;
    if(!el||!('IntersectionObserver' in window)){void get();return()=>controller.abort();}
    const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){observer.disconnect();void get();}},{rootMargin:'150px'});
    observer.observe(el);return()=>{observer.disconnect();controller.abort();};
  },[retry]);
  const asOf=today||[dataVerified,newsChecked].sort().at(-1)!;
  const {poll,lead,day,vote,latest}=coverSources(archive,politicalNews,votes,asOf);
  const active=chosen??latest??'poll';
  const previous=poll?archive.filter(p=>p.agency===poll.agency&&p.published&&p.published<poll.published!).toSorted((a,b)=>b.published!.localeCompare(a.published!))[0]:null;
  const ranked=poll?parties.filter(p=>poll.values[p.id]!==undefined).toSorted((a,b)=>poll.values[b.id]-poll.values[a.id]).slice(0,5):[];
  const scale=poll?Math.max(1,...ranked.map(p=>Math.max(poll.values[p.id],previous?.values[p.id]??0))):1;
  const voteMarks=vote?[{key:'Z' as const,label:'Za',value:vote.za},{key:'P' as const,label:'Proti',value:vote.proti},{key:'?' as const,label:'Zdržali sa',value:vote.zdrzalo},{key:'N' as const,label:'Nehlasovali',value:vote.nehlasovalo},{key:'0' as const,label:'Neprítomní',value:vote.nepritomni}]:[];
  const colors=voteMarks.flatMap(m=>Array.from({length:m.value},()=>markColors[m.key]));
  const categories=[...new Set(day.map(n=>n.category))];
  return <div className="magazine-cover" ref={root} data-cover={active}>
    <div className="cover-switch" role="group" aria-label="Obsah titulnej obálky">{modes.map(m=><button key={m.id} type="button" aria-pressed={active===m.id} disabled={m.id==='vote'&&!vote} onClick={()=>setChosen(m.id)}><m.icon size={15} aria-hidden="true"/>{m.label}{latest===m.id&&<span className="cover-latest" aria-label="Najnovší dostupný obsah"/>}</button>)}</div>
    {active==='news'&&lead?<article className="cover-article" aria-labelledby="cover-title"><h1 id="cover-title">{lead.title}</h1><p className="cover-deck">{lead.summary}</p>
      <div className="cover-news-art"><time dateTime={lead.published}>{new Date(lead.published+'T12:00:00Z').toLocaleDateString('sk-SK',{day:'numeric',month:'long',timeZone:'UTC'})}</time><div className="cover-news-index"><span>{day.length} správ v súhrne</span>{categories.map(category=><div key={category}><span>{category}</span><div aria-label={`${category}: ${day.filter(n=>n.category===category).length} správ`}>{day.filter(n=>n.category===category).map(n=><button key={n.id} type="button" aria-label={`Otvoriť správu: ${n.title}`} title={n.title} onClick={()=>onOpenNews(n.id)}/>)}</div></div>)}</div></div>
      <footer><span>{date(lead.published)} · {lead.sourceName}</span><button type="button" onClick={()=>onOpenNews(lead.id)}>Čítať tému<ArrowUpRight size={16} aria-hidden="true"/></button></footer>
      <div className="cover-news-actions"><button type="button" onClick={()=>onOpenNewsDay?onOpenNewsDay(lead.published):onNavigate('news')}>Celý deň</button>{onPlayDay&&<button type="button" onClick={()=>onPlayDay(lead.published)}><Play size={13} aria-hidden="true"/>Deň za 30 sekúnd</button>}</div>
    </article>:active==='poll'&&poll?<article className="cover-article" aria-labelledby="cover-title"><h1 id="cover-title">{poll.agency}: najnovšie meranie</h1><p className="cover-deck">Zverejnené {date(poll.published)}. Presné hodnoty agentúry, samostatne od Modelu Mandát.</p>
      <div className="cover-poll-art" role="img" aria-label={ranked.map(p=>`${p.short} ${fmt(poll.values[p.id])} percent`).join(', ')}>{ranked.map(p=><div key={p.id} className="cover-poll-row" style={{'--cover-party':p.color} as CSSProperties}><span className="cover-party-logo">{partyLogos[p.id]&&<Image src={partyLogos[p.id].src} width={30} height={28} alt="" unoptimized/>}<b>{p.short}</b></span><span className="cover-poll-track"><i style={{width:`${poll.values[p.id]/scale*100}%`}}/>{previous?.values[p.id]!==undefined&&<i className="cover-previous" style={{left:`${previous.values[p.id]/scale*100}%`}}/>}</span><strong>{fmt(poll.values[p.id])}<small> %</small></strong></div>)}</div>
      {previous&&<p className="cover-chart-note"><i aria-hidden="true"/>Ryska: predchádzajúce meranie {poll.agency}, zber do {date(previous.end)}.</p>}
      <p className="cover-chart-note">Päť najvyšších hodnôt · pruhy od nuly. Zber {date(poll.start)} – {date(poll.end)}{poll.sample?` · n = ${poll.sample.toLocaleString('sk-SK')}`:''}.</p>
      <footer><span>{poll.method}</span><a href={poll.source} target="_blank" rel="noopener noreferrer">Zdroj agentúry<ArrowUpRight size={16} aria-hidden="true"/><span className="sr-only"> (nová karta)</span></a></footer><button className="cover-more" type="button" onClick={()=>onNavigate('polls')}>Všetky merania a trend<ArrowUpRight size={15} aria-hidden="true"/></button>
    </article>:active==='vote'&&vote?<article className="cover-article" aria-labelledby="cover-title"><h1 id="cover-title">{voteTopic(vote.nazov)}</h1><p className="cover-deck">Posledné archivované hlasovanie · {date(vote.datum)} · {vote.preslo?'Návrh prešiel':'Návrh neprešiel'}.</p>
      <div className="cover-vote-art"><svg viewBox="0 0 700 355" role="img" aria-label={voteMarks.map(m=>`${m.label} ${m.value}`).join(', ')}>{colors.length===150&&points.map((p,i)=><circle key={i} cx={350+p.x*300} cy={325+p.y*300} r="5.4" fill={colors[i]}/>)}<text x="350" y="299" textAnchor="middle" fill="currentColor" fontSize="43" fontWeight="550">{vote.za}</text><text x="350" y="323" textAnchor="middle" fill="currentColor" fontSize="15">hlasov za</text></svg><dl>{voteMarks.filter(m=>m.value>0).map(m=><div key={m.key}><dt><i style={{background:markColors[m.key]}} aria-hidden="true"/>{m.label}</dt><dd>{m.value}</dd></div>)}</dl></div>
      <p className="cover-chart-note">Farby znázorňujú súčet hlasov, nie skutočný zasadací poriadok.</p><footer><a href={voteSource(vote.id)} target="_blank" rel="noopener noreferrer">NR SR<ArrowUpRight size={15} aria-hidden="true"/><span className="sr-only"> (nová karta)</span></a><a href={`/parlament?h=${vote.id}`}>Otvoriť hlasovanie<ArrowUpRight size={16} aria-hidden="true"/></a></footer>
    </article>:<p className="cover-empty">Nemáme dostupný overený obsah pre túto obálku.</p>}
    {load==='error'&&<p className="cover-load-note">Hlasovania sa nepodarilo načítať. <button type="button" onClick={()=>{setLoad('loading');setRetry(n=>n+1);}}>Skúsiť znova</button></p>}
  </div>;
}
