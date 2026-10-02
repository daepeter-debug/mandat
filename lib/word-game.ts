/*
  Koalícia slov: denná slovná hra Mandátu. Zo 12 písmen poskladaj najviac 4 slová („strany koalície“);
  každé písmeno sa dá použiť iba raz, takže písmená rozdeľuješ medzi slová. Každé slovo získa mandáty:
  (súčet hodnôt písmen) × (dĺžka − 1), dlhšie slová sa oplatia. Cieľ: 76 mandátov (väčšina),
  90 (ústavná väčšina), tretia hviezda za koalíciu bez opozície (všetkých 12 písmen v slovách).
  Na rozdiel od Slovosledu Denníka N sa písmená nemenia ani neopakujú: hra je o tom, ako ich rozdeliť.
  Platné slová: slovník sk-spell so všetkými tvarmi (bez vlastných mien, skratiek, citosloviec a vulgarizmov).
  Zadania generuje vopred scripts/build-word-game.mjs do public/data/koalicia: na každý deň 12 písmen, všetky slová,
  ktoré sa z nich dajú zložiť, najlepšia koalícia a najlepšia koalícia zo všetkých 12 písmen. Telefón tak sťahuje
  len jeden malý súbor na deň. Tu je čistá logika: hodnoty písmen, mandáty, kontrola slova, hodnotenie, uloženie.
*/
export const POOL_SIZE = 12, MAX_WORDS = 4, MIN_LENGTH = 3, MAJORITY = 76, CONSTITUTIONAL = 90, SEATS = 150;
/** Hodnota písmena 1–5 podľa toho, aké je v slovenčine vzácne (podobne ako pri slovných hrách s písmenami). */
export const values: Record<string, number> = Object.fromEntries([
  ...[..."aoeinstrv"].map(c => [c, 1]), ...[..."lkdmpuj"].map(c => [c, 2]), ...[..."zyhbcáí"].map(c => [c, 3]),
  ...[..."čšžýúéťľ"].map(c => [c, 4]), ...[..."ňďôäóĺŕfg"].map(c => [c, 5]),
]);
// Približná početnosť písmen v slovenských textoch (váhy pri losovaní písmen dňa).
const weights: Record<string, number> = { a: 90, o: 90, e: 75, i: 57, n: 54, v: 42, s: 48, t: 44, r: 41, l: 36, k: 34, d: 32, m: 30, p: 26, u: 25, j: 20, z: 19, y: 16, h: 16, b: 16, c: 10, á: 20, í: 14, é: 8, č: 10, š: 8, ž: 8, ý: 10, ú: 7, ť: 4, ľ: 4, ň: 2, ď: 2, ô: 2, f: 3, g: 3 };
const vowels = new Set([..."aáäeéiíoóôuúyý"]);
export type Dictionary = { has: (word: string) => boolean; words: readonly string[] };
export const normalize = (word: string) => word.normalize("NFC").toLocaleLowerCase("sk").trim();
export const isLetter = (c: string) => c in values;

// Deterministický generátor (mulberry32) a mixér, ako v ostatných hrách.
export const mix = (n: number) => { let h = (n | 0) ^ 0x9e3779b9; h = Math.imul(h ^ (h >>> 16), 0x85ebca6b); h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35); return (h ^ (h >>> 16)) >>> 0; };
export function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export const daySeed = (day: string) => mix(Number(day.replaceAll("-", "")) ^ 0x51071);

