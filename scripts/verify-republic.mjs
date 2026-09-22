import assert from "node:assert/strict";
import { accrue, claimFinalDecoration, claimParcel, claimTask, chooseBranch, completeStep, connected, createTown, currentStep, openParcel, place, readSave, slovakDay, store, toggleRoad } from "../lib/republic.ts";

const ok = result => { assert.equal(result.ok, true, result.ok ? "" : result.message); return result.state; };
let town = createTown("2026-09-20");
assert.equal(slovakDay(new Date("2026-09-20T22:30:00.000Z")),"2026-09-21","Slovenský deň rešpektuje časové pásmo Bratislavy");
assert.equal(town.coins,12); assert.equal(town.charges,1); assert.equal(connected(town,town.placed.find(x=>x.id==="school")),true,"Škola susedí s cestou");
assert.equal(place(town,"town-hall",{x:0,y:0}).ok,false,"Pevné orientačné body sa nedajú postaviť znova");
assert.equal(ok(place(town,"park",{x:1,y:3})).coins,9,"Stavba odpočíta cenu");
assert.equal(place(town,"park",{x:2,y:2}).ok,false,"Pevné námestie sa nesmie prekryť");
town=ok(place(town,"park",{x:1,y:3}));
const saved=ok(store(town,town.placed.find(x=>x.id==="park")?.instanceId ?? ""));
assert.equal(saved.inventory.length,1,"Uloženie budovy je reverzibilné");
assert.equal(ok(place(saved,"park",{x:0,y:3})).coins,saved.coins,"Presun zo zásoby nestojí mince");
assert.equal(toggleRoad(town,{x:2,y:1}).ok,false,"Cesta pod radnicou je zamietnutá");
town=accrue(town,"2026-09-30"); assert.equal(town.charges,3,"Zásielky sa nahromadia najviac tri");
town=ok(openParcel(town)); const pending=town.pending; assert(pending); const openedCoins=town.coins; town=ok(claimParcel(town,pending.cards[0])); assert.equal(town.pending,null); assert.equal(town.coins,openedCoins+8,"Zásielka pripíše odmenu raz");
assert.equal(claimParcel(town,pending.cards[0]).ok,false,"Potvrdenú zásielku nemožno vyzdvihnúť znova");
const duplicate = {...town,pending:{sequence:99,rarity:"common",cards:[pending.cards[0],pending.cards[1],pending.cards[2]]}}; const duplicateCoins=duplicate.coins; const duplicateMaterials=duplicate.materials; const duplicateResult=ok(claimParcel(duplicate,pending.cards[0])); assert.equal(duplicateResult.coins,duplicateCoins,"Duplikát nepridá mince"); assert.equal(duplicateResult.materials,duplicateMaterials+2,"Duplikát dá presne dva materiály");
assert.equal(readSave({...town,version:2}),null,"Neznáma verzia sa nenačíta");
const fresh=createTown("2026-09-20");
assert.equal(currentStep(fresh)?.id,"school-yard"); assert.equal(completeStep(fresh).ok,false,"Projekt nevie preskočiť chýbajúce prepojenie");
assert.equal(place(fresh,"bench",{x:0,y:0}).ok,false,"Dekorácia sa nepostaví bez odomknutia");
let daily = createTown("2026-09-20");
daily = ok(place(daily,"park",{x:1,y:3}));
daily = ok(completeStep(daily));
assert.equal(completeStep(daily).ok,false,"Za deň ide dokončiť len jeden krok projektu");
daily = accrue(daily,"2026-09-21");
assert.equal(currentStep(daily)?.id,"books","Nový deň sprístupní nasledujúci krok");
let orders = createTown("2026-09-20");
orders = ok(claimTask(orders,"school-link"));
assert.equal(claimTask(orders,"school-link").ok,false,"Objednávku možno vyzdvihnúť raz za deň");
orders = accrue(orders,"2026-09-21");
assert.equal(claimTask(orders,"school-link").ok,true,"Rovnaká objednávka je na nový deň znovu dostupná");

for (const branch of ["museum", "market-hall", "community-hall"]) {
  let chapter = createTown("2026-09-20"); chapter.coins=999; chapter.materials=999;
  chapter=ok(place(chapter,"park",{x:1,y:3})); chapter=ok(completeStep(chapter)); chapter=accrue(chapter,"2026-09-21");
  chapter=ok(store(chapter,chapter.placed.find(x=>x.id==="park")?.instanceId??"")); chapter=ok(place(chapter,"park",{x:0,y:3}));
  chapter=ok(store(chapter,chapter.placed.find(x=>x.id==="school")?.instanceId??"")); chapter=ok(place(chapter,"school",{x:1,y:3})); chapter=ok(place(chapter,"library",{x:2,y:3})); chapter=ok(completeStep(chapter)); chapter=accrue(chapter,"2026-09-22");
  chapter=ok(store(chapter,chapter.placed.find(x=>x.id==="house"&&x.x===3&&x.y===1)?.instanceId??"")); chapter=ok(place(chapter,"clinic",{x:3,y:1})); chapter=ok(place(chapter,"house",{x:4,y:1})); chapter=ok(store(chapter,chapter.placed.find(x=>x.id==="house"&&x.x===4&&x.y===3)?.instanceId??"")); chapter=ok(place(chapter,"house",{x:3,y:3})); chapter=ok(completeStep(chapter)); chapter=accrue(chapter,"2026-09-23");
  chapter=ok(store(chapter,chapter.placed.find(x=>x.id==="library")?.instanceId??"")); chapter=ok(place(chapter,"market",{x:2,y:3})); chapter=ok(completeStep(chapter)); chapter=accrue(chapter,"2026-09-24");
  chapter=ok(chooseBranch(chapter,branch)); chapter=accrue(chapter,"2026-09-25");
  chapter=ok(store(chapter,chapter.placed.find(x=>x.id==="house"&&x.x===4&&x.y===1)?.instanceId??""));
  chapter=ok(place(chapter,branch==="museum"?"library":branch==="market-hall"?"market":"park",{x:4,y:1})); chapter=ok(completeStep(chapter)); chapter=accrue(chapter,"2026-09-26");
  chapter=ok(store(chapter,chapter.placed.find(x=>x.id==="market"&&x.x===2)?.instanceId??"")); if(branch==="market-hall") chapter=ok(store(chapter,chapter.placed.find(x=>x.id==="market"&&x.x===4)?.instanceId??"")); if(branch==="community-hall") chapter=ok(store(chapter,chapter.placed.find(x=>x.id==="park"&&x.x===4)?.instanceId??"")); if(branch==="museum") chapter=ok(store(chapter,chapter.placed.find(x=>x.id==="library"&&x.x===4)?.instanceId??"")); chapter=ok(place(chapter,"library",{x:2,y:3})); chapter=ok(place(chapter,"house",{x:4,y:1}));
  chapter=ok(completeStep(chapter)); assert.equal(chapter.completed.length,7,`Vetva ${branch} dokončí kapitolu`); chapter=ok(claimFinalDecoration(chapter,"observatory")); assert.equal(claimFinalDecoration(chapter,"bench").ok,false,"Finálna dekorácia sa nedá vybrať dvakrát");
}
console.log("PASS: republic core — map, zdroje, zásoby, cesty, zásielky, verzie a poradie projektu.");
