"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Check, Copy, ExternalLink, Flag, Play, RefreshCw, RotateCcw, Share2, Shuffle, Swords, Trophy, Users, X } from "lucide-react";
import { topicNames } from "@/lib/quiz-bank";
import {
  MAX_POINTS, PLAN, ROUND_SIZE, buildRound, codeSeed, daySeed, halve, keys, levelNames, levelPoints, levels, mix, parseProgress, parseResults, parseSeen,
  present, ranking, scoreRound, shareText, skDate, slovakDay, streak, swapItem, titleFor, type Answer, type Mode, type Progress, type Result, type RoundQuestion,
} from "@/lib/quiz";
import { addDays, hitText, isCode, newToken, parseOnline, playedText, tokenFor, type Board, type Challenge, type Online, type OnlinePlay, type Stat } from "@/lib/quiz-online";
import { DailyBoard, Duel, NickForm, ShareChallenge, api, askFirst, failed, type PlayReply } from "@/components/quiz-online";
import "@/app/quiz-game.css";

/*
  Tridsiatka: 30 otázok o slovenskej politike od ľahkých po expertné. Úvod (kvíz dňa, voľný kvíz, výzva od kamaráta,
  rebríček dňa, osobné poradie), hra (otázka, štyri možnosti, žolíky, vysvetlenie so zdrojom a úspešnosťou otázky)
  a výsledok (body, titul, porovnanie s ostatnými, rebríček, výzva pre kamaráta, zdieľanie, chyby).
  Logika a uloženie: lib/quiz.ts, otázky: lib/quiz-bank.ts, online časť: lib/quiz-online.ts + components/quiz-online.tsx.
*/
const URL_GAME = "https://mandat-preview.mandat.workers.dev/?v=game&g=quiz";
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: unknown) => { try { if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(value)); } catch { /* bez úložiska hra beží, len sa nič neuloží */ } };
const plural = (n: number, one: string, few: string, many: string) => n === 1 ? one : n >= 2 && n <= 4 ? few : many;
const letters = ["A", "B", "C", "D"];
const top = () => requestAnimationFrame(() => document.querySelector(".quiz")?.scrollIntoView({ block: "start", behavior: "instant" }));
const persist = (o: Online) => { write(keys.online, o); return o; };
const withSent = (o: Online, token: string): Online => ({ ...o, plays: o.plays.map(p => p.token === token ? { ...p, sent: true } : p) });
// Trvalá chyba servera (neplatné alebo staré kolo) sa už neopakuje; pri výpadku spojenia či limite sa skúsi neskôr.
const final = (status: number) => status >= 400 && status < 500 && status !== 429;

export default function QuizGame() {
  const [env, setEnv] = useState<{ day: string; invite: string | null } | null>(null);
  useEffect(() => {
    const refresh = () => {
      const code = new URLSearchParams(window.location.search).get("vyzva");
      setEnv({ day: slovakDay(), invite: code && isCode(code) ? code : null });
    };
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("popstate", refresh);
    return () => { window.removeEventListener("focus", refresh); window.removeEventListener("popstate", refresh); };
  }, []);
  function closeInvite() {
    const url = new URL(window.location.href); url.searchParams.delete("vyzva");
    window.history.replaceState(null, "", url);
    setEnv(e => e && { ...e, invite: null });
  }
  if (!env) return <p className="chart-loading" role="status">Pripravujeme Tridsiatku…</p>;
  return <Quiz today={env.day} invite={env.invite} onCloseInvite={closeInvite}/>;
}

type Finished = { result: Result; round: RoundQuestion[]; answers: Answer[]; play: OnlinePlay | null };
type Submission = { token: string; status: "ask" | "sending" | "done" | "error"; reply: PlayReply | null; error: string | null };
type Action = { kind: "nick" | "host" | "join"; busy: boolean; error: string | null };
export type InviteState = { code: string; data: Challenge | null; error: string | null };

