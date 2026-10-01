"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { AlertTriangle, ArrowRight, Check, RotateCcw, Vote } from "lucide-react";
import type { RepublicState } from "@/lib/republic";
import { COUNCIL_SEATS, ELECTION_DAY, LAW, candidateLabel, checkCouncil, checkMayor, councilCandidates, countElection, electionPhase, electionRules, interestNames, interestScores, mayorCandidates, parseStoredElection, type Ballot, type ElectionResult, type Invalid, type StoredElection } from "@/lib/republic-election";
import { townSatisfaction } from "@/lib/republic-trust";
import "@/app/republic-guide.css";

/*
  Komunálne voľby v Lipovej štvrti 24. 10. 2026. Pred voľbami odpočet, kandidáti, pravidlá a skúšobné
  hlasovanie; od 24. 10. ostré hlasovanie, ktoré sa uloží (mimo uloženia štvrte, kľúč nižšie), volebná noc
  so sčítaním a výsledky s odkazom na paragraf. Graficky zámerne jednoduché (ilustrácie môže doplniť Codex).
*/
const KEY = "mandat:republic:v1:election";
type Stored = StoredElection;
const names = Object.fromEntries([...mayorCandidates, ...councilCandidates].map(c => [c.id, c.name]));
function readStored(): Stored | null {
  try { return parseStoredElection(localStorage.getItem(KEY)); } catch { return null; }
}
// Prečo boli lístky neplatné (§ 184 ods. 1 a 2), napr. „2 (1 bez zakrúžkovaného kandidáta, 1 obálka s dvoma lístkami)“.
const invalidText = (n: number, r: Record<Invalid, number>) => {
  const parts = [r.none ? `${r.none} bez zakrúžkovaného kandidáta` : "", r.many ? `${r.many} s priveľa zakrúžkovanými` : "", r.double ? `${r.double} ${r.double === 1 ? "obálka" : r.double < 5 ? "obálky" : "obálok"} s dvoma lístkami` : ""].filter(Boolean);
  return `${n}${parts.length ? ` (${parts.join(", ")})` : ""}`;
};
const feminine = new Set(["eva", "nina", "maria", "zuzana"]);
const skDate = (day: string) => `${Number(day.slice(8, 10))}. ${Number(day.slice(5, 7))}. ${day.slice(0, 4)}`;

function Ballots({ ballot, setBallot }: { ballot: Ballot; setBallot: Dispatch<SetStateAction<Ballot>> }) {
  const toggle = (kind: "mayor" | "council", id: string) => setBallot(b => ({ ...b, [kind]: b[kind].includes(id) ? b[kind].filter(x => x !== id) : [...b[kind], id] }));
  const mayor = checkMayor(ballot.mayor), council = checkCouncil(ballot.council);
  return <div className="election-ballots">
    <fieldset className="election-ballot"><legend>Hlasovací lístok · starosta</legend><p>Zakrúžkuj poradové číslo jedného kandidáta.</p>
      <ol>{mayorCandidates.map((c, i) => <li key={c.id}><button aria-pressed={ballot.mayor.includes(c.id)} onClick={() => toggle("mayor", c.id)}><span className="election-number">{i + 1}</span><span><b>{c.name}</b><small>{c.role} · {candidateLabel(c)}</small></span></button></li>)}</ol>
      <p className={mayor.valid ? "election-check is-valid" : "election-check is-invalid"}>{mayor.valid ? <Check size={15} aria-hidden="true"/> : <AlertTriangle size={15} aria-hidden="true"/>}{mayor.reason}</p></fieldset>
    <fieldset className="election-ballot"><legend>Hlasovací lístok · poslanci</legend><p>Zakrúžkuj najviac {COUNCIL_SEATS} kandidátov. Volia sa {COUNCIL_SEATS} poslanci.</p>
      <ol>{councilCandidates.map((c, i) => <li key={c.id}><button aria-pressed={ballot.council.includes(c.id)} onClick={() => toggle("council", c.id)}><span className="election-number">{i + 1}</span><span><b>{c.name}</b><small>{c.role} · {candidateLabel(c)}</small></span></button></li>)}</ol>
      <p className={council.valid ? "election-check is-valid" : "election-check is-invalid"}>{council.valid ? <Check size={15} aria-hidden="true"/> : <AlertTriangle size={15} aria-hidden="true"/>}{council.reason}</p></fieldset>
  </div>;
}

