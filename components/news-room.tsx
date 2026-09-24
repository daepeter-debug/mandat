"use client";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { ArrowLeft, ArrowRight, BarChart3, Building2, Check, ChevronLeft, ChevronRight, Flag, Landmark, Megaphone, Newspaper, Share2, Vote } from 'lucide-react';
import { politicalNews, newsChecked, newsDayGroups, dayHeading, weekdayShort, relativeDay, readingMinutes, type NewsCategory, type NewsDay, type PoliticalNews } from '@/lib/political-news';
import { date } from '@/lib/polls';
import { track } from '@/lib/track';
import '@/app/day-in-politics.css';

const day=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Bratislava',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const subscribe=(onChange:()=>void)=>{const timer=setInterval(onChange,60000);return()=>clearInterval(timer);};

/*
  Deň v politike: denný súhrn, nie živý prúd správ. Každý deň má vlastnú hlavičku, správy idú
  podľa dôležitosti (1 = téma dňa), aby čitateľ vedel, čo si pozrieť hneď a čo je menej podstatné.
  Pás dní začína vľavo dneškom, doprava idú staršie dni (šípka › aj potiahnutie doľava = starší deň).
  Zoznam neodkazuje na cudzie weby: titulok otvára naše zhrnutie, vydavateľ a originál sú v ňom.
*/
const icons:Record<NewsCategory,ReactNode>={Vláda:<Building2/>,Parlament:<Landmark/>,Opozícia:<Megaphone/>,Prezident:<Flag/>,Voľby:<Vote/>,Prieskumy:<BarChart3/>,Politika:<Newspaper/>};
export function NewsCategoryChip({category}:{category:NewsCategory}){
  return <span className="dip-chip" data-cat={category}>{icons[category]}{category}</span>;
}
const tier=(rank:number)=>rank===1?'Téma dňa':rank<=3?'Dôležité':'Stojí za pozornosť';
const count=(n:number)=>`${n} ${n===1?'správa':n>=2&&n<=4?'správy':'správ'}`;
const shortDate=(d:string)=>date(d).replace(/\s?2026$/,'').replace(/\s+$/,'');

// Plynulé prepnutie dňa (View Transitions) so smerom (starší deň prichádza sprava); bez podpory alebo pri obmedzení pohybu hneď.
function transition(run:()=>void,direction:'older'|'newer'|null=null){
  const doc=document as Document&{startViewTransition?:(cb:()=>void)=>{ready:Promise<void>;finished:Promise<void>;updateCallbackDone:Promise<void>}};
  if(!doc.startViewTransition||window.matchMedia('(prefers-reduced-motion: reduce)').matches){run();return;}
  const root=document.documentElement;
  if(direction) root.dataset.dipDir=direction; else delete root.dataset.dipDir;
  // Poistka: keď prehliadač prechod nespustí (skrytá karta, pomalé zariadenie), zmena prebehne do 400 ms aj bez neho.
  let done=false;
  const go=()=>{if(done)return;done=true;flushSync(run);};
  const t=doc.startViewTransition(go);
  window.setTimeout(go,400);
  t.ready.catch(()=>{});t.updateCallbackDone.catch(()=>{});
  t.finished.catch(()=>{}).finally(()=>{delete root.dataset.dipDir;});
}

// Potiahnutie prstom doľava = starší deň (ako v páse dní, kde staršie dni sú vpravo), doprava = novší. Zvislé posúvanie stránky ostáva prehliadaču.
function useSwipe(onOlder?:()=>void,onNewer?:()=>void){
  const start=useRef<{x:number;y:number}|null>(null);
  return {
    onPointerDown:(e:ReactPointerEvent)=>{if(e.pointerType!=='mouse')start.current={x:e.clientX,y:e.clientY};},
    onPointerCancel:()=>{start.current=null;},
    onPointerUp:(e:ReactPointerEvent)=>{
      const s=start.current;start.current=null;
      if(!s) return;
      const dx=e.clientX-s.x,dy=e.clientY-s.y;
      if(Math.abs(dx)<56||Math.abs(dx)<Math.abs(dy)*1.8) return;
      if(dx<0) onOlder?.(); else onNewer?.();
    },
  };
}

