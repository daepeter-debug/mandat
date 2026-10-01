import assert from "node:assert/strict";
import { createTown, execute, readSave } from "../lib/republic.ts";
import { introSites } from "../lib/republic-intro.ts";
import { festivalSites, prepSites, festivalResult, themes, supports, festivalBudget, responses } from "../lib/republic-festival.ts";
const day = "2026-10-01";
const ok = r => { assert(r.ok, r.message); assert(readSave(r.state), "Every command reloads"); return r.state; };
function tutorial(seed, green) {
  let s = createTown(day, seed);
  const go = c => { s = ok(execute(s, c, day)); };
  go({ type: "build", id: green, target: introSites(s, { kind: "build", id: green }, day)[0] });
  go({ type: "step" });
  if (!introSites(s, { kind: "build", id: "library" }, day).length) {
    const item = s.placed.find(p => p.id === green);
    go({ type: "move", instanceId: item.instanceId, target: introSites(s, { kind: "move", id: green, instanceId: item.instanceId }, day)[0] });
  }
  go({ type: "build", id: "library", target: introSites(s, { kind: "build", id: "library" }, day)[0] });
  go({ type: "step" });
  return s;
}
let evaluated = 0;
function solve(start) {
  let losing = null;
  for (const theme of Object.keys(themes)) {
    const t = ok(execute(start, { type: "festival-theme", theme }, day));
    for (const target of festivalSites(t)) {
      const located = ok(execute(t, { type: "festival-site", target }, day));
      for (const a of Object.keys(supports)) for (const b of Object.keys(supports)) {
        if (a === b) continue;
        for (const first of prepSites(located, located.festival)) {
          const p = ok(execute(located, { type: "festival-prep", kind: a, target: first }, day));
          for (const second of prepSites(p, p.festival)) {
            const ready = ok(execute(p, { type: "festival-prep", kind: b, target: second }, day));
            for (let choice = 0; choice < 3; choice++) {
              if (responses(ready.festival)[choice].cost > festivalBudget(ready.festival)) continue;
              const result = ok(execute(ready, { type: "festival-response", choice }, day));
              evaluated++;
              if (festivalResult(result.festival).stars === 3) return { result, losing };
              losing ??= result;
            }
          }
        }
      }
    }
  }
  throw Error(`No perfect solution: seed ${start.seed}, green ${start.placed.find(p=>p.id==="park"||p.id==="garden")?.id}, stage ${start.festival.stage}, event ${start.festival.incident}`);
}
for (const green of ["park", "garden"]) for (let seed = 0; seed < 3; seed++) {
  let s = tutorial(seed, green),original = structuredClone(s);
  s = ok(execute(s, { type: "festival-journey" }, day));
  assert.equal(execute(s, { type: "festival-next" }, day).ok, false, "Cannot skip unfinished day");
  for (let stage = 0; stage < 7; stage++) {
    assert.equal(s.festival.stage, stage);
    const { result, losing } = solve(s);
    if (losing) {
      assert.equal(execute(losing, { type: "festival-next" }, day).ok, false, "Failed goals cannot unlock next day");
      const retry = ok(execute(losing, { type: "festival-retry" }, day));
      assert.equal(retry.festival.incident, losing.festival.incident, "Retry never rerolls the complication");
    }
    s = result;
    const retry = ok(execute(s, { type: "festival-retry" }, day));
    assert.equal(retry.festival.best, 3, "A worse retry does not erase a completed goal");
    const advanced = ok(execute(s, { type: "festival-next" }, day));
    assert.equal(advanced.festivalJourney.stage, stage + 1);
    assert.equal(advanced.lastDay, original.lastDay, "Story day never changes the real calendar");
    assert.equal(advanced.charges, original.charges, "No parcel farming by advancing story days");
    s = advanced;
  }
  assert.deepEqual(s.festivalJourney.scores, Array(7).fill(3));
  assert.equal(s.unlocked.filter(id => id === "ceremonial-gate").length, 1);
  assert.equal(execute(s, { type: "festival-next" }, day).ok, false, "Final reward cannot be reclaimed");
  assert.deepEqual(s.placed, original.placed);
  assert.equal(s.coins, original.coins); assert.equal(s.materials, original.materials);
  const daily = ok(execute(s, { type: "festival-start" }, day));
  assert.equal(daily.festival.mode, "daily"); assert.equal(daily.festivalJourney.stage, 7);
  assert.equal(execute(daily, { type: "festival-journey" }, day).ok, false);
  for (const malformed of [{stage:8,scores:Array(7).fill(3)},{stage:2,scores:Array(7).fill(0)},{stage:0,scores:[3]}]) assert.equal(readSave({...s,festivalJourney:malformed}),null);
}
console.log(`PASS: six complete seven-day journeys after both tutorials, ${evaluated} evaluated plans, failure/retry, progression, one-time gate, saves and real-day economy preserved.`);