function Quiz({ today, invite, onCloseInvite }: { today: string; invite: string | null; onCloseInvite: () => void }) {
  const [results, setResults] = useState<Result[]>(() => parseResults(read(keys.results)));
  const [progress, setProgress] = useState<Progress | null>(() => parseProgress(read(keys.progress)));
  const [current, setCurrent] = useState(() => { const p = parseProgress(read(keys.progress)); return p ? Math.min(p.answers.length, ROUND_SIZE - 1) : 0; });
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState<Finished | null>(null);
  const [online, setOnline] = useState<Online>(() => parseOnline(read(keys.online)));
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [action, setAction] = useState<Action | null>(null);
  const [challenge, setChallenge] = useState<InviteState | null>(null);
  const [inviteVersion, setInviteVersion] = useState(0);
  const [startBoard, setStartBoard] = useState<Board | null>(null);
  const [crowd, setCrowd] = useState<{ key: string; items: Record<string, Stat> } | null>(null);
  const [hosted, setHosted] = useState<Challenge | null>(null);
  const daily = results.find(r => r.mode === "daily" && r.day === today) ?? null;
  const dailyPlay = online.plays.find(p => p.mode === "daily" && p.day === today) ?? null;
  const screen = finished ? "end" : playing && progress ? "play" : "start";

  function save(next: Progress | null) { setProgress(next); write(keys.progress, next); }
  function updateOnline(change: (o: Online) => Online) { setOnline(prev => persist(change(prev))); }
  const markSent = (token: string) => updateOnline(o => withSent(o, token));
  const addLink = (code: string, token: string, host: boolean, day: string, nick: string) =>
    updateOnline(o => ({ ...o, nick, links: [...o.links.filter(l => !(l.code === code && l.token === token)), { code, token, host, day }].slice(-12) }));

  // Výzva z odkazu: otázky a výsledky hráčov (znova pri návrate na úvod, nech sú výsledky kamarátov čerstvé).
  const inviteToken = invite ? tokenFor(online, invite) : null;
  useEffect(() => {
    if (!invite) return;
    let alive = true;
    void api.challenge(invite, inviteToken).then(r => { if (alive) setChallenge({ code: invite, data: failed(r) ? null : r.challenge, error: failed(r) ? r.error : null }); });
    return () => { alive = false; };
  }, [invite, inviteToken, inviteVersion]);
  // Úvod: rebríček dňa (ak kolo pri dohraní nedošlo na server, pošle sa teraz).
  useEffect(() => {
    if (screen !== "start") return;
    let alive = true;
    void (async () => {
      if (dailyPlay && !dailyPlay.sent && !askFirst()) {
        const r = await api.play(dailyPlay);
        if (!failed(r) || final(r.status)) { if (alive && !failed(r) && r.board) setStartBoard(r.board); setOnline(prev => persist(withSent(prev, dailyPlay.token))); return; }
      }
      const r = await api.board(today, dailyPlay?.sent ? dailyPlay.token : null);
      if (alive && !failed(r)) setStartBoard(r.board);
    })();
    return () => { alive = false; };
  }, [screen, today, dailyPlay]);
  // Úvod: výsledky kamarátov v poslednej vlastnej výzve (z posledného týždňa), aj bez otvorenia odkazu.
  const hostedLink = [...online.links].reverse().find(l => l.host && l.day >= addDays(today, -6) && l.code !== invite) ?? null;
  const hostedCode = hostedLink?.code ?? null, hostedToken = hostedLink?.token ?? null;
  useEffect(() => {
    if (screen !== "start" || !hostedCode) return;
    let alive = true;
    void api.challenge(hostedCode, hostedToken).then(r => { if (alive && !failed(r)) setHosted(r.challenge); });
    return () => { alive = false; };
  }, [screen, hostedCode, hostedToken]);
  // Počas kola: koľko hráčov jednotlivé otázky trafilo (kvíz dňa dnes, inak zo všetkých kôl).
  const crowdKey = screen === "play" && progress ? `${progress.mode === "daily" ? "d" : "a"}|${progress.day}|${progress.items.map(i => i.id).join(",")}` : "";
  useEffect(() => {
    if (!crowdKey) return;
    const [kind, day, ids] = crowdKey.split("|");
    let alive = true;
    void (kind === "d" ? api.board(day).then(r => failed(r) ? null : r.board.items) : api.items(ids.split(",")).then(r => failed(r) ? null : r.items))
      .then(items => { if (alive && items) setCrowd({ key: crowdKey, items }); });
    return () => { alive = false; };
  }, [crowdKey]);

  async function submit(play: OnlinePlay) {
    setSubmission({ token: play.token, status: "sending", reply: null, error: null });
    const r = await api.play(play);
    if (failed(r)) { setSubmission(s => s?.token === play.token ? { ...s, status: "error", error: r.error } : s); return; }
    markSent(play.token);
    setSubmission(s => s?.token === play.token ? { ...s, status: "done", reply: r } : s);
    if (r.challenge) setChallenge({ code: r.challenge.code, data: r.challenge, error: null });
  }
  async function saveNick(play: OnlinePlay, nick: string | null) {
    setAction({ kind: "nick", busy: true, error: null });
    const r = await api.nick(play.token, play.day, nick);
    if (failed(r)) { setAction({ kind: "nick", busy: false, error: r.error }); return; }
    setAction(null);
    if (nick) updateOnline(o => ({ ...o, nick }));
    setSubmission(s => s?.token === play.token && s.reply ? { ...s, reply: { ...s.reply, board: r.board } } : s);
    if (play.day === today) setStartBoard(r.board);
  }
  async function host(play: OnlinePlay, nick: string) {
    setAction({ kind: "host", busy: true, error: null });
    const r = await api.host(play, nick);
    if (failed(r)) { setAction({ kind: "host", busy: false, error: r.error }); return; }
    setAction(null); addLink(r.code, play.token, true, play.day, nick); markSent(play.token);
  }
  async function join(code: string, play: OnlinePlay, nick: string) {
    setAction({ kind: "join", busy: true, error: null });
    if (!(online.plays.find(p => p.token === play.token) ?? play).sent) {
      const sent = await api.play(play);
      if (failed(sent)) { setAction({ kind: "join", busy: false, error: sent.error }); return; }
      markSent(play.token);
    }
    const r = await api.join(code, play.token, nick);
    if (failed(r)) { setAction({ kind: "join", busy: false, error: r.error }); return; }
    setAction(null); addLink(code, play.token, false, play.day, nick);
    setChallenge({ code, data: r.challenge, error: null });
  }
  function start(mode: Mode, from?: Challenge) {
    setFinished(null); setSubmission(null); setAction(null);
    // Výzva z dnešného kvízu dňa: rozohraný kvíz dňa pokračuje a len sa k výzve priradí.
    if (mode === "daily" && from && progress?.mode === "daily" && progress.day === today) { save({ ...progress, vyzva: from.code }); setPlaying(true); top(); return; }
    const seed = mode === "challenge" && from ? codeSeed(from.code) : mode === "daily" ? daySeed(today) : mix(Date.now() ^ Math.floor(Math.random() * 4294967295));
    const items = mode === "challenge" && from ? from.items : buildRound(seed, mode === "daily" ? [] : parseSeen(read(keys.seen)));
    save({ v: 1, mode, day: today, seed, items, answers: [], hidden: {}, jokers: { half: false, swap: false }, ...(from ? { vyzva: from.code } : {}) });
    setCurrent(0); setPlaying(true); top();
  }
  function finish(p: Progress) {
    const round = p.items.map(i => present(i)!), score = scoreRound(round, p.answers);
    const already = p.mode === "daily" && results.some(r => r.mode === "daily" && r.day === p.day);
    const token = newToken();
    const result: Result = { mode: p.mode, day: p.day, points: score.points, max: score.max, correct: score.correct, marks: score.marks, at: new Date().toISOString(), ...(already ? {} : { token }) };
    const play: OnlinePlay | null = already ? null : { token, mode: p.mode, day: p.day, items: p.items, answers: p.items.map((_, i) => p.answers[i] ?? null), vyzva: p.vyzva ?? null, sent: false };
    const nextResults = already ? results : [...results, result].slice(-60);
    setResults(nextResults); write(keys.results, nextResults);
    write(keys.seen, [...parseSeen(read(keys.seen)), ...p.items.map(i => i.id)].slice(-150));
    if (play) updateOnline(o => ({ ...o, plays: [...o.plays, play].slice(-8) }));
    save(null); setPlaying(false); setFinished({ result, round, answers: p.answers, play }); setAction(null);
    if (play) { if (askFirst()) setSubmission({ token, status: "ask", reply: null, error: null }); else void submit(play); }
    top();
  }
  function home() { setFinished(null); setInviteVersion(v => v + 1); top(); }

  const rival = progress?.vyzva && challenge?.code === progress.vyzva ? challenge.data?.players.find(p => p.host && !p.me) ?? null : null;
  const rivalMarks = rival && challenge?.data ? Object.fromEntries(challenge.data.items.map((x, i) => [x.id, rival.marks[i] === "1"])) : null;
  if (finished) return <End {...finished} today={today} results={results} online={online} submission={submission} action={action} challenge={challenge?.data ?? null}
    onSubmit={() => finished.play && void submit(finished.play)} onNick={(play, nick) => void saveNick(play, nick)} onHost={(play, nick) => void host(play, nick)}
    onJoin={(code, play, nick) => void join(code, play, nick)} onNew={() => start("free")} onHome={home}/>;
  if (playing && progress) return <RoundScreen progress={progress} current={current} setCurrent={setCurrent} onSave={save} onFinish={finish} onQuit={() => { setPlaying(false); setInviteVersion(v => v + 1); }}
    crowd={crowd?.key === crowdKey ? crowd.items : null} rival={rival && rivalMarks ? { nick: rival.nick, marks: rivalMarks } : null}/>;
  return <Start today={today} results={results} daily={daily} dailyPlay={dailyPlay} progress={progress} board={startBoard} online={online} hosted={hosted && hosted.code === hostedCode ? hosted : null} invite={invite ? challenge?.code === invite ? challenge : { code: invite, data: null, error: null } : null}
    action={action} onStart={start} onResume={() => setPlaying(true)} onNick={(play, nick) => void saveNick(play, nick)} onHost={(play, nick) => void host(play, nick)}
    onJoin={(code, play, nick) => void join(code, play, nick)} onCloseInvite={onCloseInvite} loadingInvite={!!invite && challenge?.code !== invite}/>;
}

