"use client";

import { useId, useState, type ReactNode } from "react";
import { Copy, Share2, Swords, Trophy, Users } from "lucide-react";
import { MAX_POINTS } from "@/lib/quiz";
import {
  API, BAND, BOARD_SIZE, NICK_MAX, bands, cleanNick, fmt, plural, pointsWord, zo,
  type Board, type Challenge, type ChallengePlayer, type OnlinePlay, type Stat,
} from "@/lib/quiz-online";

/*
  Tridsiatka online v prehliadači: volania /api/kviz (app/api/kviz/route.ts) a časti obrazovky pre porovnanie
  s ostatnými (miesto, rozloženie bodov, rebríček dňa), prezývku a výzvy. Tok hry je v components/quiz-game.tsx.
*/
export type Fail = { error: string; status: number };
export type PlayReply = { points: number; correct: number; max: number; marks: string; board?: Board; items?: Record<string, Stat>; challenge?: Challenge };
export const failed = (r: unknown): r is Fail => !!r && typeof r === "object" && "error" in r;
async function call<T>(query: string, body?: unknown): Promise<T | Fail> {
  try {
    const res = await fetch(`${API}${query}`, {
      method: body === undefined ? "GET" : "POST",
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: typeof AbortSignal.timeout === "function" ? AbortSignal.timeout(12_000) : undefined,
    });
    const data = await res.json().catch(() => null) as (T & { error?: string }) | null;
    if (!res.ok || !data) return { error: data?.error ?? "Spojenie so serverom zlyhalo. Skús to o chvíľu.", status: res.status };
    return data;
  } catch {
    return { error: "Bez pripojenia sa porovnanie nenačíta. Skús to neskôr.", status: 0 };
  }
}
const round = (p: OnlinePlay) => ({ mode: p.mode, day: p.day, token: p.token, items: p.items, answers: p.answers, vyzva: p.vyzva });
export const api = {
  board: (day: string, token?: string | null) => call<{ board: Board }>(`?den=${day}${token ? `&hra=${token}` : ""}`),
  items: (ids: string[]) => call<{ items: Record<string, Stat> }>(`?otazky=${ids.join(",")}`),
  challenge: (code: string, token?: string | null) => call<{ challenge: Challenge }>(`?vyzva=${code}${token ? `&hra=${token}` : ""}`),
  play: (p: OnlinePlay) => call<PlayReply>("", { a: "hra", ...round(p) }),
  nick: (token: string, day: string, nick: string | null) => call<{ board: Board }>("", { a: "prezyvka", token, day, nick }),
  host: (p: OnlinePlay, nick: string) => call<{ code: string; challenge: Challenge }>("", { a: "vyzva", nick, ...round(p) }),
  join: (code: string, token: string, nick: string) => call<{ challenge: Challenge }>("", { a: "pridat", code, token, nick }),
};
/** Prehliadač s „Do Not Track“ alebo Global Privacy Control: výsledok sa pošle až po kliknutí. */
export const askFirst = () => {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return nav.doNotTrack === "1" || nav.globalPrivacyControl === true;
};
export const challengeUrl = (code: string) => `${window.location.origin}/?v=game&g=quiz&vyzva=${code}`;
/** Odkaz cez systémové zdieľanie, inak do schránky; vráti správu pre hráča. */
export async function shareLink(title: string, text: string, url: string): Promise<string> {
  try { if (navigator.share) { await navigator.share({ title, text, url }); return "Odkaz je odoslaný."; } } catch (e) { if (e instanceof Error && e.name === "AbortError") return ""; }
  try { await navigator.clipboard.writeText(`${text} ${url}`); return "Odkaz je skopírovaný, vlož ho kamarátovi do správy."; } catch { return "Skopíruj si odkaz nižšie."; }
}

