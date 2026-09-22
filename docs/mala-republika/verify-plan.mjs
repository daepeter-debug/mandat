// Independent design calculation, not a test of the future game implementation.
// Coordinates/costs intentionally live here as reference expectations.
import assert from 'node:assert/strict';

const key = ([x, y]) => `${x},${y}`;
const distance = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
const plaza = [2, 2];
const roads = [[0, 2], [1, 2], [3, 2], [4, 2], [5, 2]];
const base = { hall: [2, 1], station: [5, 1], school: [1, 1], h1: [0, 1], h2: [3, 1], h3: [4, 3] };
const step1 = { ...base, park: [1, 3] };
const step2 = { ...step1, school: [1, 3], park: [0, 3], library: [2, 3] };
const step3 = { ...step2, h1: [4, 1], h2: [1, 1], h3: [3, 3], clinic: [3, 1] };
const step4 = { ...step3, market: [2, 3] };
delete step4.library; // store, never sell or destroy the owned instance
const finalLayout = { ...step3 }; // library returned; market stored

function connectedNetwork(paths = roads) {
  const all = [plaza, ...paths];
  const seen = new Set([key(plaza)]);
  const pending = [plaza];
  while (pending.length) {
    const cell = pending.pop();
    for (const p of all) if (!seen.has(key(p)) && distance(cell, p) === 1) {
      seen.add(key(p)); pending.push(p);
    }
  }
  return all.filter(p => seen.has(key(p)));
}
const network = connectedNetwork();
const active = cell => network.some(p => distance(p, cell) === 1);
const pair = (layout, a, b) => active(layout[a]) && active(layout[b]) && distance(layout[a], layout[b]) <= 2;
function checkLayout(layout) {
  const cells = [plaza, ...roads, ...Object.values(layout)];
  assert.equal(new Set(cells.map(key)).size, cells.length, 'occupied tile collision');
  for (const p of cells) assert(p.every(n => Number.isInteger(n) && n >= 0 && n < 6));
  assert.deepEqual(layout.hall, base.hall);
  assert.deepEqual(layout.station, base.station);
  for (const [id, p] of Object.entries(layout)) assert(active(p), `${id} is disconnected`);
}
for (const layout of [base, step1, step2, step3, step4, finalLayout]) checkLayout(layout);
assert(pair(step1, 'school', 'park'));
assert(pair(step2, 'school', 'library'));
assert(['h1', 'h2', 'h3'].filter(id => pair(step3, 'clinic', id)).length >= 2);
assert(distance(step4.market, plaza) <= 2 && active(step4.market));
assert(pair(finalLayout, 'school', 'library'));
assert(['h1', 'h2', 'h3'].every(id => active(finalLayout[id])));

for (const [branch, building] of [['museum', 'library'], ['market-hall', 'market'], ['community-hall', 'park']]) {
  const preparation = { ...step4 };
  delete preparation.h1; // temporarily put that home in inventory
  preparation[building] = [4, 1]; // moving a placed building also clears its old tile
  checkLayout(preparation);
  assert(pair(preparation, 'station', building), branch);
  checkLayout(finalLayout); // home and library restored for the last goal
  let coins = 12, materials = 8;
  const costs = [[3, 2], [6, 3], [7, 4], [6, 3], [0, 0], [6, 4], [8, 4]];
  for (let day = 0; day < 7; day++) {
    coins += 8; materials += 4; // guaranteed daily parcel, no duplicate compensation
    const [c, m] = costs[day];
    assert(coins >= c && materials >= m, `${branch}: insufficient funds on day ${day + 1}`);
    coins -= c; materials -= m;
    if (day < 4) { coins += 2; materials += 1; }
  }
  assert.equal(coins, 40);
  assert.equal(materials, 20);
  console.log(`${branch}: geometry and daily guaranteed budget feasible; final reserve 40 C / 20 M`);
}
assert.equal(60 + 25 + 12 + 3, 100);
console.log('PASS: design arithmetic only. Engine commands, dates, saves, auth and UI still require implementation tests.');
