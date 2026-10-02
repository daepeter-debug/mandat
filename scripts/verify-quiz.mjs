// Tridsiatka: kontrola banky otázok (tvar, duplicity, krížová kontrola s dátami webu) a logiky kola.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { questions, topicNames } from "../lib/quiz-bank.ts";
import { MAX_POINTS, PLAN, ROUND_SIZE, buildRound, daySeed, halve, levels, parseProgress, parseResults, parseSeen, present, ranking, scoreRound, shareText, streak, swapItem, titleFor } from "../lib/quiz.ts";
import { cabinets } from "../lib/cabinets.ts";
import { election2023 } from "../lib/parliament.ts";
import { publicFinance } from "../lib/public-finance.data.ts";

// ── Banka ──────────────────────────────────────────────────────────────────────────────────────────
assert(questions.length >= 280, `Aspoň 280 otázok (je ${questions.length})`);
const ids = new Set();
for (const q of questions) {
  assert(/^[a-z0-9-]+$/.test(q.id) && !ids.has(q.id), `Jedinečné id: ${q.id}`); ids.add(q.id);
  const options = [q.a, ...q.wrong];
  assert(options.every(o => typeof o === "string" && o.trim() && o.length <= 80), `Možnosti 1–80 znakov: ${q.id}`);
  assert.equal(new Set(options.map(o => o.toLocaleLowerCase("sk"))).size, 4, `Štyri rôzne možnosti: ${q.id}`);
  assert(q.q.length >= 15 && q.q.length <= 170 && q.q.endsWith("?"), `Otázka 15–170 znakov s otáznikom: ${q.id}`);
  assert(q.explain.length >= 20 && q.explain.length <= 280, `Vysvetlenie 20–280 znakov: ${q.id}`);
  assert(/^https:\/\/[^\s]+$/.test(q.source), `Zdroj ako https odkaz: ${q.id}`);
  assert(topicNames[q.topic] && levels.includes(q.level), `Téma a úroveň: ${q.id}`);
}
for (const l of levels) assert(questions.filter(q => q.level === l).length >= PLAN[l] * 4, `Úroveň ${l}: aspoň štyri kolá bez opakovania`);
for (const t of Object.keys(topicNames)) assert(questions.some(q => q.topic === t), `Téma ${t} má otázky`);

// ── Krížová kontrola s dátami webu ────────────────────────────────────────────────────────────────
const byId = id => { const q = questions.find(x => x.id === id); assert(q, `Otázka ${id} existuje`); return q; };
const pmAt = date => cabinets.find(c => c.start <= date && (c.end === null || date < c.end)).pm;
for (const year of [1996, 2000, 2008, 2014, 2019, 2022, 2025]) { const q = questions.find(x => x.id === `premier-${year}`); if (q) assert.equal(q.a, pmAt(`${year}-07-01`), `Premiér v roku ${year} podľa lib/cabinets.ts`); }
assert.equal(byId("najkratsia").a.includes("Ódora"), true);
const shortest = cabinets.filter(c => c.end).map(c => ({ id: c.id, days: (Date.parse(c.end) - Date.parse(c.start)) / 864e5 })).sort((a, b) => a.days - b.days)[0];
assert.equal(shortest.id, "odor", "Najkratšia vláda podľa dát je Ódorova");
const seats = Object.fromEntries(election2023.subjects.map(s => [s.short, s]));
const check2023 = (id, value) => { const q = questions.find(x => x.id === id); if (q) assert(q.a.includes(String(value)), `${id}: ${q.a} ≠ ${value}`); };
check2023("mandaty-smer-2023", seats.SMER.seats); check2023("mandaty-ps-2023", seats.PS.seats); check2023("mandaty-hlas-2023", seats.HLAS.seats);
check2023("koalicia-2023-mandaty", seats.SMER.seats + seats.HLAS.seats + seats.SNS.seats);
check2023("strany-2023", election2023.subjects.filter(s => s.seats > 0).length);
check2023("pct-smer-2023", String(seats.SMER.pct).replace(".", ","));
check2023("najmenej-2023", Math.min(...election2023.subjects.filter(s => s.seats > 0).map(s => s.seats)));
assert(byId("republika-2023").q.includes(String(seats.REPUBLIKA.pct).replace(".", ",")), "Republika 2023: percentá v otázke");
const years = publicFinance.years, value = (y, k) => years.find(r => r.year === y)[k];
const top = (k, from, dir = 1) => years.filter(r => r.year >= from && r[k] !== undefined && r[k] !== null).sort((a, b) => dir * (b[k] - a[k]))[0];
// Odpoveď je rok (čísla v možnostiach by prezradili odpoveď), hodnota z dát webu musí byť vo vysvetlení.
const checkFin = (id, row, k) => { const q = questions.find(x => x.id === id); if (q) assert(q.a === String(row.year) && q.explain.includes(String(row[k]).replace(".", ",").replace("-", "")), `${id}: ${q.a} / ${q.explain} vs ${row.year} ${row[k]}`); };
checkFin("nezamestnanost-max", top("unemployment", 1995), "unemployment");
checkFin("dlh-min", top("debtPct", 1999, -1), "debtPct");
checkFin("deficit-2000", top("deficitPct", 1995, -1), "deficitPct");
checkFin("inflacia-2022", top("inflation", 2001), "inflation");
assert(byId("dlh-2025").explain.includes(String(value(2025, "debtPct")).replace(".", ",")), "Dlh 2025 podľa Eurostatu v repe");
assert(byId("nezamestnanost-2025").explain.includes(String(value(2025, "unemployment")).replace(".", ",")), "Nezamestnanosť 2025 podľa Eurostatu v repe");
const tax = readFileSync(new URL("../lib/tax-receipt.ts", import.meta.url), "utf8");
assert(tax.includes("915") && byId("mzda-min-2026").a === "915 €", "Minimálna mzda 2026 ako v kalkulačke daní");
assert(tax.includes("9,4 %") && byId("odvody-zamestnanec").a === "9,4 %", "Sociálne poistenie zamestnanca 2026 ako v kalkulačke daní");