/** Miesto v kvíze dňa a podiel hráčov s menej bodmi. */
export function Standing({ board }: { board: Board }) {
  const me = board.me;
  if (!me) return null;
  if (board.players < 2) return <p className="quiz-note">Dnes zatiaľ nikto iný nehral. Porovnanie sa ukáže, keď pribudnú ďalší hráči.</p>;
  return <div className="quiz-standing">
    <p className="quiz-standing-rank"><b>{me.rank}.</b> miesto {zo(board.players)} {fmt(board.players)}</p>
    <p>{me.rank === 1 ? "Zatiaľ najlepší výsledok dňa." : me.better ? <>Viac bodov ako <b>{me.better} %</b> ostatných hráčov.</> : "Ťažký deň, zajtra je nový kvíz."}</p>
  </div>;
}
/** Rozloženie bodov dňa po pásmach, vlastné pásmo zvýraznené. */
export function Histogram({ hist, points }: { hist: number[]; points: number | null }) {
  const b = bands(hist), top = Math.max(1, ...b), mine = points === null ? -1 : Math.floor(points / BAND);
  const label = b.map((n, i) => `${i * BAND}–${Math.min(MAX_POINTS, i * BAND + BAND - 1)}: ${n}`).join(", ");
  return <figure className="quiz-hist">
    <div className="quiz-hist-bars" role="img" aria-label={`Rozloženie bodov dnes (body: počet hráčov): ${label}`}>
      {b.map((n, i) => <span key={i} data-me={i === mine || undefined} style={{ height: `${n ? Math.max(8, n / top * 100) : 3}%` }}/>)}
    </div>
    <figcaption><span>0</span><span>Rozloženie bodov dnes{mine >= 0 ? " · tvoje pásmo žltou" : ""}</span><span>{MAX_POINTS}</span></figcaption>
  </figure>;
}
/** Rebríček dňa: hráči s prezývkou (miesto počíta všetkých), pod ním vlastný riadok, ak nie je medzi prvými. */
export function BoardList({ board }: { board: Board }) {
  if (!board.top.length && !board.me) return <p className="quiz-note">Zatiaľ sa do rebríčka nikto nezapísal.</p>;
  const me = board.me && !board.top.some(e => e.me) ? { nick: board.me.nick ?? "Ty, bez prezývky", points: board.me.points, rank: board.me.rank, me: true, own: !board.me.nick } : null;
  const last = board.top.at(-1), apart = !!me && board.top.length >= BOARD_SIZE && !!last && me.points < last.points;
  const rows = me && !apart ? [...board.top, me].sort((a, b) => b.points - a.points || (a.me ? 1 : 0) - (b.me ? 1 : 0)) : board.top;
  const row = (e: { nick: string; points: number; rank: number; me?: boolean; own?: boolean }, i: number) => <li key={`${i}-${e.nick}`} data-me={e.me || undefined}>
    <span className="quiz-rank">{e.rank}.</span><b>{e.nick}{e.me && !e.own ? " (ty)" : ""}</b><span>{e.points} b.</span>
  </li>;
  return <ol className="quiz-board">
    {rows.map(row)}
    {me && apart && <><li className="quiz-board-gap" aria-hidden="true">…</li>{row(me, rows.length + 1)}</>}
  </ol>;
}
/** Prezývka: kontrola v prehliadači (rovnaká ako na serveri), chybu zo servera ukáže pod poľom. */
export function NickForm({ initial, label, button, busy, error, note, onSubmit }: { initial: string | null; label: string; button: string; busy: boolean; error: string | null; note?: ReactNode; onSubmit: (nick: string) => void }) {
  const id = useId(), [value, setValue] = useState(initial ?? ""), [local, setLocal] = useState<string | null>(null);
  const message = local ?? error;
  return <form className="quiz-nick" onSubmit={e => {
    e.preventDefault();
    const clean = cleanNick(value);
    if ("error" in clean) { setLocal(clean.error); return; }
    setLocal(null); setValue(clean.nick); onSubmit(clean.nick);
  }}>
    <label htmlFor={id}>{label}</label>
    <div className="quiz-nick-row">
      <input id={id} value={value} onChange={e => { setValue(e.target.value); setLocal(null); }} maxLength={NICK_MAX} autoComplete="nickname" autoCapitalize="words" spellCheck={false} enterKeyHint="send" placeholder="Tvoja prezývka" aria-invalid={message ? true : undefined} aria-describedby={message ? `${id}-e` : undefined}/>
      <button type="submit" className="quiz-primary" disabled={busy}>{busy ? "Ukladám…" : button}</button>
    </div>
    {message ? <p className="quiz-error" id={`${id}-e`} role="alert">{message}</p> : note && <p className="quiz-note">{note}</p>}
  </form>;
}
/** Kvíz dňa: miesto, rozloženie bodov, rebríček a prezývka (zápis, zmena, odstránenie). */
export function DailyBoard({ board, points, nick, onNick, busy, error, title = "Porovnanie s ostatnými" }: { board: Board; points: number | null; nick: string | null; onNick: (nick: string | null) => void; busy: boolean; error: string | null; title?: string }) {
  const own = board.me?.nick ?? null;
  return <section className="quiz-card quiz-online" aria-label="Kvíz dňa: porovnanie a rebríček">
    <p className="quiz-kicker"><Users size={14} aria-hidden="true"/> {title}</p>
    {board.me ? <Standing board={board}/> : board.players > 0 && <p className="quiz-note">{fmt(board.players)} {plural(board.players, "hráč", "hráči", "hráčov")} v dnešnom kvíze.</p>}
    {board.players > 1 && <Histogram hist={board.hist} points={points}/>}
    <h3 className="quiz-online-title"><Trophy size={16} aria-hidden="true"/> Rebríček dňa</h3>
    <BoardList board={board}/>
    {board.me && (own
      ? <p className="quiz-note">V rebríčku si ako <b>{own}</b>. <button type="button" className="quiz-link" disabled={busy} onClick={() => onNick(null)}>Odstrániť ma z rebríčka</button></p>
      : <NickForm key={nick ?? ""} initial={nick} label="Zapíš sa do rebríčka" button="Zapísať" busy={busy} error={error} onSubmit={onNick}
          note="Prezývku uvidia ostatní hráči. Bez vulgarizmov a bez mien politikov či strán; kedykoľvek ju odstrániš."/>)}
    {board.top.length > 0 && <p className="quiz-note">Miesto počíta všetkých hráčov dňa, v zozname sú tí, ktorí sa zapísali.</p>}
  </section>;
}

