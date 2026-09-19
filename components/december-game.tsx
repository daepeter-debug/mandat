"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CarFront, CircleHelp, Coins, GraduationCap, HeartPulse, RotateCcw, ScrollText, Share2, Star } from "lucide-react";
import { createSeason, eventFor, EVENTS, grade, METERS, MONTHS, MONTHS_IN, previousDay, readSave, replay, slovakDay, type MeterId, type SeasonPlan } from "@/lib/december-game";
import DecemberTown from "@/components/december-town";
// Spoločné štýly hier (hlavička, prepínač režimu, týždenný pás, „Ako sa hrá“) sú v daily-game.css.
import "@/app/daily-game.css";
import "@/app/december-game.css";

/*
  Do decembra: dvanásť mestských správ, dve možnosti pri každej. Scéna hore reaguje na rozhodnutia,
  karta dole hovorí, čo sa práve deje. Denná sezóna je pre všetkých rovnaká a ukladá sa v prehliadači;
  tréning má náhodné zrnko a neukladá sa. Formát ukladania: mandat:do-decembra:v1:<deň>.
*/
const storageKey = (day: string) => `mandat:do-decembra:v1:${day}`;
const icons: Record<MeterId, typeof GraduationCap> = { schools: GraduationCap, health: HeartPulse, transport: CarFront };
const loadChoices = (day: string) => { try { return readSave(JSON.parse(localStorage.getItem(storageKey(day)) ?? "null")).choices; } catch { return []; } };
const loadHistory = (day: string) => {
  const stars = new Map<string, number>();
  try {
    for (let i = 0; i < 7; i++) { const date = previousDay(day, i); const save = readSave(JSON.parse(localStorage.getItem(storageKey(date)) ?? "null")); if (save.stars !== null) stars.set(date, save.stars); }
  } catch { /* bez úložiska ostáva história prázdna */ }
  return stars;
};
const shortDate = (day: string) => new Intl.DateTimeFormat("sk-SK", { day: "numeric", month: "numeric", year: "numeric" }).format(new Date(`${day}T12:00:00Z`));

