"use client";

import { lazy, Suspense, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { ArrowUpRight, Box, Check, ChevronLeft, ChevronRight, Link2, Pause, Play, Search, Share2, UserRound, X } from "lucide-react";
import Chamber2D from "@/components/chamber-2d";
import { VOTES_INDEX, clubLabel, clubTotals, kindNames, markColors, markNames, marks, matchesQuery, required, seatMembers, skDay, voteSource, type Mark, type SeatedMember, type VoteIndex, type VoteKind, type VoteSummary } from "@/lib/votes";
import { DEPUTIES_FILE, clubAgreement, clubStats, deputyProfile, deputyStats, differentAt, displayName, findDeputies, partyAt, unaffiliatedPresence, voteDetailAt, type DeputiesData, type DeputyRow } from "@/lib/deputies";
import { CLUBS_AS_OF, TERM, UNAFFILIATED, clubEntries, clubSeatParty } from "@/lib/parliament-clubs";
import { voteShareCard } from "./vote-share";
import { track } from "@/lib/track";
import partyLogos from "@/lib/party-logos.json";
import "@/app/parliament-ar.css";
import "@/app/parliament-page.css";

/*
  Stránka Parlament (/parlament): sála v 2D (ľahký úvod, záloha bez WebGL) alebo v 3D (components/parliament-ar.tsx,
  načíta sa až po voľbe 3D), skutočné kluby NR SR, hlasovania 9. volebného obdobia a ako hlasoval každý poslanec.
  Stav je v adrese: hlasovanie (h), poslanec (poslanec), režim 3D sály (rezim) — odkaz sa dá zdieľať aj s náhľadom.
  Všetko podľa rovnakých pravidiel pre každého (lib/deputies.ts), bez ručného výberu „zaujímavých“ hlasovaní.
*/
const ParliamentChamber = lazy(() => import("@/components/parliament-ar"));
export type Mode3d = "strany" | "koalicia" | "bloky" | "vyvoj" | "hlasovania";
export type ParliamentChange = { vote?: number | null; deputy?: number | null; mode?: string | null };

const logos = partyLogos as Record<string, { src: string }>;
const clubInfo = (party: string | null) => clubEntries.find(c => c.id === (party ?? UNAFFILIATED.id)) ?? { id: party ?? UNAFFILIATED.id, short: party ? party.toUpperCase() : UNAFFILIATED.short, color: UNAFFILIATED.color, seats: 0, club: "" };
const clubColors = clubSeatParty.map(id => clubInfo(id).color);
const unaffiliatedToday = clubEntries.find(c => c.id === UNAFFILIATED.id)?.seats ?? 0;
const VOTE_KINDS: (VoteKind | "vsetky")[] = ["vsetky", "ustavny", "nedovera", "rozpocet", "veto", "zakon"];
const PAGE = 20;
const MARK_LABEL: Record<Mark, string> = { Z: "Za", P: "Proti", "?": "Zdržali sa", N: "Nehlasovali", "0": "Neprítomní" };
const share = (a: number, b: number) => b ? a / b * 100 : 0;
const percent = (v: number) => `${(Math.round(v * 10) / 10).toLocaleString("sk-SK")} %`;
const plural = (n: number, one: string, few: string, many: string) => n === 1 ? one : n >= 2 && n <= 4 ? few : many;
const votesCount = (v: Pick<VoteSummary, "za" | "proti" | "zdrzalo" | "nehlasovalo" | "nepritomni">): Record<Mark, number> => ({ Z: v.za, P: v.proti, "?": v.zdrzalo, N: v.nehlasovalo, "0": v.nepritomni });
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let indexPromise: Promise<VoteIndex> | null = null, deputiesPromise: Promise<DeputiesData> | null = null;
const getJson = <T,>(url: string) => fetch(url).then(r => r.ok ? r.json() as Promise<T> : Promise.reject(new Error(`${r.status}`)));
const loadIndex = () => indexPromise ??= getJson<VoteIndex>(VOTES_INDEX).catch(e => { indexPromise = null; throw e; });
const loadDeputies = () => deputiesPromise ??= getJson<DeputiesData>(DEPUTIES_FILE).catch(e => { deputiesPromise = null; throw e; });
// Kód 3D sály sa stiahne pri zámere (prejdenie myšou, fokus); knižnica a model až v nej.
const prefetch3d = () => { void import("@/components/parliament-ar").catch(() => {}); };

function ClubMark({ party, size = 18 }: { party: string | null; size?: number }) {
  const info = clubInfo(party), src = party ? logos[party]?.src : undefined;
  return src ? <Image className="parl-logo" src={src} alt="" width={Math.round(size * 1.3)} height={size} unoptimized loading="lazy"/> : <i className="parl-dot" style={{ background: info.color }} aria-hidden="true"/>;
}

export default function ParliamentPage({ vote, deputy, mode, onChange, onNavigate }: { vote: number | null; deputy: number | null; mode: string | null; onChange: (change: ParliamentChange) => void; onNavigate: (view: string) => void }) {
  const [index, setIndex] = useState<VoteIndex | null>(null), [data, setData] = useState<DeputiesData | null>(null), [failed, setFailed] = useState(false);
  const [view3d, setView3d] = useState(false), [reduced, setReduced] = useState(false);
  const [query, setQuery] = useState(""), [kind, setKind] = useState<VoteKind | "vsetky">("vsetky"), [limit, setLimit] = useState(PAGE);
  const [highlight, setHighlight] = useState(false), [playing, setPlaying] = useState(false), [focusClub, setFocusClub] = useState<string | null>(null);
  const [card, setCard] = useState<{ preview: string; file: File; native: boolean } | null>(null), [message, setMessage] = useState("");
  const [deputyQuery, setDeputyQuery] = useState("");
  const stage = useRef<HTMLDivElement>(null), change = useRef(onChange);
  useEffect(() => { change.current = onChange; });

  useEffect(() => {
    let alive = true;
    Promise.all([loadIndex(), loadDeputies()]).then(([i, d]) => { if (alive) { setIndex(i); setData(d); } }).catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)"), update = () => setReduced(media.matches);
    update(); media.addEventListener("change", update); return () => media.removeEventListener("change", update);
  }, []);

  const position = useMemo(() => new Map(data?.hlasovania.map((id, j) => [id, j]) ?? []), [data]);
  const byId = useMemo(() => new Map(index?.hlasovania.map(v => [v.id, v]) ?? []), [index]);
  const j = vote !== null ? position.get(vote) ?? -1 : -1;
  const total = data?.hlasovania.length ?? TERM.votes;
  const summary = vote !== null ? byId.get(vote) ?? null : null;
  const detail = useMemo(() => data && j >= 0 ? voteDetailAt(data, j) : null, [data, j]);
  const seated = useMemo(() => detail ? seatMembers(detail) : null, [detail]);
  const latestSeats = useMemo(() => data ? seatMembers(voteDetailAt(data, 0)) : null, [data]);
  const differing = useMemo(() => data && j >= 0 ? differentAt(data, j) : [], [data, j]);
  const diffIds = useMemo(() => new Set(differing.map(d => d.row.id)), [differing]);
  const row = data && deputy !== null ? data.poslanci.find(r => r.id === deputy) ?? null : null;
  const stageSeats = seated ?? latestSeats;
  const spot = row && stageSeats ? stageSeats.find(s => s.id === row.id) ?? null : null;
  const mode3d: Mode3d = vote !== null ? "hlasovania" : mode && mode !== "hlasovania" ? mode as Mode3d : "strany";
  const voteList = useMemo(() => index ? index.hlasovania.filter(v => (kind === "vsetky" || v.druh === kind) && matchesQuery(v, query)) : [], [index, kind, query]);
  const playlist = useMemo(() => voteList.map(v => v.id).reverse(), [voteList]);

  // Neplatné hlasovanie alebo poslanec v adrese (napr. zo starého odkazu) sa po načítaní dát zahodia;
  // režim Hlasovania bez hlasovania ukáže najnovšie.
  useEffect(() => {
    if (!data || !index) return;
    const patch: ParliamentChange = {};
    if (vote !== null && !position.has(vote)) patch.vote = null;
    if (deputy !== null && !data.poslanci.some(r => r.id === deputy)) patch.deputy = null;
    if (mode === "hlasovania" && vote === null) { patch.vote = index.hlasovania[0]?.id ?? null; patch.mode = null; }
    if (Object.keys(patch).length) change.current(patch);
  }, [data, index, vote, deputy, mode, position]);
  // Prehrávanie: hlasovania z aktuálneho zoznamu (filter a hľadanie) chronologicky, jedno za 1,5 s.
  useEffect(() => {
    if (!playing) return;
    const at = vote === null ? -1 : playlist.indexOf(vote);
    const timer = window.setTimeout(() => {
      const next = playlist[at + 1];
      if (next === undefined || reducedMotion()) setPlaying(false); else change.current({ vote: next, mode: null });
    }, at < 0 ? 0 : 1500);
    return () => clearTimeout(timer);
  }, [playing, vote, playlist]);
  // Titulok okna podľa výberu (MandatApp nastaví „Parlament · Mandát“ pri vstupe, preto až po ňom).
  useEffect(() => {
    const timer = window.setTimeout(() => { document.title = summary ? `${summary.nazov} · Parlament · Mandát` : row ? `${displayName(row.meno)} · Parlament · Mandát` : "Parlament · Mandát"; }, 0);
    return () => clearTimeout(timer);
  }, [summary, row]);
  useEffect(() => {
    if (!playing) return;
    const stop = () => { if (document.hidden) setPlaying(false); };
    document.addEventListener("visibilitychange", stop);
    return () => document.removeEventListener("visibilitychange", stop);
  }, [playing]);

  const reveal = () => {
    const el = stage.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    if (top < -40 || top > window.innerHeight * .45) el.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
  };
  const showProfile = () => window.setTimeout(() => document.getElementById("poslanec")?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" }), 0);
  const chooseVote = (id: number, scroll = true) => { setPlaying(false); setCard(null); setMessage(""); change.current({ vote: id, mode: null }); if (scroll) reveal(); track("parlament", "vote"); };
  const step = (id: number | undefined) => { if (id !== undefined) { setCard(null); setMessage(""); change.current({ vote: id, mode: null }); } };
  const clearVote = () => { setPlaying(false); setCard(null); setHighlight(false); change.current({ vote: null, mode: null }); };
  const chooseDeputy = (id: number | null, then?: "profile" | "stage") => {
    change.current({ deputy: id });
    if (id !== null) track("parlament", "deputy");
    if (then === "profile") showProfile(); else if (then === "stage") reveal();
  };
  const setMode3d = (m: Mode3d) => {
    setPlaying(false);
    if (m === "hlasovania") change.current({ mode: null, vote: vote ?? index?.hlasovania[0]?.id ?? null });
    else change.current({ mode: m === "strany" ? null : m, vote: null });
  };
  const togglePlay = () => {
    if (playing) { setPlaying(false); return; }
    if (!playlist.length) return;
    if (vote !== null && playlist.indexOf(vote) === playlist.length - 1) change.current({ vote: playlist[0], mode: null });
    setPlaying(true); reveal(); track("parlament", "play");
  };
  async function makeCard() {
    if (!summary || !seated) return;
    setMessage("");
    try {
      const blob = await voteShareCard(summary, seated, window.location.host);
      const preview = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("preview")); reader.readAsDataURL(blob); });
      const file = new File([blob], `hlasovanie-${summary.id}.png`, { type: "image/png" });
      setCard({ preview, file, native: !!navigator.canShare?.({ files: [file] }) });
      track("parlament", "card");
    } catch { setMessage("Obrázok sa nepodarilo vytvoriť. Skús to znova."); }
  }
  async function shareCard() {
    if (!card) return;
    try { await navigator.share({ files: [card.file], title: summary?.nazov ?? "Hlasovanie NR SR · Mandát" }); }
    catch (e) { if (!(e instanceof DOMException && e.name === "AbortError")) setMessage("Zdieľanie nebolo dostupné. Obrázok si môžeš stiahnuť."); }
  }
  async function copyLink() {
    try { await navigator.clipboard.writeText(window.location.href); setMessage("Odkaz je skopírovaný."); }
    catch { setMessage("Odkaz sa nepodarilo skopírovať. Skopíruj adresu stránky."); }
  }

  const colors = seated ? seated.map(s => markColors[s.mark]) : clubColors;
  const rings = useMemo(() => seated && diffIds.size ? new Set(seated.filter(s => diffIds.has(s.id)).map(s => s.seat)) : undefined, [seated, diffIds]);
  const dim = useMemo(() => {
    if (seated) return highlight && diffIds.size ? new Set(seated.filter(s => !diffIds.has(s.id)).map(s => s.seat)) : null;
    return focusClub ? new Set(clubSeatParty.flatMap((id, i) => id === focusClub ? [] : [i])) : null;
  }, [seated, highlight, diffIds, focusClub]);
  const label2d = summary ? `Hlasovanie ${summary.nazov}: za ${summary.za}, proti ${summary.proti}, zdržalo sa ${summary.zdrzalo}, nehlasovalo ${summary.nehlasovalo}, neprítomní ${summary.nepritomni}.`
    : `Kluby NR SR k ${skDay(CLUBS_AS_OF)}: ${clubEntries.map(c => `${c.short} ${c.seats}`).join(", ")}.`;
  const need = summary ? required(summary) : null;

  return <div className="parl">
    <section className="intro parl-intro"><div>
      <h1>Parlament</h1>
      <p className="intro-description">Kto sedí v Národnej rade a ako hlasoval každý zo {TERM.deputies} poslancov a poslankýň v {TERM.votes} hlasovaniach o zákonoch, rozpočtoch a nedôvere.</p>
      <ul className="parl-facts">
        <li><b>150</b><span>kresiel</span></li>
        <li><b>{clubEntries.length - (unaffiliatedToday ? 1 : 0)}</b><span>klubov · {unaffiliatedToday} {plural(unaffiliatedToday, "nezaradený", "nezaradení", "nezaradených")}</span></li>
        <li><b>{TERM.votes}</b><span>hlasovaní od {skDay(TERM.since)}</span></li>
      </ul>
    </div><figure className="parl-preview">
      <button type="button" aria-label="Preskúmať sálu v 3D" onPointerEnter={prefetch3d} onFocus={prefetch3d}
        onClick={() => { setView3d(true); stage.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }); track("parlament", "3d"); }}>
        <Image src="/models/chamber-clubs-2026-10-01.webp" width={1209} height={518} alt="Ilustračná 3D sála podľa klubov k 1. októbru 2026" unoptimized/>
        <span><Box size={16} aria-hidden="true"/>Preskúmať v 3D<ArrowUpRight size={16} aria-hidden="true"/></span>
      </button>
      <figcaption>Náhľad klubov k 1. 10. 2026 · ilustračná sála</figcaption>
    </figure></section>

    <section className="parl-stage-block" aria-label="Sála">
      <div ref={stage} className="parl-stage-head">
        <div className="par3d-seg parl-view" role="group" aria-label="Zobrazenie sály">
          <button type="button" aria-pressed={!view3d} onClick={() => setView3d(false)}>Sála 2D</button>
          <button type="button" aria-pressed={view3d} onPointerEnter={prefetch3d} onFocus={prefetch3d} onClick={() => { setView3d(true); track("parlament", "3d"); }}><Box size={15} aria-hidden="true"/>3D sála</button>
        </div>
        <span className="parl-stage-label">{summary ? `Hlasovanie ${skDay(summary.datum)}` : `Kluby k ${skDay(CLUBS_AS_OF)}`}</span>
      </div>
      {view3d
        ? <Suspense fallback={<div className="parl-stage parl-stage-wait" role="status"><Chamber2D colors={colors} label={label2d}/><span>Načítava sa 3D sála…</span></div>}>
            <ParliamentChamber mode={mode3d} onMode={setMode3d} vote={summary} voteSeats={seated} latestSeats={latestSeats} deputy={deputy}
              onDeputy={id => chooseDeputy(id)} onProfile={showProfile} highlightDiff={highlight} differing={diffIds}/>
          </Suspense>
        : <div className="parl-stage">
            <Chamber2D colors={colors} label={label2d} spotlight={spot?.seat ?? null} rings={rings} dim={dim}
              onSeat={seat => { const m = stageSeats?.[seat]; if (m) chooseDeputy(deputy === m.id ? null : m.id); }}/>
            <button type="button" className="parl-enter" onPointerEnter={prefetch3d} onFocus={prefetch3d} onClick={() => { setView3d(true); track("parlament", "3d"); }}><Box size={18} aria-hidden="true"/>Vstúpiť do 3D sály</button>
            {playing && summary && <p className="parl-playing" role="status"><span>{skDay(summary.datum)}</span>{summary.nazov}</p>}
          </div>}
      {!view3d && (seated && summary
        ? <ul className="parl-legend" aria-label="Hlasy v sále">{marks.map(m => <li key={m}><i style={{ background: markColors[m] }} aria-hidden="true"/>{MARK_LABEL[m]} <b>{votesCount(summary)[m]}</b></li>)}{rings && <li><i className="parl-ring" aria-hidden="true"/>Inak ako klub <b>{rings.size}</b></li>}</ul>
        : <ul className="parl-legend parl-clubs-legend" aria-label="Kluby v sále">{clubEntries.map(c => <li key={c.id}><button type="button" aria-pressed={focusClub === c.id} onClick={() => setFocusClub(focusClub === c.id ? null : c.id)}><ClubMark party={c.id === UNAFFILIATED.id ? null : c.id}/>{c.short}<b>{c.seats}</b></button></li>)}</ul>)}
      {!view3d && row && <div className="par3d-detail par3d-inspection parl-seat-card">
        <ClubMark party={spot ? (spot.party === UNAFFILIATED.id ? null : spot.party) : null} size={22}/>
        <span><b>{displayName(row.meno)}</b><small>{spot ? <>{clubLabel(spot.club)}{seated && <> · <em>{markNames[spot.mark]}</em></>}</> : "V tomto hlasovaní nebol poslancom."}</small></span>
        <button type="button" onClick={showProfile}><UserRound size={15} aria-hidden="true"/>Profil</button>
        <button type="button" className="parl-icon-button" aria-label="Zrušiť výber poslanca" onClick={() => chooseDeputy(null)}><X size={16}/></button>
      </div>}
      {!view3d && !row && <p className="parl-hint">{summary ? "Ťukni na kreslo a uvidíš, kto tam sedí a ako hlasoval." : "Ťukni na kreslo a uvidíš poslanca. Klub zvýrazníš v zozname."} Kreslá sú podľa klubov, nie skutočný zasadací poriadok. Pozadie: večerná Bratislava, ilustrácia vytvorená pomocou AI.</p>}
    </section>

    {failed && <p className="parl-error" role="alert">Hlasovania sa nepodarilo načítať. Skontroluj pripojenie a obnov stránku.</p>}

    <div className="parl-columns">
      <div className="parl-column">
        {summary && seated && detail && need && <section className="parl-vote" aria-labelledby="parl-vote-title">
          <div className="parl-vote-top">
            <button type="button" className="parl-back" onClick={clearVote}><X size={15} aria-hidden="true"/>Späť na kluby</button>
            <div className="parl-step" role="group" aria-label="Listovanie v hlasovaniach">
              <button type="button" aria-label="Staršie hlasovanie" disabled={!data || j >= total - 1} onClick={() => step(data?.hlasovania[j + 1])}><ChevronLeft size={18}/></button>
              <span>{total - j} / {total}</span>
              <button type="button" aria-label="Novšie hlasovanie" disabled={!data || j <= 0} onClick={() => step(data?.hlasovania[j - 1])}><ChevronRight size={18}/></button>
              <button type="button" className="parl-play" disabled={reduced || !playlist.length} aria-pressed={playing} onClick={togglePlay}>{playing ? <Pause size={15} aria-hidden="true"/> : <Play size={15} aria-hidden="true"/>}{playing ? "Pozastaviť" : "Prehrať"}</button>
            </div>
          </div>
          <p className="par3d-vote-meta">{skDay(summary.datum)} · {summary.schodza}. schôdza · {kindNames[summary.druh]}</p>
          <h2 id="parl-vote-title" className="parl-vote-title">{summary.nazov}</h2>
          <div className="par3d-board" role="img" aria-label={`Výsledok: za ${summary.za}, proti ${summary.proti}, zdržalo sa ${summary.zdrzalo}, nehlasovalo ${summary.nehlasovalo}, neprítomní ${summary.nepritomni}. ${summary.preslo ? "Návrh prešiel" : "Návrh neprešiel"}.`}>
            {marks.map(m => <span key={m} data-mark={m}><small><i style={{ background: markColors[m] }} aria-hidden="true"/>{MARK_LABEL[m]}</small><b>{votesCount(summary)[m]}</b></span>)}
            <strong data-passed={summary.preslo}>{summary.preslo ? "Návrh prešiel" : "Návrh neprešiel"}</strong>
          </div>
          <p className="par3d-vote-rule">Na prijatie {summary.druh === "nedovera" ? "nedôvery" : "návrhu"} treba {need.votes} hlasov ({need.rule}). Za hlasovalo {summary.za}. <a href={voteSource(summary.id)} target="_blank" rel="noopener noreferrer">nrsr.sk<ArrowUpRight size={12} aria-hidden="true"/><span className="sr-only"> (nová karta)</span></a></p>
          {playing && <p className="parl-note" role="status">Prehrávam {playlist.indexOf(summary.id) + 1}. z {playlist.length} hlasovaní v zozname, od najstaršieho.</p>}
          {reduced && <p className="parl-note">Prehrávanie je vypnuté podľa nastavenia obmedzeného pohybu; listuj šípkami.</p>}
          {differing.length > 0
            ? <div className="parl-diff">
                <p><b>Inak ako väčšina klubu: {differing.length}</b> {plural(differing.length, "poslanec alebo poslankyňa", "poslanci", "poslancov")}</p>
                <ul>{differing.map(d => <li key={d.row.id}><button type="button" aria-pressed={deputy === d.row.id} onClick={() => chooseDeputy(deputy === d.row.id ? null : d.row.id, "stage")}>
                  <i style={{ background: markColors[d.mark] }} aria-hidden="true"/>{displayName(d.row.meno)}<small>{clubInfo(d.party).short} · {markNames[d.mark]}, klub: {markNames[d.line]}</small></button></li>)}</ul>
                <label className="parl-toggle"><input type="checkbox" checked={highlight} onChange={e => setHighlight(e.target.checked)}/><span>Zvýrazniť ich v sále</span></label>
              </div>
            : <p className="parl-note">Nikto z prítomných nehlasoval inak ako nadpolovičná väčšina jeho klubu.</p>}
          <ul className="par3d-clubs" aria-label="Hlasovanie podľa klubov">{clubTotals(detail).map(r => <li key={r.club}>
            <span>{clubLabel(r.club)}<small>{r.total}</small></span>
            <span className="par3d-club-bar" aria-hidden="true">{marks.map(k => r.counts[k] > 0 && <i key={k} style={{ flexGrow: r.counts[k], background: markColors[k] }}/>)}</span>
            <small>{marks.filter(k => r.counts[k] > 0).map(k => `${markNames[k]} ${r.counts[k]}`).join(" · ")}</small>
          </li>)}</ul>
          <RollCall seated={seated} diffIds={diffIds} deputy={deputy} onDeputy={id => chooseDeputy(deputy === id ? null : id, "stage")}/>
          <div className="parl-share">
            <button type="button" onClick={makeCard}><Share2 size={15} aria-hidden="true"/>Obrázok hlasovania</button>
            <button type="button" onClick={copyLink}><Link2 size={15} aria-hidden="true"/>Kopírovať odkaz</button>
            {message && <span role="status">{message}</span>}
          </div>
          {card && <div className="par3d-share-preview"><Image unoptimized src={card.preview} alt="Obrázok hlasovania: sála vo farbách hlasov a výsledok" width="72" height="90"/>
            <span>Obrázok hlasovania{card.native && <button className="par3d-share" type="button" onClick={shareCard}><Share2 size={14} aria-hidden="true"/>Zdieľať obrázok</button>}<a href={card.preview} download={card.file.name}>Stiahnuť PNG</a></span>
            <button type="button" aria-label="Skryť náhľad obrázka" onClick={() => setCard(null)}><X size={16}/></button></div>}
        </section>}

        <section className="parl-votes" aria-labelledby="parl-votes-title">
          <div className="parl-section-head"><h2 id="parl-votes-title">Hlasovania</h2><span>{index ? `${index.hlasovania.length} · aktualizované ${skDay(index.aktualizovane)}` : `${TERM.votes}`}</span></div>
          <p className="parl-section-text">Záverečné hlasovania o zákonoch, ústavných zákonoch a rozpočtoch, opätovné hlasovania po vete prezidenta a hlasovania o nedôvere. Vyberajú sa podľa názvu, nie ručne.</p>
          <label className="par3d-vote-search"><Search size={16} aria-hidden="true"/><span className="sr-only">Hľadať hlasovanie</span>
            <input type="search" value={query} placeholder="Hľadať v názvoch, napr. rozpočet" enterKeyHint="search" onChange={e => { setQuery(e.target.value); setLimit(PAGE); }}/></label>
          <div className="par3d-vote-kinds" role="group" aria-label="Druh hlasovania">{VOTE_KINDS.map(k => <button key={k} type="button" aria-pressed={kind === k} onClick={() => { setKind(k); setLimit(PAGE); }}>{k === "vsetky" ? "Všetky" : kindNames[k]}{index && <small>{k === "vsetky" ? index.hlasovania.length : index.hlasovania.filter(v => v.druh === k).length}</small>}</button>)}</div>
          {!index && !failed && <p className="parl-note" role="status">Načítavam hlasovania NR SR…</p>}
          {index && <ol className="par3d-vote-list parl-vote-list">{voteList.slice(0, limit).map(v => { const c = votesCount(v); return <li key={v.id}><button type="button" aria-pressed={vote === v.id} onClick={() => chooseVote(v.id)}>
            <span className="par3d-vote-meta">{skDay(v.datum)} · {kindNames[v.druh]}</span>
            <b>{v.nazov}</b>
            <span className="parl-mini-bar" aria-hidden="true">{marks.map(m => c[m] > 0 && <i key={m} style={{ flexGrow: c[m], background: markColors[m] }}/>)}</span>
            <span className="par3d-vote-result" data-passed={v.preslo}>{v.preslo ? <Check size={13} aria-hidden="true"/> : <X size={13} aria-hidden="true"/>}{v.preslo ? "Prešiel" : "Neprešiel"} · za {v.za}, proti {v.proti}, zdržalo sa {v.zdrzalo}</span>
          </button></li>; })}</ol>}
          {index && !voteList.length && <p className="parl-note">Nič sa nenašlo. Skús iné slovo alebo druh hlasovania.</p>}
          {voteList.length > limit && <button type="button" className="par3d-vote-more" onClick={() => setLimit(n => n + PAGE)}>Zobraziť ďalšie ({voteList.length - limit})</button>}
          {index && voteList.length > 1 && !summary && <button type="button" className="parl-play parl-play-wide" disabled={reduced} onClick={togglePlay}><Play size={15} aria-hidden="true"/>Prehrať {voteList.length === index.hlasovania.length ? "všetky hlasovania" : "hlasovania zo zoznamu"} od najstaršieho</button>}
        </section>
      </div>

      <div className="parl-column">
        <section className="parl-deputies" aria-labelledby="parl-deputies-title">
          <div className="parl-section-head"><h2 id="parl-deputies-title">Poslanci</h2><span>{data ? `${data.poslanci.length} v tomto období` : `${TERM.deputies}`}</span></div>
          <p className="parl-section-text">Ako hlasoval každý poslanec a poslankyňa, vrátane náhradníkov. Rovnaké pravidlá pre všetkých.</p>
          <label className="par3d-vote-search"><Search size={16} aria-hidden="true"/><span className="sr-only">Hľadať poslanca</span>
            <input type="search" value={deputyQuery} placeholder="Meno alebo priezvisko" enterKeyHint="search" autoComplete="off" onChange={e => setDeputyQuery(e.target.value)}/></label>
          {data && deputyQuery.trim() && <DeputyResults data={data} query={deputyQuery} onPick={id => { setDeputyQuery(""); chooseDeputy(id, "profile"); }}/>}
          {data && row && <DeputyProfile key={row.id} data={data} byId={byId} row={row} current={j >= 0 ? j : null} onVote={id => chooseVote(id)} onStage={() => reveal()} onClose={() => chooseDeputy(null)}/>}
          {data && !row && <AllDeputies data={data} onPick={id => chooseDeputy(id, "profile")}/>}
          {!data && !failed && <p className="parl-note" role="status">Načítavam poslancov…</p>}
        </section>
        {data && <ClubsPanel data={data}/>}
      </div>
    </div>

    <section className="parl-about" aria-labelledby="parl-about-title">
      <h2 id="parl-about-title">Ako to čítať</h2>
      <p><b>Hlasovania.</b> Záverečné hlasovania o zákonoch a ústavných zákonoch ako celku (aj o štátnom rozpočte), opätovné hlasovania o zákonoch vrátených prezidentom a hlasovania o vyslovení nedôvery v 9. volebnom období podľa nrsr.sk. Vyberajú sa podľa názvu hlasovania, nie ručne; procedurálne hlasovania a pozmeňujúce návrhy tu nie sú. Výsledok overujeme podľa väčšiny, ktorú vyžaduje ústava.</p>
      <p><b>Kreslá.</b> Poslanci sedia podľa klubov v čase hlasovania (koalícia vľavo, nezaradení a Hnutie Slovensko v strede, opozícia vpravo), v klube podľa hlasu. Je to ilustrácia, nie skutočný zasadací poriadok NR SR.</p>
      <p><b>Prítomnosť</b> je podiel hlasovaní, pri ktorých bol poslanec v sále (hlasoval alebo nehlasoval), z tých, v ktorých bol poslancom. Neprítomnosť môže mať rôzne dôvody: práca mimo pléna, choroba aj politické rozhodnutie odísť zo sály pri hlasovaní.</p>
      <p><b>Inak ako klub</b>: poslanec hlasoval za, proti alebo sa zdržal a nadpolovičná väčšina prítomných členov jeho klubu hlasovala inak. Nehlasovanie a neprítomnosť sa nerátajú. <b>Jednotnosť</b> klubu je priemerný podiel prítomných členov, ktorí hlasovali ako najväčšia skupina klubu. Nezaradení klub nemajú.</p>
      <p>Hodnotenie nechávame na čitateľa: čísla neukazujú dôvody hlasovania ani obsah zákonov. <a href="https://www.nrsr.sk/web/?sid=schodze/hlasovanie" target="_blank" rel="noopener noreferrer">Hlasovania na nrsr.sk<ArrowUpRight size={12} aria-hidden="true"/><span className="sr-only"> (nová karta)</span></a> · <button type="button" className="parl-link" onClick={() => onNavigate("method")}>Metodika Mandátu</button></p>
    </section>
  </div>;
}

