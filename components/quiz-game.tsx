"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, Copy, ExternalLink, Flag, Play, RefreshCw, RotateCcw, Share2, Shuffle, Trophy, X } from "lucide-react";
import { topicNames } from "@/lib/quiz-bank";
import {
  MAX_POINTS, PLAN, ROUND_SIZE, buildRound, daySeed, halve, keys, levelNames, levelPoints, levels, mix, parseProgress, parseResults, parseSeen,
  present, ranking, scoreRound, shareText, skDate, slovakDay, streak, swapItem, titleFor, type Answer, type Mode, type Progress, type Result, type RoundQuestion,
} from "@/lib/quiz";
import "@/app/quiz-game.css";

/*
  Tridsiatka: 30 otázok o slovenskej politike od ľahkých po expertné. Úvod (kvíz dňa, voľný kvíz, osobné poradie),
  hra (otázka, štyri možnosti, žolíky, vysvetlenie so zdrojom) a výsledok (body, titul, rozpis, zdieľanie, chyby).
  Logika a uloženie: lib/quiz.ts, otázky: lib/quiz-bank.ts. Grafiku (ilustrácie, oslava) môže doplniť Codex.
*/
const URL_GAME = "https://mandat-preview.mandat.workers.dev/?v=game&g=quiz";
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: unknown) => { try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(value)); } catch { /* bez úložiska hra beží, len sa nič neuloží */ } };
const plural = (n: number, one: string, few: string, many: string) => n === 1 ? one : n >= 2 && n <= 4 ? few : many;
const letters = ["A", "B", "C", "D"];

