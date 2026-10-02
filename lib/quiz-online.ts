import type { Level } from "./quiz-bank.ts";
import {
  CODE_RE, MAX_POINTS, PLAN, ROUND_SIZE, TOKEN_RE, buildRound, daySeed, levels, present, scoreRound, swapItem,
  type Answer, type Mode, type RoundItem,
} from "./quiz.ts";

/*
  Tridsiatka online: spoločný rebríček kvízu dňa, porovnanie s ostatnými a výzvy pre kamarátov.
  Tu sú čisté funkcie, ktoré používa prehliadač aj server (lib/quiz-store.ts v Durable Object worker/quiz-board.ts):
  overenie kola a výpočet bodov (server bodom od klienta neverí), kontrola prezývky, poradie a percentil z rozloženia
  bodov a texty o úspešnosti otázok. O hráčovi sa neukladá nič: kolo má nový náhodný kód z prehliadača, server pozná
  body, ktoré otázky boli správne a prezývku, len ak ju hráč sám zadá. IP adresa slúži iba na krátky limit pokusov v pamäti.
*/
export const API = "/api/kviz";
export const NICK_MAX = 20;
export const BOARD_SIZE = 10;
export const CHALLENGE_LIMIT = 100;
export type Stat = [shown: number, correct: number];
export type BoardEntry = { nick: string; points: number; rank: number; me?: boolean };
export type Standing = { players: number; rank: number; better: number | null };
export type Board = { day: string; players: number; hist: number[]; top: BoardEntry[]; me: (Standing & { points: number; nick: string | null }) | null; items: Record<string, Stat> };
export type ChallengePlayer = { nick: string; points: number; correct: number; marks: string; host: boolean; me?: boolean };
export type Challenge = { code: string; mode: "daily" | "free"; day: string; max: number; items: RoundItem[]; players: ChallengePlayer[] };
export type Verified = { points: number; correct: number; max: number; marks: string };

const random = (alphabet: string, n: number) => Array.from(crypto.getRandomValues(new Uint8Array(n)), b => alphabet[b % alphabet.length]).join("");
export const newToken = () => random("abcdefghijklmnopqrstuvwxyz234567", 16);
export const newCode = () => random("23456789ABCDEFGHJKMNPQRSTUVWXYZ", 7);
export const isToken = (v: unknown): v is string => typeof v === "string" && TOKEN_RE.test(v);
export const isCode = (v: unknown): v is string => typeof v === "string" && CODE_RE.test(v);
export const isDay = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));
export const addDays = (day: string, n: number) => new Date(Date.UTC(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10) + n)).toISOString().slice(0, 10);

// ── Overenie kola ──────────────────────────────────────────────────────────────────────────────────
const LEVEL_ORDER: Level[] = levels.flatMap(l => Array<Level>(PLAN[l]).fill(l));
const isItem = (x: unknown): x is RoundItem => !!x && typeof x === "object" && typeof (x as RoundItem).id === "string" && Array.isArray((x as RoundItem).order) && present(x as RoundItem) !== null;
const same = (a: RoundItem | null, b: RoundItem) => !!a && a.id === b.id && a.order.every((v, i) => v === b.order[i]);
/** Čisté kópie otázok kola (bez cudzích polí z požiadavky), alebo null. */
export function cleanItems(items: unknown): RoundItem[] | null {
  if (!Array.isArray(items) || items.length !== ROUND_SIZE || !items.every(isItem) || new Set(items.map(x => x.id)).size !== ROUND_SIZE) return null;
  return items.map(x => ({ id: x.id, order: x.order.slice() }));
}
/**
  Overí kolo a spočíta body. Kvíz dňa musí byť presne kolo daného dňa (najviac jedna otázka vymenená žolíkom),
  výzva presne otázky výzvy, voľné kolo 30 rôznych otázok v poradí úrovní (8 + 9 + 9 + 4).
*/
export function verifyRound(mode: Mode, day: string, rawItems: unknown, rawAnswers: unknown, expected?: RoundItem[]): (Verified & { items: RoundItem[]; answers: Answer[] }) | { error: string } {
  const items = cleanItems(rawItems);
  if (!items) return { error: "Kolo nemá platných 30 otázok." };
  if (!Array.isArray(rawAnswers) || rawAnswers.length !== ROUND_SIZE || !rawAnswers.every(a => a === null || (Number.isInteger(a) && a >= 0 && a <= 3))) return { error: "Kolo nemá platných 30 odpovedí." };
  const round = items.map(x => present(x)!);
  if (round.some((q, i) => q.level !== LEVEL_ORDER[i])) return { error: "Otázky nesedia s úrovňami kola." };
  if (mode === "daily") {
    const seed = daySeed(day), base = buildRound(seed), diff = base.flatMap((x, i) => same(x, items[i]) ? [] : [i]);
    if (diff.length > 1 || (diff.length === 1 && !same(swapItem(base, diff[0], seed), items[diff[0]]))) return { error: "Toto nie je kvíz dňa." };
  }
  if (mode === "challenge" && !(expected && expected.length === ROUND_SIZE && expected.every((x, i) => same(x, items[i])))) return { error: "Otázky nesedia s výzvou." };
  const answers = rawAnswers as Answer[], s = scoreRound(round, answers);
  return { points: s.points, correct: s.correct, max: s.max, marks: s.marks, items, answers: answers.slice() };
}