const count = (letters: Iterable<string>) => { const m = new Map<string, number>(); for (const c of letters) m.set(c, (m.get(c) ?? 0) + 1); return m; };
/** Mandáty za slovo: (súčet hodnôt) × (dĺžka − 1). Kalibrované na slovníku: väčšina z dvoch stredne dlhých slov. */
export const seatsFor = (word: string) => { const w = [...normalize(word)]; return w.length < MIN_LENGTH ? 0 : w.reduce((s, c) => s + (values[c] ?? 0), 0) * (w.length - 1); };
/** Dá sa slovo poskladať z dostupných písmen (každé písmeno raz)? */
export function canForm(word: string, letters: Iterable<string>) {
  const have = count(letters);
  for (const c of normalize(word)) { const n = have.get(c) ?? 0; if (!n) return false; have.set(c, n - 1); }
  return true;
}
/** Písmená, ktoré ešte nie sú v slovách koalície. */
export function remaining(pool: readonly string[], words: readonly string[]) {
  const left = [...pool];
  for (const w of words) for (const c of normalize(w)) { const i = left.indexOf(c); if (i >= 0) left.splice(i, 1); }
  return left;
}
export type Check = { ok: true; seats: number } | { ok: false; reason: string };
/** Môže slovo vstúpiť do koalície? Dôvod pri odmietnutí je veta pre hráča. */
export function checkWord(word: string, pool: readonly string[], words: readonly string[], dictionary: Dictionary): Check {
  const w = normalize(word);
  if ([...w].length < MIN_LENGTH) return { ok: false, reason: `Slovo musí mať aspoň ${MIN_LENGTH} písmená.` };
  if (words.length >= MAX_WORDS) return { ok: false, reason: `Koalícia môže mať najviac ${MAX_WORDS} strany. Vráť niektoré slovo.` };
  if (words.map(normalize).includes(w)) return { ok: false, reason: "Toto slovo už v koalícii je." };
  if (!canForm(w, remaining(pool, words))) return { ok: false, reason: "Na toto slovo nemáš voľné písmená." };
  if (!dictionary.has(w)) return { ok: false, reason: "Toto slovo v slovníku nemáme. Platia všetky tvary bežných slov aj názvy štátov, nie mená ľudí, mestá a skratky." };
  return { ok: true, seats: seatsFor(w) };
}
export function evaluate(pool: readonly string[], words: readonly string[]) {
  const seats = Math.min(SEATS, words.reduce((s, w) => s + seatsFor(w), 0)), left = remaining(pool, words).length;
  const stars = seats >= MAJORITY ? 1 + (seats >= CONSTITUTIONAL ? 1 : 0) + (left === 0 ? 1 : 0) : 0;
  return { seats, left, stars, majority: seats >= MAJORITY, constitutional: seats >= CONSTITUTIONAL, united: left === 0 && words.length > 0 };
}

