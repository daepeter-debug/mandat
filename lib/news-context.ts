import {politicalNews,type PoliticalNews} from './political-news.ts';
/** Archive retrieval by an explicit subject; this does not infer causation between stories. */
const subjects=[
  {label:'Filip Kuffa a envirorezort',match: /kuff/u},
  {label:'Rozpočet a rozpočtové pravidlá',match:/rozpoč|provizór/u},
  {label:'Tomáš Taraba',match:/tarab/u},
  {label:'Vyšetrovatelia okolo Jána Čurillu',match:/čurill/u},
];
export function newsContext(item:PoliticalNews,archive:PoliticalNews[]=politicalNews):{label:string;items:PoliticalNews[]}|null {
  const subject=subjects.find(s=>s.match.test(item.title.toLocaleLowerCase('sk')));
  if(!subject)return null;
  const items=archive.filter(n=>n.id!==item.id&&n.published<item.published&&subject.match.test(n.title.toLocaleLowerCase('sk'))).sort((a,b)=>b.published.localeCompare(a.published)||(a.rank??99)-(b.rank??99)||a.id.localeCompare(b.id)).slice(0,3).reverse();
  return items.length?{label:subject.label,items}:null;
}