// ── Prezývka ───────────────────────────────────────────────────────────────────────────────────────
/*
  Prezývku vidia ostatní, preto bez vulgarizmov a urážok, bez mien a skratiek strán a politikov (web je neutrálny, rebríček
  nie je miesto na kampaň) a bez vydávania sa za správcu webu. Porovnáva sa zjednotený tvar: malé písmená bez diakritiky,
  číslice čítané ako písmená (0 → o, 1 → i, 3 → e, 4 → a, 5 → s, 7 → t), bez znakov medzi písmenami a bez zdvojených písmen,
  takže prejde ani „K.u.r.v.a“, „kuuurva“ či „F1co“. Krátke skratky sa porovnávajú len ako celé slová (inak by zablokovali
  aj nevinné prezývky). Zoznam nie je dokonalý; nevhodnú prezývku vie správca zmazať (GAMES.md).
*/
const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const LEET: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", "$": "s", "€": "e" };
const squash = (s: string) => fold(s).replace(/[0-9@$€]/g, c => LEET[c] ?? c).replace(/[^a-z]/g, "").replace(/(.)\1+/g, "$1");
const BAD_PARTS = [
  // vulgarizmy a urážky (SK, CZ, HU, EN)
  "kurv", "kokot", "picus", "picov", "picin", "jeb", "srac", "hovn", "chuj", "debil", "idiot", "kreten", "zmrd", "mrd", "buzer", "buzik",
  "cigan", "negr", "nigg", "fasist", "nacist", "nazi", "hitler", "heil", "prdel", "sukat", "kunda", "kundy", "kundo", "kundu", "pizd",
  "posran", "zasran", "onani", "sperm", "penis", "vagin", "porn", "sex", "dement", "retard", "geci", "fasz", "picsa", "bazdm", "kocsog",
  "fuck", "shit", "cunt", "dick", "pussy", "whore", "bitch", "fagot", "blyat",
  // strany a politici
  "smer", "hlasak", "progresiv", "olano", "kotleb", "fico", "matovic", "pelegrini", "simeck", "kotlar", "uhrik", "grohling", "majersk",
  "kalinak", "taraba", "susko", "sutaj", "estok", "huliak", "blanar", "migal", "korcok", "krajniak", "mazurek", "remisov", "meciar",
  "dzurind", "radicov", "kiska", "caputov", "gasparovic", "schuster", "sulik", "beblav", "truban", "harabin", "slota", "bugar", "blaha",
  "sakova", "simkovic", "kamenick", "lengvarsk", "drucker",
].map(squash);
const BAD_WORDS = new Set([
  "pica", "picu", "pici", "pice", "pico", "kkt", "kkk", "zid", "zidi", "zidak", "fag", "anal", "hh", "1488",
  "ps", "sas", "kdh", "sns", "lsns", "sd", "hlas", "rep", "republika", "ku", "pnp", "danko", "heger", "gubik", "karas", "kollar", "rasi", "gaspar", "ziga",
  "admin", "administrator", "moderator", "mandat", "spravca", "redakcia", "official", "oficialny", "support",
]);
// Slová prezývky: len písmená (aj po rozdelení „VolteKDH“ → volte, kdh), len číslice a slová s číslicami čítanými ako písmená („P5“ → ps).
const tokens = (nick: string) => {
  const s = fold(nick), camel = fold(nick.replace(/(\p{Ll})(\p{Lu})/gu, "$1 $2"));
  const leet = s.split(/[^a-z0-9@$€]+/).map(w => w.replace(/[0-9@$€]/g, c => LEET[c] ?? c));
  return [...s.split(/[^a-z]+/), ...camel.split(/[^a-z]+/), ...s.split(/[^0-9]+/), ...leet].filter(Boolean);
};
export function nickBlocked(nick: string) {
  const whole = squash(nick);
  return BAD_PARTS.some(p => whole.includes(p)) || tokens(nick).some(w => BAD_WORDS.has(w) || BAD_WORDS.has(w.replace(/(.)\1+/g, "$1")));
}
/** Upravená prezývka na zobrazenie, alebo dôvod, prečo ju nemôžeme prijať. */
export function cleanNick(raw: unknown): { nick: string } | { error: string } {
  if (typeof raw !== "string") return { error: "Zadaj prezývku." };
  const nick = raw.normalize("NFC").replace(/\s+/g, " ").trim();
  if (nick.length < 2 || nick.length > NICK_MAX) return { error: `Prezývka má mať 2 až ${NICK_MAX} znakov.` };
  if (!/^[\p{L}\p{N} ._-]+$/u.test(nick)) return { error: "V prezývke môžu byť písmená, číslice, medzera, bodka, pomlčka a podčiarkovník." };
  if ((nick.match(/\p{L}/gu) ?? []).length < 2) return { error: "Prezývka potrebuje aspoň dve písmená." };
  if (nickBlocked(nick)) return { error: "Túto prezývku nemôžeme zobraziť. Vyber inú, bez vulgarizmov a bez mien politikov či strán." };
  return { nick };
}

