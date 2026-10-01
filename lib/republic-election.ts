import { connected, dayNumber, items, type RepublicState } from "./republic.ts";
import { homeNeeds, townSatisfaction } from "./republic-trust.ts";

/*
  Komunálne voľby v Lipovej štvrti: herná simulácia so skutočnými pravidlami volieb do orgánov samosprávy obcí
  podľa zákona č. 180/2014 Z. z. (overené v plnom znení): § 182 ods. 4 (označovanie kandidátov), § 184 ods. 1
  a 2 (neplatné hlasovacie lístky, viac lístkov rovnakého druhu v obálke), § 189 (výsledky, rovnosť hlasov, žreb, starosta) a § 192 ods. 1 (náhradníci).
  Kandidáti, strany aj voliči sú vymyslení. Výsledok závisí od štvrte (čo hráč postavil a napojil, slávnosti)
  a je deterministický: rovnaká štvrť a rovnaké lístky dajú rovnaký výsledok.
  Deň volieb = skutočné spojené voľby do orgánov samosprávy obcí a samosprávnych krajov 24. 10. 2026 (sobota).
*/
export const ELECTION_DAY = "2026-10-24";
export const COUNCIL_SEATS = 3;
export type Interest = "deti" | "zelen" | "zdravie" | "remeslo" | "doprava" | "komunita";
export type Candidate = { id: string; name: string; role: string; party: string | null; order: number; interests: Interest[] };
export const interestNames: Record<Interest, string> = { deti: "deti a škola", zelen: "zeleň", zdravie: "zdravie", remeslo: "remeslá a obchod", doprava: "doprava a stanica", komunita: "susedský život" };
// Lístky sú zoradené abecedne ako na skutočných hlasovacích lístkoch; poradové čísla sú poradie na lístku.
export const mayorCandidates: Candidate[] = [
  { id: "eva", name: "Eva", role: "učiteľka", party: null, order: 1, interests: ["deti", "zelen"] },
  { id: "milan", name: "Milan", role: "správca stanice", party: null, order: 1, interests: ["remeslo", "doprava"] },
  { id: "nina", name: "Nina", role: "susedská organizátorka", party: null, order: 1, interests: ["komunita", "zdravie"] },
];
export const councilCandidates: Candidate[] = [
  { id: "jakub", name: "Jakub", role: "záhradník", party: "Spolok Lipová", order: 2, interests: ["zelen", "komunita"] },
  { id: "maria", name: "Mária", role: "dôchodkyňa", party: null, order: 1, interests: ["zdravie", "komunita"] },
  { id: "ondrej", name: "Ondrej", role: "rušňovodič", party: "Stanica žije", order: 1, interests: ["doprava", "remeslo"] },
  { id: "pavol", name: "Pavol", role: "stolár", party: "Stanica žije", order: 2, interests: ["remeslo", "komunita"] },
  { id: "tomas", name: "Tomáš", role: "študent", party: null, order: 1, interests: ["zelen", "doprava"] },
  { id: "zuzana", name: "Zuzana", role: "zdravotná sestra", party: "Spolok Lipová", order: 1, interests: ["zdravie", "deti"] },
];
export const candidateLabel = (c: Candidate) => c.party ?? (c.name.endsWith("a") ? "nezávislá kandidátka" : "nezávislý kandidát");
export const electionRules = [
  { title: "Dva hlasovacie lístky", text: `Na lístku pre poslancov zakrúžkuješ najviac toľko kandidátov, koľko sa ich v obvode volí (v Lipovej štvrti ${COUNCIL_SEATS}). Na lístku pre starostu zakrúžkuješ jedného kandidáta.`, law: "§ 182 ods. 4" },
  { title: "Neplatný lístok", text: "Lístok je neplatný, ak na ňom nikto nie je zakrúžkovaný alebo je zakrúžkovaných viac kandidátov, než sa smie (pri starostovi viac ako jeden). Ak sú v obálke dva lístky rovnakého druhu, neplatné sú oba.", law: "§ 184" },
  { title: "Kto sa stane poslancom", text: "Zvolení sú kandidáti, ktorí v obvode získali najviac platných hlasov.", law: "§ 189 ods. 1" },
  { title: "Rovnosť hlasov", text: "Ak majú rovnako hlasov kandidáti tej istej strany, rozhodne poradie na kandidátnej listine. Ak sú z rôznych strán alebo nezávislí, rozhodne žreb miestnej volebnej komisie.", law: "§ 189 ods. 2 a 3" },
  { title: "Starosta", text: "Starostom je kandidát s najviac platnými hlasmi. Pri rovnosti hlasov sa konajú nové voľby.", law: "§ 189 ods. 4" },
  { title: "Náhradníci", text: "Keď sa uvoľní miesto poslanca, nastúpi nezvolený kandidát s najviac platnými hlasmi v obvode.", law: "§ 192 ods. 1" },
];
export const LAW = "zákon č. 180/2014 Z. z. o podmienkach výkonu volebného práva";

