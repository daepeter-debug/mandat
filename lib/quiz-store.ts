import { MAX_POINTS, slovakDay, type Mode, type RoundItem } from "./quiz.ts";
import {
  BOARD_SIZE, CHALLENGE_LIMIT, addDays, cleanItems, cleanNick, isCode, isDay, isToken, newCode, nickBlocked, standing, verifyRound,
  type Board, type Challenge, type Stat,
} from "./quiz-online.ts";

/*
  Úložisko Tridsiatky online: SQLite v Durable Object (worker/quiz-board.ts), v testoch node:sqlite.
  Jedna inštancia pre celý web, zápisy idú po jednom, takže počty a poradie sú vždy presné. Tabuľky:
  - plays: odohrané kolá (náhodný kód z prehliadača, deň, druh, body, správne/nesprávne, dobrovoľná prezývka pri kvíze dňa),
  - item_stats: koľkokrát hráči otázku dostali a trafili, po dňoch kvízu dňa a spolu za všetky kolá (deň „*“),
  - challenges a challenge_players: výzvy (otázky výzvy, hráči s prezývkou a výsledkom).
  Žiadne IP adresy, e-maily ani iné údaje o hráčoch. Body vždy počíta server (verifyRound v lib/quiz-online.ts).
  Moderácia: prezývka, ktorá je (aj dodatočne) v zozname zakázaných slov v lib/quiz-online.ts, sa nikde nezobrazí;
  v rebríčku chýba, vo výzve je „Hráč“. Stačí slovo doplniť do zoznamu a nasadiť, v úložisku netreba nič meniť.
*/
const shown = (nick: string | null) => nick !== null && !nickBlocked(nick) ? nick : null;
type Param = string | number | null;
export type Sql = { exec(query: string, ...params: Param[]): { toArray(): Record<string, unknown>[] } };
export type Reply = { status: number; body: unknown };
type ChallengeRow = { code: string; mode: "daily" | "free"; day: string; items: string };
type Accepted = { token: string; mode: Mode; day: string; points: number; correct: number; marks: string; items: RoundItem[]; challenge: ChallengeRow | null };

export const SCHEMA = [
  "CREATE TABLE IF NOT EXISTS plays (token TEXT PRIMARY KEY, day TEXT NOT NULL, mode TEXT NOT NULL, points INTEGER NOT NULL, correct INTEGER NOT NULL, marks TEXT NOT NULL, nick TEXT, challenge TEXT, created_at INTEGER NOT NULL)",
  "CREATE INDEX IF NOT EXISTS plays_day ON plays (day, mode, points)",
  "CREATE TABLE IF NOT EXISTS item_stats (day TEXT NOT NULL, item TEXT NOT NULL, shown INTEGER NOT NULL, correct INTEGER NOT NULL, PRIMARY KEY (day, item))",
  "CREATE TABLE IF NOT EXISTS challenges (code TEXT PRIMARY KEY, mode TEXT NOT NULL, day TEXT NOT NULL, items TEXT NOT NULL, created_at INTEGER NOT NULL)",
  "CREATE TABLE IF NOT EXISTS challenge_players (code TEXT NOT NULL, token TEXT NOT NULL, nick TEXT NOT NULL, points INTEGER NOT NULL, correct INTEGER NOT NULL, marks TEXT NOT NULL, host INTEGER NOT NULL, created_at INTEGER NOT NULL, PRIMARY KEY (code, token))",
  "CREATE INDEX IF NOT EXISTS challenge_players_token ON challenge_players (token, host)",
];
const ok = (body: unknown): Reply => ({ status: 200, body });
const fail = (error: string, status = 400): Reply => ({ status, body: { error } });
const ITEM_RE = /^[a-z0-9-]{1,60}$/;

export class QuizStore {
  private sql: Sql;
  private transaction: <T>(fn: () => T) => T;
  private now: () => number;
  constructor(sql: Sql, transaction: <T>(fn: () => T) => T = fn => fn(), now: () => number = Date.now) {
    this.sql = sql; this.transaction = transaction; this.now = now;
    for (const statement of SCHEMA) sql.exec(statement);
  }
  private rows<T>(query: string, ...params: Param[]) { return this.sql.exec(query, ...params).toArray() as T[]; }

  /** GET: ?den=RRRR-MM-DD (rebríček), ?otazky=id,id (úspešnosť otázok), ?vyzva=KÓD (výzva); &hra=kód označí vlastný riadok. */
  get(params: URLSearchParams): Reply {
    const raw = params.get("hra"), me = isToken(raw) ? raw : "";
    const code = params.get("vyzva");
    if (code !== null) {
      if (!isCode(code)) return fail("Neplatný kód výzvy.");
      const challenge = this.challenge(code, me);
      return challenge ? ok({ challenge }) : fail("Výzva sa nenašla.", 404);
    }
    const ids = params.get("otazky");
    if (ids !== null) return ok({ items: this.totals(ids.split(",").filter(id => ITEM_RE.test(id)).slice(0, 40)) });
    const day = params.get("den") ?? slovakDay(new Date(this.now()));
    return isDay(day) ? ok({ board: this.board(day, me) }) : fail("Neplatný deň.");
  }

