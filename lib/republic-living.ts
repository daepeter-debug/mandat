import { distance, network, type ItemId, type Point, type RepublicState } from "./republic.ts";

/** Decorative simulation only: never changes the economy, commands or save. */
export type ResidentKind = "child" | "adult" | "senior" | "dog";
export type DayPeriod = "morning" | "afternoon" | "evening" | "night";
export type Season = "spring" | "summer" | "autumn" | "winter";
export type Clock = { day:string; hour:number; minute:number; weekday:number; utcOffset:number };
export type Walker = { key:string; kind:Exclude<ResidentKind,"dog">; dog:boolean; home:string; destination:ItemId; route:Point[]; phase:number; speed:number };
export type Gathering = { key:string; kind:ResidentKind; point:Point; activity:"play"|"garden"|"chat"|"shop"; offset:number };
export const sceneHash = (value:string) => { let h=2166136261; for(const c of value)h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h; };
const unit=(value:string)=>sceneHash(value)/4294967296;
const zone="Europe/Bratislava";
const format=new Intl.DateTimeFormat("en-CA",{timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"});
export function bratislavaClock(now:Date):Clock {
  if(!Number.isFinite(+now))throw new RangeError("Invalid scene time");
  const parts=format.formatToParts(now),get=(key:string)=>Number(parts.find(p=>p.type===key)!.value);
  const year=get("year"),month=get("month"),date=get("day"),hour=get("hour"),minute=get("minute");
  return {day:`${year}-${String(month).padStart(2,"0")}-${String(date).padStart(2,"0")}`,hour,minute,
    weekday:new Date(Date.UTC(year,month-1,date)).getUTCDay(),utcOffset:Math.round((Date.UTC(year,month-1,date,hour,minute)-Math.floor(+now/60000)*60000)/60000)};
}
const radians=(n:number)=>n*Math.PI/180;
/** NOAA fractional-year approximation, zenith 90.833°. UTC instants avoid DST arithmetic. */
export function solarTimes(day:string) {
  const midnight=Date.parse(`${day}T00:00:00Z`),date=new Date(midnight),year=date.getUTCFullYear();
  if(!Number.isFinite(midnight)||date.toISOString().slice(0,10)!==day)throw new RangeError("Invalid solar date");
  const days=(Date.UTC(year+1,0,1)-Date.UTC(year,0,1))/86400000;
  const ordinal=(midnight-Date.UTC(year,0,1))/86400000;
  const g=2*Math.PI/days*ordinal;
  const equation=229.18*(.000075+.001868*Math.cos(g)-.032077*Math.sin(g)-.014615*Math.cos(2*g)-.040849*Math.sin(2*g));
  const declination=.006918-.399912*Math.cos(g)+.070257*Math.sin(g)-.006758*Math.cos(2*g)+.000907*Math.sin(2*g)-.002697*Math.cos(3*g)+.00148*Math.sin(3*g);
  const latitude=radians(48.149),angle=Math.acos(Math.cos(radians(90.833))/(Math.cos(latitude)*Math.cos(declination))-Math.tan(latitude)*Math.tan(declination))*180/Math.PI;
  return {sunrise:midnight+(720-4*(17.108+angle)-equation)*60000,sunset:midnight+(720-4*(17.108-angle)-equation)*60000};
}
const smooth=(n:number)=>{const t=Math.max(0,Math.min(1,n));return t*t*(3-2*t);};
export function sceneTime(now:Date) {
  const clock=bratislavaClock(now),sun=solarTimes(clock.day),minutes=+now/60000;
  const daylight=smooth((minutes-(sun.sunrise/60000-35))/60)*(1-smooth((minutes-(sun.sunset/60000-25))/60));
  const period:DayPeriod=clock.hour<6||clock.hour>=22?"night":clock.hour<12?"morning":clock.hour>=18||+now>=sun.sunset?"evening":"afternoon";
  const month=Number(clock.day.slice(5,7));
  const season:Season=month>=3&&month<=5?"spring":month>=6&&month<=8?"summer":month>=9&&month<=11?"autumn":"winter";
  return {...clock,...sun,period,season,daylight,night:1-daylight};
}
const key=(p:Point)=>`${p.x},${p.y}`;
/** Shortest orthogonal route; every point, including both endpoints, is a network tile. */
export function roadRoute(roads:Point[],start:Point,end:Point):Point[] {
  const allowed=new Map(roads.map(p=>[key(p),p]));
  if(!allowed.has(key(start))||!allowed.has(key(end)))return [];
  const queue=[start],parent=new Map<string,Point|null>([[key(start),null]]);
  for(let i=0;i<queue.length;i++) {
    const p=queue[i];if(key(p)===key(end)){const route:Point[]=[];let current:Point|null=p;while(current){route.push({...current});current=parent.get(key(current))!;}return route.reverse();}
    for(const [x,y] of [[p.x+1,p.y],[p.x,p.y+1],[p.x-1,p.y],[p.x,p.y-1]]) {const n=allowed.get(`${x},${y}`);if(n&&!parent.has(key(n))){parent.set(key(n),p);queue.push(n);}}
  }
  return [];
}
const entries=(roads:Point[],p:Point)=>roads.filter(r=>distance(r,p)===1).sort((a,b)=>a.y-b.y||a.x-b.x);
const wishes=(kind:Walker["kind"],period:DayPeriod,weekday:number):ItemId[]=>{
  if(period==="night")return ["plaza"];
  if(period==="evening")return ["culture","plaza"];
  if(period==="afternoon")return ["park","garden","library"];
  if(kind==="child")return weekday>0&&weekday<6?["school"]:["park","garden"];
  if(kind==="senior")return ["clinic","park"];
  return ["workshop","market","station"];
};
export function livingScene(state:RepublicState,now:Date) {
  const time=sceneTime(now),roads=network(state),homes=state.placed.filter(p=>p.id==="house"&&entries(roads,p).length);
  const salt=`${state.seed}:${time.day}:${time.hour}`;
  const walkers:Walker[]=[];
  const targetCount=time.period==="night"?Math.min(1,homes.length):Math.min(14,homes.length*3);
  // Stable candidates, never a random render. Missing connected destinations yield no trip.
  for(let i=0;i<homes.length*6&&walkers.length<targetCount;i++) {
    const home=homes[i%homes.length],kind:Walker["kind"]=(['child','adult','senior'] as const)[Math.floor(i/homes.length)%3];
    if(time.period==="night"&&kind!=="adult")continue;
    const wanted=wishes(kind,time.period,time.weekday),destinations=state.placed.filter(p=>wanted.includes(p.id)&&(p.id==="plaza"||entries(roads,p).length));
    if(!destinations.length)continue;
    const destination=destinations[sceneHash(`${salt}:destination:${i}`)%destinations.length];
    const from=entries(roads,home),to=destination.id==="plaza"?[{x:2,y:2}]:entries(roads,destination);
    const routes=from.flatMap(a=>to.map(b=>roadRoute(roads,a,b))).filter(r=>r.length>1);
    if(!routes.length)continue;
    const route=routes[sceneHash(`${salt}:route:${i}`)%routes.length],id=`${home.instanceId}:${i}`;
    walkers.push({key:id,kind,dog:time.period==="night",home:home.instanceId,destination:destination.id,route,phase:unit(`${salt}:phase:${id}`),speed:kind==="senior"?.25:kind==="child"?.42:.32});
  }
  const gatherings:Gathering[]=[];
  if(time.period!=="night"&&homes.length) {
    for(const p of state.placed) {
      if(p.id!=="plaza"&&!entries(roads,p).length)continue;
      const activity=p.id==="park"&&time.period!=="evening"?"play":p.id==="garden"&&time.period!=="evening"?"garden":p.id==="market"&&time.period==="morning"?"shop":p.id==="plaza"||p.id==="fountain"?"chat":null;
      if(!activity)continue;
      for(let i=0;i<Math.min(2,homes.length);i++)gatherings.push({key:`${p.instanceId}:${i}`,point:{x:p.x,y:p.y},activity,kind:activity==="play"?"child":i===0?"adult":"senior",offset:i});
    }
  }
  const peak=Math.max(0,1-Math.abs((Date.parse(time.day)-Date.parse(`${time.day.slice(0,4)}-10-28`))/86400000)/43);
  const effect=time.season==="autumn"?"leaves":time.season==="winter"&&sceneHash(`${state.seed}:${time.day}:snow`)%4===0?"snow":time.season==="spring"?"flowers":time.season==="summer"&&time.period==="evening"&&time.night>.1&&time.night<.98?"fireflies":"none";
  const particles=Array.from({length:effect==="leaves"?4+Math.round(peak*14):effect==="snow"?18:effect==="flowers"?14:effect==="fireflies"?8:0},(_,i)=>({x:unit(`${salt}:x:${i}`)*580-10,y:unit(`${salt}:y:${i}`)*400+30,phase:unit(`${salt}:p:${i}`),size:1.2+unit(`${salt}:size:${i}`)*1.8}));
  return {time,roads,walkers,gatherings,effect,particles};
}
/** Ping-pong along the same road with short endpoint pauses; no shortcuts between corners. */
export function walkerPosition(walker:Walker,seconds:number) {
  const length=walker.route.length-1,hold=1.2,cycle=length*2+hold*2;
  const tick=((seconds*walker.speed+walker.phase*cycle)%cycle+cycle)%cycle;
  const backwards=tick>length+hold;
  const position=tick<=length?tick:tick<=length+hold?length:Math.max(0,cycle-hold-tick);
  const index=Math.min(length-1,Math.floor(position)),a=walker.route[index],b=walker.route[index+1],t=position-index;
  return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,moving:tick<length||tick>length+hold&&tick<cycle-hold,backwards,
    left:((b.x-b.y)<(a.x-a.y))!==backwards};
}
