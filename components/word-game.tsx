"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, Delete, Dices, Eye, Flame, RefreshCw, Share2, Shuffle, Star, X } from "lucide-react";
import { hemicycleSeats } from "@/lib/parliament";
import {
  CONSTITUTIONAL, FREE_COUNT, MAJORITY, MAX_WORDS, POOL_SIZE, SEATS, checkWord, emptySave, evaluate, goalsOf, mandates, normalize, parseHistory, parsePuzzle,
  parseSave, record, seatsFor, shareText, skDate, slovakDay, starsOf, streak, values, type History, type Puzzle, type Save,
} from "@/lib/word-game";
import "@/app/word-game.css";

/*
  Koalícia slov: 12 písmen, najviac 4 slová, každé písmeno raz. Mandáty slova = (súčet hodnôt) × (dĺžka − 1).
  Ciele: väčšina 76, ústavná väčšina 90, koalícia bez opozície (všetkých 12 písmen). Polkruh ukazuje kreslá koalície.
  Logika a overenie: lib/word-game.ts; zadania: public/data/koalicia (scripts/build-word-game.mjs). Grafiku môže doladiť Codex.
*/
const SEAT_POINTS = hemicycleSeats(SEATS);
const COLORS = ["#3b8146", "#33679e", "#c27c14", "#7354a3"];
const EMPTY_SEAT = "#4c6a5c";
const URL_GAME = "https://mandat-preview.mandat.workers.dev/?v=game&g=words";
const storeKey = (k: string) => `mandat:words:v1:${k}`;
const read = (k: string) => { try { return localStorage.getItem(storeKey(k)); } catch { return null; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(storeKey(k), JSON.stringify(v)); } catch { /* bez úložiska hra beží, len sa nič neuloží */ } };
const dayNumber = (day: string) => Math.round(Date.UTC(+day.slice(0, 4), +day.slice(5, 7) - 1, +day.slice(8, 10)) / 864e5);
const upper = (w: string) => w.toLocaleUpperCase("sk");
type Mode = { kind: "daily" } | { kind: "free"; n: number };

/** Voľná hra: posledná nedohraná, inak náhodná, ktorú hráč ešte neotvoril (keď sú všetky otvorené, hocijaká iná). */
function pickFree(current: number | null, fresh: boolean) {
  const last = Number(read("free-current"));
  if (!fresh && Number.isInteger(last) && last >= 1 && last <= FREE_COUNT) return last;
  const start = Math.floor(Math.random() * FREE_COUNT);
  for (let k = 0; k < FREE_COUNT; k++) { const n = 1 + (start + k) % FREE_COUNT; if (n !== current && read(`free:${n}`) === null) return n; }
  const n = 1 + start;
  return n === current ? 1 + (n % FREE_COUNT) : n;
}