/** Slová zo slovníka, ktoré sa dajú poskladať z daných písmen (zoradené od najviac mandátov). */
export function candidates(pool: readonly string[], dictionary: Dictionary) {
  const have = count(pool), size = pool.length;
  return dictionary.words.filter(w => { const n = [...w].length; if (n < MIN_LENGTH || n > size) return false; const need = count(w); for (const [c, k] of need) if ((have.get(c) ?? 0) < k) return false; return true; })
    .map(w => ({ word: w, seats: seatsFor(w) })).sort((a, b) => b.seats - a.seats || a.word.localeCompare(b.word, "sk"));
}
/** Najlepšia možná koalícia (najviac mandátov, najviac 4 disjunktné slová): prehľadávanie s orezaním. */
export function bestCoalition(pool: readonly string[], dictionary: Dictionary, limit = 400) {
  const list = candidates(pool, dictionary).slice(0, limit);
  let best = { seats: 0, words: [] as string[] };
  const go = (start: number, left: string[], chosen: string[], seats: number) => {
    if (seats > best.seats) best = { seats, words: chosen.slice() };
    if (chosen.length === MAX_WORDS) return;
    for (let i = start; i < list.length; i++) {
      const { word, seats: s } = list[i];
      // Horná hranica: zvyšné slová nemôžu dať viac ako (počet volných slotov) × toto slovo.
      if (seats + s * (MAX_WORDS - chosen.length) <= best.seats) return;
      if (!canForm(word, left)) continue;
      chosen.push(word); go(i + 1, remaining(left, [word]), chosen, seats + s); chosen.pop();
    }
  };
  go(0, [...pool], [], 0);
  return { seats: Math.min(SEATS, best.seats), words: best.words, candidates: list.length };
}
/** Losovanie 12 písmen: 4 – 6 samohlások, najviac 2 rovnaké, najviac 3 vzácne (hodnota 4 – 5). */
export function drawPool(r: () => number) {
  const letters = Object.keys(weights), total = letters.reduce((s, c) => s + weights[c], 0);
  for (;;) {
    const pool: string[] = [];
    while (pool.length < POOL_SIZE) {
      let x = r() * total, pick = letters[0];
      for (const c of letters) { x -= weights[c]; if (x <= 0) { pick = c; break; } }
      if (pool.filter(c => c === pick).length < 2) pool.push(pick);
    }
    const v = pool.filter(c => vowels.has(c)).length, rare = pool.filter(c => values[c] >= 4).length;
    if (v >= 4 && v <= 6 && rare <= 3) return pool;
  }
}
export const skDate = (day: string) => `${Number(day.slice(8, 10))}. ${Number(day.slice(5, 7))}. ${day.slice(0, 4)}`;
export const mandates = (n: number) => `${n} ${n === 1 ? "mandát" : n >= 2 && n <= 4 ? "mandáty" : "mandátov"}`;
/** Farby strán koalície (v hre aj vo štvorčekoch pri zdieľaní): zelená, modrá, oranžová, fialová. */
export const PARTY_SQUARES = ["🟩", "🟦", "🟧", "🟪"];
/** Výsledok na zdieľanie: mandáty, hviezdy a dĺžky slov (bez samotných slov, nič neprezradí). */
export function shareText(heading: string, words: readonly string[], seats: number, stars: number, url: string) {
  return [`${heading}: ${mandates(seats)} ${"★".repeat(stars)}${"☆".repeat(3 - stars)}`, words.map((w, i) => PARTY_SQUARES[i % PARTY_SQUARES.length].repeat([...w].length)).join(" "), url].join("\n");
}
export const addDays = (day: string, n: number) => new Date(Date.UTC(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10) + n)).toISOString().slice(0, 10);
/** Denné výsledky hráča (deň → mandáty a hviezdy), len v tomto zariadení. */
export type History = Record<string, { seats: number; stars: number }>;
export function parseHistory(text: string | null): History {
  let v: unknown;
  try { v = JSON.parse(text ?? "{}"); } catch { return {}; }
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  const out: History = {};
  for (const [day, r] of Object.entries(v as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).slice(-400)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !r || typeof r !== "object") continue;
    const { seats, stars } = r as Record<string, unknown>;
    if (Number.isInteger(seats) && Number.isInteger(stars) && (seats as number) >= 0 && (seats as number) <= SEATS && (stars as number) >= 0 && (stars as number) <= 3) out[day] = { seats: seats as number, stars: stars as number };
  }
  return out;
}
/** Séria: koľko dní po sebe (dnes alebo včera ako posledný) mal hráč aspoň väčšinu. */
export function streak(history: History, today: string) {
  let day = (history[today]?.stars ?? 0) >= 1 ? today : addDays(today, -1), n = 0;
  while ((history[day]?.stars ?? 0) >= 1) { n++; day = addDays(day, -1); }
  return n;
}