export default function QuizGame() {
  const [day, setDay] = useState<string | null>(null);
  useEffect(() => {
    const refresh = () => setDay(slovakDay());
    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);
  if (!day) return <p className="chart-loading" role="status">Pripravujeme Tridsiatku…</p>;
  return <Quiz today={day}/>;
}

function Quiz({ today }: { today: string }) {
  const [results, setResults] = useState<Result[]>(() => parseResults(read(keys.results)));
  const [progress, setProgress] = useState<Progress | null>(() => parseProgress(read(keys.progress)));
  const [current, setCurrent] = useState(() => { const p = parseProgress(read(keys.progress)); return p ? Math.min(p.answers.length, ROUND_SIZE - 1) : 0; });
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState<{ result: Result; round: RoundQuestion[]; answers: Answer[] } | null>(null);
  const daily = results.find(r => r.mode === "daily" && r.day === today) ?? null;

  function save(next: Progress | null) { setProgress(next); write(keys.progress, next); }
  function start(mode: Mode) {
    const seed = mode === "daily" ? daySeed(today) : mix(Date.now() ^ Math.floor(Math.random() * 4294967295));
    const items = buildRound(seed, mode === "daily" ? [] : parseSeen(read(keys.seen)));
    save({ v: 1, mode, day: today, seed, items, answers: [], hidden: {}, jokers: { half: false, swap: false } });
    setCurrent(0); setFinished(null); setPlaying(true);
    requestAnimationFrame(() => document.querySelector(".quiz")?.scrollIntoView({ block: "start", behavior: "instant" }));
  }
  function finish(p: Progress) {
    const round = p.items.map(i => present(i)!), score = scoreRound(round, p.answers);
    const result: Result = { mode: p.mode, day: p.day, points: score.points, max: score.max, correct: score.correct, marks: score.marks, at: new Date().toISOString() };
    const already = p.mode === "daily" && results.some(r => r.mode === "daily" && r.day === p.day);
    const nextResults = already ? results : [...results, result].slice(-60);
    setResults(nextResults); write(keys.results, nextResults);
    write(keys.seen, [...parseSeen(read(keys.seen)), ...p.items.map(i => i.id)].slice(-150));
    save(null); setPlaying(false); setFinished({ result, round, answers: p.answers });
    requestAnimationFrame(() => document.querySelector(".quiz")?.scrollIntoView({ block: "start", behavior: "instant" }));
  }

  if (finished) return <End {...finished} today={today} results={results} onNew={() => start("free")} onHome={() => setFinished(null)}/>;
  if (playing && progress) return <RoundScreen progress={progress} current={current} setCurrent={setCurrent} onSave={save} onFinish={finish} onQuit={() => setPlaying(false)}/>;
  return <Start today={today} results={results} daily={daily} progress={progress} onStart={start} onResume={() => setPlaying(true)}/>;
}

function Start({ today, results, daily, progress, onStart, onResume }: { today: string; results: Result[]; daily: Result | null; progress: Progress | null; onStart: (m: Mode) => void; onResume: () => void }) {
  const best = ranking(results, 5), days = streak(results, today), [copied, setCopied] = useState("");
  async function shareDaily() {
    if (!daily) return;
    const text = shareText("daily", daily.day, daily.points, daily.max, daily.marks, URL_GAME);
    try { if (navigator.share) { await navigator.share({ title: "Tridsiatka", text }); return; } } catch (e) { if (e instanceof Error && e.name === "AbortError") return; }
    try { await navigator.clipboard.writeText(text); setCopied("Výsledok je skopírovaný."); } catch { setCopied(text); }
  }
  return <section className="quiz quiz-start" aria-labelledby="quiz-title">
    <header className="quiz-hero">
      <p className="quiz-kicker">Politický kvíz Mandátu</p>
      <h1 id="quiz-title">Tridsiatka</h1>
      <p>30 otázok o slovenskej politike od roku 1989: od ľahkých po naozaj ťažké. Každé kolo je iné.</p>
      <ul className="quiz-levels" aria-label="Úrovne otázok">{levels.map(l => <li key={l} data-level={l}><b>{PLAN[l]}×</b> {levelNames[l]} <span>{levelPoints[l]} {plural(levelPoints[l], "bod", "body", "bodov")}</span></li>)}</ul>
    </header>
    {progress && <div className="quiz-card quiz-resume"><div><b>Rozohrané kolo</b><span>{progress.mode === "daily" ? `Kvíz dňa ${skDate(progress.day)}` : "Voľný kvíz"} · otázka {Math.min(progress.answers.length + 1, ROUND_SIZE)} z {ROUND_SIZE}</span></div><button className="quiz-primary" onClick={onResume}>Pokračovať<ArrowRight size={18} aria-hidden="true"/></button></div>}
    <div className="quiz-modes">
      <article className="quiz-card quiz-daily">
        <p className="quiz-kicker"><Flag size={14} aria-hidden="true"/> Kvíz dňa · {skDate(today)}</p>
        <h2>Rovnakých 30 otázok pre všetkých</h2>
        {daily ? <>
          <p className="quiz-daily-score"><b>{daily.points}</b>/{daily.max} bodov · {titleFor(daily.points, daily.max).name}</p>
          <p className="quiz-note">Dnes máš odohraté. Porovnaj sa s ostatnými, nový kvíz dňa bude zajtra.</p>
          <button className="quiz-secondary" onClick={() => void shareDaily()}><Share2 size={17} aria-hidden="true"/> Zdieľať výsledok</button>
          {copied && <p className="quiz-note" role="status">{copied}</p>}
        </> : <>
          <p className="quiz-note">Zahráš ho raz za deň a výsledok môžeš poslať kamarátom.{days > 0 ? ` Séria: ${days} ${plural(days, "deň", "dni", "dní")} po sebe.` : ""}</p>
          <button className="quiz-primary" onClick={() => onStart("daily")}>{progress ? "Začať kvíz dňa (rozohrané sa zahodí)" : "Spustiť kvíz dňa"}<Play size={17} aria-hidden="true"/></button>
        </>}
      </article>
      <article className="quiz-card">
        <p className="quiz-kicker"><Shuffle size={14} aria-hidden="true"/> Voľný kvíz</p>
        <h2>Náhodných 30 z 300 otázok</h2>
        <p className="quiz-note">Prednosť majú otázky, ktoré sa ti v poslednom čase neukázali. Môžeš hrať koľkokrát chceš.</p>
        <button className={daily ? "quiz-primary" : "quiz-secondary"} onClick={() => onStart("free")}><RefreshCw size={17} aria-hidden="true"/>{progress ? "Nové kolo (rozohrané sa zahodí)" : "Nové kolo"}</button>
      </article>
    </div>
    <section className="quiz-card quiz-ranking" aria-labelledby="quiz-ranking-title">
      <h2 id="quiz-ranking-title"><Trophy size={18} aria-hidden="true"/> Tvoje poradie</h2>
      {best.length ? <ol>{best.map((r, i) => <li key={r.at}><span className="quiz-rank">{i + 1}.</span><b>{r.points}/{r.max}</b><span>{titleFor(r.points, r.max).name}</span><small>{r.mode === "daily" ? "kvíz dňa" : "voľný"} · {skDate(r.day)}</small></li>)}</ol>
        : <p className="quiz-note">Zatiaľ prázdne. Po prvom kole sa tu objavia tvoje najlepšie výsledky.</p>}
      <p className="quiz-note">Poradie sa ukladá iba v tomto zariadení.</p>
    </section>
    <details className="quiz-rules"><summary>Pravidlá</summary>
      <ul>
        <li>Otázky idú od ľahkých po expertné: {levels.map(l => `${PLAN[l]} ${levelNames[l]}`).join(", ")}. Body: {levels.map(l => `${levelNames[l]} ${levelPoints[l]}`).join(", ")}; spolu najviac {MAX_POINTS}.</li>
        <li>Bez časového limitu. Po každej odpovedi uvidíš vysvetlenie a zdroj.</li>
        <li>Dva žolíky na kolo: <b>50 : 50</b> skryje dve nesprávne možnosti, <b>výmena</b> dá inú otázku rovnakej úrovne.</li>
        <li>Otázky sú o overiteľných faktoch (inštitúcie, voľby, vlády, dejiny, EÚ). Stav k 1. 10. 2026.</li>
      </ul>
    </details>
  </section>;
}

function RoundScreen({ progress, current, setCurrent, onSave, onFinish, onQuit }: {
  progress: Progress; current: number; setCurrent: (n: number) => void; onSave: (p: Progress) => void; onFinish: (p: Progress) => void; onQuit: () => void;
}) {
  const q = present(progress.items[current])!, answer = progress.answers[current], answered = answer !== undefined && answer !== null;
  const hidden = progress.hidden[current] ?? [], round = progress.items.map(i => present(i)!), points = scoreRound(round.slice(0, progress.answers.length), progress.answers).points;
  function choose(i: number) {
    if (answered || hidden.includes(i)) return;
    const answers = progress.answers.slice(); answers[current] = i;
    onSave({ ...progress, answers });
  }
  function next() { if (current >= ROUND_SIZE - 1) onFinish(progress); else { setCurrent(current + 1); requestAnimationFrame(() => document.querySelector<HTMLElement>(".quiz-question")?.focus({ preventScroll: false })); } }
  function useHalf() { if (progress.jokers.half || answered) return; onSave({ ...progress, hidden: { ...progress.hidden, [current]: halve(q, progress.seed) }, jokers: { ...progress.jokers, half: true } }); }
  function useSwap() {
    if (progress.jokers.swap || answered) return;
    const swapped = swapItem(progress.items, current, progress.seed); if (!swapped) return;
    const items = progress.items.slice(); items[current] = swapped;
    const hiddenNext = { ...progress.hidden }; delete hiddenNext[current];
    onSave({ ...progress, items, hidden: hiddenNext, jokers: { ...progress.jokers, swap: true } });
  }
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("input,textarea")) return;
      const n = "1234".indexOf(e.key) >= 0 ? "1234".indexOf(e.key) : "abcd".indexOf(e.key.toLowerCase());
      if (!answered && n >= 0 && e.key.length === 1) { e.preventDefault(); choose(n); }
      else if (answered && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); next(); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });
  const correct = answered && answer === q.correct;
  return <section className="quiz quiz-play" aria-label="Tridsiatka – otázka">
    <div className="quiz-top">
      <button className="quiz-quit" onClick={onQuit} aria-label="Prerušiť kolo (pokračovať môžeš neskôr)"><X size={18}/></button>
      <div className="quiz-count"><b>Otázka {current + 1}</b> z {ROUND_SIZE}</div>
      <div className="quiz-points" aria-label={`${points} bodov`}><Trophy size={15} aria-hidden="true"/>{points}</div>
    </div>
    <ol className="quiz-track" aria-hidden="true">{round.map((x, i) => <li key={x.id} data-level={x.level} data-state={i === current ? "current" : progress.answers[i] === undefined || progress.answers[i] === null ? "todo" : progress.answers[i] === x.correct ? "ok" : "bad"}/>)}</ol>
    <div className="quiz-question" tabIndex={-1}>
      <p className="quiz-meta"><span className="quiz-level" data-level={q.level}>{levelNames[q.level]} · {levelPoints[q.level]} {plural(levelPoints[q.level], "bod", "body", "bodov")}</span><span>{topicNames[q.topic]}</span></p>
      <h2>{q.q}</h2>
    </div>
    <ul className="quiz-options">{q.options.map((option, i) => {
      const state = !answered ? hidden.includes(i) ? "hidden" : "idle" : i === q.correct ? "correct" : i === answer ? "wrong" : "dim";
      return <li key={option}><button data-state={state} disabled={answered || hidden.includes(i)} onClick={() => choose(i)} aria-pressed={answered ? i === answer : undefined}>
        <span className="quiz-letter">{state === "correct" ? <Check size={16} aria-hidden="true"/> : state === "wrong" ? <X size={16} aria-hidden="true"/> : letters[i]}</span><span>{option}</span>
      </button></li>;
    })}</ul>
    {!answered ? <div className="quiz-jokers">
      <button disabled={progress.jokers.half} onClick={useHalf}><span>50 : 50</span><small>{progress.jokers.half ? "použitý" : "skryje dve zlé"}</small></button>
      <button disabled={progress.jokers.swap} onClick={useSwap}><span><Shuffle size={15} aria-hidden="true"/> Výmena</span><small>{progress.jokers.swap ? "použitá" : "iná otázka"}</small></button>
    </div> : <div className="quiz-feedback" data-correct={correct} role="status" aria-live="polite">
      <p className="quiz-verdict">{correct ? `Správne! +${levelPoints[q.level]} ${plural(levelPoints[q.level], "bod", "body", "bodov")}` : `Nesprávne. Správne je: ${q.options[q.correct]}`}</p>
      <p>{q.explain}</p>
      <a href={q.source} target="_blank" rel="noopener noreferrer">Zdroj <ExternalLink size={13} aria-hidden="true"/></a>
      <button className="quiz-primary quiz-next" onClick={next} autoFocus>{current >= ROUND_SIZE - 1 ? "Zobraziť výsledok" : "Ďalšia otázka"}<ArrowRight size={18} aria-hidden="true"/></button>
    </div>}
  </section>;
}

