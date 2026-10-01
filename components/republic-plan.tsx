"use client";

import { useEffect } from "react";
import { AlertTriangle, ArrowRight, Boxes, Check, Circle, Coins, Flag, Sparkles, Vote, X } from "lucide-react";
import { rewardText, type PlanAction, type PlanItem, type Reward, type playerPlan } from "@/lib/republic-plan";
import type { townSatisfaction } from "@/lib/republic-trust";
import type { Festival } from "@/lib/republic-festival";
import { festivalGaps } from "@/lib/republic-plan";
import "@/app/republic-guide.css";

/*
  Prehľadnosť hry (spätná väzba z testovania): hráč má na prvý pohľad vidieť, kde je, čo má urobiť teraz,
  čo už splnil, čo mu chýba a akú odmenu dostane. Dáta počíta lib/republic-plan.ts; tu je len kresba.
*/
type Plan = ReturnType<typeof playerPlan>;
type Satisfaction = ReturnType<typeof townSatisfaction>;

export function RewardChips({ reward, cost }: { reward?: Reward | null; cost?: Reward | null }) {
  if (!reward && !cost) return null;
  return <span className="plan-chips">
    {reward && reward.coins > 0 && <span className="plan-chip is-reward"><Coins size={13} aria-hidden="true"/>+{reward.coins}</span>}
    {reward && reward.materials > 0 && <span className="plan-chip is-reward"><Boxes size={13} aria-hidden="true"/>+{reward.materials}</span>}
    {cost && (cost.coins > 0 || cost.materials > 0) && <span className="plan-chip is-cost">cena {cost.coins} mincí · {cost.materials} mat.</span>}
    <span className="sr-only">{reward ? `Odmena: ${rewardText(reward)}.` : ""}</span>
  </span>;
}
export const actionLabel = (a: PlanAction, item?: PlanItem) => a.type === "step" ? "Potvrdiť krok" : a.type === "branch" ? "Vybrať podobu haly" : a.type === "final" ? "Vybrať dekoráciu"
  : a.type === "task" ? "Vyzdvihnúť odmenu" : a.type === "parcel" ? item?.title.startsWith("Vybrať") ? "Vybrať ozdobu" : "Otvoriť zásielku" : a.type === "story" ? "Otvoriť slávnosť"
  : a.type === "build" ? "Ukázať, čo postaviť" : a.type === "road" ? "Položiť cestu" : "";
const statusIcon = (s: PlanItem["status"]) => s === "done" ? <Check size={15} aria-hidden="true"/> : s === "ready" ? <Sparkles size={15} aria-hidden="true"/> : s === "later" ? <Check size={15} aria-hidden="true"/> : <Circle size={13} aria-hidden="true"/>;
const statusText = { ready: "dá sa hneď", todo: "ešte chýba", done: "hotové", later: "hotové na dnes" };

function Meter({ label, value, max, text }: { label: string; value: number; max: number; text: string }) {
  return <div className="plan-meter"><span>{label}</span><b>{text}</b><span className="plan-bar" aria-hidden="true"><span style={{ width: `${Math.round(Math.min(1, value / max) * 100)}%` }}/></span></div>;
}

export function PlanPanel({ plan, satisfaction, project, journey, electionDays, blocked, onAction }: {
  plan: Plan; satisfaction: Satisfaction; project: number; journey: number; electionDays: number | null; blocked: boolean; onAction: (a: PlanAction, item: PlanItem) => void;
}) {
  const next = plan.next;
  return <section className="republic-plan" aria-label="Kde som a čo ďalej">
    <div className="plan-goal">
      <h2><Flag size={20} aria-hidden="true"/> Vráť život štvrti pri starej stanici</h2>
      <p className="plan-goal-text">Sedem krokov projektu, sedem dní slávností a spokojní susedia{electionDays !== null ? " pred voľbami v štvrti" : ""}.</p>
      <div className="plan-meters">
        <Meter label="Projekt" value={project} max={7} text={`${project}/7`}/>
        <Meter label="Slávnosti" value={journey} max={7} text={`${journey}/7`}/>
        <Meter label="Spokojnosť" value={satisfaction.value} max={100} text={`${satisfaction.value} %`}/>
      </div>
      {electionDays !== null && <a className="plan-election-link" href="#republic-election"><Vote size={15} aria-hidden="true"/>{electionDays > 0 ? `Voľby v štvrti o ${electionDays} ${electionDays === 1 ? "deň" : electionDays < 5 ? "dni" : "dní"}` : "Voľby v štvrti sú otvorené"}<ArrowRight size={14} aria-hidden="true"/></a>}
    </div>
    <div className="plan-now-column">
      {plan.blockers.map(b => <div key={b.key} className="plan-blocker" role="alert"><AlertTriangle size={20} aria-hidden="true"/><div><b>{b.title}</b><p>{b.detail}</p></div></div>)}
      {next && !(plan.idle && next.key === "story") ? <div className="plan-now" data-status={next.status}>
        <h3>{next.title}</h3>
        <p className="plan-next-status">{next.status === "ready" ? "Teraz môžeš" : "Ďalší krok"}</p>
        <p>{next.detail}</p>
        {next.progress && <p className="plan-progress">Stav: <b>{next.progress.have}/{next.progress.need}</b></p>}
        <div className="plan-now-footer"><RewardChips reward={next.reward} cost={next.cost}/>
          {next.action.type !== "none" && <button className="plan-now-button" disabled={blocked} onClick={() => onAction(next.action, next)}>{actionLabel(next.action, next)}<ArrowRight size={16} aria-hidden="true"/></button>}</div>
      </div> : <div className="plan-now is-idle">
        <h3>Na dnes máš projekt aj objednávky hotové.</h3>
        <p>Zajtra príde nová zásielka, ďalší krok projektu a nové objednávky. Medzitým môžeš štvrť preplánovať (presuny sú zadarmo) alebo zahrať slávnosť.</p>
        <div className="plan-now-footer"><button className="plan-now-button" disabled={blocked} onClick={() => onAction(plan.story.action, plan.story)}>{plan.story.title}<ArrowRight size={16} aria-hidden="true"/></button></div>
      </div>}
    </div>
  </section>;
}

