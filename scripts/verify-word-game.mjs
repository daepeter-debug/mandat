// Koalícia slov: kontrola logiky (mandáty, kontrola slova, hviezdy, prísne čítanie zadania a uloženia, séria)
// a všetkých vygenerovaných zadaní v public/data/koalicia (denné bez medzier, voľné, tri hviezdy vždy dosiahnuteľné).
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import {
  CONSTITUTIONAL, FREE_COUNT, MAJORITY, MAX_WORDS, POOL_SIZE, SEATS, addDays, bestCoalition, canForm, checkWord, emptySave, evaluate, goalsOf, mandates, parseHistory,
  parsePuzzle, parseSave, record, remaining, seatsFor, shareText, slovakDay, starsOf, streak, values,
} from "../lib/word-game.ts";
import { GEOGRAPHY } from "./word-forms.mjs";

// ── Mandáty a kontrola slova ───────────────────────────────────────────────────────────────────────
assert.equal(Object.keys(values).length, 40, "40 písmen slovenskej abecedy (bez q, w, x a spojeniek dz, dž, ch)");
assert.equal(seatsFor("mandát"), 50, "mandát: (2+1+1+2+3+1) × 5");
assert.equal(seatsFor("MANDÁT"), 50, "Veľké písmená sa normalizujú");
assert.equal(seatsFor("ty"), 0, "Krátke slovo nemá mandáty");
assert.equal(mandates(1), "1 mandát"); assert.equal(mandates(3), "3 mandáty"); assert.equal(mandates(76), "76 mandátov");
const pool = [..."aámndtvoleis"], dict = { words: ["mandát", "voliéš", "les", "volí", "ale", "sto"], has: w => dict.words.includes(w) };
assert(canForm("mandát", pool) && !canForm("mandáty", pool), "Slovo len z dostupných písmen");
assert.deepEqual(remaining(pool, ["mandát"]).sort(), [..."voleis"].sort());
const reason = (w, words = []) => { const c = checkWord(w, pool, words, dict); return c.ok ? "ok" : c.reason; };
assert.match(reason("le"), /aspoň 3/);
assert.match(reason("les", ["mandát", "volí", "sto", "ale"]), /najviac 4/);
assert.match(reason("les", ["les"]), /už v koalícii/);
assert.match(reason("sto", ["mandát"]), /voľné písmená/, "Druhé t už nie je");
assert.match(reason("vole"), /v slovníku nemáme/);
assert.equal(reason("Mandát"), "ok");
const e1 = evaluate(pool, ["mandát"]), e2 = evaluate(pool, ["mandát", "les"]);
assert.equal(e1.seats, 50); assert.equal(e1.stars, 0); assert.equal(e2.seats, 50 + 8, "les: (2+1+1) × 2"); assert.equal(e2.left, 3);

// ── Prísne čítanie zadania a uloženia ──────────────────────────────────────────────────────────────
const dir = new URL("../public/data/koalicia/", import.meta.url);
const sample = JSON.parse(readFileSync(new URL("2026-10-02.json", dir), "utf8"));
const puzzle = parsePuzzle(sample, "day:2026-10-02");
assert(puzzle, "Zadanie dňa sa dá prečítať");
const bad = [
  { ...sample, v: 2 }, { ...sample, letters: sample.letters.slice(1) }, { ...sample, letters: sample.letters.slice(0, 11) + "q" },
  { ...sample, words: sample.words + " zzzzz" }, { ...sample, words: "" },
  { ...sample, best: { ...sample.best, seats: sample.best.seats + 1 } }, { ...sample, best: { ...sample.best, words: [...sample.best.words, "neexistuje"] } },
  { ...sample, cover: { ...sample.cover, words: sample.cover.words.slice(1) } }, null, [], "text",
];
for (const b of bad) assert.equal(parsePuzzle(b, "x"), null, `Poškodené zadanie sa zahodí: ${JSON.stringify(b)?.slice(0, 60)}`);
const [w1, w2] = puzzle.cover.words, good = { words: [w1], best: { seats: 999, words: puzzle.best.words }, united: { seats: 1, words: puzzle.cover.words }, revealed: false };
const saved = parseSave(JSON.stringify(good), puzzle);
assert(saved && saved.best.seats === puzzle.best.seats && saved.united.seats === puzzle.cover.seats && starsOf(saved) === 3, "Uloženie: mandáty sa prepočítajú, nie prevezmú");
assert.equal(starsOf(parseSave(JSON.stringify({ ...good, united: null }), puzzle)), 2, "Bez koalície zo všetkých písmen dve hviezdy");
const notAll = remaining(puzzle.letters, puzzle.best.words).length ? puzzle.best.words : [w1];
for (const b of [null, "{", JSON.stringify({ ...good, words: [w1, w1] }), JSON.stringify({ ...good, words: ["neexistuje"] }), JSON.stringify({ ...good, revealed: "áno" }),
  JSON.stringify({ ...good, best: { words: [w2, w2, w2] } }), JSON.stringify({ ...good, united: { words: notAll } }), JSON.stringify({ ...good, united: undefined })])
  assert.equal(parseSave(b, puzzle), null, `Poškodené uloženie sa zahodí: ${String(b).slice(0, 50)}`);
