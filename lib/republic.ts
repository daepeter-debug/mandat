export type BuildingId = "house" | "school" | "library" | "clinic" | "park" | "market" | "workshop" | "garden" | "culture" | "town-hall" | "plaza" | "station";
export type DecorationId = "bench" | "flower-bed" | "linden" | "fountain" | "book-kiosk" | "pergola" | "clock" | "bandstand" | "sculpture" | "observatory" | "glasshouse" | "ceremonial-gate";
export type ItemId = BuildingId | DecorationId;
export type Branch = "museum" | "market-hall" | "community-hall";
export type Point = { x: number; y: number };
export type Placed = Point & { instanceId: string; id: ItemId; fixed?: boolean };
export type Pending = { sequence: number; rarity: Rarity; cards: [DecorationId, DecorationId, DecorationId] };
export type Rarity = "common" | "uncommon" | "rare" | "epic";
export type RepublicState = {
  version: 1; revision: number; name: string; coins: number; materials: number; createdDay: string; lastDay: string;
  charges: number; claimSequence: number; pending: Pending | null; unlocked: DecorationId[]; placed: Placed[]; inventory: Placed[];
  roads: Point[]; completed: string[]; branch: Branch | null; finalReward: boolean; claimedTasks: string[]; lastProjectDay: string | null; seed: number;
};
export type Result = { ok: true; state: RepublicState; message: string } | { ok: false; message: string };
export const MAP_SIZE = 6;
export const fixed: Placed[] = [
  { instanceId: "plaza", id: "plaza", x: 2, y: 2, fixed: true }, { instanceId: "hall", id: "town-hall", x: 2, y: 1, fixed: true },
  { instanceId: "station", id: "station", x: 5, y: 1, fixed: true },
];
const startPlaced: Placed[] = [
  ...fixed, { instanceId: "school-1", id: "school", x: 1, y: 1 }, { instanceId: "house-1", id: "house", x: 0, y: 1 },
  { instanceId: "house-2", id: "house", x: 3, y: 1 }, { instanceId: "house-3", id: "house", x: 4, y: 3 },
];
const startRoads = [[0,2],[1,2],[3,2],[4,2],[5,2]].map(([x,y])=>({x,y}));
export const catalog: Record<ItemId, { name: string; coins: number; materials: number; kind: "building" | "decoration"; icon: string }> = {
  house:{name:"Dom",coins:4,materials:2,kind:"building",icon:"house"}, school:{name:"Škola",coins:7,materials:4,kind:"building",icon:"school"}, library:{name:"Knižnica",coins:6,materials:3,kind:"building",icon:"library"}, clinic:{name:"Ambulancia",coins:7,materials:4,kind:"building",icon:"clinic"}, park:{name:"Park",coins:3,materials:2,kind:"building",icon:"park"}, market:{name:"Tržnica",coins:6,materials:3,kind:"building",icon:"market"}, workshop:{name:"Dielňa",coins:5,materials:3,kind:"building",icon:"workshop"}, garden:{name:"Záhrada",coins:3,materials:2,kind:"building",icon:"garden"}, culture:{name:"Kultúrny dom",coins:6,materials:3,kind:"building",icon:"culture"}, "town-hall":{name:"Radnica",coins:0,materials:0,kind:"building",icon:"hall"}, plaza:{name:"Námestie",coins:0,materials:0,kind:"building",icon:"plaza"}, station:{name:"Stará stanica",coins:0,materials:0,kind:"building",icon:"station"},
  bench:{name:"Lavička",coins:0,materials:0,kind:"decoration",icon:"bench"}, "flower-bed":{name:"Kvetinový záhon",coins:0,materials:0,kind:"decoration",icon:"flower"}, linden:{name:"Lipa",coins:0,materials:0,kind:"decoration",icon:"tree"}, fountain:{name:"Fontána",coins:0,materials:0,kind:"decoration",icon:"fountain"}, "book-kiosk":{name:"Knižný kiosk",coins:0,materials:0,kind:"decoration",icon:"kiosk"}, pergola:{name:"Pergola",coins:0,materials:0,kind:"decoration",icon:"pergola"}, clock:{name:"Vežové hodiny",coins:0,materials:0,kind:"decoration",icon:"clock"}, bandstand:{name:"Hudobný pavilón",coins:0,materials:0,kind:"decoration",icon:"bandstand"}, sculpture:{name:"Socha",coins:0,materials:0,kind:"decoration",icon:"sculpture"}, observatory:{name:"Hvezdáreň",coins:0,materials:0,kind:"decoration",icon:"observatory"}, glasshouse:{name:"Skleník",coins:0,materials:0,kind:"decoration",icon:"glasshouse"}, "ceremonial-gate":{name:"Slávnostná brána",coins:0,materials:0,kind:"decoration",icon:"gate"},
};