/** Menovitý zoznam hlasovania po kluboch (záloha k sále, čitateľná aj bez grafiky). */
function RollCall({ seated, diffIds, deputy, onDeputy }: { seated: SeatedMember[]; diffIds: ReadonlySet<number>; deputy: number | null; onDeputy: (id: number) => void }) {
  const groups = useMemo(() => {
    const out: { club: string; party: string; members: SeatedMember[] }[] = [];
    for (const m of seated) {
      let g = out.find(x => x.club === m.club);
      if (!g) out.push(g = { club: m.club, party: m.party, members: [] });
      g.members.push(m);
    }
    out.forEach(g => g.members.sort((a, b) => a.name.localeCompare(b.name, "sk")));
    return out;
  }, [seated]);
  return <details className="parl-roll"><summary>Menovite: ako hlasoval každý poslanec</summary>
    {groups.map(g => <div key={g.club} className="parl-roll-club"><h3>{clubLabel(g.club)} <small>{g.members.length}</small></h3>
      <ul>{g.members.map(m => <li key={m.id}><button type="button" aria-pressed={deputy === m.id} onClick={() => onDeputy(m.id)}><i style={{ background: markColors[m.mark] }} aria-hidden="true"/>{displayName(m.name)}<small>{markNames[m.mark]}{diffIds.has(m.id) ? " · inak ako klub" : ""}</small></button></li>)}</ul>
    </div>)}
  </details>;
}