export function electionPhase(today: string) {
  const days = dayNumber(ELECTION_DAY) - dayNumber(today);
  return days > 0 ? { phase: "pred" as const, days } : { phase: days === 0 ? "den" as const : "po" as const, days: 0 };
}

// Deterministický generátor (mulberry32) a mixér.
const mix = (n: number) => { let h = (n | 0) ^ 0x9e3779b9; h = Math.imul(h ^ (h >>> 16), 0x85ebca6b); h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35); return (h ^ (h >>> 16)) >>> 0; };
function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/** Ako štvrť napĺňa jednotlivé záujmy (0–1). */
export function interestScores(s: RepublicState): Record<Interest, number> {
  const on = (id: Parameters<typeof items>[1]) => items(s, id).some(o => connected(s, o));
  const homes = items(s, "house"), share = (key: keyof ReturnType<typeof homeNeeds>) => homes.length ? homes.filter(h => homeNeeds(s, h)[key]).length / homes.length : 0;
  const journey = (s.festivalJourney?.scores ?? []).reduce((a, b) => a + b, 0) / 21;
  const decor = s.placed.filter(o => ["linden", "flower-bed", "fountain", "pergola", "bench"].includes(o.id)).length;
  const clamp = (n: number) => Math.round(Math.max(0, Math.min(1, n)) * 100) / 100;
  return {
    deti: clamp((on("school") ? .4 : 0) + (on("library") ? .3 : 0) + share("zelen") * .3),
    zelen: clamp(share("zelen") * .75 + Math.min(.25, decor * .08)),
    zdravie: clamp(share("lekar")),
    remeslo: clamp((on("workshop") ? .5 : 0) + (on("market") ? .5 : 0)),
    doprava: clamp((connected(s, { x: 5, y: 1 }) ? .4 : 0) + (s.completed.includes("opening") ? .4 : 0) + Math.min(.2, s.roads.length / 40)),
    komunita: clamp(journey * .6 + (on("culture") ? .25 : 0) + (on("plaza") ? .15 : 0)),
  };
}

