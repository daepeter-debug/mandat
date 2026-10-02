import { questions, type Level, type Question, type Topic } from "./quiz-bank.ts";

/*
  Tridsiatka, politický kvíz Mandátu. Kolo má 30 otázok od ľahkých po expertné (8 + 9 + 9 + 4), náhodne vybraných
  z banky (lib/quiz-bank.ts); z jednej témy najviac 3 otázky na úroveň, možnosti v náhodnom poradí.
  Kvíz dňa je pre všetkých rovnaký (zrnko zo slovenského dátumu), voľný kvíz uprednostní otázky, ktoré hráč
  v poslednom čase nevidel. Dva žolíky: 50 : 50 a výmena otázky (každý raz za kolo). Bez časového limitu.
  Bez servera: rozohrané kolo, výsledky a osobné poradie sú v tomto zariadení (localStorage, prísne čítané).
*/
export const PLAN: Record<Level, number> = { 1: 8, 2: 9, 3: 9, 4: 4 };
export const ROUND_SIZE = 30;
export const levels: Level[] = [1, 2, 3, 4];
export const levelPoints: Record<Level, number> = { 1: 1, 2: 2, 3: 3, 4: 5 };
export const levelNames: Record<Level, string> = { 1: "ľahká", 2: "stredná", 3: "ťažká", 4: "expert" };
export const MAX_POINTS = levels.reduce((sum, l) => sum + PLAN[l] * levelPoints[l], 0);
const TOPIC_CAP = 3;

