import assert from 'node:assert/strict';
import fs from 'node:fs';
import { displayFacts, displayPhase } from '../lib/parliament-display.ts';
import { required } from '../lib/votes.ts';
const votes = JSON.parse(fs.readFileSync('public/data/hlasovania/index.json','utf8')).hlasovania;
for (const vote of votes) {
  const before = JSON.stringify(vote), facts = displayFacts(vote, 'ignored');
  assert.deepEqual(facts.slice(0,5).map(f => Number(f.text.match(/\d+$/)[0])), [vote.za,vote.proti,vote.zdrzalo,vote.nehlasovalo,vote.nepritomni]);
  assert.ok(facts[5].text.endsWith(String(required(vote).votes)));
  assert.ok(facts[6].text.includes(vote.nazov));
  assert.equal(JSON.stringify(vote), before);
}
assert.equal(displayFacts(null, 'Kluby dnes')[0].text, 'Kluby dnes');
assert.equal(displayPhase(0, 2000), 0);
assert.ok(displayPhase(100,2000) > displayPhase(0,2000), 'Text travels left to right');
assert.ok(displayPhase(1e8,2000) >= 0 && displayPhase(1e8,2000) < 2000);
assert.equal(displayPhase(100,0), 0);
console.log(`Architectural panel: ${votes.length} exact vote summaries; majority, payload immutability and positive wrap verified.`);
