// Poslanci a kluby pre stránku Parlament (scripts/build-deputies.mjs → public/data/hlasovania/poslanci.json,
// lib/parliament-clubs.data.ts): zhoda so súbormi hlasovaní, rozsadenie, kluby k poslednému hlasovaniu a pravidlá
// z lib/deputies.ts (prítomnosť, línia klubu, inak ako klub, jednotnosť) na malých kontrolných príkladoch.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { clubParty, marks, seatMembers } from "../lib/votes.ts";
import { clubAgreement, clubLines, clubStats, deputyStats, differentAt, differsAt, displayName, findDeputies, voteDetailAt } from "../lib/deputies.ts";
import { parliamentClubs } from "../lib/parliament-clubs.data.ts";
import { clubEntries, clubSeatParty, clubsVariant, TERM } from "../lib/parliament-clubs.ts";

const dir = new URL("../public/data/hlasovania/", import.meta.url);
const read = name => JSON.parse(readFileSync(new URL(name, dir), "utf8"));
const index = read("index.json"), data = read("poslanci.json");
assert.equal(data.v, 1); assert.equal(data.aktualizovane, index.aktualizovane, "Poslanci po poslednom sťahovaní hlasovaní (spusti build-deputies)");
assert.deepEqual(data.hlasovania, index.hlasovania.map(v => v.id), "Poradie hlasovaní zhodné so zoznamom");
assert(data.kluby.every(c => clubParty(c)), "Každý klub známy");
const n = data.hlasovania.length;
assert.equal(new Set(data.poslanci.map(p => p.id)).size, data.poslanci.length, "Každý poslanec raz");
for (const p of data.poslanci) {
  assert.equal(p.h.length, n, `Dĺžka hlasov ${p.meno}`); assert.equal(p.k.length, n, `Dĺžka klubov ${p.meno}`);
  assert([...p.h].every((m, j) => (m === "-") === (p.k[j] === "-") && (m === "-" || marks.includes(m))), `Hlasy a kluby ${p.meno}`);
  assert(/^[^,]+, .+$/.test(p.meno), `Meno v tvare „Priezvisko, Meno“: ${p.meno}`);
}
// Každé hlasovanie poskladané z poslancov sa zhoduje so súborom hlasovania (vrátane rozsadenia do kresiel).
data.hlasovania.forEach((id, j) => {
  const file = read(`${id}.json`), built = voteDetailAt(data, j);
  assert.equal(built.poslanci.length, 150, `150 poslancov v ${id}`);
  const key = d => seatMembers(d).map(s => `${s.id}:${s.mark}:${clubParty(s.club)}`).join(",");
  assert.equal(key(built), key(file), `Rozsadenie ${id} zo súboru poslancov`);
});
// Kluby k poslednému hlasovaniu = rozsadenie posledného hlasovania; poradie sály.
assert.equal(parliamentClubs.voteId, index.hlasovania[0].id, "Kluby k poslednému hlasovaniu (spusti build-deputies)");
assert.equal(TERM.votes, n); assert.equal(TERM.deputies, data.poslanci.length);
assert.equal(clubSeatParty.length, 150, "150 kresiel v Kluboch dnes");
const latest = seatMembers(voteDetailAt(data, 0));
assert.deepEqual(clubSeatParty, latest.map(s => s.party), "Kluby dnes sedia ako pri poslednom hlasovaní");
assert.equal(clubEntries.reduce((a, c) => a + c.seats, 0), 150);
const variant = clubsVariant();
assert.equal(variant.ordered.reduce((a, c) => a + c.seats, 0), 150); assert.equal(variant.blocs.total ?? 150, 150);
// Pravidlá na kontrolnom príklade: klub A (3 členovia), nezaradený, dve hlasovania.
const sample = { v: 1, obdobie: 9, aktualizovane: "2026-01-01", hlasovania: [2, 1], kluby: ["Klub SMER - SD", "Poslanci, ktorí nie sú členmi poslaneckých klubov", "Klub PS"], poslanci: [
  { id: 1, meno: "A, Prvý", h: "ZZ", k: "00" }, { id: 2, meno: "B, Druhý", h: "ZP", k: "00" }, { id: 3, meno: "C, Tretí", h: "PN", k: "00" },
  { id: 4, meno: "D, Štvrtý", h: "P0", k: "11" }, { id: 5, meno: "E, Piaty", h: "PZ", k: "22" }, { id: 6, meno: "F, Šiesty", h: "-Z", k: "-2" },
] };
const lines = clubLines(sample);
assert.equal(lines[0].get("smer").mark, "Z", "Línia: nadpolovičná väčšina prítomných (2 z 3)");
assert.equal(lines[1].get("smer").mark, null, "Bez nadpolovičnej väčšiny nie je línia (Z, P, N)");
assert.equal(differsAt(sample, sample.poslanci[2], 0), true, "Proti pri línii za = inak ako klub");
assert.equal(differsAt(sample, sample.poslanci[2], 1), false, "Nehlasovanie sa nepočíta");
assert.equal(differsAt(sample, sample.poslanci[3], 0), false, "Nezaradený nemá klub");
assert.deepEqual(differentAt(sample, 0).map(d => d.row.id), [3]);
const s1 = deputyStats(sample, sample.poslanci[3]);
assert.deepEqual([s1.seated, s1.present], [2, 1], "Prítomnosť: neprítomnosť sa nepočíta ako prítomnosť");
const s6 = deputyStats(sample, sample.poslanci[5]);
assert.equal(s6.seated, 1, "Pred nástupom nie je poslancom");
const cs = clubStats(sample).get("smer");
assert.equal(cs.seated, 6); assert.equal(cs.present, 6); assert(Math.abs(cs.cohesion - (2 / 3 + 1 / 3) / 2) < 1e-9, "Jednotnosť = priemer podielu najväčšej skupiny");
const agree = clubAgreement(sample, ["smer", "ps"]);
assert.deepEqual(agree("smer", "ps"), { same: 0, both: 1 }, "Zhoda len v hlasovaniach, kde líniu majú oba kluby");
assert.equal(agree("ps", "ps"), null);
assert.equal(displayName("Baláž, Vladimír"), "Vladimír Baláž");
assert.deepEqual(findDeputies(sample, "druhy b").map(r => r.id), [2], "Hľadanie bez diakritiky a v ľubovoľnom poradí");
// Skutočné dáta: rozumné hranice (žiadne tvrdenie o konkrétnych ľuďoch).
const stats = clubStats(data);
for (const c of clubEntries.filter(c => c.id !== "nezaradeni")) {
  const s = stats.get(c.id);
  assert(s && s.seated > 0 && s.present <= s.seated && s.cohesion > .5 && s.cohesion <= 1, `Štatistika klubu ${c.id}`);
}
const differs = data.poslanci.reduce((a, p) => a + deputyStats(data, p).differs.length, 0);
console.log(`PASS poslanci: ${data.poslanci.length} poslancov × ${n} hlasovaní, rozsadenie = súbory hlasovaní, kluby dnes ${clubEntries.map(c => `${c.short} ${c.seats}`).join(", ")}, hlasov inak ako klub ${differs}`);
