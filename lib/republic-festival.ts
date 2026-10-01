import { connected, distance, dayNumber, type Point, type RepublicState, type Result } from "./republic.ts";

export type Theme = "books" | "food" | "music";
export type Incident = "rain" | "power" | "crowd";
export type Mood = [number, number, number];
export type Support = "shelter"|"welcome"|"quiet";
export const supports:Record<Support,{name:string;cost:number;mood:Mood;hint:string}>={
 shelter:{name:"Krytý stánok",cost:2,mood:[1,1,0],hint:"Eva +1, Milan +1. Priamo vedľa programu ďalší bod pre Evu. Zmierni dážď."},
 welcome:{name:"Uvítací stolík",cost:1,mood:[0,-1,2],hint:"Nina +2, Milan −1. Do 2 políčok od námestia ešte Nina +1. Pomôže pri návale."},
 quiet:{name:"Tichý kútik",cost:1,mood:[2,0,-1],hint:"Eva +2, Nina −1. Body pre Evu získaš iba pri odstupe 2 políčok od programu."},
};
export type Festival = { day:string; best:number; preparations:(Point&{kind:Support})[]; round:number; theme:Theme|null; site:Point|null; mood:Mood|null; discovery:string|null; incident:Incident; response:number|null };
export type FestivalCommand = {type:"festival-replan"}|{type:"festival-start"}|{type:"festival-theme";theme:Theme}|{type:"festival-site";target:Point}|{type:"festival-prep";kind:Support;target:Point}|{type:"festival-response";choice:number};
export const neighbours = ["Eva", "Milan", "Nina"] as const;
export const themes:Record<Theme,{name:string;description:string;cost:number;mood:Mood;wish:string}> = {
  books:{name:"Príbehy pod stromami",description:"Čítanie a dielničky pre deti. Eva sa teší, Milanovi bude chýbať niečo praktické.",cost:2,mood:[2,-1,1],wish:"Skús nájsť miesto pri škole alebo knižnici."},
  food:{name:"Susedský piknik",description:"Domáce jedlo a výmena receptov. Milan rozloží stoly; zvyšok štvrte ešte potrebuješ získať.",cost:2,mood:[0,2,0],wish:"Záhrada v okolí môže prispieť čerstvou úrodou."},
  music:{name:"Koncert medzi domami",description:"Nina priláka ľudí hudbou. Eva sa obáva hluku pri domoch.",cost:3,mood:[-1,1,2],wish:"Park je príjemný sused. Domy ocenia odstup."},
};
type Response = {name:string;description:string;cost:number;mood:Mood};
export const incidents:Record<Incident,{title:string;text:string;mood:Mood}> = {
  rain:{title:"Nad štvrťou sa zatiahlo.",text:"Predpoveď hlási krátky dážď práve počas programu. Ľudia už prichádzajú. Čo zachrániš ako prvé?",mood:[-1,0,-1]},
  power:{title:"Zásuvka zostala bez prúdu.",text:"Milan skúsil predlžovačku, ale istič znovu vypadol. Program sa má o chvíľu začať.",mood:[0,-1,-1]},
  crowd:{title:"Prišli aj susedia spoza trate.",text:"Pozvánka sa rozšírila. Máme viac návštevníkov, než sme čakali, a pri vstupe sa tvorí rad.",mood:[-1,0,0]},
};
export function responses(f:Festival):Response[] {
  switch(f.incident) {
    case "rain":return [
      {name:"Požičať veľký stan",description:"Sucho pre deti aj program. Prenos stolov zamestná Milana.",cost:3,mood:[2,-1,1]},
      {name:"Presunúť program pod strechu",description:f.theme==="books"?"Knihy sa zmestia do školy. Nina obmedzí počet hostí.":"Menší program v škole. Nina musí odmietnuť časť hostí.",cost:0,mood:[f.theme==="books"?2:1,1,-2]},
      {name:"Rozdeliť program na kratšie bloky",description:"Každý sa vystrieda, ale deti budú čakať. Milan pomôže s presunmi.",cost:2,mood:[-1,1,2]},
    ];
    case "power":return [
      {name:"Požičať generátor",description:"Program pokračuje. Motor pri deťoch Eve prekáža.",cost:3,mood:[-1,1,2]},
      {name:"Urobiť program bez elektriny",description:f.theme==="music"?"Akustický koncert má čaro, no Nina stratí časť publika.":"Čítanie aj piknik fungujú bez káblov. Nina skráti večerný program.",cost:0,mood:[2,1,f.theme==="music"?-2:-1]},
      {name:"Opraviť prípojku s dobrovoľníkmi",description:"Eva pripraví detský kútik. Milan príde o čas pri svojom programe.",cost:2,mood:[1,-2,2]},
    ];
    case "crowd":return [
      {name:"Otvoriť ďalší vstup",description:"Nina rozdelí návštevníkov. Milan bude celý deň organizovať rad.",cost:2,mood:[1,-2,2]},
      {name:"Vpúšťať menšie skupiny",description:"Deti majú pokoj a Milan čas na hostí. Nina musí niektorých nechať čakať.",cost:0,mood:[2,1,-2]},
      {name:"Pridať stoly a detský kútik",description:"Viac miesta pre rodiny, viac práce pre Milana.",cost:3,mood:[2,-1,1]},
    ];
}
}
export const festivalBudget=(f:Festival)=>8-f.preparations.reduce((sum,p)=>sum+supports[p.kind].cost,0)-(f.theme?themes[f.theme].cost:0)-(f.response!==null?responses(f)[f.response].cost:0);
const add=(a:Mood,b:Mood):Mood=>a.map((v,i)=>v+b[i]) as Mood;
const clamp=(a:Mood):Mood=>a.map(v=>Math.max(0,Math.min(5,v))) as Mood;
export function festivalSites(town:RepublicState):Point[] {
  return Array.from({length:36},(_,i)=>({x:i%6,y:Math.floor(i/6)})).filter(p=>{
    const object=town.placed.find(o=>distance(o,p)===0);
    return (object?.id==="plaza"||connected(town,p))&&!town.roads.some(r=>distance(r,p)===0)&&(!object||["plaza","park","garden"].includes(object.id));
  });
}
export function siteReport(town:RepublicState,theme:Theme,p:Point) {
  const near=(ids:string[])=>town.placed.some(o=>ids.includes(o.id)&&distance(o,p)<=2&&connected(town,o));
  const central=distance(p,{x:2,y:2})<=2,homes=near(["house"]);
  const discovery=theme==="books"&&near(["school","library"])?"Čitateľský dvor: škola alebo knižnica v dosahu dá Eve +1."
    :theme==="food"&&near(["garden"])?"Zo záhrady na stôl: miestna úroda dá Milanovi +1."
    :theme==="music"&&near(["park"])?"Koncert v zeleni: park v dosahu dá Nine +1.":null;
  let mood=add([2,2,2],themes[theme].mood);
  mood=add(mood,[theme==="music"&&homes?-2:1,central?0:1,central?1:-1]);
  if(discovery)mood=add(mood,theme==="books"?[1,0,0]:theme==="food"?[0,1,0]:[0,0,1]);
  return {mood,discovery,notes:[central?"Blízko námestia: Nina +1.":"Ďalej od centra: Milan +1 za priestor, Nina −1 za dochádzanie.",theme==="music"&&homes?"Hudba pri domoch: Eva −2 za hluk.":"Pokojný program alebo odstup od domov: Eva +1."]};
}
export function dailyBrief(day:string) {
  const i=dayNumber(day)%3;
  return {title:["Slávnosť pre celú štvrť","Rodiny majú svoj deň","Susedia spoza trate"][i],goal:["Aspoň dvaja spokojní susedia a spolu 11 bodov spokojnosti.","Aspoň dvaja spokojní susedia, Eva aspoň 4 z 5.","Aspoň dvaja spokojní susedia, Nina aspoň 4 z 5."][i],kind:i};
}
export function prepSites(town:RepublicState,f:Festival):Point[] {
 return !f.site?[]:festivalSites(town).filter(p=>distance(p,f.site!)>0&&distance(p,f.site!)<=2&&!f.preparations.some(o=>distance(o,p)===0));
}
export function preparedMood(f:Festival):Mood {
  let prepared=f.mood??add([2,2,2],f.theme?themes[f.theme].mood:[0,0,0]);
  for(const p of f.preparations)prepared=add(prepared,preparationImpact(f,p));
  return prepared;
}
export function preparationImpact(f:Festival,p:Point&{kind:Support}):Mood {
  const base=supports[p.kind].mood;
  const close=!!f.site&&distance(p,f.site)===1;
  return add(base,p.kind==="quiet"&&close?[-2,0,0]:p.kind==="shelter"&&close?[1,0,0]:p.kind==="welcome"&&distance(p,{x:2,y:2})<=2?[0,0,1]:[0,0,0]);
}
export function activeFestival(town:RepublicState):Festival {
  const f=town.festival!;
  if(!f.site||!f.theme||f.response!==null)return f;
  const report=siteReport(town,f.theme,f.site);
  return {...f,mood:report.mood,discovery:report.discovery};
}
export function festivalLayoutReady(town:RepublicState,f:Festival):boolean {
  const sites=festivalSites(town);
  return !!f.site&&sites.some(p=>distance(p,f.site!)===0)&&f.preparations.every(p=>sites.some(s=>distance(s,p)===0));
}
export function festivalResult(f:Festival,choice=f.response) {
  let prepared=preparedMood(f);
  if(f.incident==="rain"&&f.preparations.some(p=>p.kind==="shelter"))prepared=add(prepared,[1,0,1]);
  if(f.incident==="crowd"&&f.preparations.some(p=>p.kind==="welcome"))prepared=add(prepared,[1,0,0]);
  const mood=clamp(add(add(prepared,incidents[f.incident].mood),choice===null?[0,0,0]:responses(f)[choice].mood));
  const happy=mood.filter(n=>n>=3).length;
  const kind=dailyBrief(f.day).kind;
  const special=kind===0?mood.reduce((a,b)=>a+b,0)>=11:kind===1?mood[0]>=4:mood[2]>=4;
  const reserve=8-(f.theme?themes[f.theme].cost:0)-f.preparations.reduce((sum,p)=>sum+supports[p.kind].cost,0)-(choice===null?0:responses(f)[choice].cost);
  const stars=Number(happy>=2)+Number(special)+Number(reserve>=1);
  return {mood,happy,stars,special,reserve,title:happy===3?"Slávnosť, na ktorú budú spomínať.":happy===2?"Štvrť má čo oslavovať.":"Prvý pokus. Nabudúce po svojom.",
    reactions:mood.map((n,i)=>n>=3?["Deti mali svoj priestor. Prídeme znova!","Malo to zmysel. Nabudúce zavolám aj kolegov.","Susedia sa konečne stretli. Toto zopakujme!"][i]:["Nabudúce by som chcela viac pokoja pre deti.","Potreboval som viac priestoru na vlastný program.","Škoda, že sme nedokázali zapojiť viac ľudí."][i])};
}
export function festivalCommand(town:RepublicState,c:FestivalCommand):Result {
  const bad=(message:string):Result=>({ok:false,message});
  const s=structuredClone(town),f=s.festival;
  if(c.type==="festival-start") {
    if(f&&f.response===null)return bad("Slávnosť už pripravuješ. Pokračuj rozpracovaným krokom.");
    const round=(f?.round??0)+1;if(round>100000)return bad("Dosiahol si limit slávností v tomto prototype.");
    s.festival={day:s.lastDay,best:f?.day===s.lastDay?f.best:0,preparations:[],round,theme:null,site:null,mood:null,discovery:null,incident:(["rain","power","crowd"] as Incident[])[(s.seed+dayNumber(s.lastDay))%3],response:null};
  } else {
    if(!f||f.response!==null)return bad("Najprv začni novú slávnosť.");
    if(c.type==="festival-replan") {
      f.theme=null;f.site=null;f.mood=null;f.discovery=null;f.preparations=[];
    } else if(c.type==="festival-theme") {
      if(f.theme||!Object.hasOwn(themes,c.theme))return bad("Program už bol vybraný alebo nie je platný.");
      f.theme=c.theme;
    } else if(c.type==="festival-site") {
      if(!f.theme||f.site||!festivalSites(s).some(p=>distance(p,c.target)===0))return bad("Vyber dostupné miesto pri ceste, park, záhradu alebo námestie.");
      const report=siteReport(s,f.theme,c.target);f.site={...c.target};f.mood=report.mood;f.discovery=report.discovery;
    } else if(c.type==="festival-prep") {
      if(!f.site||f.preparations.length>=2||!Object.hasOwn(supports,c.kind)||f.preparations.some(p=>p.kind===c.kind)||!prepSites(s,f).some(p=>distance(p,c.target)===0))return bad("Vyber iné zázemie na dostupnom mieste do dvoch políčok od programu.");
      if(supports[c.kind].cost>festivalBudget(f))return bad("Chýbajú prípravné body.");
      f.preparations.push({...c.target,kind:c.kind});
    } else {
      if(f.preparations.length!==2)return bad("Najprv priprav dve rôzne stanovištia zázemia.");
      if(!f.site||!Number.isInteger(c.choice)||c.choice<0||c.choice>2)return bad("Najprv vyber miesto a jednu z troch reakcií.");
      if(!festivalLayoutReady(s,f))return bad("Štvrť sa zmenila. Uvoľni miesta a cesty k stanovištiam alebo preplánuj slávnosť.");
      if(responses(f)[c.choice].cost>festivalBudget(f))return bad("Na toto riešenie chýbajú prípravné body. Vyber lacnejšiu možnosť.");
      const report=siteReport(s,f.theme!,f.site);f.mood=report.mood;f.discovery=report.discovery;
      f.response=c.choice;f.best=Math.max(f.best,festivalResult(f).stars);
    }
  }
  s.revision++;
  return {ok:true,state:s,message:c.type==="festival-response"?"Slávnosť sa začala. Pozri, ako dopadla.":"Príprava slávnosti je uložená."};
}
export function validFestival(v:unknown):boolean {
  if(v===undefined||v===null)return true;
  if(typeof v!=="object"||Array.isArray(v))return false;
  const f=v as Festival;
  if(typeof f.day!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(f.day)||new Date(dayNumber(f.day)*86400000).toISOString().slice(0,10)!==f.day)return false;
  if(!Number.isInteger(f.best)||f.best<0||f.best>3||!Array.isArray(f.preparations)||f.preparations.length>2)return false;
  const validPoint=(p:Point)=>p&&Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.y>=0&&p.x<6&&p.y<6;
  if(f.preparations.some(p=>!validPoint(p)||!Object.hasOwn(supports,p.kind)||!f.site||distance(p,f.site)===0||distance(p,f.site)>2))return false;
  if(new Set(f.preparations.map(p=>p.kind)).size!==f.preparations.length||new Set(f.preparations.map(p=>p.x+","+p.y)).size!==f.preparations.length)return false;
  if(f.response!==null&&f.preparations.length!==2)return false;
  if(!Number.isInteger(f.round)||f.round<1||f.round>100000||!Object.hasOwn(incidents,f.incident))return false;
  if(f.theme!==null&&!Object.hasOwn(themes,f.theme))return false;
  if(f.response!==null&&(!Number.isInteger(f.response)||f.response<0||f.response>2))return false;
  if(f.site!==null&&(!f.site||!Number.isInteger(f.site.x)||!Number.isInteger(f.site.y)||f.site.x<0||f.site.y<0||f.site.x>5||f.site.y>5))return false;
  if(f.mood!==null&&(!Array.isArray(f.mood)||f.mood.length!==3||f.mood.some(n=>!Number.isInteger(n)||n< -5||n>10)))return false;
  if(f.discovery!==null&&(typeof f.discovery!=="string"||f.discovery.length>140))return false;
  if(!f.theme&&(f.site!==null||f.mood!==null||f.response!==null||f.discovery!==null))return false;
  if((f.site===null)!==(f.mood===null)||f.response!==null&&!f.site||!f.site&&f.discovery!==null)return false;
  return festivalBudget(f)>=0;
}
