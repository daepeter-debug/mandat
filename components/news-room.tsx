"use client";
import { useId, useState, useSyncExternalStore } from 'react';
import { ArrowRight, Newspaper } from 'lucide-react';
import { politicalNews, newsChecked, filterNews } from '@/lib/political-news';
import { date } from '@/lib/polls';
const day=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Bratislava',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const subscribe=(onChange:()=>void)=>{const timer=setInterval(onChange,60000);return()=>clearInterval(timer);};

/*
  Zoznam správ neodkazuje na cudzie weby: titulok otvára naše dlhšie zhrnutie,
  kde je aj pôvodný vydavateľ a odkaz na originál. Čitateľ tak dostane obsah u nás
  a odchádza až vtedy, keď chce čítať celý článok.
*/
export default function PoliticalNewsFeed({compact=false,onOpen,onOpenNews}:{compact?:boolean;onOpen?:()=>void;onOpenNews:(id:string)=>void}){
  const uid=useId();
  const Heading=compact?'h2':'h1';
  const today=useSyncExternalStore(subscribe,day,()=>newsChecked);
  const [period,setPeriod]=useState('week');
  const [category,setCategory]=useState('all');
  const rows=filterNews(politicalNews,today,compact?'all':period,compact?'all':category);
  return <section className={compact?'news-digest':'news-page'} aria-labelledby={uid}>
    <header className="news-heading"><div><Heading id={uid}>{compact?<><Newspaper size={18} strokeWidth={1.5}/>Politika v krátkosti</>:'Čo sa deje v politike.'}</Heading>{!compact&&<p>Podstatné udalosti a stručný kontext. Každú správu zhŕňame vlastnými slovami z pôvodného článku.</p>}</div><span className="news-selection">Ručný výber redakcie</span></header>
    <p className="news-checked">Kontrola zdrojov {date(newsChecked)} · {compact?'Najnovšie dostupné správy':'Ručne dopĺňané, bez automatickej aktualizácie'}</p>
    {!compact&&<div className="news-filters"><div role="group" aria-label="Obdobie správ">{[['week','Posledných 7 dní'],['today','Dnes'],['all','Celý výber']].map(([id,label])=><button key={id} aria-pressed={period===id} onClick={()=>setPeriod(id)}>{label}</button>)}</div><label>Téma<select value={category} onChange={e=>setCategory(e.target.value)}><option value="all">Všetky témy</option>{['Vláda','Parlament','Prieskumy'].map(c=><option key={c}>{c}</option>)}</select></label></div>}
    <div className="news-scroll">
      {rows.map(n=><article className="news-entry" key={n.id}>
        <div className="news-entry-meta"><time dateTime={n.published}>{n.published===today?'Dnes':date(n.published)}</time><span>{n.category}</span></div>
        <h3><button type="button" onClick={()=>onOpenNews(n.id)}>{n.title}<ArrowRight size={15} aria-hidden="true"/><span className="sr-only"> — otvoriť zhrnutie</span></button></h3>
        <p>{n.summary}</p>
      </article>)}
      {!rows.length&&<div className="news-empty"><h3>Pre tento výber ešte nemáme správu.</h3><p>Výber dopĺňame ručne. Prázdny zoznam neznamená, že sa nič nestalo.</p><button onClick={()=>{setPeriod('all');setCategory('all');}}>Zobraziť všetky správy</button></div>}
    </div>
    {compact?<button className="news-open" onClick={onOpen}>Všetky správy a súvislosti <ArrowRight size={16}/></button>:<p className="news-footnote" role="status">{rows.length} z {politicalNews.length} správ vo výbere. Zhrnutia píšeme sami z pôvodných článkov; odkaz na originál je v každom zhrnutí.</p>}
  </section>;
}
