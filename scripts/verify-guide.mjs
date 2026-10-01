import assert from "node:assert/strict";
import { catalog, connected, createTown, distance, execute, readSave } from "../lib/republic.ts";
import { categories, cellReport, info, objectReport, usefulSites } from "../lib/republic-info.ts";
import { festivalSites, prepSites, supports, festivalResult, themes } from "../lib/republic-festival.ts";
import { blockers, connectableCells, festivalGaps, freeCells, placementOptions, playerPlan, rewardText, stepItem, taskItem } from "../lib/republic-plan.ts";
import { homeWishes, townSatisfaction } from "../lib/republic-trust.ts";
import { COUNCIL_SEATS, checkCouncil, checkEnvelope, checkMayor, councilCandidates, countElection, electionPhase, interestScores, mayorCandidates, mayorOutcome, parseStoredElection, rankCouncil } from "../lib/republic-election.ts";

const day = "2026-10-01";
const ok = r => { assert(r.ok, r.message); return r.state; };
const fresh = createTown(day, 7);

// ── Plán: čo sa dá urobiť hneď, za akú odmenu, čo chýba ─────────────────────────────────────────────
const plan = playerPlan(fresh);
assert.equal(plan.step.title, "Školský dvor");
assert.equal(plan.step.status, "todo");
assert.match(plan.step.detail, /park alebo záhradu/i, "Krok povie, čo chýba");
assert.deepEqual(plan.tasks.map(t => t.status), ["ready", "todo", "ready"], "Zapoj školu a Zapoj tri domy sú hneď splnené");
assert.equal(plan.tasks[1].progress.have, 0); assert.equal(plan.tasks[1].progress.need, 1);
assert.equal(plan.next.key, "task:school-link", "Ďalší krok = objednávka, ktorá dá odmenu hneď");
assert.equal(rewardText(plan.next.reward), "+2 mince, +1 materiál");
assert.equal(rewardText({ coins: 8, materials: 4 }), "+8 mincí, +4 materiály");
assert.equal(plan.parcel.status, "ready", "Zásielka čaká");
let s = ok(execute(fresh, { type: "task", task: "school-link" }, day));
assert.equal(taskItem(s, "school-link").status, "done", "Vyzdvihnutá objednávka je hotová");
assert(playerPlan(s).done.some(x => x.key === "task:school-link"));
// Krok sa splní parkom pri škole; potom je pripravený na potvrdenie s odmenou.
s = ok(execute(s, { type: "build", id: "park", target: { x: 1, y: 3 } }, day));
const step = stepItem(s);
if (step.status === "ready") assert.equal(rewardText(step.reward), "+2 mince, +1 materiál");
// ── Zablokovanie ─────────────────────────────────────────────────────────────────────────────────
assert.deepEqual(blockers(fresh), [], "Nová štvrť nie je zablokovaná");
let full = fresh;
for (const p of freeCells(fresh)) full = ok(execute(full, { type: "road", target: p }, day));
assert.equal(freeCells(full).length, 0);
assert.equal(blockers(full)[0].key, "full", "Plná štvrť hlási, že nie je kam stavať");
assert.equal(placementOptions(full).cells.length, 0);
let island = fresh;
for (const p of fresh.roads) island = ok(execute(island, { type: "road", target: p }, day)); // odstráni cesty
for (const target of [{ x: 1, y: 2 }, { x: 3, y: 2 }, { x: 2, y: 3 }]) island = ok(execute(island, { type: "build", id: "house", target }, day));
assert.equal(connectableCells(island).length, 0, "Okolie námestia je zastavané a ciest niet");
assert(freeCells(island).length > 0);
assert.equal(blockers(island)[0].key, "no-road", "Voľné miesta bez cesty sú výrazné upozornenie");
assert(placementOptions(island).cells.length > 0 && placementOptions(island).connected.length === 0);
// ── Slávnosť: prečo nemôžem pokračovať ───────────────────────────────────────────────────────────
let three = null, less = null;
outer: for (const theme of Object.keys(themes)) {
  const t0 = ok(execute(ok(execute(fresh, { type: "festival-journey" }, day)), { type: "festival-theme", theme }, day));
  for (const site of festivalSites(t0)) {
    const t1 = execute(t0, { type: "festival-site", target: site }, day); if (!t1.ok) continue;
    for (const a of Object.keys(supports)) for (const b of Object.keys(supports)) { if (a === b) continue;
      for (const pa of prepSites(t1.state, t1.state.festival)) { const t2 = execute(t1.state, { type: "festival-prep", kind: a, target: pa }, day); if (!t2.ok) continue;
        for (const pb of prepSites(t2.state, t2.state.festival)) { const t3 = execute(t2.state, { type: "festival-prep", kind: b, target: pb }, day); if (!t3.ok) continue;
          for (let c = 0; c < 3; c++) { const t4 = execute(t3.state, { type: "festival-response", choice: c }, day); if (!t4.ok) continue;
            const stars = festivalResult(t4.state.festival).stars; if (stars === 3) three ??= t4.state; else less ??= t4.state; if (three && less) break outer; } } } }
  }
}
assert(three && less, "Našli sa výsledky 3/3 aj horšie");
assert.deepEqual(festivalGaps(three.festival), [], "Pri 3/3 nič nechýba");
const gaps = festivalGaps(less.festival);
assert(gaps.length >= 1 && gaps.every(g => g.label && g.have && g.hint && (g.key === "special" || g.need)), "Každý nesplnený cieľ má stav, cieľ a radu");
if (gaps.some(g => g.key === "happy")) assert.match(gaps.find(g => g.key === "happy").have, /^\d\/3$/);
// ── Spokojnosť štvrte a priania domov ────────────────────────────────────────────────────────────
const base = townSatisfaction(fresh);
assert.equal(base.homes, 3); assert(base.value >= 0 && base.value <= 100);
assert(homeWishes(fresh).every(w => w.wish === "zelen"), "Nové domy si ako prvé želajú zeleň");
const greener = townSatisfaction(ok(execute(fresh, { type: "build", id: "park", target: { x: 3, y: 3 } }, day)));
assert(greener.value > base.value, "Park pri domoch zvýši spokojnosť");
// ── Komunálne voľby (zákon č. 180/2014 Z. z.) ────────────────────────────────────────────────────
assert.deepEqual(electionPhase("2026-10-01"), { phase: "pred", days: 23 });
assert.equal(electionPhase("2026-10-24").phase, "den"); assert.equal(electionPhase("2026-10-25").phase, "po");
assert.equal(checkMayor([]).valid, false); assert.equal(checkMayor(["eva", "nina"]).valid, false); assert.equal(checkMayor(["eva"]).valid, true);
assert.equal(checkCouncil([]).valid, false); assert.equal(checkCouncil(["jakub", "maria", "ondrej", "pavol"]).valid, false, "Viac ako 3 = neplatný (§ 184)");
assert.equal(checkCouncil(["jakub"]).valid, true, "Menej ako 3 je platné");
const scores = interestScores(fresh); assert(Object.values(scores).every(v => v >= 0 && v <= 1));
const r1 = countElection(fresh, { mayor: ["nina"], council: ["maria", "tomas"] }), r2 = countElection(fresh, { mayor: ["nina"], council: ["maria", "tomas"] });
assert.deepEqual(r1, r2, "Rovnaká štvrť a lístky = rovnaký výsledok");
assert.equal(r1.mayor.valid + r1.mayor.invalid, r1.voted); assert.equal(r1.council.valid + r1.council.invalid, r1.voted);
assert.equal(Object.values(r1.mayor.votes).reduce((a, b) => a + b, 0), r1.mayor.valid, "Každý platný lístok starostu = 1 hlas");
assert(Object.values(r1.council.votes).reduce((a, b) => a + b, 0) <= r1.council.valid * COUNCIL_SEATS);
assert.equal(r1.council.elected.length, COUNCIL_SEATS); assert.equal(r1.council.substitutes.length, councilCandidates.length - COUNCIL_SEATS);
assert.equal(r1.steps.at(-1).counted, r1.voted, "Sčítanie dobehne do konca");
const invalid = countElection(fresh, { mayor: ["eva", "milan"], council: [] });
assert.equal(invalid.player.mayor.valid, false); assert.equal(invalid.player.council.valid, false);
assert.equal(invalid.mayor.invalid, countElection(fresh, null).mayor.invalid + 1, "Neplatný lístok hráča sa započíta medzi neplatné");
// § 189 ods. 2: rovnosť v rámci tej istej strany → poradie na listine (Zuzana je 1., Jakub 2. v Spolku Lipová).
const sameParty = rankCouncil({ jakub: 5, zuzana: 5, maria: 7, ondrej: 1, pavol: 0, tomas: 2 }, 1);
assert(sameParty.ranking.indexOf("zuzana") < sameParty.ranking.indexOf("jakub")); assert.equal(sameParty.lots.length, 0, "Bez žrebu");
// § 189 ods. 3: rovnosť nezávislých na hranici mandátu → žreb (deterministický, zaznamenaný).
const lot = rankCouncil({ maria: 4, tomas: 4, zuzana: 6, ondrej: 5, jakub: 1, pavol: 0 }, 99);
assert.equal(lot.lots.length, 1); assert.deepEqual(new Set(lot.lots[0].among), new Set(["maria", "tomas"]));
assert.deepEqual(rankCouncil({ maria: 4, tomas: 4, zuzana: 6, ondrej: 5, jakub: 1, pavol: 0 }, 99), lot);
// § 189 ods. 4: rovnosť pri starostovi → nové voľby.
assert.deepEqual(mayorOutcome({ eva: 4, milan: 4, nina: 2 }), { winner: null, tie: ["eva", "milan"] });
assert.deepEqual(mayorOutcome({ eva: 4, milan: 3, nina: 2 }), { winner: "eva", tie: [] });
assert.equal(mayorCandidates.length, 3);
// § 184 ods. 2: dva lístky rovnakého druhu v obálke → neplatné oba, druhý druh lístka ostáva platný.
const env = checkEnvelope({ mayor: ["eva"], council: ["jakub"], double: "council" });
assert.equal(env.mayor.valid, true); assert.equal(env.council.valid, false); assert.equal(env.council.why, "double");
assert.equal(checkEnvelope({ mayor: ["eva"], council: ["jakub"], double: "mayor" }).mayor.why, "double");
const sum = r => r.none + r.many + r.double;
assert.equal(sum(r1.mayor.reasons), r1.mayor.invalid, "Dôvody neplatnosti starostu sedia so súčtom");
assert.equal(sum(r1.council.reasons), r1.council.invalid, "Dôvody neplatnosti poslancov sedia so súčtom");
const towns = Array.from({ length: 60 }, (_, i) => countElection(createTown(day, i + 1), null));
assert(towns.some(r => r.mayor.reasons.double + r.council.reasons.double > 0), "Medzi voličmi sa vyskytne aj obálka s dvoma lístkami");
assert(towns.every(r => sum(r.mayor.reasons) === r.mayor.invalid && sum(r.council.reasons) === r.council.invalid && r.mayor.valid + r.mayor.invalid === r.voted));
// Uložené ostré hlasovanie: platný tvar prejde, poškodený alebo podvrhnutý sa zahodí.
const stored = { day: "2026-10-24", ballot: { mayor: ["nina"], council: ["maria", "tomas"] }, result: r1 };
assert.deepEqual(parseStoredElection(JSON.stringify(stored)), stored);
const broken = [null, "", "{", "null", "[]", JSON.stringify({ ...stored, day: "24.10." }), JSON.stringify({ ...stored, ballot: { mayor: ["hacker"], council: [] } }),
  JSON.stringify({ ...stored, ballot: { mayor: ["eva", "eva"], council: [] } }), JSON.stringify({ ...stored, result: { ...r1, steps: [] } }),
  JSON.stringify({ ...stored, result: { ...r1, council: { ...r1.council, elected: ["jakub", "maria"] } } }), JSON.stringify({ ...stored, result: { ...r1, mayor: { ...r1.mayor, winner: "x" } } }),
  JSON.stringify({ ...stored, result: { ...r1, voted: -1 } }), JSON.stringify({ ...stored, result: { ...r1, council: { ...r1.council, reasons: undefined } } })];