// Ciele sa zbierajú: najsilnejšia koalícia a koalícia zo všetkých 12 písmen môžu byť rôzne; po odhalení sa nič nezapíše.
let game = record(emptySave(), puzzle.letters, puzzle.cover.words);
assert.deepEqual([game.best.seats, game.united?.seats, starsOf(game)], [puzzle.cover.seats, puzzle.cover.seats, puzzle.cover.seats >= CONSTITUTIONAL ? 3 : 2]);
game = record(game, puzzle.letters, puzzle.best.words);
assert.deepEqual([game.best.seats, game.united?.seats, starsOf(game)], [puzzle.best.seats, puzzle.cover.seats, 3], "Tri hviezdy z dvoch rôznych koalícií");
const revealed = record({ ...emptySave(), revealed: true }, puzzle.letters, puzzle.best.words);
assert.deepEqual([revealed.best.seats, revealed.united, revealed.words], [0, null, puzzle.best.words], "Po odhalení sa výsledok nezapisuje");
assert.deepEqual(goalsOf({ best: { seats: 90, words: [] }, united: null }), { majority: true, constitutional: true, united: false });

// ── Séria, zdieľanie, dátum ────────────────────────────────────────────────────────────────────────
const history = parseHistory(JSON.stringify({ "2026-09-30": { seats: 80, stars: 1 }, "2026-10-01": { seats: 95, stars: 2 }, "2026-10-02": { seats: 40, stars: 0 }, x: { seats: 1, stars: 1 }, "2026-09-29": { seats: 999, stars: 1 } }));
assert.deepEqual(Object.keys(history), ["2026-09-30", "2026-10-01", "2026-10-02"], "Neplatné dni sa vynechajú");
assert.equal(streak(history, "2026-10-02"), 2, "Dnes ešte bez väčšiny: séria do včera");
assert.equal(streak({ ...history, "2026-10-02": { seats: 90, stars: 2 } }, "2026-10-02"), 3);
assert.equal(streak(history, "2026-10-04"), 0);
assert.equal(addDays("2026-12-31", 1), "2027-01-01"); assert.equal(addDays("2027-03-01", -1), "2027-02-28");
assert.equal(slovakDay(new Date("2026-10-02T22:30:00Z")), "2026-10-03", "Polnoc podľa slovenského času");
const text = shareText("Koalícia slov 2. 10. 2026", puzzle.cover.words, puzzle.cover.seats, 3, "https://example.sk");
assert(text.startsWith(`Koalícia slov 2. 10. 2026: ${mandates(puzzle.cover.seats)} ★★★`) && text.split("\n").length === 3, "Zdieľanie: hlavička, štvorčeky, odkaz");
assert.match(text.split("\n")[1], /^[🟩🟦🟧🟪 ]+$/u, "Zdieľanie neprezradí slová, len ich dĺžky");
assert.equal([...text.split("\n")[1].replaceAll(" ", "")].length, POOL_SIZE, "Štvorček za každé písmeno");

