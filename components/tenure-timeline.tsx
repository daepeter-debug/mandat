import {formatTenureDate,tenureAsOf,type GovernmentTenure} from '@/lib/government-tenure';
import '@/app/editorial-context.css';
export default function TenureTimeline({tenure}:{tenure:GovernmentTenure}){
  if(!tenure.periods.length)return null;
  const start=Date.parse('1993-01-01'),end=Date.parse(tenureAsOf),x=(d:string)=>12+(Date.parse(d)-start)/(end-start)*296;
  return <figure className="tenure-timeline"><svg viewBox="0 0 320 68" role="img" aria-label={`Účasť vo vláde od roku 1993, stav k ${formatTenureDate(tenureAsOf)}. Farebné úseky označujú overené obdobia; presné dátumy a zdroje sú nižšie.`}><path d="M12 28H308" stroke="currentColor" opacity=".18" strokeWidth="8" strokeLinecap="round"/>{tenure.periods.map(p=><g key={p.start}><path d={`M${x(p.start)} 28H${x(p.end??tenureAsOf)}`} stroke="var(--party-color, #245c48)" strokeWidth="8"><title>{p.government}: {formatTenureDate(p.start)} – {formatTenureDate(p.end??tenureAsOf)}</title></path></g>)}{[1993,2000,2010,2020,2026].map(y=><g key={y}><path d={`M${x(`${y}-01-01`)} 40v4`} stroke="currentColor" opacity=".4"/><text x={x(`${y}-01-01`)} y="58" textAnchor={y===1993?'start':y===2026?'end':'middle'}>{y}</text></g>)}</svg><figcaption>Farebné úseky = účasť vo vláde · stav k {formatTenureDate(tenureAsOf)}</figcaption></figure>;
}