function lastParty(data: DeputiesData, row: DeputyRow) {
  const j = [...row.h].findIndex(m => m !== "-");
  return j < 0 ? null : partyAt(data, row, j);
}

function DeputyResults({ data, query, onPick }: { data: DeputiesData; query: string; onPick: (id: number) => void }) {
  const found = findDeputies(data, query);
  return <ul className="parl-results" aria-label="Nájdení poslanci">
    {found.slice(0, 8).map(r => <li key={r.id}><button type="button" onClick={() => onPick(r.id)}><ClubMark party={lastParty(data, r)}/>{displayName(r.meno)}<small>{clubInfo(lastParty(data, r)).short}{r.h[0] === "-" ? " · už nie je poslancom" : ""}</small></button></li>)}
    {!found.length && <li className="parl-note">Nikoho sme nenašli. Skús iné meno.</li>}
    {found.length > 8 && <li className="parl-note">a ďalší ({found.length - 8}) — spresni meno.</li>}
  </ul>;
}

/** Všetci poslanci: dnešní po kluboch (poradie sály), bývalí zvlášť. */
function AllDeputies({ data, onPick }: { data: DeputiesData; onPick: (id: number) => void }) {
  const groups = useMemo(() => {
    const now = clubEntries.map(c => ({ id: c.id, label: c.id === UNAFFILIATED.id ? "Nezaradení" : c.short, rows: data.poslanci.filter(r => r.h[0] !== "-" && (partyAt(data, r, 0) ?? UNAFFILIATED.id) === c.id) }));
    return [...now, { id: "byvali", label: "Už nie sú poslancami", rows: data.poslanci.filter(r => r.h[0] === "-") }].filter(g => g.rows.length);
  }, [data]);
  return <details className="parl-all"><summary>Všetci poslanci podľa klubov</summary>
    {groups.map(g => <div key={g.id} className="parl-roll-club"><h3>{g.id !== "byvali" && <ClubMark party={g.id === UNAFFILIATED.id ? null : g.id}/>}{g.label} <small>{g.rows.length}</small></h3>
      <ul>{g.rows.map(r => <li key={r.id}><button type="button" onClick={() => onPick(r.id)}>{displayName(r.meno)}</button></li>)}</ul></div>)}
  </details>;
}