export type Ballot = { mayor: string[]; council: string[] };
/** Obálka voliča. `double`: v obálke boli dva lístky rovnakého druhu, neplatné sú potom všetky (§ 184 ods. 2). */
export type Envelope = Ballot & { double?: "mayor" | "council" };
export type Invalid = "none" | "many" | "double";
export type Check = { valid: boolean; why: Invalid | null; reason: string };
export function checkMayor(circled: string[]): Check {
  if (!circled.length) return { valid: false, why: "none", reason: "Nezakrúžkoval si žiadneho kandidáta na starostu (§ 184 ods. 1)." };
  if (circled.length > 1) return { valid: false, why: "many", reason: "Na starostu si zakrúžkoval viac ako jedného kandidáta (§ 184 ods. 1)." };
  return { valid: true, why: null, reason: "Lístok pre starostu je platný." };
}
export function checkCouncil(circled: string[], seats = COUNCIL_SEATS): Check {
  if (!circled.length) return { valid: false, why: "none", reason: "Nezakrúžkoval si žiadneho kandidáta na poslanca (§ 184 ods. 1)." };
  if (circled.length > seats) return { valid: false, why: "many", reason: `Zakrúžkoval si ${circled.length} kandidátov, volia sa ${seats} poslanci. Lístok by bol neplatný (§ 184 ods. 1).` };
  return { valid: true, why: null, reason: circled.length < seats ? `Platný: smieš zakrúžkovať najviac ${seats}, ty si zakrúžkoval ${circled.length}.` : "Lístok pre poslancov je platný." };
}
/** Celá obálka: dva lístky rovnakého druhu zneplatnia oba bez ohľadu na zakrúžkovanie (§ 184 ods. 2). */
export function checkEnvelope(e: Envelope): { mayor: Check; council: Check } {
  return {
    mayor: e.double === "mayor" ? { valid: false, why: "double", reason: "V obálke boli dva lístky pre starostu, neplatné sú oba (§ 184 ods. 2)." } : checkMayor(e.mayor),
    council: e.double === "council" ? { valid: false, why: "double", reason: "V obálke boli dva lístky pre poslancov, neplatné sú oba (§ 184 ods. 2)." } : checkCouncil(e.council),
  };
}

/** Voliči štvrte a ich lístky. Počet rastie s domami, účasť so spokojnosťou štvrte. */
export function electionBallots(s: RepublicState) {
  const scores = interestScores(s), satisfaction = townSatisfaction(s).value / 100;
  const homes = items(s, "house"), registered = Math.min(90, 24 + homes.reduce((n, h) => n + (connected(s, h) ? 6 : 3), 0));
  const r = rng(mix(s.seed ^ dayNumber(ELECTION_DAY) * 7919));
  const journey = s.festivalJourney?.scores ?? [];
  // Hrdina slávnosti získa u susedov dôveru: Nina (dni 1 a 5), Eva (deň 3), Milan (deň 4).
  const hero: Record<string, number> = { nina: ((journey[0] ?? 0) + (journey[4] ?? 0)) / 6 * .3, eva: (journey[2] ?? 0) / 3 * .3, milan: (journey[3] ?? 0) / 3 * .3 };
  const turnout = .35 + .45 * satisfaction, ballots: Envelope[] = [];
  for (let v = 0; v < registered; v++) {
    const weights = Object.fromEntries((Object.keys(scores) as Interest[]).map(k => [k, .2 + r() ** 2 * 1.6])) as Record<Interest, number>;
    const goes = r() < turnout;
    const appeal = (c: Candidate) => c.interests.reduce((sum, k) => sum + weights[k] * (.35 + scores[k]), 0) + (hero[c.id] ?? 0) + r() * .45;
    if (!goes) continue;
    const mayorRank = mayorCandidates.map(c => ({ id: c.id, a: appeal(c) })).sort((a, b) => b.a - a.a).map(x => x.id);
    const councilRank = councilCandidates.map(c => ({ id: c.id, a: appeal(c) })).sort((a, b) => b.a - a.a).map(x => x.id);
    const m = r(), c = r();
    // Neplatné: starosta 2 % prázdny, 1,5 % dvaja zakrúžkovaní, 0,5 % dva lístky v obálke; poslanci 1 % / 1,5 % / 0,5 %.
    const mayor = m < .02 ? [] : m < .035 ? mayorRank.slice(0, 2) : mayorRank.slice(0, 1);
    const k = c < .01 ? 0 : c < .025 ? COUNCIL_SEATS + 1 : c < .28 ? 1 : c < .58 ? 2 : COUNCIL_SEATS;
    const double = m >= .035 && m < .04 ? "mayor" as const : c >= .025 && c < .03 ? "council" as const : null;
    ballots.push(double ? { mayor, council: councilRank.slice(0, k), double } : { mayor, council: councilRank.slice(0, k) });
  }
  return { registered, ballots };
}

