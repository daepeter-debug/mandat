import { fmt } from '@/lib/polls';
import type { AggregateValue } from '@/lib/aggregate';
import '@/app/support-range.css';
/** A local numeric axis, always including 5%, with explicitly labelled endpoints. */
export default function SupportRange({support}:{support:AggregateValue}) {
  const start=Math.max(0,Math.floor(Math.min(5,support.lower))-1),end=Math.ceil(Math.max(5,support.upper))+1;
  const x=(value:number)=>20+(value-start)/(end-start)*260;
  return <figure className="support-range"><svg viewBox="0 0 300 67" role="img" aria-label={`Model ${fmt(support.value)} %, pásmo neistoty ${fmt(support.lower)} až ${fmt(support.upper)} %, hranica postupu samostatnej strany 5 %.`}>
    <path d="M20 31 H280" stroke="currentColor" opacity=".15" strokeWidth="3"/>
    <path d={`M${x(support.lower).toFixed(6)} 31 H${x(support.upper).toFixed(6)}`} stroke="var(--party-color)" strokeOpacity=".35" strokeWidth="12" strokeLinecap="round"/>
    <path d={`M${x(5).toFixed(6)} 21 V41`} stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2"/>
    <circle cx={x(support.value).toFixed(6)} cy="31" r="5" fill="var(--party-color)" stroke="var(--card)" strokeWidth="2"/>
    <text x="20" y="58">{start} %</text><text x={x(5).toFixed(6)} y="13" textAnchor="middle">hranica 5 %</text><text x="280" y="58" textAnchor="end">{end} %</text>
  </svg><figcaption>Farebný úsek = pásmo neistoty · bod = model</figcaption></figure>;
}
