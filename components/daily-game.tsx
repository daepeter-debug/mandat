"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { Anchor, Check, Circle, CircleHelp, GraduationCap, HeartPulse, Leaf, Lightbulb, RotateCcw, Share2, Sparkles, Sun, Trophy, Waves, X } from "lucide-react";
import { createPuzzle, evaluate, gameParties, previousDay, readSave, slovakDay, type GameSave } from "@/lib/daily-game";
import { hemicycleSeats } from "@/lib/parliament";
import "@/app/daily-game.css";

const points = hemicycleSeats(150);
const symbols = [Anchor, Leaf, Sparkles, Sun, Waves, Circle];
const empty: GameSave = { selected: [], attempts: 0, hints: 0, solved: false };
const storageKey = (day: string) => `mandat:daily-majority:v1:${day}`;
// Čítanie uloženej hry pri vytvorení stavu (komponent sa vykresľuje až v prehliadači), nie v efekte.
const loadSave = (day: string, puzzle: ReturnType<typeof createPuzzle>): GameSave => {
  try { return readSave(JSON.parse(localStorage.getItem(storageKey(day)) ?? "null"), puzzle); } catch { return empty; }
};
const loadHistory = (day: string) => {
  const completed: string[] = [];
  try {
    for (let i = 0; i < 7; i++) {
      const date = previousDay(day, i);
      if (readSave(JSON.parse(localStorage.getItem(storageKey(date)) ?? "null"), createPuzzle(date)).solved) completed.push(date);
    }
  } catch { /* bez úložiska ostáva história prázdna */ }
  return completed;
};

