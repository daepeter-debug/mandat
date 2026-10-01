import assert from "node:assert/strict";
import {createTown,execute,readSave,dayNumber} from "../lib/republic.ts";
import {preparationImpact,festivalSites,prepSites,festivalBudget,festivalResult,themes,supports,responses,dailyBrief} from "../lib/republic-festival.ts";
import {createLocalStore} from "../lib/republic-storage.ts";
const ok=r=>{assert(r.ok,r.message);return r.state;};
let paths=0,wins=0;
const outcomes=new Set();
for(let d=0;d<3;d++)for(let seed=0;seed<3;seed++){
 const day=`2026-09-${28+d}`,fresh=createTown(day,seed),started=ok(execute(fresh,{type:"festival-start"},day));
 assert(readSave(fresh),"Pre-festival saves stay readable");
 assert.equal(execute(started,{type:"festival-response",choice:0},day).ok,false);
 let localWins=0,localLosses=0;
 for(const theme of Object.keys(themes)){
  const themed=ok(execute(started,{type:"festival-theme",theme},day));
  for(const target of festivalSites(themed)){
   const located=ok(execute(themed,{type:"festival-site",target},day));
   for(const a of Object.keys(supports))for(const b of Object.keys(supports)){
    if(a===b)continue;
    let s=located;
    for(const kind of [a,b]){
     const site=prepSites(s,s.festival)[0];if(!site)break;
     s=ok(execute(s,{type:"festival-prep",kind,target:site},day));
    }
    if(s.festival.preparations.length<2)continue;
    assert.equal(execute(s,{type:"festival-prep",kind:a,target},day).ok,false,"No third or duplicate station");
    for(let choice=0;choice<3;choice++){
     const result=execute(s,{type:"festival-response",choice},day);
     if(responses(s.festival)[choice].cost>festivalBudget(s.festival)){assert.equal(result.ok,false);continue;}
     const end=ok(result),score=festivalResult(end.festival);paths++;
     if(score.stars===3){wins++;localWins++;}else localLosses++;
     outcomes.add(score.stars);assert.equal(festivalBudget(end.festival),score.reserve);assert(score.reserve>=0);
     assert(readSave(JSON.parse(JSON.stringify(end))),"Every legal result reloads");
     assert.deepEqual(end.placed,fresh.placed);assert.deepEqual(end.completed,[]);assert.equal(end.coins,12);assert.equal(end.materials,8);
     assert.equal(execute(end,{type:"festival-response",choice},day).ok,false,"No repeat reward/result mutation");
     const again=ok(execute(end,{type:"festival-start"},day));assert.equal(again.festival.incident,end.festival.incident);assert.equal(again.festival.best,score.stars);
    }
   }
  }
 }
 assert(localWins>0,`Reachable perfect result for ${day}/${seed}`);
 assert(localLosses>0,`Choices matter for ${day}/${seed}`);
}
const day="2026-09-30";
let s=ok(execute(createTown(day,7),{type:"festival-start"},day));
s=ok(execute(s,{type:"festival-theme",theme:"music"},day));
s=ok(execute(s,{type:"festival-site",target:{x:2,y:2}},day));
assert.notDeepEqual(preparationImpact(s.festival,{kind:"quiet",x:2,y:3}),preparationImpact(s.festival,{kind:"quiet",x:1,y:3}),"Quiet area needs distance, not just a click");
const before=JSON.stringify(s);
assert.equal(execute(s,{type:"festival-prep",kind:"quiet",target:{x:5,y:5}},day).ok,false);
assert.equal(JSON.stringify(s),before,"Invalid command is immutable");
assert.equal(execute(s,{type:"festival-replan"},"2026-09-29").ok,false);
const later=ok(execute(s,{type:"festival-replan"},"2026-10-01"));
assert.equal(later.festival.day,day,"Unfinished challenge survives midnight");
assert.equal(later.festival.incident,s.festival.incident);assert.equal(festivalBudget(later.festival),8);
assert.notEqual(dailyBrief(day).kind,dailyBrief("2026-10-01").kind);
for(const malformed of [{...s.festival,best:9},{...s.festival,day:"2026-02-30"},{...s.festival,preparations:[{kind:"invalid",x:1,y:3}]},{...s.festival,response:0}])assert.equal(readSave({...s,festival:malformed}),null);
let prepared=s;
for(const kind of ["shelter","welcome"])prepared=ok(execute(prepared,{type:"festival-prep",kind,target:prepSites(prepared,prepared.festival)[0]},day));
const changed={...prepared,roads:[]};
assert.equal(execute(changed,{type:"festival-response",choice:1},day).ok,false,"Changed town cannot silently invalidate stations");
const data=new Map(),port={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
const store=createLocalStore(port,async fn=>fn(),1,()=>day),initial=store.load();
const saved=await store.write(initial,{type:"festival-start"});assert(saved.ok);
assert.equal((await store.write(initial,{type:"festival-start"})).kind,"conflict");
assert(store.load().state.festival);assert.equal(dayNumber(day)%3,dailyBrief(day).kind);
console.log(`PASS: ${paths} festival plans, ${wins} perfect results, scores ${[...outcomes].sort().join('/')}; all daily goals/events solvable, budgets, old/new saves, midnight, replan, replay, stale writes.`);
