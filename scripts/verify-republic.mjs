import assert from "node:assert/strict";
import { accrue, branches, claimParcel, claimTask, clinicReady, combos, connected, coveredHomes, createTown, dayNumber, execute, move, network, openParcel, parcelRarity, place, readSave, slovakDay, steps, tasksFor, toggleRoad } from "../lib/republic.ts";
import { createLocalStore, republicKey } from "../lib/republic-storage.ts";

const ok=r=>{assert.equal(r.ok,true,r.message);return r.state;};
const date=n=>new Date(Date.UTC(2026,8,20+n)).toISOString().slice(0,10);
const at=(s,id,x,y)=>s.placed.find(p=>p.id===id&&p.x===x&&p.y===y)?.instanceId;
const fresh=createTown(date(0));
assert.equal(fresh.coins,12);assert.equal(fresh.materials,8);
assert.equal(connected(fresh,{x:1,y:1}),true);
assert.equal(place(fresh,"park",{x:-1,y:0}).ok,false);
assert.equal(place(fresh,"park",{x:2,y:2}).ok,false);
assert.equal(place(fresh,"toString",{x:0,y:0}).ok,false);
assert.equal(place(fresh,"culture",{x:0,y:0}).ok,false);
assert.equal(place(fresh,"town-hall",{x:0,y:0}).ok,false);
assert.equal(place(fresh,"bench",{x:0,y:0}).ok,false);
assert.equal(place({...fresh,coins:0},"school",{x:0,y:0}).ok,false);
assert.equal(move(fresh,"hall",{x:0,y:0}).ok,false);
const original=JSON.stringify(fresh);
assert.equal(move(fresh,"school-1",{x:2,y:1}).ok,false);
assert.equal(JSON.stringify(fresh),original,"Rejected move leaves original untouched");
assert.equal(toggleRoad(fresh,{x:2,y:1}).ok,false);
const detached={...fresh,roads:[{x:0,y:0}]};
assert.equal(network(detached).length,1,"Disconnected road is not part of the plaza network");
assert.equal(connected(detached,{x:0,y:1}),false);
const geometry=structuredClone(fresh);
geometry.placed=geometry.placed.filter(p=>p.fixed);
geometry.placed.push({id:"house",instanceId:"h1",x:0,y:1},{id:"house",instanceId:"h2",x:5,y:1},
 {id:"clinic",instanceId:"c1",x:1,y:1},{id:"clinic",instanceId:"c2",x:4,y:1});
assert.equal(clinicReady(geometry),false,"Two separate clinics serving one home each do not satisfy one-clinic goal");
const green=structuredClone(fresh);
green.placed=green.placed.filter(p=>p.fixed||p.instanceId==="house-1");
green.placed.push({id:"park",instanceId:"p1",x:1,y:1},{id:"garden",instanceId:"g1",x:0,y:3});
assert.equal(coveredHomes(green,["park","garden"]),1,"Same home covered by park and garden counts once");
assert.equal(coveredHomes({...green,placed:green.placed.filter(p=>p.id!=="garden").map(p=>p.id==="park"?{...p,x:2,y:3}:p)},"park"),0,"Distance greater than two is outside service");

for(const [iso,expected] of [
 ["2026-03-28T23:30:00Z","2026-03-29"],["2026-03-29T22:30:00Z","2026-03-30"],
 ["2026-10-24T22:30:00Z","2026-10-25"],["2026-10-25T23:30:00Z","2026-10-26"],
 ["2026-12-31T23:30:00Z","2027-01-01"]])assert.equal(slovakDay(new Date(iso)),expected);
assert.equal(dayNumber("2026-03-30")-dayNumber("2026-03-29"),1);
assert.equal(dayNumber("2026-10-26")-dayNumber("2026-10-25"),1);
assert.equal(accrue(fresh,date(10)).charges,3);
assert.equal(accrue(fresh,date(0)),fresh);
assert.equal(accrue(fresh,"2026-09-19"),fresh);
assert.equal(execute(accrue(fresh,date(1)),{type:"task",task:"school-link"},date(0)).ok,false,"Backdating cannot claim old tasks");
assert.equal(accrue(fresh,date(1)).revision,1);
let ordered=ok(claimTask(fresh,"school-link"));
assert.equal(claimTask(ordered,"school-link").ok,false);
assert.equal(claimTask(ordered,"craft-pair").ok,false,"Only today's three tasks are accepted");
assert.deepEqual(tasksFor(fresh),["school-link","green-home","three-homes"]);
ordered=accrue(ordered,date(2));assert.equal(claimTask(ordered,"school-link").ok,true);

