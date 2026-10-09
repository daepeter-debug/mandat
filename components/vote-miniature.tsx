"use client";
import { useEffect, useRef, useState } from "react";
import MiniHemicycle from "@/components/mini-hemicycle";
import { markColors, marks, seatMembers, voteFile, type VoteDetail, type VoteSummary } from "@/lib/votes";
const cache = new Map<number, Promise<VoteDetail>>();
function load(id: number) {
  const found = cache.get(id); if (found) return found;
  const request = fetch(voteFile(id)).then(async response => {
    if (!response.ok) throw new Error("vote");
    const detail: VoteDetail = await response.json();
    if (detail.id !== id || !Array.isArray(detail.kluby) || !Array.isArray(detail.poslanci) || detail.poslanci.length !== 150
      || !detail.poslanci.every(m => Array.isArray(m) && m.length === 4 && Number.isInteger(m[2]) && typeof detail.kluby[m[2]] === "string" && marks.includes(m[3]))) throw new Error("vote-data");
    return detail;
  }).catch(error => { cache.delete(id); throw error; });
  cache.set(id, request); if (cache.size > 24) cache.delete(cache.keys().next().value!);
  return request;
}
export default function VoteMiniature({ vote }: { vote: VoteSummary }) {
  const element = useRef<HTMLSpanElement>(null), [detail, setDetail] = useState<VoteDetail | null>(null);
  useEffect(() => {
    let live = true, observer: IntersectionObserver | undefined;
    const start = () => { observer?.disconnect(); void load(vote.id).then(d => { if (live) setDetail(d); }).catch(() => {}); };
    if (typeof IntersectionObserver === "undefined") start();
    else { observer = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) start(); }, { rootMargin: "80px" }); if (element.current) observer.observe(element.current); }
    return () => { live = false; observer?.disconnect(); };
  }, [vote.id]);
  const counts = { Z: vote.za, P: vote.proti, "?": vote.zdrzalo, N: vote.nehlasovalo, "0": vote.nepritomni };
  return <span className="vote-miniature" ref={element}>
    {detail ? <MiniHemicycle className="vote-mini-arc" colors={seatMembers(detail).map(m => markColors[m.mark])} label={`150 kresiel podľa klubov: za ${vote.za}, proti ${vote.proti}, zdržalo sa ${vote.zdrzalo}, nehlasovalo ${vote.nehlasovalo}, neprítomných ${vote.nepritomni}.`}/>
      : <span className="parl-mini-bar" aria-hidden="true">{marks.map(m => counts[m] > 0 && <i key={m} style={{ flexGrow: counts[m], background: markColors[m] }}/>)}</span>}
  </span>;
}