function Start({ today, results, daily, dailyPlay, progress, board, online, hosted, invite, loadingInvite, action, onStart, onResume, onNick, onHost, onJoin, onCloseInvite }: {
  today: string; results: Result[]; daily: Result | null; dailyPlay: OnlinePlay | null; progress: Progress | null; board: Board | null; online: Online; hosted: Challenge | null; invite: InviteState | null; loadingInvite: boolean; action: Action | null;
  onStart: (m: Mode, from?: Challenge) => void; onResume: () => void; onNick: (play: OnlinePlay, nick: string | null) => void; onHost: (play: OnlinePlay, nick: string) => void; onJoin: (code: string, play: OnlinePlay, nick: string) => void; onCloseInvite: () => void;
}) {
  const best = ranking(results, 5), days = streak(results, today), [copied, setCopied] = useState("");
  const dailyLink = dailyPlay ? online.links.find(l => l.token === dailyPlay.token && l.host) ?? null : null;
  async function shareDaily() {
    if (!daily) return;
    const extra = board?.me && board.me.better && board.players > 1 ? ` · lepší výsledok ako ${board.me.better} % hráčov` : "";
    const text = shareText("daily", daily.day, daily.points, daily.max, daily.marks, URL_GAME, extra);
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
    {invite && <Invite state={loadingInvite ? null : invite} today={today} daily={daily} dailyPlay={dailyPlay} online={online} results={results} action={action} onStart={onStart} onJoin={onJoin} onClose={onCloseInvite}/>}
    {progress && <div className="quiz-card quiz-resume"><div><b>Rozohrané kolo</b><span>{progress.mode === "daily" ? `Kvíz dňa ${skDate(progress.day)}` : progress.mode === "challenge" ? "Výzva od kamaráta" : "Voľný kvíz"} · otázka {Math.min(progress.answers.length + 1, ROUND_SIZE)} z {ROUND_SIZE}</span></div><button className="quiz-primary" onClick={onResume}>Pokračovať<ArrowRight size={18} aria-hidden="true"/></button></div>}
    <div className="quiz-modes">
      <article className="quiz-card quiz-daily">
        <p className="quiz-kicker"><Flag size={14} aria-hidden="true"/> Kvíz dňa · {skDate(today)}</p>
        <h2>Rovnakých 30 otázok pre všetkých</h2>
        {daily ? <>
          <p className="quiz-daily-score"><b>{daily.points}</b>/{daily.max} bodov · {titleFor(daily.points, daily.max).name}</p>
          {board?.me && board.players > 1 && <p className="quiz-daily-rank"><Users size={15} aria-hidden="true"/> {board.me.rank}. miesto z {board.players}{board.me.better ? ` · viac bodov ako ${board.me.better} % hráčov` : ""}</p>}
          <p className="quiz-note">Dnes máš odohraté. Nový kvíz dňa bude zajtra.</p>
          <div className="quiz-daily-actions">
            <button className="quiz-secondary" onClick={() => void shareDaily()}><Share2 size={17} aria-hidden="true"/> Zdieľať výsledok</button>
            {dailyPlay && !dailyLink && <button className="quiz-secondary" onClick={() => document.getElementById("quiz-challenge-daily")?.scrollIntoView({ behavior: "smooth", block: "start" })}><Swords size={17} aria-hidden="true"/> Vyzvi kamaráta</button>}
          </div>
          {copied && <p className="quiz-note" role="status">{copied}</p>}
        </> : <>
          <p className="quiz-note">Zahráš ho raz za deň a porovnáš sa s ostatnými.{days > 0 ? ` Séria: ${days} ${plural(days, "deň", "dni", "dní")} po sebe.` : ""}</p>
          {board && board.players > 0 && <p className="quiz-daily-rank"><Users size={15} aria-hidden="true"/> {playedText(board.players)}</p>}
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
    {hosted && <Duel challenge={hosted} mine={null}><ShareChallenge code={hosted.code} points={hosted.players.find(p => p.me)?.points ?? 0} max={hosted.max}/></Duel>}
    {board && (board.top.length > 0 || board.me) && <DailyBoard board={board} points={board.me?.points ?? null} nick={online.nick} busy={!!action?.busy && action.kind === "nick"} error={action?.kind === "nick" ? action.error : null}
      onNick={nick => dailyPlay && onNick(dailyPlay, nick)} title={`Kvíz dňa ${skDate(today)}`}/>}
    {daily && dailyPlay && !dailyLink && <ChallengeMaker id="quiz-challenge-daily" play={dailyPlay} points={daily.points} online={online} action={action} onHost={onHost}/>}
    <section className="quiz-card quiz-ranking" aria-labelledby="quiz-ranking-title">
      <h2 id="quiz-ranking-title"><Trophy size={18} aria-hidden="true"/> Tvoje poradie</h2>
      {best.length ? <ol>{best.map((r, i) => <li key={r.at}><span className="quiz-rank">{i + 1}.</span><b>{r.points}/{r.max}</b><span>{titleFor(r.points, r.max).name}</span><small>{r.mode === "daily" ? "kvíz dňa" : r.mode === "challenge" ? "výzva" : "voľný"} · {skDate(r.day)}</small></li>)}</ol>
        : <p className="quiz-note">Zatiaľ prázdne. Po prvom kole sa tu objavia tvoje najlepšie výsledky.</p>}
      <p className="quiz-note">Osobné poradie sa ukladá iba v tomto zariadení.</p>
    </section>
    <details className="quiz-rules"><summary>Pravidlá</summary>
      <ul>
        <li>Otázky idú od ľahkých po expertné: {levels.map(l => `${PLAN[l]} ${levelNames[l]}`).join(", ")}. Body: {levels.map(l => `${levelNames[l]} ${levelPoints[l]}`).join(", ")}; spolu najviac {MAX_POINTS}.</li>
        <li>Bez časového limitu. Po každej odpovedi uvidíš vysvetlenie, zdroj a koľko hráčov otázku trafilo.</li>
        <li>Dva žolíky na kolo: <b>50 : 50</b> skryje dve nesprávne možnosti, <b>výmena</b> dá inú otázku rovnakej úrovne (vo výzve sa otázky nevymieňajú).</li>
        <li>Kvíz dňa má spoločný rebríček. Po dohraní pošleme na server tvoje odpovede pod náhodným kódom kola, bez mena, e-mailu či IP adresy; body spočíta server. Do rebríčka sa zapíšeš prezývkou, len ak chceš, a kedykoľvek ju odstrániš.</li>
        <li>Výzva: pošli kamarátovi odkaz, dostane tých istých 30 otázok a uvidíte svoje výsledky vedľa seba.</li>
        <li>Otázky sú o overiteľných faktoch (inštitúcie, voľby, vlády, dejiny, EÚ). Stav k 1. 10. 2026.</li>
      </ul>
    </details>
  </section>;
}

/** Výzva z odkazu na úvode: prijatie, porovnanie po odohraní, zápis a odoslanie ďalej. */
function Invite({ state, today, daily, dailyPlay, online, results, action, onStart, onJoin, onClose }: {
  state: InviteState | null; today: string; daily: Result | null; dailyPlay: OnlinePlay | null; online: Online; results: Result[]; action: Action | null;
  onStart: (m: Mode, from?: Challenge) => void; onJoin: (code: string, play: OnlinePlay, nick: string) => void; onClose: () => void;
}) {
  const close = <button type="button" className="quiz-invite-close" onClick={onClose} aria-label="Zavrieť výzvu"><X size={18}/></button>;
  if (!state) return <div className="quiz-card quiz-invite" role="status"><p className="quiz-note">Načítavam výzvu…</p></div>;
  if (!state.data) return <div className="quiz-card quiz-invite">{close}<p className="quiz-kicker"><Swords size={14} aria-hidden="true"/> Výzva</p><p className="quiz-note">{state.error ?? "Výzva sa nenašla."}</p></div>;
  const ch = state.data, mine = ch.players.find(p => p.me), host = ch.players.find(p => p.host) ?? null;
  const todayDaily = ch.mode === "daily" && ch.day === today;
  const played = online.plays.find(p => p.vyzva === ch.code) ?? (todayDaily && daily ? dailyPlay : null);
  const playedResult = played ? results.find(r => r.token === played.token) ?? null : null;
  if (mine?.host) return <Duel challenge={ch} mine={null}>{close}<ShareChallenge code={ch.code} points={mine.points} max={ch.max}/></Duel>;
  if (mine) return <Duel challenge={ch} mine={null}>{close}<ShareChallenge code={ch.code} points={mine.points} max={ch.max} own={false}/></Duel>;
  if (played && playedResult) return <Duel challenge={ch} mine={{ nick: "Ty", points: playedResult.points, marks: playedResult.marks }}>{close}
    <NickForm key={online.nick ?? ""} initial={online.nick} label="Zapíš sa do výzvy, nech výsledok vidia aj ostatní" button="Zapísať" busy={!!action?.busy && action.kind === "join"}
      error={action?.kind === "join" ? action.error : null} onSubmit={nick => onJoin(ch.code, played, nick)}/>
  </Duel>;
  return <article className="quiz-card quiz-invite" aria-label="Výzva od kamaráta">
    {close}
    <p className="quiz-kicker"><Swords size={14} aria-hidden="true"/> Výzva{todayDaily ? ` · kvíz dňa ${skDate(ch.day)}` : ""}</p>
    <h2>{host ? `${host.nick} ťa vyzýva` : "Výzva v Tridsiatke"}</h2>
    {host && <p className="quiz-invite-score"><b>{host.points}</b>/{ch.max} bodov · {titleFor(host.points, ch.max).name}</p>}
    <p className="quiz-note">{todayDaily && !daily ? "Je to dnešný kvíz dňa: zahráš ho ako zvyčajne a výsledok sa porovná aj s výzvou." : "Dostaneš tých istých 30 otázok. Dáš viac bodov?"}{ch.players.length > 1 ? ` Výzvu už ${plural(ch.players.length, "hral", "hrali", "hralo")} ${ch.players.length} ${plural(ch.players.length, "hráč", "hráči", "hráčov")}.` : ""}</p>
    <button className="quiz-primary" onClick={() => onStart(todayDaily && !daily ? "daily" : "challenge", ch)}>Prijať výzvu<ArrowRight size={18} aria-hidden="true"/></button>
  </article>;
}

/** Nová výzva z odohraného kola: prezývka a odkaz pre kamaráta. */
function ChallengeMaker({ id, play, points, online, action, onHost }: { id?: string; play: OnlinePlay; points: number; online: Online; action: Action | null; onHost: (play: OnlinePlay, nick: string) => void }) {
  const link = online.links.find(l => l.token === play.token && l.host);
  return <section className="quiz-card quiz-maker" id={id} aria-label="Vyzvi kamaráta">
    <p className="quiz-kicker"><Swords size={14} aria-hidden="true"/> Vyzvi kamaráta</p>
    {link ? <>
      <h2>Výzva je pripravená</h2>
      <p className="quiz-note">Kamarát dostane tých istých 30 otázok. Výsledky uvidíš po otvorení odkazu aj tu na úvode Tridsiatky.</p>
      <ShareChallenge code={link.code} points={points} max={MAX_POINTS}/>
    </> : <>
      <h2>Tých istých 30 otázok pre kamaráta</h2>
      <p className="quiz-note">Vytvoríme odkaz, cez ktorý kamarát zahrá presne tvoje kolo. Na konci uvidíte svoje výsledky vedľa seba.</p>
      <NickForm key={online.nick ?? ""} initial={online.nick} label="Pod akou prezývkou vyzývaš" button="Vytvoriť výzvu" busy={!!action?.busy && action.kind === "host"} error={action?.kind === "host" ? action.error : null}
        onSubmit={nick => onHost(play, nick)} note="Prezývku uvidí každý, kto dostane odkaz."/>
    </>}
  </section>;
}

function RoundScreen({ progress, current, setCurrent, onSave, onFinish, onQuit, crowd, rival }: {
  progress: Progress; current: number; setCurrent: (n: number) => void; onSave: (p: Progress) => void; onFinish: (p: Progress) => void; onQuit: () => void;
  crowd: Record<string, Stat> | null; rival: { nick: string; marks: Record<string, boolean> } | null;
}) {
  const q = present(progress.items[current])!, answer = progress.answers[current], answered = answer !== undefined && answer !== null;
  const hidden = progress.hidden[current] ?? [], round = progress.items.map(i => present(i)!), points = scoreRound(round.slice(0, progress.answers.length), progress.answers).points;
  const noSwap = progress.mode === "challenge";
  function choose(i: number) {
    if (answered || hidden.includes(i)) return;
    const answers = progress.answers.slice(); answers[current] = i;
    onSave({ ...progress, answers });
  }
  function next() { if (current >= ROUND_SIZE - 1) onFinish(progress); else { setCurrent(current + 1); requestAnimationFrame(() => document.querySelector<HTMLElement>(".quiz-question")?.focus({ preventScroll: false })); } }
  function useHalf() { if (progress.jokers.half || answered) return; onSave({ ...progress, hidden: { ...progress.hidden, [current]: halve(q, progress.seed) }, jokers: { ...progress.jokers, half: true } }); }
  function useSwap() {
    if (progress.jokers.swap || answered || noSwap) return;
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
  const correct = answered && answer === q.correct, crowdText = hitText(crowd?.[q.id], progress.mode === "daily"), rivalOk = rival?.marks[q.id];
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
      <button disabled={progress.jokers.swap || noSwap} onClick={useSwap}><span><Shuffle size={15} aria-hidden="true"/> Výmena</span><small>{noSwap ? "vo výzve nie" : progress.jokers.swap ? "použitá" : "iná otázka"}</small></button>
    </div> : <div className="quiz-feedback" data-correct={correct} role="status" aria-live="polite">
      <p className="quiz-verdict">{correct ? `Správne! +${levelPoints[q.level]} ${plural(levelPoints[q.level], "bod", "body", "bodov")}` : `Nesprávne. Správne je: ${q.options[q.correct]}`}</p>
      <p>{q.explain}</p>
      {(crowdText || rivalOk !== undefined) && <p className="quiz-crowd"><Users size={14} aria-hidden="true"/><span>{crowdText}{crowdText && rivalOk !== undefined ? " " : ""}{rivalOk !== undefined && <b>{rival!.nick}: {rivalOk ? "správne" : "nesprávne"}.</b>}</span></p>}
      <a href={q.source} target="_blank" rel="noopener noreferrer">Zdroj <ExternalLink size={13} aria-hidden="true"/></a>
      <button className="quiz-primary quiz-next" onClick={next} autoFocus>{current >= ROUND_SIZE - 1 ? "Zobraziť výsledok" : "Ďalšia otázka"}<ArrowRight size={18} aria-hidden="true"/></button>
    </div>}
  </section>;
}

function End({ result, round, answers, play, today, results, online, submission, action, challenge, onSubmit, onNick, onHost, onJoin, onNew, onHome }: Finished & {
  today: string; results: Result[]; online: Online; submission: Submission | null; action: Action | null; challenge: Challenge | null;
  onSubmit: () => void; onNick: (play: OnlinePlay, nick: string | null) => void; onHost: (play: OnlinePlay, nick: string) => void; onJoin: (code: string, play: OnlinePlay, nick: string) => void; onNew: () => void; onHome: () => void;
}) {
  const score = scoreRound(round, answers), title = titleFor(result.points, result.max), best = ranking(results, 10);
  const place = best.findIndex(r => r.at === result.at), missed = round.map((q, i) => ({ q, a: answers[i] })).filter(x => x.a !== x.q.correct);
  const [copied, setCopied] = useState("");
  const reply = submission && play && submission.token === play.token ? submission : null, board = reply?.reply?.board ?? null;
  // Výzva: najčerstvejšia verzia (po zápise do výzvy), inak tá z odpovede na odohrané kolo.
  const stats = board?.items ?? reply?.reply?.items ?? {}, linked = play?.vyzva ? challenge?.code === play.vyzva ? challenge : reply?.reply?.challenge ?? null : null;
  const joined = !!linked?.players.some(p => p.me);
  const extra = board?.me && board.me.better && board.players > 1 ? ` · lepší výsledok ako ${board.me.better} % hráčov` : "";
  const text = shareText(result.mode, result.day, result.points, result.max, result.marks, URL_GAME, extra);
  async function share() {
    try { if (navigator.share) { await navigator.share({ title: "Tridsiatka", text }); return; } } catch (e) { if (e instanceof Error && e.name === "AbortError") return; }
    try { await navigator.clipboard.writeText(text); setCopied("Výsledok je skopírovaný, môžeš ho vložiť do správy."); } catch { setCopied(text); }
  }
  return <section className="quiz quiz-end" aria-labelledby="quiz-end-title">
    <header className="quiz-result">
      <p className="quiz-kicker">{result.mode === "daily" ? `Kvíz dňa ${skDate(result.day)}` : result.mode === "challenge" ? "Výzva" : "Voľný kvíz"}</p>
      <h1 id="quiz-end-title">{title.name}</h1>
      <p className="quiz-score"><b>{result.points}</b><span>/{result.max} bodov</span></p>
      <p>{title.text} Správne odpovede: {result.correct} z {ROUND_SIZE}.</p>
      {place >= 0 && <p className="quiz-place"><Trophy size={16} aria-hidden="true"/> {place + 1}. miesto v tvojom poradí</p>}
    </header>
    <div className="quiz-marks" role="img" aria-label={`Správne ${result.correct} z ${ROUND_SIZE}`}>{[...result.marks].map((m, i) => <span key={i} data-ok={m === "1"} data-level={round[i]?.level}/>)}</div>
    {play && reply?.status === "ask" && <div className="quiz-card quiz-online"><p className="quiz-kicker"><Users size={14} aria-hidden="true"/> Porovnanie s ostatnými</p>
      <p className="quiz-note">Tvoj prehliadač žiada nesledovať. Výsledok pošleme na server, len ak chceš (pod náhodným kódom kola, bez údajov o tebe).</p>
      <button className="quiz-primary" onClick={onSubmit}>Porovnať sa s ostatnými</button></div>}
    {play && reply?.status === "sending" && <div className="quiz-card quiz-online" role="status"><p className="quiz-note">Porovnávame s ostatnými hráčmi…</p></div>}
    {play && reply?.status === "error" && <div className="quiz-card quiz-online"><p className="quiz-note">{reply.error}</p><button className="quiz-secondary" onClick={onSubmit}><RefreshCw size={16} aria-hidden="true"/> Skúsiť znova</button></div>}
    {play && linked && <Duel challenge={linked} mine={{ nick: "Ty", points: result.points, marks: result.marks }}>
      {joined ? <ShareChallenge code={linked.code} points={result.points} max={result.max} own={false}/>
        : <NickForm key={online.nick ?? ""} initial={online.nick} label="Zapíš sa do výzvy, nech výsledok vidia aj ostatní" button="Zapísať" busy={!!action?.busy && action.kind === "join"}
            error={action?.kind === "join" ? action.error : null} onSubmit={nick => onJoin(linked.code, play, nick)}/>}
    </Duel>}
    {play && result.mode === "daily" && board && <DailyBoard board={board} points={result.points} nick={online.nick} busy={!!action?.busy && action.kind === "nick"} error={action?.kind === "nick" ? action.error : null} onNick={nick => onNick(play, nick)}/>}
    <ul className="quiz-breakdown">{levels.map(l => <li key={l} data-level={l}><span>{levelNames[l]}</span><b>{score.byLevel[l].correct}/{score.byLevel[l].total}</b><span className="quiz-bar" aria-hidden="true"><span style={{ width: `${score.byLevel[l].total ? score.byLevel[l].correct / score.byLevel[l].total * 100 : 0}%` }}/></span></li>)}</ul>
    {play && !linked && <ChallengeMaker play={play} points={result.points} online={online} action={action} onHost={onHost}/>}
    <div className="quiz-actions">
      <button className="quiz-primary" onClick={() => void share()}><Share2 size={17} aria-hidden="true"/> Zdieľať výsledok</button>
      <button className="quiz-secondary" onClick={onNew}><RefreshCw size={17} aria-hidden="true"/> Nové kolo</button>
      <button className="quiz-secondary" onClick={onHome}><RotateCcw size={17} aria-hidden="true"/> Na začiatok</button>
    </div>
    {copied && <p className="quiz-note" role="status">{copied.includes("\n") ? <><Copy size={14} aria-hidden="true"/> Skopíruj si výsledok: <code>{copied}</code></> : copied}</p>}
    {missed.length > 0 && <details className="quiz-card quiz-review"><summary>Chybné odpovede ({missed.length})</summary>
      <ol>{missed.map(({ q, a }) => { const hit = hitText(stats[q.id], result.mode === "daily"); return <li key={q.id}><b>{q.q}</b><span className="quiz-review-answer"><Check size={14} aria-hidden="true"/> {q.options[q.correct]}</span>{a !== null && a !== undefined && <span className="quiz-review-wrong"><X size={14} aria-hidden="true"/> {q.options[a]}</span>}<small>{q.explain}</small>{hit && <small className="quiz-review-crowd"><Users size={12} aria-hidden="true"/> {hit}</small>}</li>; })}</ol>
    </details>}
    {result.mode === "daily" && result.day === today && <p className="quiz-note">Kvíz dňa sa počíta raz za deň. Ďalšie kolá hraj ako voľný kvíz.</p>}
  </section>;
}