/** Všetko na dnes: krok projektu, objednávky, zásielka a slávnosť so stavom, odmenou a tým, čo chýba. */
export function PlanToday({ plan, blocked, onAction }: { plan: Plan; blocked: boolean; onAction: (a: PlanAction, item: PlanItem) => void }) {
  const items = [plan.step, ...plan.tasks, plan.parcel, plan.story].filter((x): x is PlanItem => !!x);
  const ready = items.filter(x => x.status === "ready").length, done = items.filter(x => x.status === "done" || x.status === "later").length;
  return <section className="plan-today-section" aria-label="Dnes v štvrti">
    <details className="plan-today" open>
      <summary><b>Dnes v štvrti</b><span>{ready ? `${ready} ${ready === 1 ? "vec sa dá" : ready < 5 ? "veci sa dajú" : "vecí sa dá"} hneď` : "nič nečaká"} · {done} {done === 1 ? "hotová" : done > 1 && done < 5 ? "hotové" : "hotových"}</span></summary>
      <ul>{items.map(item => <li key={item.key} data-status={item.status}>
        <span className="plan-status" title={statusText[item.status]}>{statusIcon(item.status)}<span className="sr-only">{statusText[item.status]}</span></span>
        <div><b>{item.title}</b><small>{item.detail}{item.progress ? ` (${item.progress.have}/${item.progress.need})` : ""}</small></div>
        <RewardChips reward={item.status === "done" ? null : item.reward}/>
        {item.status === "ready" && item.action.type !== "none" && <button disabled={blocked} onClick={() => onAction(item.action, item)} aria-label={`${actionLabel(item.action, item)}: ${item.title}`}><ArrowRight size={16} aria-hidden="true"/></button>}
      </li>)}</ul>
    </details>
  </section>;
}

export type Win = { id: number; title: string; reward: Reward | null; next: string | null };
/** Výrazné potvrdenie: čo hráč dokončil, čo získal a čo ďalej. Zmizne samo po 8 s. */
export function WinBanner({ win, onClose }: { win: Win | null; onClose: () => void }) {
  useEffect(() => { if (!win) return; const t = setTimeout(onClose, 8000); return () => clearTimeout(t); }, [win, onClose]);
  if (!win) return null;
  return <div className="plan-win" role="status" aria-live="polite" key={win.id}>
    <span className="plan-win-icon"><Check size={22} aria-hidden="true"/></span>
    <div><b>Hotovo: {win.title}</b>{win.reward && (win.reward.coins > 0 || win.reward.materials > 0) && <p className="plan-win-reward">Získal si {rewardText(win.reward)}.</p>}{win.next && <p>Ďalej: {win.next}</p>}</div>
    <button onClick={onClose} aria-label="Zavrieť oznámenie"><X size={18}/></button>
  </div>;
}

/** Slávnosť: prečo hráč nemôže pokračovať na ďalší deň príbehu a čo konkrétne mu chýba. */
export function FestivalGaps({ festival, nextDay }: { festival: Festival; nextDay: number }) {
  const gaps = festivalGaps(festival);
  if (!gaps.length) return null;
  return <div className="festival-gaps" role="alert">
    <p className="plan-kicker"><AlertTriangle size={14} aria-hidden="true"/> Na deň {nextDay} ešte chýba</p>
    <h4>Splnené {3 - gaps.length} z 3 cieľov. Postúpiš, keď splníš všetky tri.</h4>
    <ul>{gaps.map(g => <li key={g.key}><div><b>{g.label}</b><span className="festival-gap-score">{g.need ? `máš ${g.have} · treba ${g.need}` : g.have}</span></div><p>{g.hint}</p></li>)}</ul>
    <p className="festival-gaps-note">Skús iný plán: ďalší pokus má tú istú komplikáciu a najlepší výsledok sa zachová.</p>
  </div>;
}