export default function WordGame() {
  const [day, setDay] = useState<string | null>(null), [mode, setMode] = useState<Mode>({ kind: "daily" });
  useEffect(() => {
    const refresh = () => setDay(slovakDay());
    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);
  if (!day) return <p className="chart-loading" role="status">Pripravujeme písmená dňa…</p>;
  function free(fresh: boolean) {
    const n = pickFree(mode.kind === "free" ? mode.n : null, fresh);
    write("free-current", n);
    setMode({ kind: "free", n });
    requestAnimationFrame(() => document.querySelector(".words")?.scrollIntoView({ block: "start", behavior: "instant" }));
  }
  return <Loader key={mode.kind === "daily" ? `d:${day}` : `f:${mode.n}`} day={day} mode={mode} onFree={free} onDaily={() => setMode({ kind: "daily" })}/>;
}

function Loader({ day, mode, onFree, onDaily }: { day: string; mode: Mode; onFree: (fresh: boolean) => void; onDaily: () => void }) {
  const [puzzle, setPuzzle] = useState<Puzzle | null | "error">(null);
  useEffect(() => {
    let alive = true;
    const load = async (url: string, key: string) => { try { const r = await fetch(url); return r.ok ? parsePuzzle(await r.json(), key) : null; } catch { return null; } };
    (async () => {
      // Denné zadanie; keby súbor na tento deň chýbal, hra použije voľné zadanie určené dátumom (pre všetkých rovnaké).
      const p = mode.kind === "daily"
        ? await load(`/data/koalicia/${day}.json`, `day:${day}`) ?? await load(`/data/koalicia/volne/${(dayNumber(day) % FREE_COUNT) + 1}.json`, `day:${day}`)
        : await load(`/data/koalicia/volne/${mode.n}.json`, `free:${mode.n}`);
      if (alive) setPuzzle(p ?? "error");
    })();
    return () => { alive = false; };
  }, [day, mode]);
  if (puzzle === null) return <p className="chart-loading" role="status">Pripravujeme písmená…</p>;
  if (puzzle === "error") return <section className="words"><p className="words-message" role="alert">Písmená sa nepodarilo načítať. Skontroluj pripojenie a skús to znova.</p><button className="words-secondary" onClick={() => location.reload()}><RefreshCw size={16} aria-hidden="true"/> Skúsiť znova</button></section>;
  return <Game puzzle={puzzle} day={day} mode={mode} onFree={onFree} onDaily={onDaily}/>;
}

/** Ktoré kachličky patria ktorému slovu koalície (prvá voľná kachlička s daným písmenom). */
function assignTiles(letters: string[], words: string[]) {
  const owner: (number | null)[] = letters.map(() => null);
  words.forEach((w, wi) => { for (const c of normalize(w)) { const i = letters.findIndex((l, li) => l === c && owner[li] === null); if (i >= 0) owner[i] = wi; } });
  return owner;
}

function Game({ puzzle, day, mode, onFree, onDaily }: { puzzle: Puzzle; day: string; mode: Mode; onFree: (fresh: boolean) => void; onDaily: () => void }) {
  const daily = mode.kind === "daily";
  const [save, setSave] = useState<Save>(() => parseSave(read(puzzle.key), puzzle) ?? emptySave());
  const [history, setHistory] = useState<History>(() => parseHistory(read("history")));
  const [order, setOrder] = useState<number[]>(() => puzzle.letters.map((_, i) => i));
  const [current, setCurrent] = useState<number[]>([]), [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null), [copied, setCopied] = useState("");
  const owner = assignTiles(puzzle.letters, save.words), result = evaluate(puzzle.letters, save.words), earned = goalsOf(save), stars = starsOf(save);
  const word = current.map(i => puzzle.letters[i]).join(""), length = current.length, perfect = save.best.seats >= puzzle.best.seats;

  function commit(next: Save) {
    setSave(next); write(puzzle.key, next);
    const seats = next.best.seats, nextStars = starsOf(next), before = history[day];
    if (daily && !next.revealed && (!before || seats > before.seats || nextStars > before.stars)) {
      const h = { ...history, [day]: { seats: Math.max(seats, before?.seats ?? 0), stars: Math.max(nextStars, before?.stars ?? 0) } };
      setHistory(h); write("history", h);
    }
  }
  function withWords(words: string[], note: (next: Save) => { ok: boolean; text: string }) {
    const next = record(save, puzzle.letters, words);
    commit(next);
    setMessage(note(next));
  }
  function tap(i: number) {
    if (owner[i] !== null) return;
    setMessage(null); setCopied("");
    setCurrent(c => c.includes(i) ? c.filter(x => x !== i) : [...c, i]);
  }
  function add() {
    const check = checkWord(word, puzzle.letters, save.words, puzzle.dictionary);
    if (!check.ok) { setMessage({ ok: false, text: check.reason }); return; }
    setCurrent([]);
    withWords([...save.words, normalize(word)], next => {
      // Oslava len pri cieli, ktorý hráč dnes splnil prvý raz.
      const now = goalsOf(next), milestone = now.united && !earned.united ? " Koalícia bez opozície: všetkých 12 písmen!"
        : now.constitutional && !earned.constitutional ? " Ústavná väčšina!" : now.majority && !earned.majority ? " Máš väčšinu!" : "";
      return { ok: true, text: `${upper(word)}: +${mandates(check.seats)}.${milestone}` };
    });
  }
  function drop(index: number) { setCurrent([]); withWords(save.words.filter((_, i) => i !== index), () => ({ ok: true, text: `${upper(save.words[index])} odchádza z koalície, jeho písmená sú znova voľné.` })); }
  function shuffle() {
    setOrder(o => { const next = [...o]; for (let i = next.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [next[i], next[j]] = [next[j], next[i]]; } return next; });
  }
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const target = e.target instanceof HTMLElement ? e.target : null;
      if (e.ctrlKey || e.metaKey || e.altKey || target?.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "Enter") { if (!length || (target?.closest("button, a, summary") && !target.closest(".words-tiles"))) return; e.preventDefault(); add(); return; }
      if (e.key === "Backspace") { if (length) { e.preventDefault(); setCurrent(c => c.slice(0, -1)); } return; }
      if (e.key === "Escape") { setCurrent([]); return; }
      const c = normalize(e.key);
      if ([...c].length !== 1 || !(c in values)) return;
      const i = order.find(li => puzzle.letters[li] === c && owner[li] === null && !current.includes(li));
      if (i !== undefined) { e.preventDefault(); setMessage(null); setCurrent(cur => [...cur, i]); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });
  async function share() {
    const text = shareText(daily ? `Koalícia slov ${skDate(day)}` : `Koalícia slov, voľná hra č. ${mode.n}`, save.best.words, save.best.seats, stars, URL_GAME);
    try { if (navigator.share) { await navigator.share({ title: "Koalícia slov", text }); return; } } catch (e) { if (e instanceof Error && e.name === "AbortError") return; }
    try { await navigator.clipboard.writeText(text); setCopied("Výsledok je skopírovaný, môžeš ho vložiť do správy."); } catch { setCopied(text); }
  }

  let filled = 0;
  const seatColor = SEAT_POINTS.map(() => EMPTY_SEAT);
  save.words.forEach((w, wi) => { const n = Math.min(SEATS - filled, seatsFor(w)); for (let k = 0; k < n; k++) seatColor[filled + k] = COLORS[wi]; filled += n; });
  // Ciele sa zbierajú počas hry (earned); po odhalení riešenia sa rozsvieti aj to, čo spĺňa práve rozložená koalícia.
  const goals = [
    { done: earned.majority || result.majority, label: `Väčšina ${MAJORITY}`, more: `väčšina, aspoň ${MAJORITY} mandátov` },
    { done: earned.constitutional || result.constitutional, label: `Ústavná ${CONSTITUTIONAL}`, more: `ústavná väčšina, aspoň ${CONSTITUTIONAL} mandátov` },
    { done: earned.united || (result.united && result.majority), label: "Všetkých 12", more: "koalícia bez opozície: všetkých 12 písmen v slovách a väčšina, hoci aj v inej koalícii ako tá najsilnejšia" },
  ];
  const days = streak(history, day), status = result.seats === 0 ? `na väčšinu treba ${MAJORITY}` : result.constitutional ? "ústavná väčšina" : result.majority ? "väčšina" : `do väčšiny chýba ${MAJORITY - result.seats}`;
  const free = MAX_WORDS - save.words.length;
  return <section className="words" aria-labelledby="words-title">
    <header className="words-head">
      <p className="words-kicker">{daily ? `Písmená dňa · ${skDate(day)}` : `Voľná hra č. ${mode.n}`}{daily && days > 0 && <span className="words-streak"><Flame size={13} aria-hidden="true"/> {days} {days === 1 ? "deň" : days <= 4 ? "dni" : "dní"} po sebe</span>}</p>
      <h1 id="words-title">Koalícia slov</h1>
      <p>12 písmen, najviac 4 slová, každé písmeno raz. Dlhšie slovo prinesie viac mandátov.</p>
    </header>
    <div className="words-chamber">
      <svg viewBox="-1.08 -1.08 2.16 1.16" aria-hidden="true">{SEAT_POINTS.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="0.027" fill={seatColor[i]} className={i === MAJORITY - 1 ? "words-seat-majority" : undefined}/>)}</svg>
      <div className="words-count" aria-live="polite"><b>{result.seats}</b><span>{status}</span></div>
    </div>
    <ul className="words-goals" aria-label="Ciele">{goals.map(g => <li key={g.label} data-done={g.done} title={g.more}><Star size={14} aria-hidden="true"/><span aria-hidden="true">{g.label}</span><span className="sr-only">{g.more}{g.done ? " – splnené" : ""}</span></li>)}</ul>
    <div className="words-current" aria-live="polite">
      <div className="words-word">{length ? current.map((i, k) => <span key={k}>{upper(puzzle.letters[i])}</span>) : <em>Ťukaj na písmená</em>}</div>
      <p className="words-preview">{length >= 3 ? `${mandates(seatsFor(word))}, ak slovo platí` : length ? "Slovo musí mať aspoň 3 písmená" : " "}</p>
    </div>
    <div className="words-tiles" role="group" aria-label="Písmená">{order.map(i => {
      const l = puzzle.letters[i], o = owner[i], picked = current.includes(i);
      return <button key={i} className="words-tile" data-used={o !== null} data-picked={picked} style={o !== null ? { ["--party" as string]: COLORS[o] } : undefined} disabled={o !== null} aria-pressed={picked} onClick={() => tap(i)} aria-label={`${upper(l)}, ${values[l]} ${values[l] === 1 ? "bod" : values[l] <= 4 ? "body" : "bodov"}${o !== null ? ", už v koalícii" : ""}`}>
        <span>{upper(l)}</span><small>{values[l]}</small>
      </button>;
    })}</div>
    <div className="words-controls">
      <button className="words-secondary" onClick={() => setCurrent(c => c.slice(0, -1))} disabled={!length} aria-label="Zmazať posledné písmeno"><Delete size={18} aria-hidden="true"/></button>
      <button className="words-secondary" onClick={shuffle} aria-label="Zamiešať písmená"><Shuffle size={18} aria-hidden="true"/></button>
      <button className="words-primary" onClick={add} disabled={length < 3}>Pridať slovo<ArrowRight size={18} aria-hidden="true"/></button>
    </div>
    {message && <p className="words-message" data-ok={message.ok} role="status">{message.ok ? <Check size={16} aria-hidden="true"/> : <X size={16} aria-hidden="true"/>}{message.text}</p>}
    {save.words.length ? <ol className="words-coalition" aria-label="Slová v koalícii">
      {save.words.map((w, i) => <li key={i} style={{ ["--party" as string]: COLORS[i] }}><span className="words-party-dot" aria-hidden="true"/><b>{upper(w)}</b><span>{mandates(seatsFor(w))}</span><button onClick={() => drop(i)} aria-label={`Vyradiť slovo ${w} z koalície`}><X size={16}/></button></li>)}
      {free > 0 && <li className="is-empty"><span className="words-party-dot" aria-hidden="true"/><span>{result.left ? `Ešte ${free} ${free === 1 ? "voľné miesto" : "voľné miesta"} v koalícii` : "Všetky písmená sú v koalícii"}</span></li>}
    </ol> : <p className="words-hint">Každé slovo bude jedna strana koalície. Na väčšinu často stačia dve dlhšie slová; vzácne písmená (4 – 5 bodov) sa oplatí zapojiť.</p>}
    <div className="words-card words-result">
      <p className="words-target">Najsilnejšia možná koalícia má <b>{mandates(puzzle.best.seats)}</b>. Z týchto písmen sa dá zložiť {puzzle.dictionary.words.length.toLocaleString("sk")} slov.</p>
      {save.best.seats > 0 && <p className="words-best"><b>Tvoj najlepší výsledok{daily ? " dnes" : ""}:</b> {mandates(save.best.seats)} <span aria-label={`${stars} z 3 hviezd`}>{"★".repeat(stars)}{"☆".repeat(3 - stars)}</span>{perfect && <strong className="words-perfect"> Najsilnejšia možná koalícia, lepšie to nejde!</strong>}</p>}
      {save.revealed ? <div className="words-reveal">
        <p><b>Najsilnejšia koalícia:</b> {puzzle.best.words.map(upper).join(" + ")} = {mandates(puzzle.best.seats)}</p>
        <p><b>Najsilnejšia zo všetkých 12 písmen:</b> {puzzle.cover.words.map(upper).join(" + ")} = {mandates(puzzle.cover.seats)}</p>
        <p className="words-note">Po odhalení môžeš hrať ďalej, výsledok sa už nezapíše.</p>
      </div> : <button className="words-secondary" onClick={() => commit({ ...save, revealed: true })}><Eye size={16} aria-hidden="true"/> Ukázať riešenie</button>}
      <div className="words-actions">
        {save.best.seats > 0 && <button className="words-primary" onClick={() => void share()}><Share2 size={16} aria-hidden="true"/> Zdieľať výsledok</button>}
        <button className="words-secondary" onClick={() => onFree(!daily)}><Dices size={16} aria-hidden="true"/> {daily ? "Voľná hra" : "Iné písmená"}</button>
        {!daily && <button className="words-secondary" onClick={onDaily}>Späť na písmená dňa</button>}
      </div>
      {copied && <p className="words-note" role="status">{copied.includes("\n") ? <code>{copied}</code> : copied}</p>}
    </div>
    <details className="words-rules"><summary>Pravidlá a slovník</summary>
      <ul>
        <li>Mandáty slova = súčet bodov jeho písmen × (počet písmen − 1). Slovo zo 6 písmen so súčtom 11 bodov dá 55 mandátov.</li>
        <li>Body písmen: 1 – a o e i n s t r v · 2 – l k d m p u j · 3 – z y h b c á í · 4 – č š ž ý ú é ť ľ · 5 – ň ď ô ä ó ĺ ŕ f g.</li>
        <li>Slovo musí mať aspoň 3 písmená. Platia všetky tvary bežných slovenských slov (pády, osoby, časy, stupne) aj názvy štátov a svetadielov (omán, v ománe). Neplatia mená ľudí, mestá, skratky, citoslovcia ani vulgarizmy.</li>
        <li>Koalícia má najviac {MAX_WORDS} slová z {POOL_SIZE} písmen. Slovo môžeš kedykoľvek vyradiť a jeho písmená použiť inak.</li>
        <li>Ciele sa zbierajú počas hry: väčšinu a ústavnú väčšinu ti prinesie najsilnejšia koalícia, tretiu hviezdu aj iná koalícia, ktorá použije všetkých 12 písmen a má väčšinu.</li>
        <li>Písmená dňa sú pre všetkých rovnaké a každý deň sa dajú splniť všetky tri ciele. Výsledky a séria sa ukladajú len v tomto zariadení.</li>
        <li>Slovník: slovenský slovník sk-spell (projekt LibreOffice), licencia MPL 1.1, z vlastných mien len štáty a svetadiely, bez skratiek a vulgarizmov. <a href="/data/koalicia/ZDROJ.txt" target="_blank" rel="noopener">Zdroj a úpravy</a>.</li>
      </ul>
    </details>
  </section>;
}
