import { agencies, archive, type Poll } from './polls.ts';
export const publicationDate = (poll: Poll) => poll.published ?? poll.end;
export const latestAgencyPolls = agencies.map(agency=>archive.filter(p=>p.agency===agency).sort((a,b)=>b.end.localeCompare(a.end))[0]).filter(p=>p!==undefined).sort((a,b)=>publicationDate(b).localeCompare(publicationDate(a))||b.end.localeCompare(a.end));
/** Only a known publication date earns the newest marker; unknown publication is not invented. */
export function newestPublishedPollIds(polls: Poll[]): Set<string> {
  const newest = polls.reduce((day,p)=>p.published&&p.published>day?p.published:day,'');
  return new Set(polls.filter(p=>p.published&&p.published===newest).map(p=>p.id));
}
export const newestPollIds = newestPublishedPollIds(latestAgencyPolls);