// Deterministický generátor (mulberry32) a mixér, ako v ostatných hrách.
export const mix = (n: number) => { let h = (n | 0) ^ 0x9e3779b9; h = Math.imul(h ^ (h >>> 16), 0x85ebca6b); h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35); return (h ^ (h >>> 16)) >>> 0; };
export function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
/** Dnešný dátum v slovenskom čase (RRRR-MM-DD), rovnaký pre všetkých hráčov kvízu dňa. */
export function slovakDay(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bratislava", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}
export const daySeed = (day: string) => mix(Number(day.replaceAll("-", "")) ^ 0x51ced);
function shuffle<T>(list: T[], r: () => number) { const a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const byId = new Map(questions.map(q => [q.id, q]));

export type RoundItem = { id: string; order: number[] };
export type RoundQuestion = { id: string; level: Level; topic: Topic; q: string; options: string[]; correct: number; explain: string; source: string; order: number[] };
/** Otázka v kole: možnosti v poradí `order` (indexy do [správna, zlá1, zlá2, zlá3]). */
export function present(item: RoundItem, bank: Map<string, Question> = byId): RoundQuestion | null {
  const q = bank.get(item.id);
  if (!q || item.order.length !== 4 || new Set(item.order).size !== 4 || item.order.some(i => !Number.isInteger(i) || i < 0 || i > 3)) return null;
  const all = [q.a, ...q.wrong];
  return { id: q.id, level: q.level, topic: q.topic, q: q.q, options: item.order.map(i => all[i]), correct: item.order.indexOf(0), explain: q.explain, source: q.source, order: item.order };
}
const item = (q: Question, r: () => number): RoundItem => ({ id: q.id, order: shuffle([0, 1, 2, 3], r) });

/** Nové kolo: 30 otázok podľa plánu úrovní, pestré témy, najprv otázky mimo `avoid` (nedávno videné). */
export function buildRound(seed: number, avoid: string[] = [], bank: Question[] = questions): RoundItem[] {
  const r = rng(seed), avoided = new Set(avoid), out: RoundItem[] = [];
  for (const level of levels) {
    const pool = bank.filter(q => q.level === level);
    const ordered = [...shuffle(pool.filter(q => !avoided.has(q.id)), r), ...shuffle(pool.filter(q => avoided.has(q.id)), r)];
    const picked: Question[] = [], perTopic = new Map<Topic, number>();
    for (const q of ordered) {
      if (picked.length === PLAN[level]) break;
      const n = perTopic.get(q.topic) ?? 0;
      if (n < TOPIC_CAP) { picked.push(q); perTopic.set(q.topic, n + 1); }
    }
    for (const q of ordered) { if (picked.length === PLAN[level]) break; if (!picked.includes(q)) picked.push(q); }
    out.push(...picked.map(q => item(q, r)));
  }
  return out;
}
/** Žolík „výmena“: iná otázka tej istej úrovne, ktorá v kole ešte nie je. */
export function swapItem(round: RoundItem[], index: number, seed: number, bank: Question[] = questions): RoundItem | null {
  const used = new Set(round.map(x => x.id)), current = byId.get(round[index]?.id ?? ""), r = rng(mix(seed ^ (index + 1) * 7919));
  if (!current) return null;
  const pool = shuffle(bank.filter(q => q.level === current.level && !used.has(q.id)), r);
  return pool.length ? item(pool[0], r) : null;
}
/** Žolík 50 : 50: indexy dvoch nesprávnych možností, ktoré sa skryjú (deterministicky podľa kola). */
export function halve(q: RoundQuestion, seed: number): number[] {
  const r = rng(mix(seed ^ 0xfa11 ^ q.id.length * 131));
  return shuffle(q.options.map((_, i) => i).filter(i => i !== q.correct), r).slice(0, 2).sort((a, b) => a - b);
}

export type Answer = number | null;
export const titles = [
  { min: 0, name: "Volič", text: "Začiatok je za tebou. Každé kolo je iné, skús ďalšie." },
  { min: 0.25, name: "Starosta", text: "Základy máš. Ťažšie otázky ešte potrápia." },
  { min: 0.45, name: "Poslanec", text: "Slušný prehľad o slovenskej politike." },
  { min: 0.65, name: "Minister", text: "Výborne, poznáš aj detaily." },
  { min: 0.8, name: "Premiér", text: "Veľmi silný výkon, na takéto kolo treba prehľad." },
  { min: 0.93, name: "Prezident", text: "Takmer bezchybné. Klobúk dole." },
];
export const titleFor = (points: number, max = MAX_POINTS) => [...titles].reverse().find(t => points / Math.max(1, max) >= t.min)!;
/** Body: ľahká 1, stredná 2, ťažká 3, expert 5. Nezodpovedaná otázka = 0. */
export function scoreRound(round: RoundQuestion[], answers: Answer[]) {
  const byLevel = Object.fromEntries(levels.map(l => [l, { correct: 0, total: 0 }])) as Record<Level, { correct: number; total: number }>;
  let points = 0, correct = 0, max = 0;
  round.forEach((q, i) => {
    byLevel[q.level].total++; max += levelPoints[q.level];
    if (answers[i] === q.correct) { correct++; points += levelPoints[q.level]; byLevel[q.level].correct++; }
  });
  return { points, correct, max, byLevel, title: titleFor(points, max), marks: round.map((q, i) => answers[i] === q.correct ? "1" : "0").join("") };
}
export const skDate = (day: string) => `${Number(day.slice(8, 10))}. ${Number(day.slice(5, 7))}. ${day.slice(0, 4)}`;
/** Výsledok na zdieľanie: body, titul a 30 štvorčekov po desiatich (bez otázok, nič neprezradí). */
export function shareText(mode: "daily" | "free", day: string, points: number, max: number, marks: string, url: string) {
  const rows = [0, 10, 20].map(i => [...marks.slice(i, i + 10)].map(m => m === "1" ? "🟩" : "🟥").join(""));
  return [`Tridsiatka${mode === "daily" ? ` · kvíz dňa ${skDate(day)}` : ""}: ${points}/${max} bodov · ${titleFor(points, max).name}`, ...rows, url].join("\n");
}

// ── Uloženie v zariadení (nedôveryhodný vstup, preto prísne čítanie) ─────────────────────────────
export type Mode = "daily" | "free";
export type Progress = { v: 1; mode: Mode; day: string; seed: number; items: RoundItem[]; answers: Answer[]; hidden: Record<number, number[]>; jokers: { half: boolean; swap: boolean } };
export type Result = { mode: Mode; day: string; points: number; max: number; correct: number; marks: string; at: string };
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const isDay = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
const isInt = (v: unknown, max: number) => Number.isInteger(v) && (v as number) >= 0 && (v as number) <= max;
const json = (text: string | null) => { try { return JSON.parse(text ?? "null") as unknown; } catch { return null; } };
export function parseProgress(text: string | null): Progress | null {
  const v = json(text);
  if (!isObj(v) || v.v !== 1 || (v.mode !== "daily" && v.mode !== "free") || !isDay(v.day) || !isInt(v.seed, 4294967295)) return null;
  if (!Array.isArray(v.items) || v.items.length !== ROUND_SIZE || !Array.isArray(v.answers) || v.answers.length > ROUND_SIZE || !isObj(v.hidden) || !isObj(v.jokers)) return null;
  const items = v.items as RoundItem[];
  if (!items.every(x => isObj(x) && typeof x.id === "string" && Array.isArray(x.order) && present(x) !== null) || new Set(items.map(x => x.id)).size !== ROUND_SIZE) return null;
  if (!v.answers.every(a => a === null || isInt(a, 3))) return null;
  if (!Object.entries(v.hidden).every(([k, h]) => isInt(Number(k), ROUND_SIZE - 1) && Array.isArray(h) && h.length === 2 && h.every(i => isInt(i, 3)))) return null;
  if (typeof v.jokers.half !== "boolean" || typeof v.jokers.swap !== "boolean") return null;
  return v as Progress;
}
const isResult = (r: unknown): r is Result => isObj(r) && (r.mode === "daily" || r.mode === "free") && isDay(r.day) && isInt(r.points, 999) && isInt(r.max, 999)
  && (r.points as number) <= (r.max as number) && isInt(r.correct, ROUND_SIZE) && typeof r.marks === "string" && /^[01]{30}$/.test(r.marks) && typeof r.at === "string" && r.at.length <= 40;
export function parseResults(text: string | null): Result[] {
  const v = json(text);
  return Array.isArray(v) ? v.filter(isResult).slice(-60) : [];
}
export function parseSeen(text: string | null): string[] {
  const v = json(text);
  return Array.isArray(v) ? v.filter((id): id is string => typeof id === "string" && byId.has(id)).slice(-150) : [];
}
/** Osobné poradie: najlepšie výsledky (body, potom novšie), prvých `n`. */
export const ranking = (results: Result[], n = 10) => results.slice().sort((a, b) => b.points - a.points || b.at.localeCompare(a.at)).slice(0, n);
/** Séria dní s kvízom dňa (končiaca dnes alebo včera). */
export function streak(results: Result[], today: string) {
  const days = new Set(results.filter(r => r.mode === "daily").map(r => r.day));
  const back = (d: string, n: number) => new Date(Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10) - n)).toISOString().slice(0, 10);
  let start = days.has(today) ? today : back(today, 1), count = 0;
  while (days.has(start)) { count++; start = back(start, 1); }
  return count;
}
export const keys = { progress: "mandat:quiz:v1:progress", results: "mandat:quiz:v1:results", seen: "mandat:quiz:v1:seen" };
