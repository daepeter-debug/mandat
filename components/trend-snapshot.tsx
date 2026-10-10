import Image from 'next/image';
import logos from '@/lib/party-logos.json';
import {fmt,date,type Party} from '@/lib/polls';
import type {AggregatePoint} from '@/lib/aggregate';
export default function TrendSnapshot({point,parties,focus,onFocus}:{point:AggregatePoint;parties:Party[];focus:string;onFocus:(id:string)=>void}){
  const partyLogos=logos as Record<string,{src:string}>;
  const available=parties.filter(p=>point.values[p.id]).sort((a,b)=>point.values[b.id].value-point.values[a.id].value);
  return <div className="trend-snapshot"><div className="trend-snapshot-head"><strong>Hodnoty k {date(point.date)}</strong><small>Model Mandát · percentá podpory</small></div><div className="trend-snapshot-values">{available.map(p=><button key={p.id} aria-pressed={p.id===focus} aria-label={`Zvýrazniť ${p.short}, ${fmt(point.values[p.id].value)} percent`} onClick={()=>onFocus(p.id)}>{partyLogos[p.id]&&<Image className="trend-snapshot-logo" src={partyLogos[p.id].src} alt="" width={19} height={19} unoptimized/>}<span>{p.short}</span><b>{fmt(point.values[p.id].value)} %</b></button>)}</div></div>;
}
