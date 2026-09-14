import { parties } from "./polls.ts";
import { governmentTenure, periodDays, tenureDays, tenureLabel, tenureAsOf, type GovernmentTenure, type GovernmentTenurePeriod } from "./government-tenure.ts";
import { inactiveParties } from "./government-tenure-inactive.ts";

/*
  Zodpovednosť za stav krajiny meriame časom vo vláde od vzniku samostatnej SR (1. 1. 1993)
  k dátumu kontroly. Podiel = dni v koalícii alebo v kabinete / všetky dni od 1993. Tmavšia časť
  pruhu = obdobia, keď vládu viedol premiér z danej strany (podľa názvu vlády v zdrojoch).
  Ide o meradlo času a moci, nie o hodnotenie výsledkov vládnutia. Strany vládnu súčasne,
  preto podiely nedávajú súčet 100 %.
*/
export const RESPONSIBILITY_START = "1993-01-01";
const dayMs = 86_400_000;
export const responsibilityTotalDays = Math.round((Date.parse(`${tenureAsOf}T00:00:00Z`) - Date.parse(`${RESPONSIBILITY_START}T00:00:00Z`)) / dayMs);
const ledPatterns: Record<string, RegExp> = { smer: /Fica|Pellegriniho/, slovensko: /Matoviča|Hegera/, dem: /Hegera/ };
const ledDays = (id: string, periods: GovernmentTenurePeriod[]) => ledPatterns[id] ? periods.filter(p => ledPatterns[id].test(p.government)).reduce((a, p) => a + periodDays(p), 0) : 0;

export type ResponsibilityTier = { min: number; label: string; hint: string };
export const responsibilityTiers: ResponsibilityTier[] = [
  { min: 40, label: "rozhodujúca", hint: "od 40 % času" },
  { min: 25, label: "významná", hint: "od 25 %" },
  { min: 10, label: "čiastočná", hint: "od 10 %" },
  { min: 0.0001, label: "okrajová", hint: "pod 10 %" },
  { min: 0, label: "bez účasti", hint: "0 %" },
];
/** Skrátený zápis dĺžky vlády do jedného riadku: celé roky, pod rok mesiace, bez účasti prázdny. */
export const compactTenure = (days: number) => {
  if (days <= 0) return "";
  const years = Math.floor(days / 365.25);
  if (years >= 1) return `${years} r.`;
  return `${Math.max(1, Math.floor(days / 30.4375))} mes.`;
};
export const tierFor = (share: number) => responsibilityTiers.find(t => share >= t.min) ?? responsibilityTiers[responsibilityTiers.length - 1];

export type ResponsibilityRow = { id: string; short: string; name: string; color: string; days: number; led: number; share: number; ledShare: number; label: string; compact: string; tier: string; predecessorNote?: string; fate?: string; successor?: string };
export const responsibilityRows = (): ResponsibilityRow[] => parties.map(p => {
  const tenure = governmentTenure[p.id];
  const days = tenure ? tenureDays(tenure) : 0;
  const led = tenure ? Math.min(days, ledDays(p.id, tenure.periods)) : 0;
  const share = days / responsibilityTotalDays * 100;
  return { id: p.id, short: p.short, name: p.name, color: p.color, days, led, share, ledShare: led / responsibilityTotalDays * 100, label: tenure ? tenureLabel(tenure) : "bez účasti", compact: compactTenure(days), tier: tierFor(share).label, predecessorNote: tenure?.predecessorNote };
}).sort((a, b) => b.days - a.days || a.name.localeCompare(b.name, "sk"));


/** Strany s účasťou vo vláde zoskupené podľa stupňa škály, od najvyššieho; prázdne stupne sa vynechajú. */
export const responsibilityGroups = (rows = responsibilityRows()) => responsibilityTiers
  .filter(t => t.min > 0)
  .map(t => ({ ...t, rows: rows.filter(r => r.days > 0 && r.tier === t.label) }))
  .filter(g => g.rows.length > 0);

/** Strany, ktoré už nekandidujú alebo sa zlúčili; rovnaký výpočet, „na čele vlády“ podľa označenia období. */
export const inactiveResponsibilityRows = (): ResponsibilityRow[] => inactiveParties.map(p => {
  const tenure: GovernmentTenure = { periods: p.periods };
  const days = tenureDays(tenure);
  const led = Math.min(days, p.periods.filter(x => x.led).reduce((a, x) => a + periodDays(x), 0));
  const share = days / responsibilityTotalDays * 100;
  return { id: p.id, short: p.short, name: p.name, color: p.color, days, led, share, ledShare: led / responsibilityTotalDays * 100, label: tenureLabel(tenure), compact: compactTenure(days), tier: tierFor(share).label, fate: p.fate, successor: p.successor };
}).sort((a, b) => b.days - a.days || a.name.localeCompare(b.name, "sk"));
