import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { deputyFootprint, footprintWindow, footprintPageSize } from '../lib/deputy-footprint.ts';
import { deputyStats, differsAt } from '../lib/deputies.ts';
import { marks } from '../lib/votes.ts';

const read = path => JSON.parse(readFileSync(path, 'utf8'));
const data = read('public/data/hlasovania/poslanci.json');
const votes = read('public/data/hlasovania/index.json');
const byId = new Map(votes.hlasovania.map(v => [v.id, v]));
for (const row of data.poslanci) {
  const items = deputyFootprint(data, row, byId), stats = deputyStats(data, row);
  assert.equal(items.length, stats.seated, `membership count: ${row.id}`);
  assert.equal(new Set(items.map(i => i.id)).size, items.length);
  for (const mark of marks) assert.equal(items.filter(i => i.mark === mark).length, stats.counts[mark]);
  for (const i of items) {
    assert.equal(data.hlasovania[i.j], i.id);
    assert.equal(row.h[i.j], i.mark);
    assert.equal(i.vote, byId.get(i.id));
    assert.equal(i.differs, differsAt(data, row, i.j));
  }
  for (let i = 1; i < items.length; i++) assert(items[i - 1].vote.datum <= items[i].vote.datum);
  for (const year of new Set(items.map(i => i.vote.datum.slice(0, 4)))) {
    const expected = items.filter(i => i.vote.datum.startsWith(year));
    const recent = footprintWindow(items, year, 0);
    assert.deepEqual(recent.items, expected.slice(-footprintPageSize));
    const pages = Array.from({ length: recent.pages }, (_, page) => footprintWindow(items, year, page).items);
    assert.deepEqual(pages.reverse().flat(), expected, 'each vote appears once across chronological pages');
    assert.equal(footprintWindow(items, year, -1).page, 0);
    assert.equal(footprintWindow(items, year, Infinity).page, 0);
    assert.equal(footprintWindow(items, year, 999).page, recent.pages - 1);
  }
  const partial = new Map(byId); partial.delete(data.hlasovania[0]);
  assert(!deputyFootprint(data, row, partial).some(i => i.id === data.hlasovania[0]), 'missing source cannot become an invented vote');
}
assert.deepEqual(footprintWindow([], '2026', 0).items, []);
assert.equal(footprintWindow([], '2026', 0).pages, 1);
console.log(`Deputy footprint: membership, votes, dissent and paging agree for all ${data.poslanci.length} deputies.`);
