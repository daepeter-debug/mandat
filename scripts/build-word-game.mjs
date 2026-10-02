// Koalícia slov: vygeneruje zadania (12 písmen + všetky platné slová z nich + najlepšie koalície) do public/data/koalicia.
// Slovník sk-spell (sk_SK.aff + sk_SK.dic, LibreOffice dictionaries) nie je v repe; cesta k nemu je prvý argument.
// Použitie: node --max-old-space-size=6144 scripts/build-word-game.mjs <priečinok-so-slovníkom> [do-dňa=2028-10-01] [voľných=300]
// Každé zadanie má zaručené: všetkých 12 písmen sa dá použiť v najviac 4 slovách s aspoň 76 mandátmi (tretia hviezda),
// najlepšia možná koalícia (presné prehľadávanie všetkých slov) má aspoň 100 mandátov a z písmen sa dá zložiť aspoň 120 slov. Generovanie je deterministické.
import fs from "node:fs";
import path from "node:path";
import { readForms } from "./word-forms.mjs";
import { CONSTITUTIONAL, MAJORITY, MAX_WORDS, POOL_SIZE, SEATS, bestCoalition, canForm, daySeed, drawPool, isLetter, mix, remaining, rng, seatsFor, values } from "../lib/word-game.ts";

const [dictDir, until = "2028-10-01", freeCount = "300"] = process.argv.slice(2);
if (!dictDir) { console.error("Chýba cesta k priečinku so sk_SK.aff a sk_SK.dic."); process.exit(1); }
const OUT = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1")), "..", "public", "data", "koalicia");
const t0 = Date.now(), { forms, stats } = readForms(dictDir);
const usable = [...forms].filter(w => { const n = [...w].length; return n >= 3 && n <= POOL_SIZE && [...w].every(isLetter); });
console.log(`slovník: ${stats.lemmas} hesiel, ${forms.size} tvarov, ${usable.length} použiteľných (3 – ${POOL_SIZE} písmen), ${Date.now() - t0} ms`);
const alphabet = Object.keys(values), index = new Map(alphabet.map((c, i) => [c, i]));
const maskOf = w => { let lo = 0, hi = 0; for (const c of w) { const i = index.get(c); if (i < 31) lo |= 1 << i; else hi |= 1 << (i - 31); } return [lo, hi]; };
const masks = usable.map(maskOf);
function formable(pool) {
  const [plo, phi] = maskOf(pool.join("")), out = [];
  for (let i = 0; i < usable.length; i++) { const [lo, hi] = masks[i]; if ((lo & ~plo) === 0 && (hi & ~phi) === 0 && canForm(usable[i], pool)) out.push(usable[i]); }
  return out.sort((a, b) => a.localeCompare(b, "sk"));
}
/** Najlepšia koalícia zo všetkých 12 písmen (najviac 4 slová) alebo null. */
function bestCover(pool, words) {
  const byLetter = new Map();
  for (const w of words) for (const c of new Set(w)) { if (!byLetter.has(c)) byLetter.set(c, []); byLetter.get(c).push(w); }
  let top = null;
  const go = (left, chosen, seats) => {
    if (!left.length) { if (!top || seats > top.seats) top = { seats, words: chosen.slice() }; return; }
    if (chosen.length === MAX_WORDS) return;
    const c = left.slice().sort((a, b) => (byLetter.get(a)?.length ?? 0) - (byLetter.get(b)?.length ?? 0))[0];   // najvzácnejšie písmeno najprv
    for (const w of byLetter.get(c) ?? []) if (canForm(w, left)) { chosen.push(w); go(remaining(left, [w]), chosen, seats + seatsFor(w)); chosen.pop(); }
  };
  go(pool, [], 0);
  return top && { seats: Math.min(SEATS, top.seats), words: top.words };
}
function puzzle(seed) {
  const r = rng(seed);
  for (let attempt = 0; attempt < 200; attempt++) {
    const pool = drawPool(r).sort((a, b) => a.localeCompare(b, "sk")), words = formable(pool);
    if (words.length < 120) continue;
    const dict = { words, has: w => words.includes(w) }, best = bestCoalition(pool, dict, words.length);   // presne: zo všetkých slov zadania
    if (best.seats < 100) continue;
    const cover = bestCover(pool, words);
    if (!cover || cover.seats < MAJORITY) continue;
    return { letters: pool.join(""), words, best: { seats: best.seats, words: best.words }, cover };
  }
  throw new Error(`Zadanie sa nepodarilo nájsť (zrnko ${seed}).`);
}
const write = (file, data) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify({ v: 1, ...data, words: data.words.join(" ") })); };
const days = [];
for (let d = new Date(Date.UTC(2026, 9, 2)); d.toISOString().slice(0, 10) <= until; d.setUTCDate(d.getUTCDate() + 1)) days.push(d.toISOString().slice(0, 10));
const summary = { best: [], cover: [], words: [] };
const t1 = Date.now();
for (const day of days) { const p = puzzle(daySeed(day)); write(path.join(OUT, `${day}.json`), { day, ...p }); summary.best.push(p.best.seats); summary.cover.push(p.cover.seats); summary.words.push(p.words.length); }
for (let i = 1; i <= Number(freeCount); i++) { const p = puzzle(mix(0x5eed0000 + i)); write(path.join(OUT, "volne", `${i}.json`), { free: i, ...p }); }
// BOM na začiatku: Cloudflare posiela .txt ako text/plain bez znakovej sady a prehliadač by diakritiku pokazil.
fs.writeFileSync(path.join(OUT, "ZDROJ.txt"), "﻿" + [
  "Koalícia slov – zoznamy slov v tomto priečinku",
  "",
  "Slová sú odvodené zo slovenského slovníka projektu sk-spell (verzia 2.4.8, 2024-08-29),",
  "distribuovaného v repozitári LibreOffice dictionaries: https://github.com/LibreOffice/dictionaries/tree/master/sk_SK",
  "Pôvodné dáta sú trojlicencované (GPL 2 / LGPL 2.1 / MPL 1.1); tieto odvodené zoznamy šírime podľa MPL 1.1.",
  "Úpravy: rozbalené tvary slov, vynechané vlastné mená, skratky, citoslovcia a vulgarizmy, rozdelené na zadania hry.",
  "Generátor: scripts/build-word-game.mjs a scripts/word-forms.mjs v repozitári Mandátu.",
  "",
].join("\n"));
const q = (a, p) => a.slice().sort((x, y) => x - y)[Math.floor(p * (a.length - 1))];
console.log(`${days.length} denných + ${freeCount} voľných zadaní za ${Math.round((Date.now() - t1) / 1000)} s → ${OUT}`);
console.log(`najlepšia koalícia p10/p50/p90: ${[0.1, 0.5, 0.9].map(p => q(summary.best, p)).join("/")} · všetkých 12 písmen p10/p50/p90: ${[0.1, 0.5, 0.9].map(p => q(summary.cover, p)).join("/")} · slov p10/p50/p90: ${[0.1, 0.5, 0.9].map(p => q(summary.words, p)).join("/")} · ústavná väčšina ${CONSTITUTIONAL}`);