type Filter = "all" | "diff" | Mark;
function DeputyProfile({ data, byId, row, current, onVote, onStage, onClose }: { data: DeputiesData; byId: Map<number, VoteSummary>; row: DeputyRow; current: number | null; onVote: (id: number) => void; onStage: () => void; onClose: () => void }) {
  const stats = useMemo(() => deputyStats(data, row), [data, row]);
  const [filter, setFilter] = useState<Filter>("all"), [limit, setLimit] = useState(12);
  const differs = useMemo(() => new Set(stats.differs), [stats]);
  const items = useMemo(() => data.hlasovania.flatMap((id, j) => row.h[j] === "-" ? [] : [{ id, j, mark: row.h[j] as Mark, differs: differs.has(j) }]), [data, row, differs]);
  const shown = items.filter(it => filter === "all" ? true : filter === "diff" ? it.differs : it.mark === filter);
  const n = data.hlasovania.length, last = stats.segments.at(-1), active = row.h[0] !== "-";
  const day = (j: number) => { const v = byId.get(data.hlasovania[j]); return v ? skDay(v.datum) : ""; };
  const attendance = share(stats.present, stats.seated);
  const chips: [Filter, string, number][] = [["all", "Všetky", items.length], ["diff", "Inak ako klub", stats.differs.length], ["Z", "Za", stats.counts.Z], ["P", "Proti", stats.counts.P], ["?", "Zdržanie sa", stats.counts["?"]], ["N", "Nehlasovanie", stats.counts.N], ["0", "Neprítomnosť", stats.counts["0"]]];
  const pickBar = (x: number, width: number) => { const k = n - 1 - Math.min(n - 1, Math.max(0, Math.floor(x / width * n))); if (row.h[k] !== "-") onVote(data.hlasovania[k]); };
  return <article id="poslanec" className="parl-profile" aria-labelledby="parl-profile-name" style={{ "--club": clubInfo(last?.party ?? null).color } as CSSProperties}>
    <header>
      <ClubMark party={last?.party ?? null} size={26}/>
      <div><h3 id="parl-profile-name">{displayName(row.meno)}</h3>
        <p>{last ? clubLabel(last.club) : ""}{active ? "" : ` · poslancom do ${day(stats.segments.at(-1)!.to)}`}</p></div>
      <button type="button" className="parl-icon-button" aria-label="Zavrieť profil" onClick={onClose}><X size={18}/></button>
    </header>
    <dl className="parl-profile-stats">
      <div><dt>Prítomnosť</dt><dd>{percent(attendance)}</dd><small>{stats.present} z {stats.seated} hlasovaní</small></div>
      <div><dt>Inak ako klub</dt><dd>{stats.differs.length}×</dd><small>{last?.party ? `z ${stats.counts.Z + stats.counts.P + stats.counts["?"]} hlasov` : "nezaradení klub nemajú"}</small></div>
      <div><dt>V NR SR</dt><dd>{stats.seated}</dd><small>z {n} hlasovaní</small></div>
    </dl>
    <div className="parl-profile-bar" role="img" aria-label={marks.map(m => `${markNames[m]} ${stats.counts[m]}`).join(", ")}>{marks.map(m => stats.counts[m] > 0 && <i key={m} style={{ flexGrow: stats.counts[m], background: markColors[m] }}/>)}</div>
    <p className="parl-profile-counts">{marks.map(m => <span key={m}><i style={{ background: markColors[m] }} aria-hidden="true"/>{markNames[m]} <b>{stats.counts[m]}</b></span>)}</p>
    {stats.segments.length > 1 && <p className="parl-profile-clubs"><b>Kluby v období:</b> {stats.segments.map((s, i) => <span key={i}>{i > 0 && " → "}{s.party ? clubLabel(s.club) : "nezaradený"} <small>({day(s.from)} – {day(s.to)})</small></span>)}</p>}
    <figure className="parl-barcode">
      <figcaption>Hlasovací pás: každá čiarka je jedno hlasovanie, zľava od najstaršieho. Značka hore = inak ako klub.</figcaption>
      <svg viewBox={`0 0 ${n} 30`} preserveAspectRatio="none" shapeRendering="crispEdges" role="img" aria-label={`Hlasy v ${stats.seated} hlasovaniach v čase`}
        onClick={e => { const r = e.currentTarget.getBoundingClientRect(); pickBar(e.clientX - r.left, r.width); }}>
        {items.map(it => <rect key={it.j} x={n - 1 - it.j} y={8} width={1} height={22} fill={markColors[it.mark]}/>)}
        {stats.differs.map(k => <rect key={`d${k}`} className="parl-barcode-diff" x={n - 1 - k} y={0} width={1} height={5}/>)}
        {current !== null && <rect className="parl-barcode-now" x={n - 1 - current - .5} y={0} width={2} height={30}/>}
      </svg>
      <div className="parl-barcode-axis"><span>{day(n - 1)}</span><span>{day(0)}</span></div>
    </figure>
    <div className="par3d-vote-kinds" role="group" aria-label="Filter hlasov">{chips.filter(([k, , c]) => k === "all" || c > 0).map(([k, label, count]) => <button key={k} type="button" aria-pressed={filter === k} onClick={() => { setFilter(k); setLimit(12); }}>{label}<small>{count}</small></button>)}</div>
    <ol className="parl-record">{shown.slice(0, limit).map(it => { const v = byId.get(it.id); return v && <li key={it.id}><button type="button" aria-pressed={current === it.j} onClick={() => onVote(it.id)}>
      <i style={{ background: markColors[it.mark] }} aria-hidden="true"/>
      <span><small>{skDay(v.datum)} · {kindNames[v.druh]}</small><b>{v.nazov}</b><small className="parl-record-mark">{markNames[it.mark]}{it.differs ? " · inak ako klub" : ""} · návrh {v.preslo ? "prešiel" : "neprešiel"}</small></span>
    </button></li>; })}</ol>
    {shown.length > limit && <button type="button" className="par3d-vote-more" onClick={() => setLimit(l => l + 24)}>Zobraziť ďalšie ({shown.length - limit})</button>}
    <p className="parl-profile-links"><button type="button" className="parl-link" onClick={onStage}>Ukázať v sále</button> · <a href={deputyProfile(row.id)} target="_blank" rel="noopener noreferrer">Profil na nrsr.sk<ArrowUpRight size={12} aria-hidden="true"/><span className="sr-only"> (nová karta)</span></a></p>
  </article>;
}

