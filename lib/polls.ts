import { additionalPolls } from "./additional-polls.ts";
export type Party = { id: string; name: string; short: string; color: string };
export const parties: Party[] = [
  { id:"ps", name:"Progresívne Slovensko", short:"PS", color:"#4267dc" },
  { id:"smer", name:"SMER – sociálna demokracia", short:"SMER", color:"#d64d57" },
  { id:"rep", name:"REPUBLIKA", short:"REPUBLIKA", color:"#9c723b" },
  { id:"slovensko", name:"Hnutie Slovensko", short:"SLOVENSKO", color:"#8054a7" },
  { id:"sas", name:"Sloboda a Solidarita", short:"SaS", color:"#298467" },
  { id:"hlas", name:"HLAS – sociálna demokracia", short:"HLAS", color:"#bd567b" },
  { id:"kdh", name:"Kresťanskodemokratické hnutie", short:"KDH", color:"#4392a4" },
  { id:"dem", name:"Demokrati", short:"DEMOKRATI", color:"#d77b2c" },
  { id:"aliancia", name:"Maďarská aliancia", short:"ALIANCIA", color:"#527648" },
  { id:"rodina", name:"SME RODINA", short:"SME RODINA", color:"#537782" },
  { id:"pnp", name:"Právo na pravdu", short:"PRÁVO NA PRAVDU", color:"#7d7290" },
  { id:"sns", name:"Slovenská národná strana", short:"SNS", color:"#55638b" },
  { id:"lsns", name:"Kotlebovci – Ľudová strana Naše Slovensko", short:"ĽSNS", color:"#556b40" },
  { id:"ku", name:"Konzervatívci – Kresťanská únia", short:"KÚ", color:"#66534e" },
  { id:"vidiek", name:"Strana vidieka", short:"STRANA VIDIEKA", color:"#5c7166" },
  { id:"zaludi", name:"ZA ĽUDÍ", short:"ZA ĽUDÍ", color:"#a38d35" },
];
export type Poll = { id:string; month:string; agency:string; published:string|null; start:string; end:string; sample:number|null; method:string; type:string; client:string; source:string; sourceName:string; values:Record<string,number>; complete:boolean; other?:number; note?:string };
const base = { agency:"NMS", method:"Online panel (CAWI)", type:"Volebný model", client:"Vlastný výskum NMS", sourceName:"NMS Market Research Slovakia", complete:false };
const akoBase = {agency:"AKO",method:"Telefonické dopytovanie",type:"Volebné preferencie",client:"JOJ 24",sourceName:"Agentúra AKO · tlačová správa",sample:1000,complete:false};
export const polls: Poll[] = [...additionalPolls.filter(p=>p.agency==="NMS"),
  {...base,id:"nms-2026-05",month:"Máj",published:"2026-05-13",start:"2026-05-06",end:"2026-05-10",sample:1002,source:"https://nms.global/sk/volebny-model-maj-2026/",values:{ps:19.8,smer:17,rep:11.8,slovensko:8.2,sas:7.5,hlas:7.1,kdh:5.5,dem:5.9,aliancia:3.9,rodina:3.5}},
  {...base,id:"nms-2026-06",month:"Jún",published:"2026-06-11",start:"2026-06-03",end:"2026-06-08",sample:1002,source:"https://nms.global/sk/volebny-model-jun-2026/",values:{ps:19.7,smer:16.4,rep:12.9,slovensko:8.3,sas:7.4,hlas:7.2,kdh:4.8,dem:5.5,aliancia:4.5,rodina:3.1,zaludi:2.9,pnp:2.7,sns:2.4}},
  {...base,id:"nms-2026-07",month:"Júl",published:"2026-07-08",start:"2026-07-01",end:"2026-07-06",sample:1002,source:"https://nms.global/sk/volebny-model-jul-2026/",values:{ps:18.8,smer:15.4,rep:12.8,slovensko:9.1,sas:8,hlas:7.7,kdh:5.8,dem:5.1,aliancia:4.2,rodina:3.5,sns:2.7,pnp:2.3}},
  {...base,id:"nms-2026-08",month:"August",published:"2026-08-12",start:"2026-08-05",end:"2026-08-10",sample:1001,source:"https://nms.global/sk/volebny-model-august-2026/",values:{ps:19.2,smer:16.5,rep:13.3,slovensko:8.9,sas:7.4,hlas:5.9,kdh:5.9,dem:4.6,aliancia:4,rodina:3.7,pnp:3.6,sns:2.9,zaludi:2.2}},
  {...base,id:"nms-2026-09",month:"September",published:"2026-09-10",start:"2026-09-02",end:"2026-09-07",sample:1004,source:"https://nms.global/sk/volebny-model-september-2026/",values:{ps:21.6,smer:16.2,rep:15.6,slovensko:9,sas:6.8,hlas:6.4,kdh:5.8,dem:4.8,aliancia:3.1,rodina:3,pnp:2.1,sns:1.9,zaludi:1.6},note:"Rozdiely počítame zo zverejnených hodnôt v tejto databáze. Slovný komentár agentúry uvádza pri niektorých stranách odlišné medzimesačné zmeny. SNS 1,9 % a ZA ĽUDÍ 1,6 % doplnené 12. 9. 2026 z vloženého grafu NMS: https://flo.uri.sh/visualisation/30183930/embed (filter September 2026)."},
];
export const dataVerified = "2026-09-24"; // deň poslednej ručnej kontroly dát a programových zdrojov
export const latest = polls[polls.length-1];
export const previous = polls[polls.length-2];
export const archive: Poll[] = [...polls,...additionalPolls.filter(p=>p.agency!=="NMS"),
  {...akoBase,id:"ako-2026-05",month:"Máj",published:"2026-05-29",start:"2026-05-14",end:"2026-05-21",source:"https://ako.sk/wp-content/uploads/2026/06/ag.AKO_VOLEBNE-PREF-MAJ-2026-tlacova-sprava.pdf",values:{ps:19.7,smer:18.9,rep:9.1,hlas:8.9,sas:8.6,slovensko:8.2,kdh:7.9,dem:5.1,sns:4.8,aliancia:4,rodina:2.2,pnp:2.1},note:"Percentá z rozhodnutých voličov (64,5 % celej vzorky). Subjekty pod 1 % zatiaľ nie sú prepísané. Publikované podľa dátumu tlačovej správy; umiestnenie PDF v júnovom priečinku nie je dátumom zberu."},
  {...akoBase,id:"ako-2026-06",month:"Jún",published:"2026-06-25",start:"2026-06-09",end:"2026-06-18",source:"https://ako.sk/wp-content/uploads/2026/06/ag.AKO_VOLEBNE-PREF-JUN-2026-tlacova-sprava-FF.pdf",values:{ps:20,smer:18.6,rep:9.5,hlas:8.6,sas:8.4,kdh:8,slovensko:7.3,dem:6.2,sns:4.9,aliancia:3.2,rodina:2.5,pnp:2.3},note:"Percentá z rozhodnutých voličov (60,8 % celej vzorky). Subjekty pod 1 % zatiaľ nie sú prepísané."},
  {...akoBase,id:"ako-2026-07",month:"Júl",published:"2026-07-23",start:"2026-07-08",end:"2026-07-14",source:"https://ako.sk/wp-content/uploads/2026/07/ag.AKO_VOLEBNE-PREF-JUL-2026-tlacova-sprava.pdf",values:{ps:20.8,smer:17.3,rep:9.7,sas:8.8,hlas:8.5,slovensko:8,kdh:7.7,dem:5.8,sns:4.8,aliancia:2.8,pnp:2.8,rodina:2.2},note:"Percentá z rozhodnutých voličov (65,3 % celej vzorky). Subjekty pod 1 % zatiaľ nie sú prepísané."},
  {id:"ako-2026-08",month:"August",agency:"AKO",published:"2026-08-24",start:"2026-08-06",end:"2026-08-14",sample:1000,method:"Telefonické dopytovanie",type:"Volebné preferencie",client:"JOJ 24",sourceName:"Agentúra AKO · tlačová správa",source:"https://ako.sk/wp-content/uploads/2026/08/ag.AKO_VOLEBNE-PREF-AUGUST-2026-tlacova-sprava-003.pdf",complete:false,values:{ps:21,smer:17.7,rep:9.8,sas:8.8,hlas:8.8,kdh:7.8,slovensko:7.7,sns:4.7,dem:4.3,aliancia:2.9,pnp:2.9,rodina:2.7},note:"Percentá z rozhodnutých voličov. Celková vzorka je 1 000 respondentov; rozhodnutých bolo 68,6 % opýtaných. Ďalšie subjekty pod 1 % zatiaľ nie sú prepísané do archívu."},
  {id:"sanep-2026-08",month:"August",agency:"SANEP",published:"2026-08-20",start:"2026-08-12",end:"2026-08-18",sample:2300,method:"V zdrojovom článku neuvedené",type:"Volebný model",client:"ta3",sourceName:"SANEP / ta3",source:"https://www.ta3.com/clanok/1066975/prieskum-pre-ta3-smer-si-drzi-ps-za-sebou-naskok-je-vsak-tesny-ktorym-lidrom-volici-doveruju-najviac",complete:false,values:{smer:19.2,ps:18.5,rep:12.2,slovensko:8.5,sas:7.8,hlas:6.9,kdh:6.4,dem:5.3,sns:4.6,aliancia:4.4,rodina:3.5},note:"Výsledky medzi rozhodnutými voličmi. Zdroj uvádza celkovú vzorku 2 300 osôb vo veku 18+; rozhodnutých bolo 67,9 %."}
].sort((a,b)=>b.end.localeCompare(a.end) || a.agency.localeCompare(b.agency));
export const agencies = [...new Set(archive.map(p=>p.agency))].sort();
export const agencySeries = (agency:string, count=5) => archive.filter(p=>p.agency===agency).sort((a,b)=>a.end.localeCompare(b.end)).slice(-count);
export const availableTrendAgencies = agencies.filter(a=>agencySeries(a).length>1);
export const fmt = (n:number) => n.toLocaleString("sk-SK",{minimumFractionDigits:1,maximumFractionDigits:1});
export const date = (s:string|null) => s ? new Date(s+"T12:00:00").toLocaleDateString("sk-SK") : "Neuvedené";
export const difference = (a:Poll,b:Poll,id:string) => a.values[id]!==undefined && b.values[id]!==undefined ? Math.round((a.values[id]-b.values[id])*10)/10 : null;
export const rank = (poll:Poll) => parties.filter(p=>poll.values[p.id]!==undefined).sort((a,b)=>poll.values[b.id]-poll.values[a.id]);
