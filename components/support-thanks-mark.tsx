import {hemicycleSeats} from '@/lib/parliament';
import type {CSSProperties} from 'react';
const seats=hemicycleSeats(30,3);
/** Brand geometry, rendered only inside the server-confirmed paid branch. */
export default function SupportThanksMark(){
  return <div className="support-thanks-mark" aria-hidden="true"><svg viewBox="-1.15 -1.2 2.3 1.4" width="160" height="100">{seats.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r=".075" style={{'--thanks-delay':`${i*20}ms`} as CSSProperties}/>)}</svg><b>mandát<span>.</span></b></div>;
}
