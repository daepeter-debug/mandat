"use client";

import { useEffect } from "react";
import { AlertTriangle, ArrowRight, Boxes, Check, Circle, CircleHelp, Coins, Flag, Smile, Sparkles, TrainFront, Vote, X } from "lucide-react";
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

const plural = (n: number, one: string, few: string, many: string) => n === 1 ? one : n >= 2 && n <= 4 ? few : many;

/** Stav štvrte v jednom páse: zdroje, spokojnosť, projekt, slávnosti a voľby. Cieľ hry je v podnadpise. */
export function StatusBar({ name, coins, materials, satisfaction, project, journey, electionDays, compact = false, help = null }: {
  name: string; coins: number; materials: number; satisfaction: Satisfaction; project: number; journey: number; electionDays: number | null; compact?: boolean;
  help?: { open: boolean; onToggle: () => void } | null;
}) {
  return <section className="republic-status" aria-label="Stav štvrte">
    <div className="republic-status-title"><div><strong>{name}</strong><span><Flag size={13} aria-hidden="true"/> Cieľ: vráť život štvrti pri starej stanici</span></div>
      {help && <button type="button" className="republic-howto-toggle" aria-expanded={help.open} aria-controls="republic-howto" onClick={help.onToggle}><CircleHelp size={16} aria-hidden="true"/>Ako hra funguje</button>}</div>
    <ul className="republic-status-chips" data-compact={compact || undefined}>
      <li><Coins size={18} aria-hidden="true"/><b>{coins}</b><span>{plural(coins, "minca", "mince", "mincí")}</span></li>
      <li><Boxes size={18} aria-hidden="true"/><b>{materials}</b><span>{plural(materials, "materiál", "materiály", "materiálov")}</span></li>
      {!compact && <li title={satisfaction.label}><Smile size={18} aria-hidden="true"/><b>{satisfaction.value} %</b><span>spokojnosť</span></li>}
      <li><TrainFront size={18} aria-hidden="true"/><b>{project}/7</b><span>projekt</span></li>
      {!compact && <li><Flag size={18} aria-hidden="true"/><b>{journey}/7</b><span>slávnosti</span></li>}
      {!compact && electionDays !== null && <li className="is-link"><a href="#republic-election"><Vote size={18} aria-hidden="true"/><b>{electionDays > 0 ? `o ${electionDays} ${plural(electionDays, "deň", "dni", "dní")}` : "dnes"}</b><span>voľby</span></a></li>}
    </ul>
  </section>;
}

/** Jedna hlavná akcia: čo môžem urobiť teraz, prečo, čo presne treba a akú odmenu dostanem. Nad ňou upozornenia. */
export function PlanPanel({ plan, blocked, onAction }: { plan: Plan; blocked: boolean; onAction: (a: PlanAction, item: PlanItem) => void }) {
  const next = plan.next;
  return <section className="republic-plan" aria-label="Čo teraz">
    {plan.blockers.map(b => <div key={b.key} className="plan-blocker" role="alert"><AlertTriangle size={20} aria-hidden="true"/><div><b>{b.title}</b><p>{b.detail}</p></div></div>)}
    {next && !(plan.idle && next.key === "story") ? <div className="plan-now" data-status={next.status}>
      <div className="plan-now-text">
        <div className="plan-now-title"><h3>{next.title}</h3><p className="plan-next-status">{next.status === "ready" ? "Teraz môžeš" : "Ďalší krok"}</p></div>
        {next.why && <p className="plan-why">{next.why}</p>}
        <p className="plan-now-detail">{next.detail}{next.progress ? <> <b className="plan-progress">({next.progress.have}/{next.progress.need})</b></> : null}</p>
      </div>
      <div className="plan-now-footer"><RewardChips reward={next.reward} cost={next.cost}/>
        {next.action.type !== "none" && <button className="plan-now-button" disabled={blocked} onClick={() => onAction(next.action, next)}>{actionLabel(next.action, next)}<ArrowRight size={16} aria-hidden="true"/></button>}</div>
    </div> : <div className="plan-now is-idle">
      <div className="plan-now-text">
        <h3>Na dnes máš projekt aj objednávky hotové.</h3>
        <p className="plan-now-detail">Zajtra príde nová zásielka, ďalší krok projektu a nové objednávky. Medzitým môžeš štvrť preplánovať (presuny sú zadarmo) alebo zahrať slávnosť.</p>
      </div>
      <div className="plan-now-footer"><button className="plan-now-button" disabled={blocked} onClick={() => onAction(plan.story.action, plan.story)}>{plan.story.title}<ArrowRight size={16} aria-hidden="true"/></button></div>
    </div>}
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