export default function DailyGame() {
  const [day, setDay] = useState<string | null>(null);
  const [training, setTraining] = useState<string | null>(null);
  useEffect(() => {
    const refresh = () => setDay(slovakDay());
    refresh();
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => { clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, []);
  if (!day) return <p className="chart-loading" role="status">Pripravujeme dennú výzvu…</p>;
  return <Game key={training ?? day} day={day} id={training ?? day} training={!!training}
    onDaily={() => setTraining(null)} onTraining={() => setTraining(`training:${Date.now()}:${Math.random()}`)} />;
}

function Game({ day, id, training, onDaily, onTraining }: { day: string; id: string; training: boolean; onDaily: () => void; onTraining: () => void }) {
  const [puzzle] = useState(() => createPuzzle(id));
  const [save, setSave] = useState<GameSave>(() => training ? empty : loadSave(day, puzzle));
  // Úložisko sa overí raz pri štarte; zápis potom beží v efekte bez ďalšieho stavu.
  const [storageAvailable] = useState(() => { try { const k = "mandat:daily-majority:test"; localStorage.setItem(k, "1"); localStorage.removeItem(k); return true; } catch { return false; } });
  const [history] = useState<string[]>(() => loadHistory(day));
  const [message, setMessage] = useState("");
  const [shareText, setShareText] = useState("");
  const ready = true;
  useEffect(() => {
    if (training || !storageAvailable) return;
    try { localStorage.setItem(storageKey(day), JSON.stringify(save)); } catch { /* nedostupnosť je ohlásená pri štarte */ }
  }, [save, day, training, storageAvailable]);

  const result = evaluate(puzzle, save.selected);
  const updateSelection = (index: number) => {
    if (save.solved) return;
    setSave(s => ({ ...s, selected: s.selected.includes(index) ? s.selected.filter(i => i !== index) : [...s.selected, index] }));
    setMessage("");
  };
  const check = () => {
    setSave(s => ({ ...s, attempts: s.attempts + 1, solved: result.won }));
    if (result.won) setMessage("Vyriešené! Našiel si najtesnejšiu možnú väčšinu.");
    else if (!result.size) setMessage("V koalícii môžu byť najviac tri strany. Jednu odober.");
    else if (!result.compatible) setMessage("Táto dvojica spolu nespolupracuje. Skús vymeniť jednu zo strán.");
    else if (!result.topics) setMessage("Chýba zastúpenie školstva alebo zdravotníctva. Pozri témy pod názvami strán.");
    else if (!result.majority) setMessage(`Do väčšiny chýba ${76 - result.seats} kresiel. Skús inú kombináciu.`);
    else setMessage("Väčšinu máš, ale existuje tesnejšia. Hľadaj menej kresiel pri splnení všetkých pravidiel.");
  };
  const hint = () => {
    const next = Math.min(save.hints + 1, 3);
    setSave(s => ({ ...s, hints: next }));
    setMessage(next === 1 ? `Najtesnejšia možná väčšina má ${puzzle.target} kresiel.` : next === 2 ? `V riešení je strana ${gameParties[puzzle.solutions[0][0]].name}.` : `Skús spojiť strany ${puzzle.solutions[0].map(i => gameParties[i].name).join(", ")}. Potom potvrď zostavu.`);
  };
  const share = async () => {
    const text = `Mandát · Denná väčšina · ${day}\nVyriešené na ${save.attempts}. pokus · nápovedy: ${save.hints}/3\nNájdeš aj ty najtesnejšiu väčšinu?`;
    const url = new URL(window.location.href); url.search = "?v=game"; url.hash = "";
    try {
      if (navigator.share) await navigator.share({ title: "Denná väčšina", text, url: url.href });
      else { await navigator.clipboard.writeText(`${text}\n${url.href}`); setMessage("Výsledok je skopírovaný. Riešenie zostáva tajné."); }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) setShareText(`${text}\n${url.href}`);
    }
  };
  const filled = puzzle.seats.flatMap((count, index) => Array.from({ length: count }, () => index));
  const completeDates = new Set([...history, ...(!training && save.solved ? [day] : [])]);
  return <section className="daily-game" aria-labelledby="game-title">
    <header className="game-heading"><div><h1 id="game-title">Denná väčšina<span>.</span></h1><p>Šesť strán. Jeden hlavolam. Nájdeš najtesnejšiu vládu?</p></div><div className="game-mode" role="group" aria-label="Režim hry"><button aria-pressed={!training} onClick={onDaily}>Denná výzva</button><button aria-pressed={training} onClick={onTraining}>Tréning</button></div></header>
    <div className="game-layout">
      <div className="game-board">
        <div className="game-board-meta"><span>{training ? "Tréning · nové zadanie" : new Intl.DateTimeFormat("sk-SK", { day: "numeric", month: "long" }).format(new Date(`${day}T12:00:00Z`))}</span><span>{save.solved ? "Vyriešené" : "150 kresiel · väčšina od 76"}</span></div>
        <div className={`game-chamber${save.solved ? " is-solved" : ""}`}>
          <svg viewBox="-1.07 -1.07 2.14 1.15" role="img" aria-label={`Vybraná koalícia má ${result.seats} zo 150 kresiel. Na väčšinu potrebuje 76.`}>{points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="0.023" fill={save.selected.includes(filled[i]) ? gameParties[filled[i]].color : "#dce2d5"} />)}</svg>
          <div className="game-seat-count" aria-hidden="true"><strong>{result.seats}</strong><span>{save.solved ? "kresiel. Hotovo!" : "z potrebných 76"}</span></div>
        </div>
        <div className="game-party-grid" role="group" aria-label="Vyber strany do koalície">{gameParties.map((party, i) => {
          const Icon = symbols[i], selected = save.selected.includes(i);
          return <button key={party.name} className={`game-party${selected ? " is-selected" : ""}`} style={{ "--party-color": party.color } as CSSProperties} aria-pressed={selected} disabled={!ready || save.solved} onClick={() => updateSelection(i)} aria-label={`${party.name}, ${puzzle.seats[i]} kresiel, ${party.topic}`}><span className="game-party-symbol"><Icon size={21} aria-hidden="true"/></span><span className="game-party-label"><b>{party.name}</b><small>{party.topic}</small></span><strong>{puzzle.seats[i]}</strong><span className="game-party-check" aria-hidden="true">{selected ? <Check size={13}/> : "+"}</span></button>;
        })}</div>
        <div className="game-actions"><button className="game-submit" disabled={!ready || save.selected.length === 0 || save.solved} onClick={check}>{save.solved ? <><Trophy size={18}/> Väčšina zostavená</> : <>Potvrdiť zostavu <Check size={18}/></>}</button><button className="game-reset" disabled={!ready || save.selected.length === 0 || save.solved} onClick={() => { setSave(s => ({ ...s, selected: [] })); setMessage(""); }} aria-label="Vymazať výber strán"><RotateCcw size={19}/></button></div>
        <div className="game-feedback" role="status" aria-live="polite">{message || (save.solved ? "Dnešnú výzvu už máš vyriešenú. Ďalšia príde o polnoci." : "Ťukni na stranu. Ďalším ťuknutím ju odoberieš.")}</div>
        {save.solved && <div className="game-success"><h2><Trophy size={21}/> {training ? "Dobrý ťah." : "Dnes máš vyrokované."}</h2><p>{save.attempts}. pokus · {save.hints === 0 ? "Bez nápovedy" : `Nápovedy: ${save.hints}/3`}</p><div>{!training && <button onClick={share}><Share2 size={16}/> Zdieľať výsledok</button>}<button onClick={onTraining}>Ďalší hlavolam</button></div>{shareText && <textarea readOnly aria-label="Výsledok na skopírovanie" value={shareText} onFocus={e => e.currentTarget.select()}/>}</div>}
      </div>
      <aside className="game-guide" aria-label="Pravidlá a výsledky">
        <h2>Ako zložiť vládu</h2><p>Získaj aspoň 76 kresiel. Vyhráva <b>najnižší možný súčet</b>, ktorý splní všetky podmienky.</p>
        <ul className="game-rules">{[
          { met: result.majority, text: "Aspoň 76 kresiel", Icon: Check },
          { met: result.size, text: "Najviac tri strany", Icon: Check },
          { met: result.compatible, text: `${gameParties[puzzle.incompatible[0]].name} a ${gameParties[puzzle.incompatible[1]].name} nejdú spolu`, Icon: X },
          { met: result.topics, text: "Zastúpené školstvo aj zdravotníctvo", Icon: GraduationCap },
        ].map(rule => <li key={rule.text} className={save.selected.length && rule.met ? "is-met" : ""}><rule.Icon size={17} aria-hidden="true"/><span>{rule.text}</span><span className="game-rule-state">{save.selected.length > 0 && rule.met ? <><Check size={15}/><span className="sr-only">Splnené</span></> : <span className="sr-only">Zatiaľ nesplnené</span>}</span></li>)}</ul>
        <div className="game-help-row"><button onClick={hint} disabled={!ready || save.solved || save.hints >= 3}><Lightbulb size={17}/> Nápoveda <span>{save.hints}/3</span></button><span>Pokusy: {save.attempts}</span></div>
        <div className="game-week"><h3>Tvojich posledných 7 dní</h3><div>{Array.from({ length: 7 }, (_, i) => previousDay(day, 6 - i)).map(date => <span key={date} className={completeDates.has(date) ? "is-complete" : ""} title={`${date}: ${completeDates.has(date) ? "vyriešené" : "nevyriešené"}`}><small>{new Intl.DateTimeFormat("sk-SK", { weekday: "short" }).format(new Date(`${date}T12:00:00Z`))}</small><i>{completeDates.has(date) ? <Check size={17}/> : date.slice(-2)}</i></span>)}</div><p>Nová výzva denne o polnoci slovenského času.</p></div>
        <details className="game-about"><summary><CircleHelp size={17}/> O hre a ukladaní</summary><p>Všetky strany, počty kresiel a ich vzťahy sú vymyslené. Toto je logický hlavolam, nie politické odporúčanie. Každé zadanie má riešenie.</p><p>Dennú výzvu majú všetci rovnakú. Výsledky aj rozpracovaná hra sa ukladajú iba v tomto prehliadači. Tréning sa do dennej histórie nepočíta. Po vymazaní dát prehliadača sa história stratí.</p></details>
        {!storageAvailable && <p role="status" className="game-storage-note"><HeartPulse size={16}/> Prehliadač nepovolil uloženie. Hra funguje, ale po zatvorení sa postup nemusí zachovať.</p>}
      </aside>
    </div>
    <p className="game-fiction">Fiktívny parlament. Skutočná výzva pre tvoju logiku.</p>
  </section>;
}