// ── Kolo ───────────────────────────────────────────────────────────────────────────────────────────
const round = buildRound(42);
assert.equal(round.length, ROUND_SIZE); assert.equal(new Set(round.map(x => x.id)).size, ROUND_SIZE, "30 rôznych otázok");
const shown = round.map(x => present(x));
for (const l of levels) assert.equal(shown.filter(q => q.level === l).length, PLAN[l], `Plán úrovne ${l}`);
assert.deepEqual(shown.map(q => q.level), [...shown.map(q => q.level)].sort((a, b) => a - b), "Od ľahkých po expertné");
for (const l of levels) for (const t of Object.keys(topicNames)) assert(shown.filter(q => q.level === l && q.topic === t).length <= 3, "Najviac 3 otázky jednej témy na úroveň");
for (const q of shown) assert.equal(q.options[q.correct], byId(q.id).a, "Správna možnosť po zamiešaní");
assert.deepEqual(buildRound(42), round, "Rovnaké zrnko = rovnaké kolo");
assert.deepEqual(buildRound(daySeed("2026-10-02")), buildRound(daySeed("2026-10-02")), "Kvíz dňa je rovnaký pre všetkých");
assert.notDeepEqual(buildRound(daySeed("2026-10-02")).map(x => x.id), buildRound(daySeed("2026-10-03")).map(x => x.id), "Iný deň = iné otázky");
const avoid = round.map(x => x.id), fresh = buildRound(7, avoid);
assert(fresh.filter(x => avoid.includes(x.id)).length <= 2, "Voľný kvíz uprednostní nevidené otázky");
const swapped = swapItem(round, 5, 42);
assert(swapped && !avoid.includes(swapped.id) && present(swapped).level === shown[5].level, "Výmena: iná otázka tej istej úrovne");
const hidden = halve(shown[3], 42);
assert.equal(hidden.length, 2); assert(!hidden.includes(shown[3].correct), "50 : 50 skryje dve nesprávne");
const perfect = scoreRound(shown, shown.map(q => q.correct)), none = scoreRound(shown, shown.map(() => null));
assert.equal(perfect.points, MAX_POINTS); assert.equal(perfect.correct, 30); assert.equal(none.points, 0); assert.equal(perfect.marks, "1".repeat(30));
assert.equal(titleFor(MAX_POINTS).name, "Prezident"); assert.equal(titleFor(0).name, "Volič"); assert.equal(titleFor(Math.round(MAX_POINTS * 0.5)).name, "Poslanec");
const text = shareText("daily", "2026-10-02", 48, MAX_POINTS, "1".repeat(20) + "0".repeat(10), "https://example.sk");
assert(text.startsWith("Tridsiatka · kvíz dňa 2. 10. 2026: 48/") && text.split("\n").length === 5 && !text.includes(shown[0].q), "Zdieľanie bez otázok");
// ── Uloženie (prísne čítanie) ──────────────────────────────────────────────────────────────────────
const progress = { v: 1, mode: "daily", day: "2026-10-02", seed: 42, items: round, answers: [1, null], hidden: { 1: hidden }, jokers: { half: true, swap: false } };
assert.deepEqual(parseProgress(JSON.stringify(progress)), progress);
for (const bad of [null, "{", "[]", JSON.stringify({ ...progress, items: round.slice(1) }), JSON.stringify({ ...progress, items: [{ id: "neexistuje", order: [0, 1, 2, 3] }, ...round.slice(1)] }),
  JSON.stringify({ ...progress, items: [{ ...round[0], order: [0, 0, 1, 2] }, ...round.slice(1)] }), JSON.stringify({ ...progress, answers: [7] }), JSON.stringify({ ...progress, mode: "x" })])
  assert.equal(parseProgress(bad), null, `Poškodené kolo sa zahodí: ${String(bad).slice(0, 50)}`);
const results = [{ mode: "daily", day: "2026-10-01", points: 40, max: MAX_POINTS, correct: 20, marks: "1".repeat(20) + "0".repeat(10), at: "2026-10-01T10:00:00.000Z" },
  { mode: "daily", day: "2026-10-02", points: 55, max: MAX_POINTS, correct: 25, marks: "1".repeat(25) + "0".repeat(5), at: "2026-10-02T10:00:00.000Z" },
  { mode: "free", day: "2026-10-02", points: 30, max: MAX_POINTS, correct: 15, marks: "1".repeat(15) + "0".repeat(15), at: "2026-10-02T11:00:00.000Z" }];
assert.deepEqual(parseResults(JSON.stringify([...results, { mode: "daily", day: "x", points: 1 }])), results, "Neplatné výsledky sa vynechajú");
assert.deepEqual(ranking(results).map(r => r.points), [55, 40, 30]);
assert.equal(streak(results, "2026-10-02"), 2); assert.equal(streak(results, "2026-10-03"), 2); assert.equal(streak(results, "2026-10-05"), 0);
assert.deepEqual(parseSeen(JSON.stringify(["vznik-sr", "nic", 5])), ["vznik-sr"]);
console.log(`PASS quiz: ${questions.length} otázok (${levels.map(l => questions.filter(q => q.level === l).length).join("/")}), krížová kontrola s vládami, voľbami 2023 a Eurostatom; kolo ${ROUND_SIZE} (${levels.map(l => PLAN[l]).join("+")}), max ${MAX_POINTS} bodov, žolíky, zdieľanie, uloženie`);
