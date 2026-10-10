import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chamberClubAnnotations, chamberSeatAnchor } from '../lib/chamber-annotations.ts';
import { clubEntries, clubSeatParty } from '../lib/parliament-clubs.ts';
import { chamberSeats } from '../lib/parliament-model.ts';
import { displayName } from '../lib/deputies.ts';

const labels = chamberClubAnnotations(clubEntries, clubSeatParty);
assert.equal(labels.reduce((sum, a) => sum + a.count, 0), 150);
assert.deepEqual(labels.map(a => [a.id, a.count]), clubEntries.map(c => [c.id, c.seats]));
for (const a of labels) {
  const mine = chamberSeats.filter(s => clubSeatParty[s.index] === a.id);
  const angle = mine.reduce((sum, s) => sum + s.angle, 0) / mine.length;
  assert(Math.abs((a.x / 100 * 644 - 322) - Math.cos(angle) * 350) < 1e-8);
  assert(Math.abs((a.y / 100 * 372 - 322) + Math.sin(angle) * 350) < 1e-8);
  assert(!/NaN|Infinity/.test(a.arc + a.line));
}
assert.deepEqual(chamberClubAnnotations([{ id: 'missing' }], clubSeatParty), []);
assert.equal(chamberSeatAnchor(-1), null);
assert.equal(chamberSeatAnchor(150), null);
for (const seat of chamberSeats) {
  const a = chamberSeatAnchor(seat.index);
  assert(a && a.x > 0 && a.x < 100 && a.y > 0 && a.y < 100);
  assert(Math.abs((a.x / 100 * 644 - 322) - seat.x * 1000) < 1e-8);
}
const read = file => JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8'));
const photos = read('../lib/deputy-portraits.json');
const people = Object.values(read('../lib/party-profiles.json')).flatMap(p => p.people);
const rows = read('../public/data/hlasovania/poslanci.json').poslanci;
for (const [id, photo] of Object.entries(photos)) {
  assert.equal(photo.name, displayName(rows.find(r => r.id === Number(id)).meno));
  const source = people.find(p => p.name === photo.name);
  assert(source && photo.photo === source.photo && photo.source === source.imageSource);
  assert.equal(photo.author, source.imageAuthor);
  assert.equal(photo.license, source.imageLicense);
  assert.equal(photo.licenseUrl, source.imageLicenseUrl);
  assert(readFileSync(new URL('../public' + photo.photo, import.meta.url)).length > 0);
}
console.log('Chamber annotations: 150 seat anchors, club positions and existing portrait credits OK.');