/** Dnešný dátum v slovenskom čase (RRRR-MM-DD), rovnaký pre všetkých hráčov. */
export function slovakDay(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bratislava", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? "";
  return [get("year"), get("month"), get("day")].join("-");
}
export const FREE_COUNT = 200;
export type Coalition = { seats: number; words: string[] };
export type Puzzle = { key: string; letters: string[]; dictionary: Dictionary; best: Coalition; cover: Coalition };
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
/** Zadanie zo súboru (nedôveryhodný vstup): 12 platných písmen, slová z nich, koalície zo slov zadania. */
export function parsePuzzle(raw: unknown, key: string): Puzzle | null {
  if (!isObj(raw) || raw.v !== 1 || typeof raw.letters !== "string" || typeof raw.words !== "string") return null;
  const letters = [...raw.letters];
  if (letters.length !== POOL_SIZE || !letters.every(isLetter)) return null;
  const list = raw.words.split(" ").filter(Boolean), set = new Set(list);
  if (!list.length || list.length > 20000 || !list.every(w => [...w].length >= MIN_LENGTH && [...w].every(isLetter) && canForm(w, letters))) return null;
  const coalition = (c: unknown, full: boolean): Coalition | null => {
    if (!isObj(c) || !Array.isArray(c.words) || c.words.length > MAX_WORDS || !c.words.every(w => typeof w === "string" && set.has(w))) return null;
    const words = c.words as string[], left = remaining(letters, words);
    if (left.length !== POOL_SIZE - words.join("").length || (full && left.length) || c.seats !== evaluate(letters, words).seats) return null;
    return { seats: c.seats as number, words };
  };
  const best = coalition(raw.best, false), cover = coalition(raw.cover, true);
  return best && cover ? { key, letters, dictionary: { has: w => set.has(w), words: list }, best, cover } : null;
}
/**
  Hra jedného zadania. Ciele sa zbierajú počas hry: väčšina a ústavná väčšina podľa najsilnejšej koalície (best),
  tretia hviezda za koalíciu zo všetkých 12 písmen s väčšinou (united), hoci aj s menej mandátmi ako best.
  Po odhalení riešenia sa výsledok už nezapisuje.
*/
export type Save = { words: string[]; best: Coalition; united: Coalition | null; revealed: boolean };
export const emptySave = (): Save => ({ words: [], best: { seats: 0, words: [] }, united: null, revealed: false });
export const goalsOf = (s: Pick<Save, "best" | "united">) => ({ majority: s.best.seats >= MAJORITY, constitutional: s.best.seats >= CONSTITUTIONAL, united: !!s.united });
export const starsOf = (s: Pick<Save, "best" | "united">) => Object.values(goalsOf(s)).filter(Boolean).length;
/** Nová koalícia v hre: zapíše sa najsilnejšia koalícia a najsilnejšia koalícia zo všetkých 12 písmen (pred odhalením). */
export function record(save: Save, pool: readonly string[], words: string[]): Save {
  if (save.revealed) return { ...save, words };
  const ev = evaluate(pool, words);
  const best = ev.seats > save.best.seats ? { seats: ev.seats, words } : save.best;
  const united = ev.united && ev.majority && (!save.united || ev.seats > save.united.seats) ? { seats: ev.seats, words } : save.united;
  return { words, best, united, revealed: false };
}
/** Uložená hra: slová musia byť platné v tomto zadaní a navzájom sa nesmú biť o písmená; mandáty sa prepočítajú. */
export function parseSave(text: string | null, puzzle: Puzzle): Save | null {
  let v: unknown;
  try { v = JSON.parse(text ?? "null"); } catch { return null; }
  if (!isObj(v) || !Array.isArray(v.words) || !isObj(v.best) || !Array.isArray(v.best.words) || typeof v.revealed !== "boolean") return null;
  if (v.united !== null && !(isObj(v.united) && Array.isArray(v.united.words))) return null;
  const valid = (words: unknown[]) => words.length <= MAX_WORDS && words.every(w => typeof w === "string" && puzzle.dictionary.has(w))
    && remaining(puzzle.letters, words as string[]).length === POOL_SIZE - (words as string[]).join("").length;
  const united = isObj(v.united) ? v.united.words as unknown[] : null;
  if (!valid(v.words) || !valid(v.best.words) || (united && !valid(united))) return null;
  const best = evaluate(puzzle.letters, v.best.words as string[]), all = united && evaluate(puzzle.letters, united as string[]);
  if (all && !(all.united && all.majority)) return null;
  return {
    words: v.words as string[], best: { seats: best.seats, words: v.best.words as string[] },
    united: all ? { seats: all.seats, words: united as string[] } : null, revealed: v.revealed,
  };
}
