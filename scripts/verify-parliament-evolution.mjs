import assert from 'node:assert/strict';
import fs from 'node:fs';
import { allParliamentVariants, parliamentTimeline, parliamentEdges } from '../lib/parliament-model.ts';
import { aggregateSeries, aggregateAsPoll, reportedByMajority } from '../lib/aggregate.ts';
import { scenarioFromPoll } from '../lib/parliament.ts';
import { seatChanges } from '../lib/parliament-experience.ts';

const timeline = parliamentTimeline();
assert.equal(timeline[0].point.date.slice(0, 7), '2026-01');
assert.equal(timeline.at(-1).point.date, aggregateSeries.at(-1).date);
assert.equal(new Set(timeline.map(p => p.variant.id)).size, timeline.length);
for (const month of timeline) {
  assert.deepEqual(month.point, aggregateSeries.filter(p => p.date.slice(0, 7) === month.point.date.slice(0, 7)).at(-1));
  assert.ok(Object.values(month.point.values).every(v => reportedByMajority(v.polls, month.agencies)));
  assert.equal(month.variant.seatParty.length, 150);
  assert.deepEqual(Object.fromEntries(month.variant.ordered.map(p => [p.id, p.seats])), Object.fromEntries(scenarioFromPoll(aggregateAsPoll(month.point)).rows.map(p => [p.id, p.seats])));
  assert.equal(seatChanges(timeline[0].variant, month.variant).reduce((sum, p) => sum + p.delta, 0), 0);
}
for (const edge of parliamentEdges()) {
  assert.ok(edge.value.lower < 5 && edge.value.upper >= 5);
  assert.ok(!edge.variant.ordered.some(p => p.id === edge.party.id));
  assert.equal(edge.variant.seatParty.length, 150);
  const poll = aggregateAsPoll(); poll.values[edge.party.id] = 0;
  assert.deepEqual(edge.variant.seatParty, allParliamentVariants().find(v => v.id === edge.variant.id).seatParty);
  assert.deepEqual(Object.fromEntries(edge.variant.ordered.map(p => [p.id, p.seats])), Object.fromEntries(scenarioFromPoll(poll).rows.map(p => [p.id, p.seats])));
}
// Model: všetky mesiace aj scenáre sú v GLB pod svojimi menami (mapovanie každého kresla a validátor Khronos stráži verify-parliament-glb).
const raw = fs.readFileSync('public/models/parlament.glb'), gltf = JSON.parse(raw.subarray(20, 20 + raw.readUInt32LE(12)).toString());
const names = gltf.extensions.KHR_materials_variants.variants.map(v => v.name);
for (const v of allParliamentVariants()) assert.ok(names.includes(v.id), `Variant ${v.id} chýba v modeli`);
console.log(`Vývoj: ${timeline.length} mesiacov, ${parliamentEdges().length} scenáre nepostúpenia; všetky varianty sú v modeli (${raw.length} B).`);