function End({ result, round, answers, today, results, onNew, onHome }: { result: Result; round: RoundQuestion[]; answers: Answer[]; today: string; results: Result[]; onNew: () => void; onHome: () => void }) {
  const score = scoreRound(round, answers), title = titleFor(result.points, result.max), best = ranking(results, 10);
  const place = best.findIndex(r => r.at === result.at), missed = round.map((q, i) => ({ q, a: answers[i] })).filter(x => x.a !== x.q.correct);
  const [copied, setCopied] = useState("");
  const text = shareText(result.mode, result.day, result.points, result.max, result.marks, URL_GAME);
  async function share() {
    try { if (navigator.share) { await navigator.share({ title: "Tridsiatka", text }); return; } } catch (e) { if (e instanceof Error && e.name === "AbortError") return; }
    try { await navigator.clipboard.writeText(text); setCopied("Výsledok je skopírovaný, môžeš ho vložiť do správy."); } catch { setCopied(text); }
  }
  return <section className="quiz quiz-end" aria-labelledby="quiz-end-title">
    <header className="quiz-result">
      <p className="quiz-kicker">{result.mode === "daily" ? `Kvíz dňa ${skDate(result.day)}` : "Voľný kvíz"}</p>
      <h1 id="quiz-end-title">{title.name}</h1>
      <p className="quiz-score"><b>{result.points}</b><span>/{result.max} bodov</span></p>
      <p>{title.text} Správne odpovede: {result.correct} z {ROUND_SIZE}.</p>
      {place >= 0 && <p className="quiz-place"><Trophy size={16} aria-hidden="true"/> {place + 1}. miesto v tvojom poradí</p>}
    </header>
    <div className="quiz-marks" role="img" aria-label={`Správne ${result.correct} z ${ROUND_SIZE}`}>{[...result.marks].map((m, i) => <span key={i} data-ok={m === "1"} data-level={round[i]?.level}/>)}</div>
    <ul className="quiz-breakdown">{levels.map(l => <li key={l} data-level={l}><span>{levelNames[l]}</span><b>{score.byLevel[l].correct}/{score.byLevel[l].total}</b><span className="quiz-bar" aria-hidden="true"><span style={{ width: `${score.byLevel[l].total ? score.byLevel[l].correct / score.byLevel[l].total * 100 : 0}%` }}/></span></li>)}</ul>
    <div className="quiz-actions">
      <button className="quiz-primary" onClick={() => void share()}><Share2 size={17} aria-hidden="true"/> Zdieľať výsledok</button>
      <button className="quiz-secondary" onClick={onNew}><RefreshCw size={17} aria-hidden="true"/> Nové kolo</button>
      <button className="quiz-secondary" onClick={onHome}><RotateCcw size={17} aria-hidden="true"/> Na začiatok</button>
    </div>
    {copied && <p className="quiz-note" role="status">{copied.includes("\n") ? <><Copy size={14} aria-hidden="true"/> Skopíruj si výsledok: <code>{copied}</code></> : copied}</p>}
    {missed.length > 0 && <details className="quiz-card quiz-review"><summary>Chybné odpovede ({missed.length})</summary>
      <ol>{missed.map(({ q, a }) => <li key={q.id}><b>{q.q}</b><span className="quiz-review-answer"><Check size={14} aria-hidden="true"/> {q.options[q.correct]}</span>{a !== null && a !== undefined && <span className="quiz-review-wrong"><X size={14} aria-hidden="true"/> {q.options[a]}</span>}<small>{q.explain}</small></li>)}</ol>
    </details>}
    {result.mode === "daily" && result.day === today && <p className="quiz-note">Kvíz dňa sa počíta raz za deň. Ďalšie kolá hraj ako voľný kvíz.</p>}
  </section>;
}