export const pools: Record<Rarity, [DecorationId, DecorationId, DecorationId]> = {
  common:["bench","flower-bed","linden"], uncommon:["fountain","book-kiosk","pergola"],
  rare:["clock","bandstand","sculpture"], epic:["observatory","glasshouse","ceremonial-gate"],
};
export const decorationIds = Object.values(pools).flat();
export const branches: Branch[] = ["museum","market-hall","community-hall"];
export const branchNames = {museum:"Múzeum stanice","market-hall":"Tržnica v hale","community-hall":"Komunitná hala"};
export const rarityNames = {common:"Bežná",uncommon:"Neobvyklá",rare:"Vzácna",epic:"Epická"};
export const taskNames = {
  "school-link":"Zapoj školu","green-home":"Ozeleň jeden dom","three-homes":"Zapoj tri domy",
  "care-two":"Ambulancia pre dva domy","market-square":"Tržnica pri námestí",
  "school-pair":"Školská štvrť","craft-pair":"Remeselná štvrť","green-two":"Ozeleň dva domy",
};
export type Task = keyof typeof taskNames;
const taskCycle: Task[][] = [
  ["school-link","green-home","three-homes"],["school-pair","green-home","three-homes"],
  ["care-two","school-link","green-home"],["market-square","three-homes","school-pair"],
  ["craft-pair","green-two","school-link"],["care-two","market-square","three-homes"],
  ["green-two","school-pair","craft-pair"],
];
export const dayNumber = (day:string) => Date.UTC(+day.slice(0,4),+day.slice(5,7)-1,+day.slice(8,10))/86400000;
export const distance = (a:Point,b:Point) => Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const key = (p:Point) => `${p.x},${p.y}`;
const inMap = (p:Point) => Number.isInteger(p.x)&&Number.isInteger(p.y)&&p.x>=0&&p.y>=0&&p.x<MAP_SIZE&&p.y<MAP_SIZE;
const same = (a:Point,b:Point) => a.x===b.x&&a.y===b.y;
const hasId = (id:string):id is ItemId => Object.hasOwn(catalog,id);
const validDay = (day:unknown):day is string => typeof day==="string" && /^\d{4}-\d{2}-\d{2}$/.test(day) && new Date(dayNumber(day)*86400000).toISOString().slice(0,10)===day;
export function slovakDay(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Bratislava",year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now);
  const get = (type:string) => parts.find(part=>part.type===type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}
export function createTown(day = slovakDay(), seed = 1729): RepublicState {
  return {version:1,revision:0,name:"Lipová štvrť",coins:12,materials:8,createdDay:day,lastDay:day,
    charges:1,claimSequence:0,pending:null,unlocked:[],placed:structuredClone(startPlaced),inventory:[],
    roads:structuredClone(startRoads),completed:[],branch:null,finalReward:false,claimedTasks:[],lastProjectDay:null,seed};
}
export function network(state:RepublicState) {
  const root={x:2,y:2}, all=[root,...state.roads], found=new Set([key(root)]), queue=[root];
  while(queue.length) { const p=queue.shift()!; for(const n of all) if(!found.has(key(n))&&distance(p,n)===1) {found.add(key(n));queue.push(n);} }
  return all.filter(p=>found.has(key(p)));
}
export const connected = (s:RepublicState,p:Point) => network(s).some(n=>distance(n,p)===1);
export const items = (s:RepublicState,id:ItemId) => s.placed.filter(p=>p.id===id);
export const paired = (s:RepublicState,a:ItemId,b:ItemId) => items(s,a).some(x=>connected(s,x)&&items(s,b).some(y=>connected(s,y)&&distance(x,y)<=2));
export function homesServed(s:RepublicState,service:Point) {
  return connected(s,service)?items(s,"house").filter(home=>connected(s,home)&&distance(service,home)<=2):[];
}
export function coveredHomes(s:RepublicState,ids:ItemId[]|ItemId) {
  const wanted=Array.isArray(ids)?ids:[ids];
  return new Set(s.placed.filter(p=>wanted.includes(p.id)).flatMap(p=>homesServed(s,p).map(h=>h.instanceId))).size;
}
export const clinicReady = (s:RepublicState) => items(s,"clinic").some(p=>homesServed(s,p).length>=2);
export function combos(s:RepublicState) {
  return {school:paired(s,"school","library"),craft:paired(s,"school","workshop"),
    centre:items(s,"market").some(x=>connected(s,x)&&distance(x,{x:2,y:2})<=2)};
}
export const tasksFor = (s:RepublicState) => taskCycle[Math.max(0,dayNumber(s.lastDay)-dayNumber(s.createdDay))%7];
export const taskClaimed = (s:RepublicState,t:Task) => s.claimedTasks.includes(`${s.lastDay}:${t}`);
export function taskReady(s:RepublicState,t:Task) {
  const c=combos(s);
  return {"school-link":items(s,"school").some(x=>connected(s,x)),
    "green-home":coveredHomes(s,["park","garden"])>=1,"three-homes":items(s,"house").filter(x=>connected(s,x)).length>=3,
    "care-two":clinicReady(s),"market-square":c.centre,"school-pair":c.school,"craft-pair":c.craft,
    "green-two":coveredHomes(s,["park","garden"])>=2}[t]??false;
}
export const steps = [
  {id:"school-yard",name:"Školský dvor",speaker:"Eva",text:"Po vyučovaní nám chýba miesto vonku. Nájdeme pri škole kúsok zelene?",goal:"Zapoj školu a park alebo záhradu najviac dve políčka od seba.",done:(s:RepublicState)=>paired(s,"school","park")||paired(s,"school","garden"),reward:[2,1] as const},
  {id:"books",name:"Cesta za knihami",speaker:"Eva",text:"Máme dvor. Teraz by sme radi chodili za knihami pešo.",goal:"Zapoj školu a knižnicu najviac dve políčka od seba.",done:(s:RepublicState)=>paired(s,"school","library"),reward:[2,1] as const},
  {id:"care",name:"Blízka ambulancia",speaker:"Nina",text:"Ambulancia by mala byť blízko domov. Skúsme ju umiestniť tak, aby slúžila aspoň dvom.",goal:"Jedna zapojená ambulancia musí dosiahnuť na dva zapojené domy.",done:clinicReady,reward:[2,1] as const},
  {id:"square",name:"Malý trh",speaker:"Nina",text:"Na námestí môže byť rušno aj bez veľkého festivalu. Začnime malým trhom.",goal:"Zapoj tržnicu najviac dve políčka od námestia.",done:(s:RepublicState)=>combos(s).centre,reward:[2,1] as const},
  {id:"discovery",name:"Stará hala",speaker:"Milan",text:"V stanici sme našli starú halu. Čo by v nej malo vzniknúť?",goal:"Vyber jednu z troch rovnocenných podôb stanice.",done:(s:RepublicState)=>!!s.branch,reward:[0,0] as const},
  {id:"preparation",name:"Pripraviť halu",speaker:"Milan",text:"Pripravme halu aj jej okolie. Ľudia sa sem musia vedieť dostať.",goal:"Zapoj stanicu a príslušnú budovu najviac dve políčka od nej.",done:(s:RepublicState)=>!!s.branch&&connected(s,{x:5,y:1})&&s.placed.some(x=>(s.branch==="museum"?x.id==="library":s.branch==="market-hall"?x.id==="market":x.id==="park"||x.id==="garden")&&connected(s,x)&&distance(x,{x:5,y:1})<=2),reward:[0,0] as const},
  {id:"opening",name:"Otvoriť dvere",speaker:"Nina",text:"Dvere sa môžu otvoriť. Dnes patrí stanica celej štvrti.",goal:"Zapoj stanicu, tri domy a vytvor aspoň jednu kombináciu.",done:(s:RepublicState)=>connected(s,{x:5,y:1})&&items(s,"house").filter(x=>connected(s,x)).length>=3&&Object.values(combos(s)).some(Boolean),reward:[0,0] as const},
];
export const currentStep = (s:RepublicState) => steps.find(step=>!s.completed.includes(step.id))??null;
export const stepCost = (id?:string) => id==="preparation"?[6,4]:id==="opening"?[8,4]:[0,0];
const fail = (message:string):Result => ({ok:false,message});
function success(s:RepublicState,message:string):Result { s.revision++; return {ok:true,state:s,message}; }
function reward(s:RepublicState,c:number,m:number) {
  const actualC=Math.min(c,999-s.coins), actualM=Math.min(m,999-s.materials);
  s.coins+=actualC; s.materials+=actualM;
  return `+${actualC} mincí, +${actualM} materiálov.${actualC<c||actualM<m?" Časť odmeny sa nezmestila do limitu 999.":""}`;
}
export function accrue(state:RepublicState,today:string):RepublicState {
  if(!validDay(today)||today<=state.lastDay)return state;
  const s=structuredClone(state);s.charges=Math.min(3,s.charges+dayNumber(today)-dayNumber(s.lastDay));
  s.lastDay=today;s.revision++;return s;
}
export function place(state:RepublicState,id:ItemId,target:Point):Result {
  if(!hasId(id)||fixed.some(p=>p.id===id))return fail("Tento objekt sa nedá stavať.");
  if(id==="culture"&&!state.completed.includes("opening"))return fail("Kultúrny dom sa sprístupní po dokončení kapitoly.");
  if(!inMap(target))return fail("Toto miesto je mimo štvrte.");
  if(state.placed.some(p=>same(p,target))||state.roads.some(p=>same(p,target)))return fail("Toto políčko je obsadené. Vyber voľné miesto.");
  const s=structuredClone(state), inv=s.inventory.find(p=>p.id===id), d=catalog[id];
  if(d.kind==="decoration"&&!s.unlocked.includes(id as DecorationId))return fail("Ozdobu najprv odomkni zo zásielky.");
  if(!inv&&(s.coins<d.coins||s.materials<d.materials))return fail("Chýbajú zdroje. Otvor zásielku alebo vybav dennú objednávku.");
  if(inv){s.inventory=s.inventory.filter(p=>p.instanceId!==inv.instanceId);s.placed.push({...inv,...target});}
  else{s.coins-=d.coins;s.materials-=d.materials;s.placed.push({instanceId:`object-${s.revision+1}-${s.placed.length+s.inventory.length}`,id,...target});}
  return success(s,`Umiestnené: ${catalog[id].name}.`);
}
export function move(state:RepublicState,instanceId:string,target:Point):Result {
  const thing=state.placed.find(p=>p.instanceId===instanceId);
  if(!thing||thing.fixed)return fail("Tento objekt sa nedá presunúť.");
  if(!inMap(target)||state.placed.some(p=>p.instanceId!==instanceId&&same(p,target))||state.roads.some(p=>same(p,target)))return fail("Cieľ presunu je obsadený alebo mimo mapy. Pôvodná budova zostala na mieste.");
  const s=structuredClone(state);Object.assign(s.placed.find(p=>p.instanceId===instanceId)!,target);
  return success(s,`Presunuté: ${catalog[thing.id].name}. Presun je zadarmo.`);
}
export function store(state:RepublicState,instanceId:string):Result {
  const thing=state.placed.find(p=>p.instanceId===instanceId);
  if(!thing||thing.fixed)return fail("Tento objekt sa nedá odložiť.");
  const s=structuredClone(state);s.placed=s.placed.filter(p=>p.instanceId!==instanceId);s.inventory.push({...thing});
  return success(s,`${catalog[thing.id].name} je v zásobe. Opätovné umiestnenie je zadarmo.`);
}
export function toggleRoad(state:RepublicState,target:Point):Result {
  if(!inMap(target)||state.placed.some(p=>same(p,target)))return fail("Cesta potrebuje voľné políčko.");
  const s=structuredClone(state), i=s.roads.findIndex(p=>same(p,target));
  if(i>=0)s.roads.splice(i,1);else s.roads.push(target);
  return success(s,i>=0?"Cesta odstránená.":"Cesta položená.");
}
// Stable seeded offers; no randomness during rendering.
export function parcelRarity(seed:number,sequence:number):Rarity {
  let n=(seed+Math.imul(sequence+1,0x6D2B79F5))|0;
  n=Math.imul(n^(n>>>15),n|1);n^=n+Math.imul(n^(n>>>7),n|61);
  const roll=((n^(n>>>14))>>>0)/4294967296;
  return roll<.60?"common":roll<.85?"uncommon":roll<.97?"rare":"epic";
}
export function openParcel(state:RepublicState):Result {
  if(state.pending)return fail("Otvorená zásielka už čaká na výber.");
  if(!state.charges)return fail("Nová zásielka príde zajtra. Môžu sa nahromadiť najviac tri.");
  const s=structuredClone(state), rarity=parcelRarity(s.seed,s.claimSequence);
  s.charges--;s.pending={sequence:s.claimSequence++,rarity,cards:[...pools[rarity]]};
  return success(s,"Zásielka je otvorená. Vyber jednu dekoráciu.");
}
export function claimParcel(state:RepublicState,id:DecorationId):Result {
  if(!state.pending||!state.pending.cards.includes(id))return fail("Vyber jednu z troch ponúknutých dekorácií.");
  const s=structuredClone(state), duplicate=s.unlocked.includes(id);
  if(!duplicate)s.unlocked.push(id);s.pending=null;
  return success(s,`${duplicate?"Duplikát: dva materiály navyše.":catalog[id].name+" pribudla do zbierky."} ${reward(s,8,duplicate?6:4)}`);
}
const dailyProjectError = (s:RepublicState) => s.lastProjectDay!==null&&s.lastProjectDay>=s.lastDay;
export function chooseBranch(state:RepublicState,branch:Branch):Result {
  if(!branches.includes(branch)||currentStep(state)?.id!=="discovery")return fail("Podobu haly teraz nie je možné vybrať.");
  if(dailyProjectError(state))return fail("Dnešný krok je hotový. Pokračovanie príde zajtra.");
  const s=structuredClone(state);s.branch=branch;s.completed.push("discovery");s.lastProjectDay=s.lastDay;
  return success(s,`Vybrané: ${branchNames[branch]}. Pokračovanie príde zajtra.`);
}
export function completeStep(state:RepublicState):Result {
  const step=currentStep(state);
  if(!step)return fail("Kapitola je už dokončená.");
  if(dailyProjectError(state))return fail("Dnešný krok je hotový. Pokračovanie príde zajtra.");
  if(step.id==="discovery")return fail("Vyber podobu starej haly.");
  if(!step.done(state))return fail(step.goal);
  const [c,m]=stepCost(step.id);
  if(state.coins<c||state.materials<m)return fail(`Na krok potrebuješ ${c} mincí a ${m} materiály.`);
  const s=structuredClone(state);s.coins-=c;s.materials-=m;s.completed.push(step.id);s.lastProjectDay=s.lastDay;
  return success(s,`${step.id==="opening"?"Stanica znova žije. Vyber si finálnu dekoráciu.":"Krok projektu je hotový. Ďalší dokončíš zajtra."} ${reward(s,step.reward[0],step.reward[1])}`);
}
export function claimFinalDecoration(state:RepublicState,id:DecorationId):Result {
  if(!state.completed.includes("opening")||state.finalReward||!decorationIds.includes(id))return fail("Finálna dekorácia teraz nie je dostupná.");
  const s=structuredClone(state);if(!s.unlocked.includes(id))s.unlocked.push(id);s.finalReward=true;
  return success(s,`${catalog[id].name} je tvoja finálna dekorácia.`);
}
export function claimTask(state:RepublicState,task:Task):Result {
  if(!tasksFor(state).includes(task))return fail("Táto objednávka dnes nie je v ponuke.");
  if(taskClaimed(state,task))return fail("Túto objednávku už máš dnes vyzdvihnutú.");
  if(!taskReady(state,task))return fail("Objednávka ešte nie je splnená. Skontroluj cestu a dosah dvoch políčok.");
  const s=structuredClone(state);s.claimedTasks.push(`${s.lastDay}:${task}`);
  return success(s,`Objednávka vybavená. ${reward(s,2,1)}`);
}
export type Command =
  | {type:"build";id:ItemId;target:Point} | {type:"move";instanceId:string;target:Point}
  | {type:"store";instanceId:string} | {type:"road";target:Point}
  | {type:"parcel-open"} | {type:"parcel-claim";id:DecorationId}
  | {type:"step"} | {type:"branch";branch:Branch} | {type:"final";id:DecorationId}
  | {type:"task";task:Task} | {type:"rename";name:string};
export function execute(state:RepublicState,command:Command,today:string):Result {
  if(!validDay(today)||today<state.lastDay)return fail("Dátum zariadenia je starší než uložený postup. Skontroluj dátum a skús znova.");
  const s=accrue(state,today);
  switch(command.type) {
    case "build": return place(s,command.id,command.target);
    case "move": return move(s,command.instanceId,command.target);
    case "store": return store(s,command.instanceId);
    case "road": return toggleRoad(s,command.target);
    case "parcel-open": return openParcel(s);
    case "parcel-claim": return claimParcel(s,command.id);
    case "step": return completeStep(s);
    case "branch": return chooseBranch(s,command.branch);
    case "final": return claimFinalDecoration(s,command.id);
    case "task": return claimTask(s,command.task);
    case "rename": {const name=command.name.trim();if(!name||name.length>40)return fail("Názov musí mať 1 až 40 znakov.");return success({...s,name},"Názov štvrte je uložený.");}
    default: return fail("Neznámy príkaz.");
  }
}
export function readSave(value:unknown):RepublicState|null {
  try {
    if(!value||typeof value!=="object"||Array.isArray(value))return null;
    const s=structuredClone(value) as RepublicState;
    const integer=(n:unknown,max:number) => Number.isSafeInteger(n)&&Number(n)>=0&&Number(n)<=max;
    if(s.version!==1||typeof s.name!=="string"||!s.name.trim()||s.name.length>40)return null;
    if(!integer(s.revision,Number.MAX_SAFE_INTEGER)||!integer(s.coins,999)||!integer(s.materials,999)||!integer(s.charges,3)||!integer(s.claimSequence,Number.MAX_SAFE_INTEGER))return null;
    if(!validDay(s.createdDay)||!validDay(s.lastDay)||s.lastDay<s.createdDay)return null;
    if(s.lastProjectDay===undefined)s.lastProjectDay=null;
    if(s.lastProjectDay!==null&&(!validDay(s.lastProjectDay)||s.lastProjectDay<s.createdDay||s.lastProjectDay>s.lastDay))return null;
    if(s.seed===undefined)s.seed=1729;
    if(!integer(s.seed,4294967295)||typeof s.finalReward!=="boolean"||(s.branch!==null&&!branches.includes(s.branch)))return null;
    for(const list of [s.placed,s.inventory,s.roads,s.unlocked,s.completed,s.claimedTasks])if(!Array.isArray(list))return null;
    if(s.placed.length>36||s.inventory.length>10000||s.roads.length>36)return null;
    if(s.unlocked.some(id=>!decorationIds.includes(id))||new Set(s.unlocked).size!==s.unlocked.length)return null;
    if(s.completed.length>7||s.completed.some((id,i)=>id!==steps[i].id))return null;
    if(s.completed.includes("discovery")!==(s.branch!==null)||s.finalReward&&!s.completed.includes("opening"))return null;
    const instances=new Set<string>(),cells=new Set<string>();
    for(const p of [...s.placed,...s.inventory]) {
      if(!p||!hasId(p.id)||typeof p.instanceId!=="string"||!p.instanceId||instances.has(p.instanceId)||!inMap(p))return null;
      if(p.fixed!==undefined&&typeof p.fixed!=="boolean")return null;
      if(catalog[p.id].kind==="decoration"&&!s.unlocked.includes(p.id as DecorationId))return null;
      if(p.id==="culture"&&!s.completed.includes("opening"))return null;
      instances.add(p.instanceId);
    }
    for(const p of [...s.placed,...s.roads]) {if(!inMap(p)||cells.has(key(p)))return null;cells.add(key(p));}
    for(const p of fixed)if(!s.placed.some(x=>x.id===p.id&&x.instanceId===p.instanceId&&x.fixed===true&&same(x,p)))return null;
    if(s.placed.filter(p=>p.fixed).length!==3||s.inventory.some(p=>p.fixed||fixed.some(f=>f.id===p.id)))return null;
    if(s.placed.some(p=>fixed.some(f=>f.id===p.id)&&!p.fixed))return null;
    if(s.pending!==null) {
      const p=s.pending;if(!p||!integer(p.sequence,Number.MAX_SAFE_INTEGER)||p.sequence!==s.claimSequence-1||!Object.hasOwn(pools,p.rarity)||!Array.isArray(p.cards)||p.cards.join()!==pools[p.rarity].join())return null;
    }
    s.claimedTasks=s.claimedTasks.map(t=>typeof t==="string"&&Object.hasOwn(taskNames,t)?`${s.lastDay}:${t}`:t);
    if(s.claimedTasks.some(t=>typeof t!=="string"||!validDay(t.slice(0,10))||t.slice(0,10)>s.lastDay||t.slice(0,10)<s.createdDay||!Object.hasOwn(taskNames,t.slice(11))||t[10]!==":")||new Set(s.claimedTasks).size!==s.claimedTasks.length)return null;
    return s;
  } catch {return null;}
}