/** Poradie kandidátov podľa § 189 ods. 2 a 3 (a § 192 pri náhradníkoch). Zaznamená žreby. */
export function rankCouncil(votes: Record<string, number>, seed: number) {
  const r = rng(seed), lots: { among: string[]; order: string[] }[] = [];
  const byVotes = new Map<number, typeof councilCandidates>();
  for (const c of councilCandidates) byVotes.set(votes[c.id], [...(byVotes.get(votes[c.id]) ?? []), c]);
  const ranking: string[] = [];
  for (const v of [...byVotes.keys()].sort((a, b) => b - a)) {
    const group = byVotes.get(v)!;
    if (group.length === 1) { ranking.push(group[0].id); continue; }
    // Bloky: kandidáti tej istej strany idú podľa poradia na listine (§ 189 ods. 2), bloky rôznych strán a nezávislých určí žreb (ods. 3).
    const blocks = Object.values(group.reduce<Record<string, Candidate[]>>((acc, c) => { const key = c.party ?? `nezavisly:${c.id}`; (acc[key] ??= []).push(c); return acc; }, {})).map(b => b.sort((a, z) => a.order - z.order));
    const drawn = blocks.length > 1 ? blocks.map(b => ({ b, key: r() })).sort((a, z) => a.key - z.key).map(x => x.b) : blocks;
    const order = drawn.flat().map(c => c.id);
    if (blocks.length > 1) lots.push({ among: group.map(c => c.id), order });
    ranking.push(...order);
  }
  return { ranking, lots };
}

/** Starosta podľa § 189 ods. 4: najviac platných hlasov, pri rovnosti nové voľby (winner = null, tie = kandidáti). */
export function mayorOutcome(votes: Record<string, number>) {
  const top = Math.max(0, ...Object.values(votes)), leaders = Object.keys(votes).filter(id => votes[id] === top);
  return { winner: top > 0 && leaders.length === 1 ? leaders[0] : null, tie: top > 0 && leaders.length > 1 ? leaders : [] };
}
export type ElectionResult = ReturnType<typeof countElection>;
/** Sčítanie podľa § 183–189: platné a neplatné lístky, hlasy, zvolení, náhradníci, starosta, žreby, priebeh sčítania. */
export function countElection(s: RepublicState, player: Ballot | null) {
  const { registered, ballots } = electionBallots(s), all: Envelope[] = player ? [...ballots, player] : ballots;
  const mayorVotes = Object.fromEntries(mayorCandidates.map(c => [c.id, 0])) as Record<string, number>;
  const councilVotes = Object.fromEntries(councilCandidates.map(c => [c.id, 0])) as Record<string, number>;
  let mayorValid = 0, councilValid = 0;
  const reasons: Record<"mayor" | "council", Record<Invalid, number>> = { mayor: { none: 0, many: 0, double: 0 }, council: { none: 0, many: 0, double: 0 } };
  const steps: { counted: number; mayor: Record<string, number>; council: Record<string, number> }[] = [];
  all.forEach((b, i) => {
    const check = checkEnvelope(b);
    if (check.mayor.valid) { mayorValid++; mayorVotes[b.mayor[0]]++; } else reasons.mayor[check.mayor.why ?? "none"]++;
    if (check.council.valid) { councilValid++; for (const id of b.council) councilVotes[id]++; } else reasons.council[check.council.why ?? "none"]++;
    if ((i + 1) % 4 === 0 || i === all.length - 1) steps.push({ counted: i + 1, mayor: { ...mayorVotes }, council: { ...councilVotes } });
  });
  const { ranking, lots } = rankCouncil(councilVotes, mix(s.seed ^ 0x5eed ^ councilValid));
  return {
    registered, voted: all.length, turnout: Math.round(all.length / (registered + (player ? 1 : 0)) * 100),
    mayor: { valid: mayorValid, invalid: all.length - mayorValid, reasons: reasons.mayor, votes: mayorVotes, ...mayorOutcome(mayorVotes) },
    council: { valid: councilValid, invalid: all.length - councilValid, reasons: reasons.council, votes: councilVotes, elected: ranking.slice(0, COUNCIL_SEATS), substitutes: ranking.slice(COUNCIL_SEATS), lots: lots.filter(l => l.among.some(id => ranking.indexOf(id) < COUNCIL_SEATS) && l.among.some(id => ranking.indexOf(id) >= COUNCIL_SEATS)) },
    player: player ? { mayor: checkMayor(player.mayor), council: checkCouncil(player.council) } : null,
    steps,
  };
}

