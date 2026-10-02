import assert from 'node:assert/strict';
import { parliamentVariants } from '../lib/parliament-model.ts';
import { coalitionSelection, partyFocus } from '../lib/parliament-experience.ts';

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
console.log('PASS parliament experience: both variants, deduplication, unknown IDs, majority crossing and deterministic seat focus.');
