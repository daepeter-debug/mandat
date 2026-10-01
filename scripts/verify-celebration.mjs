import assert from 'node:assert/strict';
import { createTown, network, readSave } from '../lib/republic.ts';
import { celebrationScene, celebrationFrame, festivalPostcardData, slovakDate, CELEBRATION_SECONDS } from '../lib/republic-celebration.ts';
const base=createTown('2026-10-01');
assert.equal(celebrationScene(base),null);assert.equal(festivalPostcardData(base),null);
for(const theme of ['books','food','music']) {
  const town=structuredClone(base);
  town.festival={day:town.lastDay,best:0,round:1,theme,site:{x:2,y:2},mood:[2,2,2],discovery:null,
    preparations:[{x:1,y:3,kind:'quiet'},{x:2,y:3,kind:'welcome'}],incident:'power',response:null};
  assert(readSave(town));const old=JSON.stringify(town);
  const before=celebrationScene(town);assert.equal(before.guests.length,3);assert(!before.lanterns);
  assert.equal(festivalPostcardData(town),null);
  assert.equal(JSON.stringify(town),old);
  const counts=[];
  for(const mood of [[-5,-5,-5],[5,-5,-5],[5,5,-5],[5,5,5]]) {
    town.festival.mood=mood;town.festival.response=0;
    const saved=JSON.stringify(town),scene=celebrationScene(town);
    assert.deepEqual(scene,celebrationScene(structuredClone(town)));
    assert.equal(JSON.stringify(town),saved);
    assert(scene.lanterns);counts.push(scene.guests.length);
    assert.equal(scene.guests.length,Math.min(4+scene.happy*5,network(town).filter(p=>Math.abs(p.x-scene.site.x)+Math.abs(p.y-scene.site.y)<=3).length*4));
    for(const guest of scene.guests) {
      assert(network(town).some(p=>p.x===guest.point.x&&p.y===guest.point.y));
      assert(!town.placed.some(o=>o.x===guest.point.x&&o.y===guest.point.y&&o.id!=='plaza'));
    }
    assert.equal(celebrationFrame(scene,0).guests.length,0);
    assert(!celebrationFrame(scene,.5).lit);assert(celebrationFrame(scene,1).lit);
    assert(celebrationFrame(scene,6).performing);
    const final=celebrationFrame(scene,CELEBRATION_SECONDS);
    assert(final.finished);assert(!final.performing);assert.equal(final.guests.length,scene.guests.length);
    assert.deepEqual(final,celebrationFrame(scene,Infinity));
    const card=festivalPostcardData(town);assert.equal(card.town,town.name);
    assert.equal(card.day,town.festival.day);assert.equal(card.reactions.length,3);
    assert.deepEqual(card.reactions.map(r=>r.name),['Eva','Milan','Nina']);
  }
  assert(counts.every((n,i)=>i===0||n>=counts[i-1]));assert(counts.at(-1)>counts[0]);
  town.festival.round++;assert.notEqual(celebrationScene(town).key,before.key);
}
const noRoads=structuredClone(base);noRoads.roads=[];
noRoads.festival={day:base.lastDay,best:0,round:1,theme:'food',site:{x:2,y:2},mood:[5,5,5],discovery:null,preparations:[],incident:'rain',response:null};
assert.equal(celebrationScene(noRoads).guests.length,3,'Square remains walkable');
assert(readSave(base),'Old saves load without additional fields');
assert.equal(slovakDate('2026-10-01'),'1. 10. 2026','Dátum bez núl na začiatku');assert.equal(slovakDate('2026-12-24'),'24. 12. 2026');
console.log('PASS celebration: themes, opening, crowd by satisfaction, deterministic paving positions, postcard data, unchanged old saves');