for (const text of broken) assert.equal(parseStoredElection(text), null, `Poškodené uloženie volieb sa zahodí: ${String(text).slice(0, 60)}`);
// ── Čo je na mape a čo robí (detail po ťuknutí) ───────────────────────────────────────────────────
for (const id of Object.keys(catalog)) assert(info[id]?.short && info[id].tagline && info[id].does && categories[info[id].category], `Popis pre ${id}`);
const home = objectReport(fresh, "house-1");
assert.deepEqual(home.checks.map(c => c.ok), [true, false, false, true, false], "Dom: cesta a škola áno, zeleň, lekár a tržnica nie");
assert.equal(home.summary, "Splnené priania: 2 z 5.");
assert.deepEqual(home.quick.map(q => q.id), ["park", "clinic", "market"], "Dom ponúkne postaviť, čo mu chýba");
assert(home.highlight.reach.every(p => distance(p, home.point) <= 2 && distance(p, home.point) > 0), "Dosah domu = 2 políčka");
const withPark = ok(execute(fresh, { type: "build", id: "park", target: { x: 3, y: 3 } }, day));
const parkId = withPark.placed.find(o => o.id === "park").instanceId, park = objectReport(withPark, parkId);
assert.equal(park.summary, "Pomáha 2 domom: D2, E4.", "Park povie, komu pomáha");
assert.deepEqual(park.highlight.good.map(p => `${p.x},${p.y}`).sort(), ["3,1", "4,3"]);
assert.equal(objectReport(withPark, "house-3").checks[1].ok, true, "Dom pri parku má zeleň");
const lonely = ok(execute(fresh, { type: "build", id: "clinic", target: { x: 0, y: 4 } }, day));
const clinic = objectReport(lonely, lonely.placed.find(o => o.id === "clinic").instanceId);
assert.equal(clinic.checks[0].ok, false, "Ambulancia bez cesty nefunguje");
assert(clinic.quick.some(q => q.kind === "road"), "Ponúkne položiť cestu");
assert.equal(objectReport(fresh, "plaza").summary, "Na námestie je napojených 6 z 6 budov.");
assert(objectReport(fresh, "school-1").related.some(r => r.text.startsWith("Krok projektu „Školský dvor“")), "Škola súvisí s krokom projektu");
assert.equal(objectReport(fresh, "nic"), null);
const freeCell = cellReport(fresh, { x: 2, y: 3 });
assert.equal(freeCell.title, "Voľný pozemok C4"); assert.equal(freeCell.quick[0].kind, "build-here", "Pri ceste: najprv Postaviť sem");
assert.match(freeCell.summary, /1 napojený dom \(E4\)/);
assert.equal(cellReport(fresh, { x: 0, y: 5 }).quick[0].kind, "road-here", "Bez cesty: najprv Cesta sem");
assert.equal(cellReport(fresh, { x: 1, y: 2 }).summary, "Spojená s námestím.");
// ── Kde stavba hneď pomôže (fajky na mape) ─────────────────────────────────────────────────────────
const yard = usefulSites(fresh, "park");
assert(yard.length && yard.every(p => distance(p, { x: 1, y: 1 }) <= 2 && connected(fresh, p)), "Pri kroku Školský dvor: park pri škole a pri ceste");
const care = usefulSites(fresh, "clinic");
assert(care.length && care.every(p => fresh.placed.filter(o => o.id === "house" && distance(o, p) <= 2).length === 2), "Ambulancia: miesta pre najviac domov");
assert(usefulSites(fresh, "market").every(p => distance(p, { x: 2, y: 2 }) <= 2), "Tržnica: pri námestí");
assert(usefulSites(fresh, "library").every(p => distance(p, { x: 1, y: 1 }) <= 2), "Knižnica: pri škole");
assert.equal(usefulSites(fresh, "school").length, 0, "Druhá škola netreba");
assert(usefulSites(fresh, "house").length > 0);
// ── Prečo: každá položka plánu má vetu z pohľadu susedov ─────────────────────────────────────────
assert(plan.step.why.startsWith("Eva: „"), "Krok projektu: slová postavy");
assert(plan.tasks.every(x => x.why.startsWith("Objednávka susedov.")) && plan.parcel.why && plan.story.why);
assert(readSave(fresh), "Plán, spokojnosť ani voľby nemenia uloženie");
console.log(`PASS guide: map details (building, plot, road), useful sites, why; next action, rewards, missing, blockers (full / no road), festival gaps; satisfaction ${base.value} → ${greener.value} %; election § 182/184 ods. 1–2/189/192, strict stored result (turnout ${r1.turnout} %)`);
