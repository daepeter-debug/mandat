import type { Poll } from './polls.ts';
import type { PoliticalNews } from './political-news.ts';
import type { VoteSummary } from './votes.ts';

export type CoverKind = 'news' | 'poll' | 'vote';
/** Only known publication dates compete. Collection end is not a publication date. */
export function coverSources(polls: readonly Poll[], news: readonly PoliticalNews[], votes: readonly VoteSummary[], asOf: string) {
  const poll = polls.filter(p => p.published && p.published <= asOf).toSorted((a,b) => b.published!.localeCompare(a.published!) || a.agency.localeCompare(b.agency))[0] ?? null;
  const items = news.filter(n => n.published <= asOf).toSorted((a,b) => b.published.localeCompare(a.published) || (a.rank ?? 99) - (b.rank ?? 99) || a.id.localeCompare(b.id));
  const lead = items[0] ?? null;
  const day = lead ? items.filter(n => n.published === lead.published) : [];
  const vote = votes.filter(v => v.datum <= asOf).toSorted((a,b) => b.datum.localeCompare(a.datum) || b.cas.localeCompare(a.cas) || b.id - a.id)[0] ?? null;
  const candidates: {kind:CoverKind;date:string}[] = [];
  if (lead) candidates.push({kind:'news',date:lead.published});
  if (poll?.published) candidates.push({kind:'poll',date:poll.published});
  if (vote) candidates.push({kind:'vote',date:vote.datum});
  const latest = candidates.toSorted((a,b) => b.date.localeCompare(a.date))[0]?.kind ?? null;
  return { poll, lead, day, vote, latest };
}

export function ballotValue(value:number):number|null {
  return Number.isFinite(value) ? Math.max(0,Math.min(100,Math.round(value*10)/10)) : null;
}

export function readCoverVotes(data:unknown):VoteSummary[]|null {
  if (!data || typeof data !== 'object' || !('v' in data) || data.v !== 1 || !('hlasovania' in data) || !Array.isArray(data.hlasovania)) return null;
  const counts=['za','proti','zdrzalo','nehlasovalo','nepritomni'] as const;
  if (!data.hlasovania.every(v=>v && typeof v==='object' && Number.isSafeInteger(v.id) && v.id>0 && typeof v.datum==='string' && /^\d{4}-\d{2}-\d{2}$/.test(v.datum) && typeof v.cas==='string' && typeof v.nazov==='string' && typeof v.preslo==='boolean' && counts.every(k=>Number.isInteger(v[k])&&v[k]>=0) && counts.reduce((sum,k)=>sum+v[k],0)===150)) return null;
  return data.hlasovania as VoteSummary[];
}
