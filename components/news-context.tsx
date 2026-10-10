import {ArrowRight} from 'lucide-react';
import {newsContext} from '@/lib/news-context';
import {date} from '@/lib/polls';
import type {PoliticalNews} from '@/lib/political-news';
import '@/app/editorial-context.css';
export default function NewsContext({item,onOpen}:{item:PoliticalNews;onOpen:(id:string)=>void}){
  const context=newsContext(item);if(!context)return null;
  return <section className="news-context" aria-label="Predchádzajúce správy k téme"><h3>K téme v našom archíve</h3><p>{context.label} · výber starších zhrnutí</p><ol>{context.items.map(n=><li key={n.id}><button onClick={()=>onOpen(n.id)}><time dateTime={n.published}>{date(n.published)}</time><span>{n.title}<small>{n.sourceName}</small></span><ArrowRight size={15} aria-hidden="true"/></button></li>)}</ol></section>;
}