async function shareDay(d:NewsDay,say:(t:string)=>void){
  const url=`${location.origin}/?v=news&den=${d.date}`;
  const text=`Deň v politike · ${dayHeading(d.date)}\n${d.items.map((n,i)=>`${i+1}. ${n.title}`).join('\n')}`;
  track('share',`den-${d.date}`);
  if(navigator.share){try{await navigator.share({title:`Deň v politike · ${dayHeading(d.date)}`,text,url});}catch{/* zrušené */}return;}
  try{await navigator.clipboard.writeText(`${text}\n${url}`);say('Súhrn dňa je skopírovaný.');}catch{say('Kopírovanie sa nepodarilo.');}
}

function DayStrip({days,current,today,onPick,compact=false}:{days:NewsDay[];current:string;today:string;onPick:(d:string)=>void;compact?:boolean}){
  const list=useRef<HTMLOListElement>(null);
  const first=useRef(true);
  // Vybraný deň do stredu pása (len vodorovne, stránka neposkočí); prvýkrát bez animácie. Okraje sa stmievajú podľa toho, kam sa dá posúvať.
  useEffect(()=>{
    const ol=list.current,btn=ol?.querySelector<HTMLElement>('[aria-current="date"]');
    if(!ol||!btn) return;
    ol.scrollTo({left:btn.offsetLeft-ol.clientWidth/2+btn.offsetWidth/2,behavior:first.current?'instant':'smooth'});
    first.current=false;
  },[current]);
  useEffect(()=>{
    const ol=list.current;
    if(!ol) return;
    const edges=()=>{ol.dataset.start=ol.scrollLeft<4?'1':'';ol.dataset.end=ol.scrollLeft+ol.clientWidth>=ol.scrollWidth-4?'1':'';};
    edges();
    ol.addEventListener('scroll',edges,{passive:true});
    window.addEventListener('resize',edges);
    return()=>{ol.removeEventListener('scroll',edges);window.removeEventListener('resize',edges);};
  },[days.length]);
  return <nav className={`dip-days${compact?' is-compact':''}`} aria-label="Vyberte deň">
    <ol ref={list}>{days.map(d=>{const rel=relativeDay(d.date,today);return <li key={d.date}>
      <button type="button" aria-current={d.date===current?'date':undefined} onClick={()=>onPick(d.date)} aria-label={`${dayHeading(d.date)}, ${count(d.items.length)}`}>
        <span>{rel??weekdayShort(d.date)}</span><b>{shortDate(d.date)}</b>
        <i aria-hidden="true">{d.items.slice(0,6).map(n=><em key={n.id}/>)}</i>
      </button>
    </li>;})}</ol>
  </nav>;
}

function DayCard({d,today,onOpenNews,onPrev,onNext,onShare}:{d:NewsDay;today:string;onOpenNews:(id:string)=>void;onPrev?:()=>void;onNext?:()=>void;onShare:()=>void}){
  const uid=useId();
  const rel=relativeDay(d.date,today);
  const swipe=useSwipe(onPrev,onNext);
  return <section className="dip-day" aria-labelledby={uid} style={{viewTransitionName:'dip-day'}}>
    <header className="dip-day-head">
      <p className="dip-kicker">Súhrn dňa{rel?<> · <b>{rel}</b></>:null}</p>
      <h2 id={uid}>{dayHeading(d.date)}</h2>
      {d.line&&<p className="dip-line">{d.line}</p>}
      <p className="dip-meta">{count(d.items.length)}{d.analyzed?<> z {d.analyzed} politických udalostí dňa</>:null} · zoradené od najdôležitejšej</p>
    </header>
    <ol className="dip-list" {...swipe}>{d.items.map((n,i)=><NewsItem key={n.id} n={n} rank={i+1} onOpen={()=>onOpenNews(n.id)}/>)}</ol>
    <footer className="dip-day-nav">
      <button type="button" onClick={onNext} disabled={!onNext}><ArrowLeft size={16} aria-hidden="true"/>Novší deň</button>
      <button type="button" className="dip-share" onClick={onShare}><Share2 size={16} aria-hidden="true"/>Zdieľať súhrn</button>
      <button type="button" onClick={onPrev} disabled={!onPrev}>Starší deň<ArrowRight size={16} aria-hidden="true"/></button>
    </footer>
  </section>;
}