let parcel=ok(openParcel(fresh));
assert.equal(parcel.coins,12,"Opening gives no resource reward");
assert.equal(openParcel(parcel).ok,false);
assert.deepEqual(readSave(JSON.parse(JSON.stringify(parcel)))?.pending,parcel.pending);
const picked=parcel.pending.cards[0];
parcel=ok(claimParcel(parcel,picked));
assert.equal(parcel.coins,20);assert.equal(parcel.materials,12);
assert.equal(claimParcel(parcel,picked).ok,false);
const duplicate={...parcel,pending:{sequence:parcel.claimSequence-1,rarity:"common",cards:[picked,picked,picked]}};
const dupResult=ok(claimParcel(duplicate,picked));
assert.equal(dupResult.coins,28,"Duplicate keeps guaranteed eight coins");
assert.equal(dupResult.materials,18,"Duplicate adds base four plus two bonus materials");
const capped=ok(claimParcel({...duplicate,coins:998,materials:998},picked));
assert.equal(capped.coins,999);assert.equal(capped.materials,999);
assert.equal(parcelRarity(17,3),parcelRarity(17,3));

for(const corrupt of [
 {...fresh,version:2},{...fresh,coins:-1},{...fresh,coins:NaN},{...fresh,coins:1000},
 {...fresh,materials:1.2},{...fresh,lastDay:"2026-99-99"},{...fresh,charges:4},
 {...fresh,placed:[...fresh.placed,{...fresh.placed[0]}]},
 {...fresh,placed:fresh.placed.map(p=>p.id==="town-hall"?{...p,x:0}:p)},
 {...fresh,completed:["opening"]},{...fresh,pending:{rarity:"epic",cards:["house"],sequence:0}},
 {...fresh,unlocked:["house"]},{...fresh,roads:[...fresh.roads,{x:2,y:1}]}])assert.equal(readSave(corrupt),null,"Malformed save rejected");
assert(readSave(fresh));
const legacy=structuredClone(fresh);delete legacy.seed;
legacy.claimedTasks=["school-link"];assert.deepEqual(readSave(legacy)?.claimedTasks,[date(0)+":school-link"]);