/** Kluby: dnešné zloženie, prítomnosť, jednotnosť a zhoda medzi klubmi. Poradie sály, nie rebríček. */
function ClubsPanel({ data }: { data: DeputiesData }) {
  const stats = useMemo(() => clubStats(data), [data]);
  const free = useMemo(() => unaffiliatedPresence(data), [data]);
  const clubs = clubEntries.filter(c => c.id !== UNAFFILIATED.id);
  const agree = useMemo(() => clubAgreement(data, clubs.map(c => c.id)), [data, clubs]);
  return <section className="parl-clubs" aria-labelledby="parl-clubs-title">
    <div className="parl-section-head"><h2 id="parl-clubs-title">Kluby</h2><span>k {skDay(CLUBS_AS_OF)}</span></div>
    <p className="parl-section-text">Zloženie podľa posledného hlasovania a ako kluby hlasovali za celé obdobie. Poradie je poradie sály, nie rebríček.</p>
    <div className="parl-club-cards">{clubEntries.map(c => {
      const s = stats.get(c.id), isFree = c.id === UNAFFILIATED.id;
      return <article key={c.id} style={{ "--club": c.color } as CSSProperties}>
        <h3><ClubMark party={isFree ? null : c.id} size={20}/>{isFree ? "Nezaradení" : c.short}<span>{c.seats} {plural(c.seats, "poslanec", "poslanci", "poslancov")}</span></h3>
        <dl>
          <div><dt>Prítomnosť</dt><dd>{percent(isFree ? share(free.present, free.seated) : share(s?.present ?? 0, s?.seated ?? 0))}</dd></div>
          <div><dt>Jednotnosť</dt><dd>{isFree ? "—" : percent((s?.cohesion ?? 0) * 100)}</dd></div>
        </dl>
      </article>;
    })}</div>
    <h3 className="parl-subhead">Ako často hlasovali kluby rovnako</h3>
    <div className="parl-heat-wrap" tabIndex={0} aria-label="Zhoda klubov v tabuľke; na úzkej obrazovke sa dá posúvať">
      <table className="parl-heat">
        <caption className="sr-only">Podiel hlasovaní, v ktorých dali dva kluby rovnaký hlas</caption>
        <thead><tr><th scope="col"><span className="sr-only">Klub</span></th>{clubs.map(c => <th key={c.id} scope="col">{c.short}</th>)}</tr></thead>
        <tbody>{clubs.map(a => <tr key={a.id}><th scope="row">{a.short}</th>{clubs.map(b => {
          const x = agree(a.id, b.id);
          if (!x) return <td key={b.id} className="parl-heat-self" aria-label="ten istý klub"/>;
          const p = share(x.same, x.both);
          return <td key={b.id} style={{ "--a": Math.max(0, Math.min(1, (p - 30) / 70)).toFixed(2) } as CSSProperties} data-strong={p >= 75} title={`${a.short} a ${b.short}: rovnako v ${x.same} z ${x.both} hlasovaní`}>{Math.round(p)}</td>;
        })}</tr>)}</tbody>
      </table>
    </div>
    <p className="parl-note">Percento hlasovaní, v ktorých dali oba kluby rovnaký hlas (za, proti, zdržanie sa alebo nehlasovanie podľa nadpolovičnej väčšiny prítomných). Rátajú sa hlasovania, v ktorých líniu mali oba kluby.</p>
  </section>;
}