function NewsItem({n,rank,onOpen}:{n:PoliticalNews;rank:number;onOpen:()=>void}){
  return <li className={`dip-item${rank===1?' is-lead':''}`}>
    <span className="dip-rank" aria-hidden="true">{rank}</span>
    <div className="dip-body">
      <div className="dip-item-meta"><span className="dip-tier"><span className="sr-only">{rank}. · </span>{tier(rank)}</span><NewsCategoryChip category={n.category}/></div>
      <h3><button type="button" onClick={onOpen}>{n.title}</button></h3>
      <p>{n.summary}</p>
      <button type="button" className="dip-read" onClick={onOpen}>Prečítať zhrnutie<span aria-hidden="true"> · {readingMinutes(n)} min</span><ArrowRight size={15} aria-hidden="true"/></button>
    </div>
  </li>;
}

/** Úvod: aktuálny deň, jeho správy s krátkym popisom a pás dní na presun do starších dní. */
function DayDigest({days,today,onOpen,onOpenNews}:{days:NewsDay[];today:string;onOpen?:(day:string)=>void;onOpenNews:(id:string)=>void}){
  const uid=useId();
  const [selected,setSelected]=useState<string|null>(null);
  const index=Math.max(0,days.findIndex(d=>d.date===selected));
  const current=days[index];
  const older=days[index+1],newer=days[index-1];
  const go=(d:NewsDay|undefined,direction:'older'|'newer'|null)=>{if(!d)return;transition(()=>setSelected(d.date),direction);track('view',`uvod-den-${d.date}`);};
  const swipe=useSwipe(older?()=>go(older,'older'):undefined,newer?()=>go(newer,'newer'):undefined);
  const rel=relativeDay(current.date,today);
  return <section className="news-digest dip-digest" aria-labelledby={uid}>
    <header className="dip-digest-head">
      <h2 id={uid}><Newspaper size={18} strokeWidth={1.6} aria-hidden="true"/>Deň v politike</h2>
      <div className="dip-digest-arrows">
        <button type="button" onClick={()=>go(newer,'newer')} disabled={!newer} aria-label={newer?`Novší deň: ${dayHeading(newer.date)}`:'Novší deň'}><ChevronLeft size={18} aria-hidden="true"/></button>
        <button type="button" onClick={()=>go(older,'older')} disabled={!older} aria-label={older?`Starší deň: ${dayHeading(older.date)}`:'Starší deň'}><ChevronRight size={18} aria-hidden="true"/></button>
      </div>
    </header>
    <DayStrip compact days={days} current={current.date} today={today} onPick={d=>go(days.find(x=>x.date===d),d<current.date?'older':'newer')}/>
    <div className="news-scroll" {...swipe}>
      <div className="dip-digest-day" style={{viewTransitionName:'dip-digest'}}>
        <p className="dip-digest-date">{rel?<b>{rel} · </b>:null}{dayHeading(current.date)}<span> · {count(current.items.length)}</span></p>
        {current.line&&<p className="dip-line">{current.line}</p>}
        <ol className="dip-mini">{current.items.map((n,i)=><li key={n.id} className={i===0?'is-lead':undefined}>
          <span className="dip-rank" aria-hidden="true">{i+1}</span>
          <div>
            <div className="dip-mini-meta">{i===0&&<span className="dip-tier">Téma dňa</span>}<NewsCategoryChip category={n.category}/></div>
            <h3><button type="button" onClick={()=>onOpenNews(n.id)}><span className="sr-only">{i+1}. </span>{n.title}<ArrowRight size={15} aria-hidden="true"/></button></h3>
            <p>{n.summary}</p>
          </div>
        </li>)}</ol>
      </div>
    </div>
    <button className="news-open" onClick={()=>onOpen?.(current.date)}>Celý súhrn dňa a ďalšie dni <ArrowRight size={16} aria-hidden="true"/></button>
  </section>;
}