// Real commands and normal starting funds. Every seed keeps guaranteed parcel funds,
// all three branches reuse owned buildings; no task rewards or injected resources.
function playChapter(branch,seed=1729,communityBuilding="park") {
 let s=createTown(date(0),seed),day=0;
 const go=cmd=>{const before=JSON.stringify(s);const result=execute(s,cmd,date(day));assert.equal(JSON.stringify(s),before,"Engine is immutable");s=ok(result);assert(readSave(s),"Every real command produces a valid save");};
 const nextDay=()=>{day++;s=accrue(s,date(day));receive();};
 const receive=()=>{go({type:"parcel-open"});go({type:"parcel-claim",id:s.pending.cards.find(id=>!s.unlocked.includes(id))??s.pending.cards[0]});};
 const build=(id,x,y)=>go({type:"build",id,target:{x,y}});
 const relocate=(id,x,y,tx,ty)=>go({type:"move",instanceId:at(s,id,x,y),target:{x:tx,y:ty}});
 const putAway=(id,x,y)=>go({type:"store",instanceId:at(s,id,x,y)});
 const finish=()=>{go({type:"step"});assert.equal(execute(s,{type:"step"},date(day)).ok,false,"One project step per day");};
 receive();build(communityBuilding,1,3);finish();
 nextDay();relocate(communityBuilding,1,3,0,3);relocate("school",1,1,1,3);build("library",2,3);finish();
 nextDay();relocate("house",3,1,1,1);relocate("house",0,1,4,1);relocate("house",4,3,3,3);build("clinic",3,1);finish();
 nextDay();putAway("library",2,3);build("market",2,3);finish();
 nextDay();go({type:"branch",branch});assert.equal(execute(s,{type:"branch",branch:"museum"},date(day)).ok,false);
 nextDay();putAway("house",4,1);
 if(branch==="museum")build("library",4,1);
 if(branch==="market-hall")relocate("market",2,3,4,1);
 if(branch==="community-hall")relocate(communityBuilding,0,3,4,1);
 // Disconnect station while service still has another road: preparation must fail.
 const off=structuredClone(s);off.roads=off.roads.filter(p=>!(p.x===5&&p.y===2));
 assert.equal(steps[5].done(off),false,"Station must be connected during preparation");
 finish();
 nextDay();
 if(branch==="museum")putAway("library",4,1);
 if(branch==="market-hall")putAway("market",4,1);
 if(branch==="community-hall")putAway(communityBuilding,4,1);
 if(s.placed.some(p=>p.id==="market"))putAway("market",2,3);
 build("library",2,3);build("house",4,1);
 assert(combos(s).school);finish();
 assert.equal(s.completed.length,7);assert(s.coins>=40);assert(s.materials>=20);
 go({type:"final",id:"observatory"});assert.equal(execute(s,{type:"final",id:"bench"},date(day)).ok,false);
 return s;
}
for(let seed=0;seed<24;seed++)for(const branch of branches)playChapter(branch,seed);
playChapter("community-hall",17,"garden");
console.log("PASS: 73 full chapter paths with ordinary funds, 3 branches, garden alternative, dates, geometry, rewards and save validation.");

const memory=new Map(),port={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value)};
let tail=Promise.resolve();
const locked=job=>{const next=tail.then(job);tail=next.catch(()=>{});return next;};
const a=createLocalStore(port,locked,10,()=>date(0)),b=createLocalStore(port,locked,20,()=>date(0));
const initial=a.load();assert.equal(initial.problem,null);
assert.equal((await a.write(initial,null)).ok,true);
const as=a.load(),bs=b.load();
const [one,two]=await Promise.all([a.write(as,{type:"parcel-open"}),b.write(bs,{type:"parcel-open"})]);
assert.equal([one,two].filter(r=>r.ok).length,1,"Concurrent opens only reserve one charge");
assert.equal([one,two].find(r=>!r.ok).kind,"conflict");
const offered=a.load(),offeredB=b.load(),choice=offered.state.pending.cards[0];
const claims=await Promise.all([a.write(offered,{type:"parcel-claim",id:choice}),b.write(offeredB,{type:"parcel-claim",id:choice})]);
assert.equal(claims.filter(r=>r.ok).length,1,"Only one tab can claim an offer");
assert.equal(a.load().state.coins,20);
const oldRaw=port.getItem(republicKey);
const failing=createLocalStore({getItem:port.getItem,setItem:()=>{throw Error("QuotaExceededError");}},locked,10,()=>date(0));
const failed=await failing.write(failing.load(),{type:"build",id:"park",target:{x:1,y:3}});
assert.equal(failed.ok,false);assert.equal(failed.kind,"storage");assert.equal(port.getItem(republicKey),oldRaw,"Failed write preserves old save");
memory.set(republicKey,"{broken-json");
const corrupt=a.load();assert.equal(corrupt.problem,"corrupt");
assert.equal((await a.write(corrupt,{type:"parcel-open"})).ok,false);
assert.equal(memory.get(republicKey),"{broken-json","Corrupt save never silently overwritten");
assert.equal((await a.write(corrupt,null,true)).ok,true);
assert.equal(memory.get(republicKey+":backup"),"{broken-json","Explicit reset backs up original first");
const denied=createLocalStore({getItem:()=>{throw Error("SecurityError");},setItem:()=>{throw Error("SecurityError");}},locked,1);
assert.equal(denied.load().problem,"unavailable");
console.log("PASS: shared storage adapter — concurrent opens/claims, stale revision, failed write, corrupt backup, denied storage.");
