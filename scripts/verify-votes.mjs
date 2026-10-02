// Hlasovania NR SR (public/data/hlasovania, scripts/fetch-votes.mjs): úplnosť, súčty voči oficiálnym číslam,
// kluby, rozsadenie do 150 kresiel a výsledok podľa väčšiny, ktorú vyžaduje Ústava SR (lib/votes.ts).
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { SEAT_ORDER, clubParty, clubTotals, marks, matchesQuery, required, seatMembers } from "../lib/votes.ts";

const dir = new URL("../public/data/hlasovania/", import.meta.url);
const read = name => JSON.parse(readFileSync(new URL(name, dir), "utf8"));
const index = read("index.json");
assert.equal(index.v, 1); assert.equal(index.obdobie, 9); assert(/^\d{4}-\d{2}-\d{2}$/.test(index.aktualizovane));
assert(index.hlasovania.length >= 300, `Aspoň 300 hlasovaní (je ${index.hlasovania.length})`);
const ids = new Set(), kinds = {}, clubs = new Set();
for (const v of index.hlasovania) {
  assert(!ids.has(v.id), `Duplicitné hlasovanie ${v.id}`); ids.add(v.id);
  kinds[v.druh] = (kinds[v.druh] ?? 0) + 1;
  assert(/^\d{4}-\d{2}-\d{2}$/.test(v.datum) && v.datum >= "2023-10-25" && /^\d{2}:\d{2}$/.test(v.cas), `Dátum ${v.id}`);
  assert(["zakon", "ustavny", "rozpocet", "veto", "nedovera"].includes(v.druh), `Druh ${v.id}`);
  assert(v.nazov.length >= 10 && v.nazov.length <= v.plny.length, `Názov ${v.id}`);
  const d = read(`${v.id}.json`);
  assert.equal(d.id, v.id); assert.equal(d.poslanci.length, 150, `150 poslancov v ${v.id}`);
  assert.equal(new Set(d.poslanci.map(p => p[0])).size, 150, `Každý poslanec raz v ${v.id}`);
  const c = Object.fromEntries(marks.map(m => [m, d.poslanci.filter(p => p[3] === m).length]));
  assert.deepEqual([v.za, v.proti, v.zdrzalo, v.nehlasovalo, v.nepritomni], [c.Z, c.P, c["?"], c.N, c["0"]], `Súčty ${v.id}`);
  // Oficiálny súhrn NR SR: hlasujúci = za + proti + zdržali sa, prítomní = hlasujúci + nehlasovali, neprítomní = 150 − prítomní.
  // Výnimka: od 9. 9. do 22. 10. 2025 súhrn ráta s 152 poslancami (neprítomných o dvoch viac), zoznam mien má 150 —
  // počítame zo zoznamu (rovnaké číslo vidno v kreslách).
  const o = v.oficialne;
  assert.deepEqual([o.za, o.proti, o.zdrzalo, o.nehlasovalo], [v.za, v.proti, v.zdrzalo, v.nehlasovalo], `Oficiálne súčty ${v.id}`);
  assert.equal(o.hlasujucich, v.za + v.proti + v.zdrzalo, `Hlasujúci ${v.id}`);
  assert.equal(o.pritomni, o.hlasujucich + v.nehlasovalo, `Prítomní ${v.id}`);
  const quirk = v.datum >= "2025-09-09" && v.datum <= "2025-10-22";
  assert(o.nepritomni === v.nepritomni || (quirk && o.nepritomni === v.nepritomni + 2), `Neprítomní v súhrne ${v.id}: ${o.nepritomni} vs ${v.nepritomni}`);
  for (const club of d.kluby) { assert(clubParty(club), `Neznámy klub „${club}“ v ${v.id}`); clubs.add(club); }
  assert(d.poslanci.every(p => Number.isInteger(p[2]) && p[2] >= 0 && p[2] < d.kluby.length && marks.includes(p[3])), `Kluby a hlasy ${v.id}`);
  // Výsledok podľa pravidla väčšiny z ústavy.
  const need = required(v).votes;
  assert.equal(v.za >= need, v.preslo, `${v.id} (${v.datum}, ${v.druh}): za ${v.za}, treba ${need}, NR SR: ${v.preslo ? "prešiel" : "neprešiel"}`);
  // Rozsadenie: 150 rôznych poslancov, kluby v poradí sály.
  const seated = seatMembers(d);
  assert.equal(seated.length, 150); assert.equal(new Set(seated.map(s => s.id)).size, 150);
  const order = seated.map(s => SEAT_ORDER.indexOf(s.party));
  assert(order.every((o, i) => i === 0 || o >= order[i - 1]), `Poradie klubov v sále ${v.id}`);
  assert.equal(clubTotals(d).reduce((a, r) => a + r.total, 0), 150);
}
const files = readdirSync(dir).filter(f => /^\d+\.json$/.test(f));
assert.equal(files.length, index.hlasovania.length, "Každý súbor hlasovania je v zozname a naopak");
assert(index.hlasovania.every((v, i, all) => i === 0 || `${all[i - 1].datum} ${all[i - 1].cas}` >= `${v.datum} ${v.cas}`), "Zoznam od najnovšieho");
assert(kinds.ustavny >= 1 && kinds.nedovera >= 1 && kinds.rozpocet >= 1, "Všetky druhy hlasovaní");
assert(index.hlasovania.some(v => matchesQuery(v, "ustava")) || index.hlasovania.some(v => matchesQuery(v, "ústavný")), "Vyhľadávanie bez diakritiky");
console.log(`PASS hlasovania: ${index.hlasovania.length} (${Object.entries(kinds).map(([k, n]) => `${k} ${n}`).join(", ")}), ${clubs.size} klubov, súčty = oficiálne, výsledok = pravidlo väčšiny, rozsadenie 150 kresiel`);