export default function PoliticalNewsFeed({compact=false,onOpen,onOpenNews,day:dayParam=null,onDay}:{compact?:boolean;onOpen?:(day:string)=>void;onOpenNews:(id:string)=>void;day?:string|null;onDay?:(d:string)=>void}){
  const uid=useId();
  const today=useSyncExternalStore(subscribe,day,()=>newsChecked);
  const days=newsDayGroups(politicalNews,today);
  const [local,setLocal]=useState<string|null>(null);
  const [toast,setToast]=useState('');
  const say=(t:string)=>{setToast(t);window.setTimeout(()=>setToast(''),2400);};
  const selected=dayParam??local;
  const index=Math.max(0,days.findIndex(d=>d.date===selected));
  const current=days[index];
  const pick=(d:string,direction:'older'|'newer'|null=null)=>{transition(()=>{if(onDay)onDay(d);else setLocal(d);},direction);track('view',`den-${d}`);};

  if(!current) return <section className={compact?'news-digest dip-digest':'dip-page'} aria-labelledby={uid}><h2 id={uid}>Deň v politike</h2><p className="dip-meta">Súhrn zatiaľ nemáme.</p></section>;
  if(compact) return <DayDigest days={days} today={today} onOpen={onOpen} onOpenNews={onOpenNews}/>;

  const older=days[index+1],newer=days[index-1];
  return <section className="dip-page" aria-labelledby={uid}>
    <header className="dip-hero">
      <p className="dip-kicker">Deň v politike</p>
      <h1 id={uid}>Čo by nemalo zapadnúť.</h1>
      <p>Každý deň prejdeme politické udalosti a vyberieme tie, ktoré hýbu politikou. Zoradené od najdôležitejšej, zhrnuté vlastnými slovami, s odkazom na pôvodný článok.</p>
      <p className="dip-checked">Súhrn nie je živý spravodajský prúd · kontrola zdrojov {date(newsChecked)}</p>
    </header>
    <DayStrip days={days} current={current.date} today={today} onPick={d=>pick(d,d<current.date?'older':'newer')}/>
    <DayCard d={current} today={today} onOpenNews={onOpenNews} onPrev={older?()=>pick(older.date,'older'):undefined} onNext={newer?()=>pick(newer.date,'newer'):undefined} onShare={()=>void shareDay(current,say)}/>
    {days.length>1&&<section className="dip-archive" aria-labelledby={`${uid}-archive`}>
      <h2 id={`${uid}-archive`}>Predchádzajúce dni</h2>
      <ul>{days.filter(d=>d.date!==current.date).map(d=><li key={d.date}><button type="button" onClick={()=>{pick(d.date,d.date<current.date?'older':'newer');window.scrollTo({top:0,behavior:'smooth'});}}>
        <span className="dip-archive-date">{dayHeading(d.date)}<small>{count(d.items.length)}</small></span>
        <span className="dip-archive-line">{d.line||d.items[0]?.title}</span>
        <ArrowRight size={16} aria-hidden="true"/>
      </button></li>)}</ul>
    </section>}
    <p className="dip-footnote">Zhrnutia píšeme sami z pôvodných článkov; vydavateľ a odkaz na originál sú v každom zhrnutí. Výber je redakčný a neznamená, že iné udalosti sa nestali.</p>
    {toast&&<p className="dip-toast" role="status"><Check size={15} aria-hidden="true"/>{toast}</p>}
  </section>;
}

/** Hlavička a listovanie v detaile správy: deň, poradie, susedné správy toho istého dňa, zdieľanie. */
export function NewsSheetMeta({n,position,count:total}:{n:PoliticalNews;position:number;count:number}){
  return <span className="dip-sheet-meta"><NewsCategoryChip category={n.category}/><span>Deň v politike · {dayHeading(n.published)} · {position}. z {total}</span><span>{readingMinutes(n)} min čítania</span></span>;
}
export function NewsSheetNav({prev,next,onOpen,id}:{prev:PoliticalNews|null;next:PoliticalNews|null;onOpen:(id:string)=>void;id:string}){
  const [copied,setCopied]=useState(false);
  async function share(){
    const url=`${location.origin}/?v=news&sp=${id}`;
    track('share',`sprava-${id}`);
    if(navigator.share){try{await navigator.share({url,title:document.title});}catch{/* zrušené */}return;}
    try{await navigator.clipboard.writeText(url);setCopied(true);window.setTimeout(()=>setCopied(false),2000);}catch{/* bez schránky */}
  }
  return <nav className="dip-sheet-nav" aria-label="Ďalšie správy dňa">
    {prev?<button type="button" onClick={()=>onOpen(prev.id)}><ArrowLeft size={16} aria-hidden="true"/><span><small>Dôležitejšia</small>{prev.title}</span></button>:<span/>}
    {next?<button type="button" className="is-next" onClick={()=>onOpen(next.id)}><span><small>Ďalšia správa dňa</small>{next.title}</span><ArrowRight size={16} aria-hidden="true"/></button>:<span/>}
    <button type="button" className="dip-sheet-share" onClick={()=>void share()}>{copied?<Check size={15} aria-hidden="true"/>:<Share2 size={15} aria-hidden="true"/>}{copied?'Odkaz skopírovaný':'Zdieľať správu'}</button>
  </nav>;
}