  /** POST: a = hra (odohrané kolo), prezyvka (do rebríčka alebo z neho), vyzva (nová výzva), pridat (zápis do výzvy). */
  post(input: Record<string, unknown>): Reply {
    switch (input.a) {
      case "hra": return this.play(input);
      case "prezyvka": return this.setNick(input);
      case "vyzva": return this.host(input);
      case "pridat": return this.join(input);
      default: return fail("Neznáma požiadavka.");
    }
  }

  board(day: string, me = ""): Board {
    const hist = Array<number>(MAX_POINTS + 1).fill(0);
    for (const r of this.rows<{ points: number; n: number }>("SELECT points, COUNT(*) AS n FROM plays WHERE day = ? AND mode = 'daily' GROUP BY points", day))
      if (r.points >= 0 && r.points <= MAX_POINTS) hist[r.points] = r.n;
    const top = this.rows<{ nick: string; points: number; token: string }>(
      "SELECT nick, points, token FROM plays WHERE day = ? AND mode = 'daily' AND nick IS NOT NULL ORDER BY points DESC, created_at LIMIT ?", day, BOARD_SIZE + 20,
    ).filter(r => shown(r.nick)).slice(0, BOARD_SIZE)
      .map(r => ({ nick: r.nick, points: r.points, rank: standing(hist, r.points).rank, ...(me && r.token === me ? { me: true } : {}) }));
    const mine = me ? this.rows<{ points: number; nick: string | null }>("SELECT points, nick FROM plays WHERE token = ? AND day = ? AND mode = 'daily'", me, day)[0] : undefined;
    const items: Record<string, Stat> = {};
    for (const r of this.rows<{ item: string; shown: number; correct: number }>("SELECT item, shown, correct FROM item_stats WHERE day = ?", day)) items[r.item] = [r.shown, r.correct];
    return { day, players: hist.reduce((a, b) => a + b, 0), hist, top, me: mine ? { ...standing(hist, mine.points), points: mine.points, nick: shown(mine.nick) } : null, items };
  }
  totals(ids: string[]): Record<string, Stat> {
    const items: Record<string, Stat> = {};
    if (!ids.length) return items;
    for (const r of this.rows<{ item: string; shown: number; correct: number }>(`SELECT item, shown, correct FROM item_stats WHERE day = '*' AND item IN (${ids.map(() => "?").join(", ")})`, ...ids))
      items[r.item] = [r.shown, r.correct];
    return items;
  }
  challenge(code: string, me = ""): Challenge | null {
    const row = this.challengeRow(code);
    if (!row) return null;
    const players = this.rows<{ nick: string; points: number; correct: number; marks: string; host: number; token: string }>(
      "SELECT nick, points, correct, marks, host, token FROM challenge_players WHERE code = ? ORDER BY points DESC, created_at LIMIT ?", code, CHALLENGE_LIMIT,
    ).map(r => ({ nick: shown(r.nick) ?? "Hráč", points: r.points, correct: r.correct, marks: r.marks, host: r.host === 1, ...(me && r.token === me ? { me: true } : {}) }));
    return { code: row.code, mode: row.mode, day: row.day, max: MAX_POINTS, items: cleanItems(JSON.parse(row.items)) ?? [], players };
  }
  private challengeRow(code: string) {
    return this.rows<ChallengeRow>("SELECT code, mode, day, items FROM challenges WHERE code = ?", code)[0] ?? null;
  }