// ── Výzvy ──────────────────────────────────────────────────────────────────────────────────────────
const rankOf = (players: ChallengePlayer[], p: ChallengePlayer) => 1 + players.filter(x => x.points > p.points).length;
/** Výsledky výzvy: všetci hráči podľa bodov, hostiteľ označený. */
export function ChallengeList({ players }: { players: ChallengePlayer[] }) {
  return <ol className="quiz-board">{players.map((p, i) => <li key={`${i}-${p.nick}`} data-me={p.me || undefined}>
    <span className="quiz-rank">{rankOf(players, p)}.</span><b>{p.nick}{p.me ? " (ty)" : ""}{p.host && <small> · vyzýva</small>}</b><span>{p.points} b.</span>
  </li>)}</ol>;
}
type Side = { nick: string; points: number; marks: string };
function MarksRow({ side, me }: { side: Side; me?: boolean }) {
  return <div className="quiz-duel-row" data-me={me || undefined}>
    <span>{me ? "Ty" : side.nick}</span>
    <span className="quiz-duel-cells" role="img" aria-label={`${me ? "Ty" : side.nick}: správne ${[...side.marks].filter(m => m === "1").length} z 30`}>{[...side.marks].map((m, i) => <i key={i} data-ok={m === "1"}/>)}</span>
  </div>;
}
/** Súboj: tvoj výsledok vedľa súpera (hostiteľa výzvy alebo najlepšieho z ostatných), pod ním celý zoznam. */
export function Duel({ challenge, mine, children }: { challenge: Challenge; mine: Side | null; children?: ReactNode }) {
  const listed = challenge.players.find(p => p.me), me: Side | null = listed ?? mine;
  const others = challenge.players.filter(p => !p.me), rival = others.find(p => p.host) ?? others[0] ?? null;
  const diff = me && rival ? me.points - rival.points : 0;
  return <section className="quiz-card quiz-duel" aria-label="Výzva">
    <p className="quiz-kicker"><Swords size={14} aria-hidden="true"/> {rival?.host ? `Vyzýva ťa ${rival.nick}` : "Tvoja výzva"}</p>
    {me && rival ? <>
      <div className="quiz-versus">
        <div data-me><span>Ty</span><b>{me.points}</b></div>
        <span className="quiz-versus-sep" aria-hidden="true">:</span>
        <div><span>{rival.nick}</span><b>{rival.points}</b></div>
      </div>
      <p className="quiz-duel-verdict">{diff > 0 ? `Vyhrávaš o ${diff} ${pointsWord(diff)}.` : diff < 0 ? `${rival.nick} vyhráva o ${-diff} ${pointsWord(-diff)}.` : "Remíza, rovnako bodov."}</p>
      <div className="quiz-duel-marks"><MarksRow side={me} me/><MarksRow side={rival}/></div>
    </> : <p className="quiz-note">{others.length ? "Odohraj výzvu a uvidíš svoj výsledok vedľa ostatných." : "Zatiaľ ju nikto neodohral. Pošli odkaz kamarátom, výsledky sa tu objavia."}</p>}
    {challenge.players.length > 2 && <ChallengeList players={challenge.players}/>}
    {children}
  </section>;
}
/** Odkaz na výzvu: zdieľanie a pole na ručné skopírovanie. */
export function ShareChallenge({ code, points, max, own = true }: { code: string; points: number; max: number; own?: boolean }) {
  const [message, setMessage] = useState(""), url = challengeUrl(code);
  const text = own ? `Vyzývam ťa v Tridsiatke: mám ${points} z ${max} bodov. Dáš viac? Rovnakých 30 otázok:` : "Zahraj si tú istú Tridsiatku ako ja a porovnajme sa:";
  return <div className="quiz-share">
    <button type="button" className="quiz-primary" onClick={() => void shareLink("Tridsiatka · výzva", text, url).then(setMessage)}><Share2 size={17} aria-hidden="true"/> Poslať odkaz kamarátovi</button>
    <label className="quiz-share-link"><span className="sr-only">Odkaz na výzvu</span><Copy size={14} aria-hidden="true"/><input readOnly value={url} onFocus={e => e.currentTarget.select()}/></label>
    {message && <p className="quiz-note" role="status">{message}</p>}
  </div>;
}