// ── Poradie a texty ────────────────────────────────────────────────────────────────────────────────
/** Miesto (rovnaké body = rovnaké miesto) a podiel ostatných hráčov s menej bodmi; `hist[body]` = počet hráčov. */
export function standing(hist: number[], points: number): Standing {
  const players = hist.reduce((a, b) => a + b, 0), above = hist.slice(points + 1).reduce((a, b) => a + b, 0), below = hist.slice(0, points).reduce((a, b) => a + b, 0);
  return { players, rank: above + 1, better: players > 1 ? Math.floor(100 * below / (players - 1)) : null };
}
/** Rozloženie bodov po päťbodových pásmach (0–4, 5–9, … 70–73). */
export const BAND = 5;
export const bands = (hist: number[]) => Array.from({ length: Math.ceil((MAX_POINTS + 1) / BAND) }, (_, i) => hist.slice(i * BAND, i * BAND + BAND).reduce((a, b) => a + b, 0));
/** Predložka pred číslom podľa výslovnosti: zo 7 (siedmich), zo 412 (štyristo…), z 25, zo 150 (sto…), z 1 000. */
export function zo(n: number): "z" | "zo" {
  if (n >= 1000) return Math.floor(n / 1000) === 1 ? "z" : zo(Math.floor(n / 1000));
  if (n >= 100) return Math.floor(n / 100) === 1 ? "zo" : zo(Math.floor(n / 100));
  if (n >= 20) return zo(Math.floor(n / 10));
  return [4, 6, 7, 14, 16, 17].includes(n) ? "zo" : "z";
}
export const fmt = (n: number) => n.toLocaleString("sk-SK");
export const plural = (n: number, one: string, few: string, many: string) => n === 1 ? one : n >= 2 && n <= 4 ? few : many;
/** Koľko hráčov otázku trafilo; pri menej ako 5 odpovediach nič, pri menej ako 20 počty namiesto percent. */
export function hitText(stat: Stat | undefined, daily: boolean): string | null {
  if (!stat || stat[0] < 5) return null;
  const [shown, ok] = stat, when = daily ? "Dnes ju" : "Zatiaľ ju";
  if (ok === 0) return `${when} netrafil nikto ${zo(shown)} ${fmt(shown)} hráčov.`;
  if (shown < 20) return `${when} ${plural(ok, "trafil", "trafili", "trafilo")} ${ok} ${plural(ok, "hráč", "hráči", "hráčov")} ${zo(shown)} ${shown}.`;
  const pct = Math.min(ok < shown ? 99 : 100, Math.max(1, Math.round(100 * ok / shown)));
  return `${when} trafilo ${pct} % hráčov.`;
}
/** „Dnes už hralo 412 hráčov.“ (sloveso sa zhoduje s podstatným menom hráč). */
export const playedText = (n: number) => `Dnes už ${plural(n, "hral", "hrali", "hralo")} ${fmt(n)} ${plural(n, "hráč", "hráči", "hráčov")}.`;
export const pointsWord = (n: number) => plural(n, "bod", "body", "bodov");

