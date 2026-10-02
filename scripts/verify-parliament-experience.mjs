import assert from 'node:assert/strict';
import { parliamentVariants } from '../lib/parliament-model.ts';
import { coalitionSelection, partyFocus, seatChanges, seatSweep, SEAT_SWEEP_MS, deputyView } from '../lib/parliament-experience.ts';

for (const variant of parliamentVariants()) {
  assert.equal(coalitionSelection(variant, []).seats, 0);
  assert.equal(coalitionSelection(variant, ['unknown']).seats, 0);
  const first = variant.ordered[0];
  assert.equal(coalitionSelection(variant, [first.id, first.id]).seats, first.seats);
  const full = coalitionSelection(variant, variant.ordered.map(p => p.id));
  assert.equal(full.seats, 150); assert.equal(full.missing, 0); assert.equal(full.majority, true);
  assert.equal(partyFocus(variant, 'unknown'), null);
  for (const p of variant.ordered) {
    const result = coalitionSelection(variant, [p.id]);
    assert.equal(result.seats, p.seats); assert.equal(result.missing, 76 - p.seats);
    const focus = partyFocus(variant, p.id);
    assert.ok(focus.target.every(Number.isFinite));
    assert.ok(Math.abs(focus.theta) <= 50);
    assert.deepEqual(focus, partyFocus(variant, p.id));
  }
  // A crossing of the majority threshold is computed from the same current variant.
  const ids = [];
  for (const p of variant.ordered) {
    ids.push(p.id); const result = coalitionSelection(variant, ids);
    assert.equal(result.majority, result.seats >= 76);
    assert.equal(result.missing, Math.max(0, 76 - result.seats));
  }
}
const [now, old] = parliamentVariants();
const changes = seatChanges(old, now);
assert.equal(changes.reduce((sum, p) => sum + p.delta, 0), 0, 'Gains and losses conserve 150 seats');
for (const p of changes) assert.equal(p.delta, (now.ordered.find(m => m.id === p.id)?.seats ?? 0) - (old.ordered.find(m => m.id === p.id)?.seats ?? 0));
assert.deepEqual(seatChanges(now, now), []);
for (let i = 0; i < 150; i++) {
  assert.equal(seatSweep(i, 0), 0); assert.equal(seatSweep(i, SEAT_SWEEP_MS), 1);
  let last = 0;
  for (let ms = 0; ms <= SEAT_SWEEP_MS; ms += 25) { const p = seatSweep(i, ms); assert.ok(p >= last && p <= 1); last = p; }
}
assert.ok(seatSweep(0, 300) > seatSweep(149, 300), 'Sweep travels in physical seat order');
assert.deepEqual(deputyView(), deputyView());
assert.ok(deputyView().eye.every(Number.isFinite));
assert.ok(deputyView().eye[2] < -.1 && deputyView().target[2] > 0, 'Eye is inside the chamber facing the lectern');
console.log('PASS parliament experience: both variants, deduplication, unknown IDs, majority crossing and deterministic seat focus.');