// ── Všetky vygenerované zadania ────────────────────────────────────────────────────────────────────
// Názvy štátov a svetadielov platia (malými písmenami), mená ľudí a mestá nie.
const countries = new Set([...GEOGRAPHY].map(g => g.toLocaleLowerCase("sk"))), countryHits = new Set();
assert(countries.has("omán") && countries.has("slovensko") && !countries.has("bratislava"), "Zoznam štátov a svetadielov");
const BLOCKED = /kurv|jeb|kokot|^hovn|sračk|buzerant|cigán|negr(?!am)|židák|^aids|^žid$|^sps$|^prib$|^zav$|^kotv$|^mazaco$|^hahoj$|^hotent$|^príd$|tmme$|^neazorsk|^nemaltsk|^nevaduzsk/;
const days = readdirSync(dir).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).map(f => f.slice(0, 10)).sort();
assert(days.length >= 365, `Aspoň rok denných zadaní (je ${days.length})`);
assert.equal(days[0], "2026-10-02");
days.forEach((d, i) => { if (i) assert.equal(d, addDays(days[i - 1], 1), `Denné zadania bez medzery: ${d}`); });
const files = [...days.map(d => [`${d}.json`, `day:${d}`]), ...Array.from({ length: FREE_COUNT }, (_, i) => [`volne/${i + 1}.json`, `free:${i + 1}`])];
let words = 0, biggest = 0;
const stats = { best: [], cover: [] };
for (const [index, [name, key]] of files.entries()) {
  const url = new URL(name, dir), raw = JSON.parse(readFileSync(url, "utf8")), p = parsePuzzle(raw, key);
  assert(p, `Zadanie ${name} sa dá prečítať`);
  assert(name.startsWith("volne/") ? raw.free === Number(name.slice(6, -5)) : raw.day === name.slice(0, 10), `Zadanie ${name} patrí svojmu dňu`);
  assert(p.dictionary.words.length >= 120 && p.best.seats >= 100 && p.cover.seats >= MAJORITY, `Zadanie ${name}: dosť slov, silná koalícia, tri hviezdy`);
  assert.equal(evaluate(p.letters, p.cover.words).stars, p.cover.seats >= CONSTITUTIONAL ? 3 : 2, `Zadanie ${name}: všetkých 12 písmen dá väčšinu`);
  assert(p.best.words.length <= MAX_WORDS && p.best.seats <= SEATS && p.best.seats >= p.cover.seats, `Zadanie ${name}: najlepšia koalícia`);
  assert.equal(new Set(p.dictionary.words).size, p.dictionary.words.length, `Zadanie ${name}: slová bez opakovania`);
  const blocked = p.dictionary.words.filter(w => BLOCKED.test(w));
  assert.deepEqual(blocked, [], `Zadanie ${name}: bez vulgarizmov a známych chybných tvarov`);
  // Najsilnejšia koalícia je presná: pri každom 20. zadaní ju prepočítame zo všetkých slov.
  if (index % 20 === 0) assert.equal(bestCoalition(p.letters, p.dictionary, p.dictionary.words.length).seats, p.best.seats, `Zadanie ${name}: najsilnejšia koalícia je presná`);
  words += p.dictionary.words.length; biggest = Math.max(biggest, statSync(url).size);
  stats.best.push(p.best.seats); stats.cover.push(p.cover.seats);
  for (const w of p.dictionary.words) if (countries.has(w)) countryHits.add(w);
}
assert(biggest <= 16_000, `Súbor zadania najviac 16 kB (najväčší ${biggest} B)`);
const source = readFileSync(new URL("ZDROJ.txt", dir), "utf8");
assert(source.includes("MPL 1.1") && source.startsWith("﻿"), "Zdroj slovníka a licencia sú pri dátach (s BOM, inak prehliadač pokazí diakritiku)");
const med = a => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
assert(countryHits.size >= 20, `Názvy štátov sú v zadaniach (${countryHits.size})`);
const ustavna = stats.cover.filter(s => s >= CONSTITUTIONAL).length;
console.log(`PASS words: ${days.length} denných (${days[0]} – ${days.at(-1)}) + ${FREE_COUNT} voľných zadaní, ${Math.round(words / files.length)} slov na zadanie, najlepšia koalícia medián ${med(stats.best)}, všetkých 12 písmen medián ${med(stats.cover)} (ústavná väčšina z 12 písmen v ${ustavna} zadaniach), najväčší súbor ${(biggest / 1024).toFixed(1)} kB; mandáty, kontrola slova, hviezdy, uloženie, séria, zdieľanie`);
