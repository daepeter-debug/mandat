// Tabuľa na stene 3D sály (lib/parliament-wall.ts): desať polí, čísla hlasovania presne podľa súhrnu, kreslá bez straty.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { WALL_PANELS, seatsWall, voteWall, wallText } from "../lib/parliament-wall.ts";
import { required } from "../lib/votes.ts";
import { clubEntries } from "../lib/parliament-clubs.ts";

const index = JSON.parse(readFileSync(new URL("../public/data/hlasovania/index.json", import.meta.url), "utf8"));
for (const v of index.hlasovania) {
  const panels = voteWall(v, 3);
  assert.equal(panels.length, WALL_PANELS, `Desať polí pri ${v.id}`);
  assert.deepEqual(panels.slice(2, 7).map(p => Number(p.value)), [v.za, v.proti, v.zdrzalo, v.nehlasovalo, v.nepritomni], `Čísla ${v.id}`);
  assert.equal(panels[7].value, v.preslo ? "PREŠIEL" : "NEPREŠIEL", `Výsledok ${v.id}`);
  assert.equal(Number(panels[8].value), required(v).votes, `Potrebná väčšina ${v.id}`);
}
const clubs = seatsWall({ title: "KLUBY NR SR", date: "k 1. 10. 2026", items: clubEntries.map(c => ({ short: c.short, color: c.color, seats: c.seats })), footer: { label: "VÄČŠINA", value: "76" } });
assert.equal(clubs.length, WALL_PANELS);
assert.equal(clubs.filter(p => !p.empty).slice(1, -1).reduce((a, p) => a + Number(p.value), 0), 150, "Kluby dnes: 150 kresiel");
const many = seatsWall({ title: "T", date: "D", items: Array.from({ length: 11 }, (_, i) => ({ short: `S${i}`, color: "#000", seats: 10 + i })), footer: { label: "F", value: "1" } });
assert.equal(many.length, WALL_PANELS); assert.equal(many[8].label, "Ostatní", "Viac ako osem strán: posledná položka Ostatní");
assert.equal(many.slice(1, 9).reduce((a, p) => a + Number(p.value), 0), Array.from({ length: 11 }, (_, i) => 10 + i).reduce((a, b) => a + b, 0), "Zlúčenie nestratí kreslá");
const few = seatsWall({ title: "T", date: "D", items: [{ short: "A", color: "#000", seats: 80 }, { short: "B", color: "#000", seats: 70 }], footer: { label: "F", value: "1" } });
assert.deepEqual(few.map(p => p.empty ? "-" : p.label), ["T", "-", "-", "-", "A", "B", "-", "-", "-", "F"], "Menej strán sa vycentruje");
assert(wallText({ kind: "vote", vote: index.hlasovania[0], differ: 0 }).includes(`ZA ${index.hlasovania[0].za}`));
console.log(`PASS tabuľa v sále: ${index.hlasovania.length} hlasovaní × 10 polí, kluby 150 kresiel, zlúčenie a centrovanie`);