export type StoredElection = { day: string; ballot: Ballot; result: ElectionResult };
const mayorIds = new Set(mayorCandidates.map(c => c.id)), councilIds = new Set(councilCandidates.map(c => c.id));
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const isCount = (v: unknown) => Number.isInteger(v) && (v as number) >= 0 && (v as number) <= 1000;
const isIds = (v: unknown, ids: Set<string>, max = ids.size) => Array.isArray(v) && v.length <= max && new Set(v).size === v.length && v.every(id => typeof id === "string" && ids.has(id));
const isVotes = (v: unknown, ids: Set<string>) => isObj(v) && Object.keys(v).length === ids.size && [...ids].every(id => isCount(v[id]));
const isReasons = (v: unknown) => isObj(v) && (["none", "many", "double"] as const).every(k => isCount(v[k]));
const isCheck = (v: unknown) => isObj(v) && typeof v.valid === "boolean" && typeof v.reason === "string";
/** Uložené ostré hlasovanie z localStorage je nedôveryhodný vstup: prijme sa len úplný a zmysluplný tvar, inak null. */
export function parseStoredElection(text: string | null): StoredElection | null {
  let v: unknown;
  try { v = JSON.parse(text ?? "null"); } catch { return null; }
  if (!isObj(v) || typeof v.day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v.day) || !isObj(v.ballot) || !isObj(v.result)) return null;
  const { ballot: b, result: r } = v;
  if (!isIds(b.mayor, mayorIds) || !isIds(b.council, councilIds)) return null;
  if (!isCount(r.registered) || !isCount(r.voted) || !isCount(r.turnout) || !isObj(r.mayor) || !isObj(r.council) || !Array.isArray(r.steps) || !r.steps.length) return null;
  const m = r.mayor, c = r.council;
  if (!isCount(m.valid) || !isCount(m.invalid) || !isReasons(m.reasons) || !isVotes(m.votes, mayorIds) || !(m.winner === null || (typeof m.winner === "string" && mayorIds.has(m.winner))) || !isIds(m.tie, mayorIds)) return null;
  if (!isCount(c.valid) || !isCount(c.invalid) || !isReasons(c.reasons) || !isVotes(c.votes, councilIds) || !isIds(c.elected, councilIds, COUNCIL_SEATS) || (c.elected as string[]).length !== COUNCIL_SEATS || !isIds(c.substitutes, councilIds)) return null;
  if (!Array.isArray(c.lots) || !c.lots.every(l => isObj(l) && isIds(l.among, councilIds) && isIds(l.order, councilIds))) return null;
  if (!r.steps.every(st => isObj(st) && isCount(st.counted) && isVotes(st.mayor, mayorIds) && isVotes(st.council, councilIds))) return null;
  if (!(r.player === null || (isObj(r.player) && isCheck(r.player.mayor) && isCheck(r.player.council)))) return null;
  return v as StoredElection;
}