function Count({ result, reveal }: { result: ElectionResult; reveal: number }) {
  const step = result.steps[Math.min(reveal, result.steps.length - 1)], finished = reveal >= result.steps.length - 1;
  const max = Math.max(1, ...Object.values(result.council.votes), ...Object.values(result.mayor.votes));
  const bars = (votes: Record<string, number>, ids: string[], win: string[]) => <ul className="election-bars">{ids.map(id => <li key={id} className={finished && win.includes(id) ? "is-winner" : ""}><span>{names[id]}</span><span className="election-bar"><span style={{ width: `${(votes[id] / max) * 100}%` }}/></span><b>{votes[id]}</b></li>)}</ul>;
  return <div className="election-count" aria-live="polite">
    <p className="election-progress">{finished ? "Sčítané" : "Sčítava sa"}: {step.counted} z {result.voted} obálok · účasť {result.turnout} %</p>
    <h4>Starosta</h4>{bars(step.mayor, mayorCandidates.map(c => c.id), result.mayor.winner ? [result.mayor.winner] : [])}
    <h4>Poslanci ({COUNCIL_SEATS} mandáty)</h4>{bars(step.council, councilCandidates.map(c => c.id).sort((a, b) => step.council[b] - step.council[a]), result.council.elected)}
  </div>;
}

function Results({ result, practice }: { result: ElectionResult; practice: boolean }) {
  return <div className="election-results">
    <p className="plan-kicker">{practice ? "Skúšobné hlasovanie" : `Výsledky volieb ${skDate(ELECTION_DAY)}`}</p>
    <h4>{result.mayor.winner ? `${feminine.has(result.mayor.winner) ? "Starostkou" : "Starostom"} je ${names[result.mayor.winner]}.` : `Remíza ${result.mayor.tie.map(id => names[id]).join(" a ")}: podľa zákona sa konajú nové voľby (§ 189 ods. 4).`}</h4>
    <p>Do zastupiteľstva: <b>{result.council.elected.map(id => names[id]).join(", ")}</b>. Náhradníci v poradí: {result.council.substitutes.map(id => names[id]).join(", ")} (§ 192 ods. 1).</p>
    {result.council.lots.map(l => <p key={l.among.join()} className="election-lot">Rovnosť hlasov ({l.among.map(id => names[id]).join(", ")}) rozhodol žreb, poradie: {l.order.map(id => names[id]).join(", ")} (§ 189 ods. 3).</p>)}
    <p className="election-meta">Odovzdaných obálok {result.voted} z {result.registered + (result.player ? 1 : 0)} voličov. Neplatné lístky (§ 184): starosta {invalidText(result.mayor.invalid, result.mayor.reasons)}; poslanci {invalidText(result.council.invalid, result.council.reasons)}.</p>
    {result.player && <p className="election-meta">Tvoje lístky: starosta {result.player.mayor.valid ? "platný" : "neplatný"}, poslanci {result.player.council.valid ? "platný" : "neplatný"}.</p>}
  </div>;
}