export default function DecemberGame() {
  const [day, setDay] = useState<string | null>(null);
  const [training, setTraining] = useState<string | null>(null);
  useEffect(() => {
    const refresh = () => setDay(slovakDay());
    refresh();
    const timer = window.setInterval(refresh, 30000);
    window.addEventListener("focus", refresh);
    return () => { clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, []);
  if (!day) return <p className="chart-loading" role="status">Pripravujeme sezónu…</p>;
  return <Game key={training ?? day} day={day} id={training ?? day} training={!!training} onDaily={() => setTraining(null)} onTraining={() => setTraining(`training:${Date.now()}:${Math.random()}`)}/>;
}

function Game({ day, id, training, onDaily, onTraining }: { day: string; id: string; training: boolean; onDaily: () => void; onTraining: () => void }) {
  const [plan] = useState<SeasonPlan>(() => createSeason(id));
  const [choices, setChoices] = useState<(0 | 1)[]>(() => training ? [] : loadChoices(day));
  const [storageAvailable] = useState(() => { try { const k = "mandat:do-decembra:test"; localStorage.setItem(k, "1"); localStorage.removeItem(k); return true; } catch { return false; } });
  const [history] = useState(() => loadHistory(day));
  const [message, setMessage] = useState("");
  const [shareText, setShareText] = useState("");
  const state = useMemo(() => replay(plan, choices), [plan, choices]);
  const result = state.ended ? grade(state) : null;
  useEffect(() => {
    if (training || !storageAvailable) return;
    try { localStorage.setItem(storageKey(day), JSON.stringify({ choices, stars: result?.stars ?? null })); } catch { /* nedostupnosť je ohlásená pri štarte */ }
  }, [choices, day, training, storageAvailable, result]);

  const event = state.ended ? null : eventFor(plan, state);
  const pick = (choice: 0 | 1) => setChoices(cs => cs.length < 12 ? [...cs, choice] : cs);
  const reset = () => { setChoices([]); setMessage(""); setShareText(""); };
  const monthName = (m: number) => MONTHS_IN[Math.min(11, m)];
  const fillHint = (hint: string, month: number, after: number) => hint.replace("{month}", monthName(month + after).replace(/^./, c => c.toUpperCase()));
  const share = async () => {
    if (!result) return;
    const stars = "★".repeat(result.stars) + "☆".repeat(3 - result.stars);
    const summary = state.ended?.kind === "collapse" ? `Mandátovce to nezvládli ${monthName(state.ended.month)}.` : `Mandátovce prežili rok: Školy ${state.meters.schools} · Zdravie ${state.meters.health} · Doprava ${state.meters.transport} · ${state.coins >= 0 ? `rezerva ${state.coins}` : `dlh ${-state.coins}`}.`;
    const text = `Do decembra · ${shortDate(day)}\n${summary}\n${stars} ${result.title}`;
    const url = new URL(window.location.href); url.search = "?v=game&g=december";
    try {
      if (navigator.share) await navigator.share({ title: "Do decembra", text, url: url.href });
      else { await navigator.clipboard.writeText(`${text}\n${url.href}`); setMessage("Pohľadnica je skopírovaná."); }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) setShareText(`${text}\n${url.href}`);
    }
  };
  const eventTitle = (eventId: string) => EVENTS.find(e => e.id === eventId);

  return <section className="december" aria-labelledby="december-title">
    <header className="game-heading">
      <div><h1 id="december-title">Do decembra</h1><p>Malé mesto Mandátovce, dvanásť mesiacov, dvanásť rozhodnutí. Každé niečo stojí — dostaneš mesto až do decembra?</p></div>
      <div className="game-mode" role="group" aria-label="Režim hry"><button type="button" aria-pressed={!training} onClick={onDaily}>Denná sezóna</button><button type="button" aria-pressed={training} onClick={onTraining}>Tréning</button></div>
    </header>
    <div className="december-layout">
      <div className="december-board">
        <div className="december-status">
          <span className="december-month"><CalendarDays size={18} aria-hidden="true"/><b>{MONTHS[state.month]}</b><small>{state.month + 1} / 12</small></span>
          <span className={`december-coins${state.coins < 0 ? " is-debt" : ""}`}><Coins size={18} aria-hidden="true"/><b key={state.coins}>{state.coins < 0 ? -state.coins : state.coins}</b><small>{state.coins < 0 ? "dlh" : "rezerva"}</small></span>
        </div>
        <DecemberTown month={state.month} flags={state.flags} className="december-town" label={`Mandátovce, ${MONTHS[state.month].toLowerCase()}: Školy ${state.meters.schools}, Zdravie ${state.meters.health}, Doprava ${state.meters.transport}, ${state.coins >= 0 ? `rezerva ${state.coins}` : `dlh ${-state.coins}`} mincí.`}/>
        <ul className="december-meters" aria-label="Stav mesta">
          {METERS.map(m => { const Icon = icons[m.id]; const v = state.meters[m.id]; return <li key={m.id} className={v <= 2 ? "is-low" : ""}><Icon size={17} aria-hidden="true"/><span>{m.label}</span><b>{v}<small>/10</small></b><i className="december-bar" aria-hidden="true">{Array.from({ length: 10 }, (_, k) => <i key={k} className={k < v ? "is-on" : ""}/>)}</i></li>; })}
        </ul>
        {state.coins < 0 && !state.ended && <p className="december-warning" role="status">Mesto je v dlhu: kým ho nesplatí, každý mesiac stráca 1 bod v každej oblasti.</p>}
      </div>
      <div className="december-panel">
        {event && !state.ended && <article className="december-event" aria-live="polite">
          <p className="december-kicker">Mestské správy · {MONTHS[state.month]}</p>
          <h2>{event.title}</h2>
          <p>{event.question}</p>
          <div className="december-options">
            {event.options.map((o, i) => <button type="button" key={`${event.id}-${i}`} className={`december-option${i === 0 ? " is-primary" : ""}`} onClick={() => pick(i as 0 | 1)}>
              <span className="december-option-text"><b>{o.label}</b><small>{fillHint(o.hint, state.month, o.later?.after ?? 0)}</small></span>
              <span className={`december-cost${o.cost < 0 ? " is-gain" : o.cost === 0 ? " is-free" : ""}`}><Coins size={15} aria-hidden="true"/>{o.cost > 0 ? `−${o.cost}` : o.cost < 0 ? `+${-o.cost}` : "0"}</span>
            </button>)}
          </div>
          {state.pending.length > 0 && <ul className="december-pending" aria-label="Odložené účty a odmeny">{state.pending.map((p, i) => <li key={i}>{monthName(p.due).replace(/^./, c => c.toUpperCase())}: {p.cost ? (p.cost > 0 ? `−${p.cost}` : `+${-p.cost}`) : "±0"} mincí · {p.note}</li>)}</ul>}
          <p className="december-income">Príjem mesta: <b>+{state.income}</b> mincí mesačne{state.income !== 1 && " (upravený rozhodnutiami)"}.</p>
        </article>}
        {state.ended && result && <article className="december-postcard">
          <div className={`december-postcard-frame stars-${result.stars}`}>
            <DecemberTown month={state.ended.kind === "december" ? 11 : state.month} flags={state.flags} className="december-town" label={`Pohľadnica z Mandátoviec: ${result.title}`}/>
            <span className="december-stamp" aria-hidden="true"><b>{state.ended.kind === "december" ? "12" : state.month + 1}</b><small>/ 12</small></span>
            <p className="december-postcard-greeting">{state.ended.kind === "december" ? "Pozdrav z Mandátoviec" : "Posledný pozdrav z Mandátoviec"}</p>
          </div>
          <div className="december-stars" aria-label={`${result.stars} z 3 hviezd`}>{[0, 1, 2].map(i => <Star key={i} size={22} className={i < result.stars ? "is-on" : ""} aria-hidden="true"/>)}</div>
          <h2>{result.title}</h2>
          <p>{result.text}</p>
          <div className="december-actions">
            {!training && <button type="button" className="december-primary" onClick={share}><Share2 size={16} aria-hidden="true"/> Zdieľať pohľadnicu</button>}
            <button type="button" onClick={training ? onTraining : reset}><RotateCcw size={16} aria-hidden="true"/> {training ? "Ďalšia sezóna" : "Hrať znova"}</button>
            {!training && <button type="button" onClick={onTraining}>Tréning s iným mestom</button>}
          </div>
          {message && <p className="game-feedback" role="status">{message}</p>}
          {shareText && <textarea readOnly aria-label="Pohľadnica na skopírovanie" value={shareText} onFocus={e => e.currentTarget.select()}/>}
          {!training && <p className="december-tomorrow">Zajtra o polnoci príde nová sezóna. Dnešná ostáva uložená v tomto prehliadači.</p>}
        </article>}
        {state.log.length > 0 && <details className="december-log">
          <summary><ScrollText size={16} aria-hidden="true"/> Kronika roka ({state.log.length}/12)</summary>
          <ol>{state.log.map(entry => { const e = eventTitle(entry.event); return <li key={entry.month}><span>{MONTHS[entry.month]}</span><b>{e?.title}</b><small>{e?.options[entry.choice].label}</small></li>; })}</ol>
        </details>}
        <details className="game-about december-about">
          <summary><CircleHelp size={16} aria-hidden="true"/> Ako sa hrá</summary>
          <ul>
            <li>Každý mesiac príde jedna mestská správa s dvoma možnosťami. Jedna zväčša stojí mince, druhá stojí niečo iné.</li>
            <li>Mesto vyberá <b>+1 mincu</b> dane mesačne; rozhodnutia ho môžu zvýšiť aj znížiť. Odložené účty prídu v uvedenom mesiaci.</li>
            <li>Školy, Zdravie a Doprava sú na stupnici 0–10. Ak niektorá klesne na nulu, mesto to nezvládne a rok sa končí.</li>
            <li>Minúť viac, než máš, sa dá — v dlhu však mesto každý mesiac stráca bod v každej oblasti.</li>
            <li>Tri hviezdy: všetky oblasti aspoň 7 a bez dlhu v decembri. Dve: všetky aspoň 5 a bez dlhu.</li>
          </ul>
          <p>Fiktívne mesto, fiktívne správy. Hra nehodnotí skutočné obce ani strany; podobnosť s reálnym mostom je čisto štatistická.</p>
        </details>
        {!training && <div className="game-week december-week"><h3>Tvojich posledných 7 dní</h3><div>{Array.from({ length: 7 }, (_, i) => previousDay(day, 6 - i)).map(date => { const stars = history.get(date) ?? (date === day ? result?.stars ?? null : null); return <span key={date} className={stars !== null ? "is-complete" : ""} title={`${date}: ${stars === null ? "nehrané" : `${stars} z 3 hviezd`}`}><small>{new Intl.DateTimeFormat("sk-SK", { weekday: "short" }).format(new Date(`${date}T12:00:00Z`))}</small><i>{stars === null ? date.slice(-2) : stars === 0 ? "×" : stars}</i></span>; })}</div><p>Číslo je počet hviezd, × je mesto, ktoré december nevidelo. {!storageAvailable && "Tento prehliadač neukladá rozohranú sezónu."}</p></div>}
        {!state.ended && state.log.length > 0 && <button type="button" className="december-restart" onClick={reset}><RotateCcw size={14} aria-hidden="true"/> Začať sezónu odznova</button>}
      </div>
    </div>
    <span className="sr-only" aria-live="polite">{state.ended ? result?.title : `${MONTHS[state.month]}, rezerva ${state.coins} mincí.`}</span>
  </section>;
}