// ── Uloženie v zariadení ───────────────────────────────────────────────────────────────────────────
/**
  Odohrané kolo s kódom, otázkami a odpoveďami (server ho dostane, aj keď bol hráč pri dohraní offline; podľa kódu
  sa potom zapíše do rebríčka či výzvy). Výzvy, ktoré hráč vytvoril alebo do ktorých sa zapísal: kód výzvy a kód kola.
*/
export type OnlinePlay = { token: string; mode: Mode; day: string; items: RoundItem[]; answers: Answer[]; vyzva: string | null; sent: boolean };
export type ChallengeLink = { code: string; token: string; host: boolean; day: string };
export type Online = { nick: string | null; plays: OnlinePlay[]; links: ChallengeLink[] };
export const emptyOnline = (): Online => ({ nick: null, plays: [], links: [] });
const isPlay = (p: unknown): p is OnlinePlay => {
  if (!p || typeof p !== "object") return false;
  const x = p as Record<string, unknown>;
  return isToken(x.token) && (x.mode === "daily" || x.mode === "free" || x.mode === "challenge") && isDay(x.day) && cleanItems(x.items) !== null
    && Array.isArray(x.answers) && x.answers.length === ROUND_SIZE && x.answers.every(a => a === null || (Number.isInteger(a) && (a as number) >= 0 && (a as number) <= 3))
    && (x.vyzva === null || isCode(x.vyzva)) && typeof x.sent === "boolean";
};
const isLink = (l: unknown): l is ChallengeLink => !!l && typeof l === "object" && isCode((l as ChallengeLink).code) && isToken((l as ChallengeLink).token)
  && typeof (l as ChallengeLink).host === "boolean" && isDay((l as ChallengeLink).day);
export function parseOnline(text: string | null): Online {
  let v: unknown;
  try { v = JSON.parse(text ?? "null"); } catch { return emptyOnline(); }
  if (!v || typeof v !== "object") return emptyOnline();
  const x = v as Record<string, unknown>, nick = typeof x.nick === "string" && "nick" in cleanNick(x.nick) ? x.nick : null;
  return {
    nick,
    plays: Array.isArray(x.plays) ? x.plays.filter(isPlay).slice(-8) : [],
    links: Array.isArray(x.links) ? x.links.filter(isLink).slice(-12) : [],
  };
}
/** Kód kola, s ktorým sa zariadenie hlási k výzve (vytvorilo ju, zapísalo sa, alebo ju odohralo). */
export const tokenFor = (online: Online, code: string) => online.links.find(l => l.code === code)?.token ?? online.plays.find(p => p.vyzva === code)?.token ?? null;
