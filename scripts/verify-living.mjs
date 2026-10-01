import assert from 'node:assert/strict';
import { createTown, network, readSave, distance } from '../lib/republic.ts';
import { bratislavaClock, solarTimes, sceneTime, livingScene, roadRoute, walkerPosition } from '../lib/republic-living.ts';
const state=createTown('2026-10-01');
const original=JSON.stringify(state),morning=new Date('2026-10-01T06:00:00Z');
assert.deepEqual(livingScene(state,morning),livingScene(state,new Date(+morning)));
assert(readSave(state));assert.equal(JSON.stringify(state),original,'Decorative scene must not mutate a save');
for(let hour=0;hour<24;hour++) {
 const scene=livingScene(state,new Date(Date.UTC(2026,9,1,hour)));
 assert(scene.walkers.length<=14);
 if(scene.time.period==='night')assert(scene.walkers.length<=1);
 for(const walker of scene.walkers) {
  assert(state.placed.some(h=>h.instanceId===walker.home&&h.id==='house'));
  for(let i=0;i<walker.route.length;i++) {
   assert(scene.roads.some(p=>distance(p,walker.route[i])===0),'Every endpoint and step on connected network');
   if(i)assert.equal(distance(walker.route[i-1],walker.route[i]),1);
  }
  for(let second=0;second<180;second+=.5) {
   const p=walkerPosition(walker,second);
   assert(walker.route.some((a,i)=>{const b=walker.route[i+1];return b&&Math.abs(distance(a,p)+distance(p,b)-1)<1e-9;}),'Interpolated walk stays on a road edge');
  }
 }
}
const cut={...state,roads:[]};assert.equal(livingScene(cut,morning).walkers.length,0,'Disconnected homes produce no pedestrians');
assert.deepEqual(roadRoute(network(state),{x:0,y:2},{x:5,y:2}).length,6);
assert.deepEqual(roadRoute([{x:0,y:0},{x:2,y:0}],{x:0,y:0},{x:2,y:0}),[]);
assert(livingScene(state,morning).walkers.some(w=>w.kind==='child'&&w.destination==='school'));
assert(!livingScene(state,new Date('2026-10-03T06:00:00Z')).walkers.some(w=>w.destination==='school'),'No school trips on Saturday');
const before=bratislavaClock(new Date('2026-10-25T00:30:00Z')),after=bratislavaClock(new Date('2026-10-25T01:30:00Z'));
assert.equal(before.day,'2026-10-25');assert.equal(before.hour,2);assert.equal(after.hour,2);assert.equal(before.utcOffset,120);assert.equal(after.utcOffset,60);
assert.equal(bratislavaClock(new Date('2026-10-25T02:00:00Z')).hour,3);
// Verified 2026-10-01 against timeanddate.com/sun/slovakia/bratislava?month=10.
// NOAA model has <5 minute tolerance here, including both sides of DST.
for(const [day,rise,set] of [[1,410,1111],[15,430,1083],[24,444,1066],[25,385,1004],[31,395,994]]) {
 const sun=solarTimes(`2026-10-${String(day).padStart(2,'0')}`);
 for(const [value,reference] of [[sun.sunrise,rise],[sun.sunset,set]]) {
  const c=bratislavaClock(new Date(value));assert(Math.abs(c.hour*60+c.minute-reference)<=5);
 }
}
const sun=solarTimes('2026-10-01');
assert(sceneTime(new Date(sun.sunrise-40*60000)).daylight<.01);
assert(sceneTime(new Date(sun.sunrise+30*60000)).daylight>.99);
for(const [month,season] of [[1,'winter'],[4,'spring'],[7,'summer'],[10,'autumn']])assert.equal(sceneTime(new Date(Date.UTC(2026,month-1,1,12))).season,season);
const late=livingScene(state,new Date('2026-10-28T12:00:00Z'));
assert(late.particles.length>livingScene(state,new Date('2026-09-01T12:00:00Z')).particles.length);
assert(new Set(Array.from({length:12},(_,i)=>livingScene(state,new Date(Date.UTC(2026,0,i+1,12))).effect)).has('none'),'Winter not daily snow');
assert.throws(()=>solarTimes('2026-02-30'));
assert.throws(()=>bratislavaClock(new Date('invalid')));
const busy=structuredClone(state);
busy.placed.push({instanceId:'park-test',id:'park',x:3,y:3},{instanceId:'garden-test',id:'garden',x:5,y:3},{instanceId:'market-test',id:'market',x:4,y:1},{instanceId:'clinic-test',id:'clinic',x:0,y:3});
assert(readSave(busy));
const scene=livingScene(busy,morning);
assert(scene.walkers.some(w=>w.kind==='senior'&&['park','clinic'].includes(w.destination)));
assert(scene.gatherings.some(p=>p.activity==='shop')&&scene.gatherings.some(p=>p.activity==='play')&&scene.gatherings.some(p=>p.activity==='garden'));
assert(livingScene(busy,new Date('2026-10-01T22:00:00Z')).walkers.every(w=>w.dog));
const roadsBefore=scene.walkers.map(w=>w.route);
assert.deepEqual(roadsBefore,livingScene(busy,morning).walkers.map(w=>w.route));
console.log('PASS: living scene deterministic, connected routes and continuous road motion, cap14, quiet nights, weekdays, DST25Oct, NOAA sunrise/sunset within5min, seasons, save unchanged.');
