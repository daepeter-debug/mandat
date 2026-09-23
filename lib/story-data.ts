import { currentAggregate } from "./aggregate.ts";
import { MAJORITY } from "./blocs.ts";
import { edition } from "./edition.ts";
import { hemicycleSeats } from "./parliament.ts";
import { parties } from "./polls.ts";
import { financeYears, latestFinanceYear } from "./public-finance.ts";
import { currentSeatUncertainty } from "./uncertainty.ts";

/*
  Dáta pre „Mandát za minútu“ (components/mandat-story.tsx) a jeho obrázky na zdieľanie (components/story-image.ts):
  rovnaké čísla ako na úvode — Model Mandát (lib/edition, lib/uncertainty) a Eurostat (lib/public-finance).
*/
export const storyParty = (id: string) => parties.find(p => p.id === id);
export const ranked = Object.values(currentAggregate.values).sort((a, b) => b.value - a.value);
export const leader = ranked[0];
export const up = edition.movers.find(m => m.delta > 0);
export const down = edition.movers.find(m => m.delta < 0);
export const edge = ranked.filter(v => v.lower < 5 && v.upper >= 5).slice(0, 4);
export const blocs = edition.withPartners;
export const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

const lastYear = latestFinanceYear;
const prevYear = financeYears.find(r => r.year === lastYear.year - 1);
export const debtYear = lastYear.year;
export const debtLastMeur = lastYear.debtMeur;
export const debtPerSecond = prevYear ? (lastYear.debtMeur - prevYear.debtMeur) * 1e6 / (365 * 86_400) : 0;
const debtFrom = Date.UTC(lastYear.year + 1, 0, 1) - 3_600_000;
export const population = lastYear.population ?? 5_400_000;
export const debtAt = (t: number) => lastYear.debtMeur * 1e6 + Math.max(0, (t - debtFrom) / 1000) * debtPerSecond;

// Kreslá zoradené zľava doprava podľa uhla: koalícia vľavo, opozícia vpravo, ostatní v strede.
export const seatPoints = hemicycleSeats(150, 6).map(p => ({ ...p, a: Math.atan2(-p.y, p.x) })).sort((a, b) => b.a - a.a);
export const seatSide = (i: number) => i < blocs.coalition ? "c" : i >= 150 - blocs.opposition ? "o" : "n";

/** Blok s väčšinou a podiel prepočtov, v ktorých ju má (null = väčšinu nemá nikto). */
export function majorityWinner() {
  const u = currentSeatUncertainty().blocs;
  if (blocs.opposition >= MAJORITY) return { label: blocs.oppositionLabel, share: u.oppositionWith.majority };
  if (blocs.coalition >= MAJORITY) return { label: blocs.coalitionLabel, share: u.coalitionWith.majority };
  return null;
}

export type SlideId = "leader" | "seats" | "month" | "edge" | "debt" | "you";
export const slides: { id: SlideId; label: string; bg: string; ms: number }[] = [
  { id: "leader", label: "Kto vedie", bg: "#183c31", ms: 6500 },
  { id: "seats", label: "Kreslá dnes", bg: "#1b2b3b", ms: 7000 },
  { id: "month", label: "Za posledný mesiac", bg: "#2a301c", ms: 6000 },
  { id: "edge", label: "Na hrane 5 %", bg: "#34272b", ms: 7000 },
  { id: "debt", label: "Dlh štátu", bg: "#20392f", ms: 6500 },
  { id: "you", label: "A čo ty?", bg: "#183c31", ms: 9000 },
];
export const pollWordNew = (n: number) => n === 1 ? "meranie" : n >= 2 && n <= 4 ? "merania" : "meraní";
