"use client";
import { useId, useState, useSyncExternalStore } from 'react';
import { ArrowRight, ArrowUpRight, Newspaper } from 'lucide-react';
import { politicalNews, newsChecked, filterNews } from '@/lib/political-news';
import { date } from '@/lib/polls';
const day=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Bratislava',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const subscribe=(onChange:()=>void)=>{const timer=setInterval(onChange,60000);return()=>clearInterval(timer);};

export default function PoliticalNewsFeed({compact=false,onOpen}:{compact?:boolean;onOpen?:()=>void}){
  const uid=useId();
  const Heading=compact?'h2':'h1';
  const today=useSyncExternalStore(subscribe,day,()=>newsChecked);
  const [period,setPeriod]=useState('week');
  const [category,setCategory]=useState('all');
  const rows=filterNews(politicalNews,today,compact?'all':period,compact?'all':category);
  return <section className={compact?'news-digest':'news-page'} aria-labelledby={uid}>
    <header className="news-heading"><div><Heading id={uid}>{compact?<><Newspaper size={18} strokeWidth={1.5}/>Politika v krátkosti</>:'Čo sa deje v politike.'}</Heading>{!compact&&<p>Podstatné udalosti, stručný kontext a cesta k pôvodnému zdroju.</p>}</div><span className="news-selection">Skúšobný výber</span></header>
    <p className="news-checked">Kontrola zdrojov {date(newsChecked)} · {compact?'Najnovšie dostupné správy':'Ručne dopĺňané, bez automatickej aktualizácie'}</p>
    {!compact&&<div className="news-filters"><div role="group" aria-label="Obdobie správ">{[['week','Posledných 7 dní'],['today','Dnes'],['all','Celý výber']].map(([id,label])=><button key={id} aria-pressed={period===id} onClick={()=>setPeriod(id)}>{label}</button>)}</div><label>Téma<select value={category} onChange={e=>setCategory(e.target.value)}><option value="all">Všetky témy</option>{['Vláda','Parlament','Prieskumy'].map(c=><option key={c}>{c}</option>)}</select></label></div>}
    <div className="news-scroll" tabIndex={compact?0:undefined} role={compact?'region':undefined} aria-label={compact?'Najnovšie politické správy, posúvateľný zoznam':undefined}>
      {rows.map(n=><article className="news-entry" key={n.id}><div className="news-entry-meta"><time dateTime={n.published}>{n.published===today?'Dnes':date(n.published)}</time><span>{n.category}</span></div><h3><a href={n.source} target="_blank" rel="noopener noreferrer">{n.title}<ArrowUpRight size={15} aria-hidden="true"/><span className="sr-only"> (nová karta)</span></a></h3><p>{n.summary}</p><a className="news-source" href={n.source} target="_blank" rel="noopener noreferrer">{n.sourceName}<ArrowUpRight size={11}/><span className="sr-only"> (nová karta)</span></a></article>)}
      {!rows.length&&<div className="news-empty"><h3>Pre tento výber ešte nemáme správu.</h3><p>Výber dopĺňame ručne. Prázdny zoznam neznamená, že sa nič nestalo.</p><button onClick={()=>{setPeriod('all');setCategory('all');}}>Zobraziť všetky správy</button></div>}
    </div>
    {compact?<button className="news-open" onClick={onOpen}>Všetky správy a súvislosti <ArrowRight size={16}/></button>:<p className="news-footnote" role="status">{rows.length} z {politicalNews.length} správ vo výbere. Ide o stručné vlastné zhrnutia; úplné články nájdete u pôvodných vydavateľov.</p>}
  </section>;
}