export default function RepublicElection({ town, today }: { town: RepublicState; today: string }) {
  const phase = electionPhase(today), [open, setOpen] = useState(false), [stored, setStored] = useState<Stored | null>(() => readStored());
  const [ballot, setBallot] = useState<Ballot>({ mayor: [], council: [] }), [practice, setPractice] = useState<ElectionResult | null>(null);
  // Uložené výsledky sa ukážu hneď celé; sčítanie sa prehrá po hlasovaní alebo na požiadanie.
  const [reveal, setReveal] = useState(() => { const s = readStored(); return s ? s.result.steps.length - 1 : 0; }), [runId, setRunId] = useState(0);
  const live = stored?.result ?? practice;
  useEffect(() => {
    if (!runId || !live) return;
    const last = live.steps.length - 1, t = setInterval(() => setReveal(r => { if (r >= last) { clearInterval(t); return r; } return r + 1; }), 450);
    return () => clearInterval(t);
  }, [runId, live]);
  const startCount = () => { setReveal(0); setRunId(n => n + 1); };
  const reduced = typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const shown = live && reduced ? live.steps.length - 1 : reveal;
  const scores = interestScores(town), sat = townSatisfaction(town);
  function vote() {
    const result = countElection(town, ballot);
    if (phase.phase === "pred") { setPractice(result); startCount(); return; }
    const next = { day: today, ballot, result };
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* bez úložiska sa výsledok ukáže len teraz */ }
    setStored(next); startCount();
  }
  return <section className="republic-election" id="republic-election" aria-labelledby="republic-election-title">
    <p className="plan-kicker"><Vote size={14} aria-hidden="true"/> Komunálne voľby · sobota {skDate(ELECTION_DAY)}</p>
    <h2 id="republic-election-title">Voľby v Lipovej štvrti</h2>
    <p>{phase.phase === "pred" ? `O ${phase.days} ${phase.days === 1 ? "deň" : phase.days < 5 ? "dni" : "dní"} si štvrť volí starostu a ${COUNCIL_SEATS} poslancov. Susedia budú voliť podľa toho, ako sa im v štvrti žije: spokojnosť je teraz ${sat.value} %.` : stored ? "Voľby sa skončili. Takto rozhodli susedia." : "Volebná miestnosť je otvorená. Odovzdaj aj svoje lístky."}
      {" "}V ten istý deň sa konajú aj skutočné voľby do miestnych a krajských zastupiteľstiev.</p>
    {stored ? <><Count result={stored.result} reveal={shown}/>{shown >= stored.result.steps.length - 1 && <Results result={stored.result} practice={false}/>}<button className="election-secondary" onClick={startCount}><RotateCcw size={15} aria-hidden="true"/> Pozrieť sčítanie znova</button></>
      : practice ? <><Count result={practice} reveal={shown}/>{shown >= practice.steps.length - 1 && <Results result={practice} practice/>}<button className="election-secondary" onClick={() => { setPractice(null); setBallot({ mayor: [], council: [] }); }}><RotateCcw size={15} aria-hidden="true"/> Hlasovať znova (skúška)</button></>
      : open ? <><Ballots ballot={ballot} setBallot={setBallot}/><button className="plan-now-button election-vote" onClick={vote}>{phase.phase === "pred" ? "Vyskúšať sčítanie (skúška)" : "Vložiť lístky do obálky a do urny"}<ArrowRight size={16} aria-hidden="true"/></button></>
      : <button className="plan-now-button" onClick={() => setOpen(true)}>{phase.phase === "pred" ? "Vyskúšať si hlasovanie" : "Ísť voliť"}<ArrowRight size={16} aria-hidden="true"/></button>}
    <details className="election-details"><summary>Kandidáti a čo susedia od štvrte čakajú</summary>
      <div className="election-interests">{(Object.keys(scores) as (keyof typeof scores)[]).map(k => <div key={k}><span>{interestNames[k]}</span><span className="plan-bar" aria-hidden="true"><span style={{ width: `${scores[k] * 100}%` }}/></span><b>{Math.round(scores[k] * 100)} %</b></div>)}</div>
      <p>Kandidáti, ktorým ide o veci, čo štvrť spĺňa, majú u susedov väčšiu podporu. Postav a napoj, čo chýba, a ovplyvníš výsledok.</p>
      <ul className="election-candidates">{[...mayorCandidates.map(c => ({ c, kind: "starosta" })), ...councilCandidates.map(c => ({ c, kind: "poslanci" }))].map(({ c, kind }) => <li key={c.id}><b>{c.name}</b><small>{kind} · {c.role} · {candidateLabel(c)} · {c.interests.map(i => interestNames[i]).join(", ")}</small></li>)}</ul>
    </details>
    <details className="election-details"><summary>Ako sa volí (podľa zákona)</summary>
      <ul className="election-rules">{electionRules.map(r => <li key={r.title}><b>{r.title}</b><p>{r.text}</p><small>{r.law} · {LAW}</small></li>)}</ul>
      <p className="election-meta">Hra zjednodušuje: celá štvrť je jeden volebný obvod, kandidáti aj strany sú vymyslení.</p>
    </details>
  </section>;
}