  /** Overí a zapíše odohrané kolo (opakované odoslanie toho istého kódu nič nezdvojí). */
  private accept(input: Record<string, unknown>): Accepted | Reply {
    const { token, mode, day } = input;
    if (!isToken(token)) return fail("Neplatný kód kola.");
    if (mode !== "daily" && mode !== "free" && mode !== "challenge") return fail("Neplatný druh kola.");
    const today = slovakDay(new Date(this.now()));
    if (!isDay(day) || (day !== today && day !== addDays(today, -1))) return fail("Kolo je staršie ako včerajšie, už sa nezapočíta.", 410);
    let challenge: ChallengeRow | null = null;
    if (input.vyzva !== undefined && input.vyzva !== null) {
      if (!isCode(input.vyzva)) return fail("Neplatný kód výzvy.");
      challenge = this.challengeRow(input.vyzva);
      if (!challenge) return fail("Výzva sa nenašla.", 404);
    }
    if (mode === "challenge" && !challenge) return fail("Chýba výzva, z ktorej sú otázky.");
    const v = verifyRound(mode, day, input.items, input.answers, mode === "challenge" ? cleanItems(JSON.parse(challenge!.items)) ?? [] : undefined);
    if ("error" in v) return fail(v.error);
    // Kvíz dňa patrí k výzve len vtedy, ak je výzva z toho istého kvízu dňa.
    const link = challenge && (mode === "challenge" || (challenge.mode === "daily" && challenge.day === day)) ? challenge.code : null;
    const stored = this.transaction(() => {
      const fresh = this.rows("INSERT INTO plays (token, day, mode, points, correct, marks, challenge, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(token) DO NOTHING RETURNING token",
        token, day, mode, v.points, v.correct, v.marks, link, this.now()).length > 0;
      if (fresh) for (const scope of mode === "daily" ? [day, "*"] : ["*"]) v.items.forEach((x, i) => this.sql.exec(
        "INSERT INTO item_stats (day, item, shown, correct) VALUES (?, ?, 1, ?) ON CONFLICT(day, item) DO UPDATE SET shown = shown + 1, correct = correct + excluded.correct",
        scope, x.id, v.marks[i] === "1" ? 1 : 0));
      return this.rows<{ day: string; mode: string; points: number; correct: number; marks: string }>("SELECT day, mode, points, correct, marks FROM plays WHERE token = ?", token)[0];
    });
    if (stored.day !== day || stored.mode !== mode) return fail("Tento kód kola už patrí inému kolu.", 409);
    return { token, mode, day, points: stored.points, correct: stored.correct, marks: stored.marks, items: v.items, challenge: link ? challenge : null };
  }
  private play(input: Record<string, unknown>): Reply {
    const r = this.accept(input);
    if ("status" in r) return r;
    return ok({
      points: r.points, correct: r.correct, max: MAX_POINTS, marks: r.marks,
      ...(r.mode === "daily" ? { board: this.board(r.day, r.token) } : { items: this.totals(r.items.map(x => x.id)) }),
      ...(r.challenge ? { challenge: this.challenge(r.challenge.code, r.token) } : {}),
    });
  }
  private setNick(input: Record<string, unknown>): Reply {
    const { token, day } = input;
    if (!isToken(token) || !isDay(day)) return fail("Neplatný výsledok.");
    let nick: string | null = null;
    if (input.nick !== null) {
      const clean = cleanNick(input.nick);
      if ("error" in clean) return fail(clean.error, 422);
      nick = clean.nick;
    }
    if (!this.rows("UPDATE plays SET nick = ? WHERE token = ? AND day = ? AND mode = 'daily' RETURNING token", nick, token, day).length) return fail("Výsledok sa nenašiel, skús ho poslať znova.", 404);
    return ok({ board: this.board(day, token) });
  }
  private host(input: Record<string, unknown>): Reply {
    const clean = cleanNick(input.nick);
    if ("error" in clean) return fail(clean.error, 422);
    if (!isToken(input.token)) return fail("Neplatný kód kola.");
    const existing = this.rows<{ code: string }>("SELECT code FROM challenge_players WHERE token = ? AND host = 1", input.token)[0];
    if (existing) {
      this.sql.exec("UPDATE challenge_players SET nick = ? WHERE code = ? AND token = ?", clean.nick, existing.code, input.token);
      return ok({ code: existing.code, challenge: this.challenge(existing.code, input.token) });
    }
    const r = this.accept(input);
    if ("status" in r) return r;
    const code = this.transaction(() => {
      let next = newCode();
      while (this.challengeRow(next)) next = newCode();
      this.sql.exec("INSERT INTO challenges (code, mode, day, items, created_at) VALUES (?, ?, ?, ?, ?)", next, r.mode === "daily" ? "daily" : "free", r.day, JSON.stringify(r.items), this.now());
      this.sql.exec("INSERT INTO challenge_players (code, token, nick, points, correct, marks, host, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)", next, r.token, clean.nick, r.points, r.correct, r.marks, this.now());
      return next;
    });
    return ok({ code, challenge: this.challenge(code, r.token) });
  }
  private join(input: Record<string, unknown>): Reply {
    const { code, token } = input;
    if (!isCode(code) || !isToken(token)) return fail("Neplatná výzva alebo výsledok.");
    const clean = cleanNick(input.nick);
    if ("error" in clean) return fail(clean.error, 422);
    const challenge = this.challengeRow(code);
    if (!challenge) return fail("Výzva sa nenašla.", 404);
    const play = this.rows<{ mode: string; day: string; points: number; correct: number; marks: string; challenge: string | null }>("SELECT mode, day, points, correct, marks, challenge FROM plays WHERE token = ?", token)[0];
    if (!play) return fail("Výsledok sa nenašiel, skús ho poslať znova.", 404);
    if (play.challenge !== code && !(challenge.mode === "daily" && play.mode === "daily" && play.day === challenge.day)) return fail("Toto kolo k výzve nepatrí.", 409);
    const joined = this.rows("SELECT 1 FROM challenge_players WHERE code = ? AND token = ?", code, token).length > 0;
    if (!joined && this.rows<{ n: number }>("SELECT COUNT(*) AS n FROM challenge_players WHERE code = ?", code)[0].n >= CHALLENGE_LIMIT) return fail("Vo výzve je už plno.", 409);
    this.sql.exec("INSERT INTO challenge_players (code, token, nick, points, correct, marks, host, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?) ON CONFLICT(code, token) DO UPDATE SET nick = excluded.nick",
      code, token, clean.nick, play.points, play.correct, play.marks, this.now());
    return ok({ challenge: this.challenge(code, token) });
  }
}
