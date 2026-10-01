import { catalog, combos, connected, coveredHomes, currentStep, dailyProjectError, distance, homesServed, items, MAP_SIZE, stepCost, taskClaimed, taskNames, taskReady, tasksFor, type ItemId, type Point, type RepublicState, type Task } from "./republic.ts";
import { journeyDays, festivalResult, festivalBrief, neighbours, type Festival } from "./republic-festival.ts";

/*
  Plán hráča: z uloženej štvrte vypočíta, kde hráč je, čo môže urobiť hneď, za akú odmenu, čo ešte chýba
  a či sa nezablokoval. Nič nemení: ekonomika, príkazy ani uloženie ostávajú v lib/republic.ts.
  UI: components/republic-plan.tsx (panel „Teraz“, zoznam úloh, upozornenia).
*/
export type Reward = { coins: number; materials: number };
export type PlanAction =
  | { type: "step" } | { type: "branch" } | { type: "final" } | { type: "task"; task: Task }
  | { type: "parcel" } | { type: "story" } | { type: "build"; id: ItemId } | { type: "road" } | { type: "none" };
export type PlanItem = {
  key: string; title: string; detail: string; status: "ready" | "todo" | "done" | "later";
  reward?: Reward | null; cost?: Reward | null; progress?: { have: number; need: number } | null; action: PlanAction;
};
export type Blocker = { key: string; title: string; detail: string; tone: "warning" | "info" };

const cells = Array.from({ length: MAP_SIZE * MAP_SIZE }, (_, i) => ({ x: i % MAP_SIZE, y: Math.floor(i / MAP_SIZE) }));
export const freeCells = (s: RepublicState) => cells.filter(p => !s.placed.some(o => distance(o, p) === 0) && !s.roads.some(r => distance(r, p) === 0));
/** Voľné políčka so susednou cestou k námestiu: tam nová budova hneď funguje. */
export const connectableCells = (s: RepublicState) => freeCells(s).filter(p => connected(s, p));
const connectedOf = (s: RepublicState, id: ItemId) => items(s, id).filter(o => connected(s, o));
const near = (s: RepublicState, anchors: Point[], within = 2) => connectableCells(s).filter(p => anchors.some(a => distance(a, p) <= within));
const plural = (n: number, one: string, few: string, many: string) => n === 1 ? one : n >= 2 && n <= 4 ? few : many;

// Pády pre vety v pláne (2. pád „od školy“, zámeno „presuň ju/ho“).
const GEN:Partial<Record<ItemId,string>>={school:"školy",library:"knižnice",park:"parku",garden:"záhrady",workshop:"dielne",market:"tržnice",clinic:"ambulancie",house:"domu"};
const IT:Partial<Record<ItemId,string>>={park:"ho",house:"ho"};
/** Čo konkrétne chýba pri pravidle „budova A do 2 políčok od B“ (obe napojené). */
function pairMissing(s: RepublicState, a: ItemId, b: ItemId, label: string) {
  const as = connectedOf(s, a), bs = connectedOf(s, b);
  if (!items(s, a).length) return `Chýba ${catalog[a].name.toLocaleLowerCase("sk")}.`;
  if (!as.length) return `${catalog[a].name} nie je napojená na cestu k námestiu.`;
  if (!items(s, b).length) return `Postav ${label} do 2 políčok od ${GEN[a]}, pri ceste.`;
  if (!bs.length) return `${catalog[b].name} potrebuje susednú cestu k námestiu.`;
  return `${catalog[b].name} je ďalej ako 2 políčka od ${GEN[a]}. Presuň ${IT[b]??"ju"} bližšie (presun je zadarmo).`;
}
const bestClinic = (s: RepublicState) => Math.max(0, ...items(s, "clinic").map(c => homesServed(s, c).length));

/** Úloha dňa (objednávka): stav, odmena a čo chýba. */
export function taskItem(s: RepublicState, t: Task): PlanItem {
  const claimed = taskClaimed(s, t), ready = taskReady(s, t), homes = items(s, "house").filter(h => connected(s, h)).length;
  let detail = "", progress: PlanItem["progress"] = null, action: PlanAction = { type: "none" };
  switch (t) {
    case "school-link": detail = "Škola potrebuje susednú cestu k námestiu."; action = { type: "road" }; break;
    case "green-home": progress = { have: Math.min(1, coveredHomes(s, ["park", "garden"])), need: 1 }; detail = "Park alebo záhrada s cestou do 2 políčok od napojeného domu."; action = { type: "build", id: "park" }; break;
    case "three-homes": progress = { have: Math.min(3, homes), need: 3 }; detail = `Napojené domy: ${homes}/3. Postav dom pri ceste alebo dotiahni cestu k domu.`; action = { type: "build", id: "house" }; break;
    case "care-two": progress = { have: Math.min(2, bestClinic(s)), need: 2 }; detail = "Ambulancia s cestou, do 2 políčok od dvoch napojených domov."; action = { type: "build", id: "clinic" }; break;
    case "market-square": detail = "Tržnica s cestou najviac 2 políčka od námestia."; action = { type: "build", id: "market" }; break;
    case "school-pair": detail = pairMissing(s, "school", "library", "knižnicu"); action = { type: "build", id: "library" }; break;
    case "craft-pair": detail = pairMissing(s, "school", "workshop", "dielňu"); action = { type: "build", id: "workshop" }; break;
    case "green-two": progress = { have: Math.min(2, coveredHomes(s, ["park", "garden"])), need: 2 }; detail = "Zeleň s cestou, ktorá dosiahne na dva napojené domy."; action = { type: "build", id: "garden" }; break;
  }
  return { key: `task:${t}`, title: taskNames[t], detail: claimed ? "Vyzdvihnuté dnes." : ready ? "Splnené, stačí vyzdvihnúť odmenu." : detail,
    status: claimed ? "done" : ready ? "ready" : "todo", reward: { coins: 2, materials: 1 }, progress: claimed || ready ? null : progress, action: ready && !claimed ? { type: "task", task: t } : action };
}

/** Čo chýba pri aktuálnom kroku kapitoly (krátko, konkrétne). */
export function stepMissing(s: RepublicState): string {
  const step = currentStep(s);
  if (!step) return "";
  switch (step.id) {
    case "school-yard": return items(s, "park").length || items(s, "garden").length ? pairMissing(s, "school", items(s, "park").length ? "park" : "garden", "park alebo záhradu") : "Postav park alebo záhradu do 2 políčok od školy, pri ceste.";
    case "books": return pairMissing(s, "school", "library", "knižnicu");
    case "care": return items(s, "clinic").length ? `Najlepšia ambulancia dosiahne na ${bestClinic(s)}/2 napojené domy (do 2 políčok).` : "Postav ambulanciu pri ceste tak, aby do 2 políčok mala dva napojené domy.";
    case "square": return items(s, "market").length ? "Tržnica musí byť pri ceste a najviac 2 políčka od námestia (C3)." : "Postav tržnicu pri ceste najviac 2 políčka od námestia (C3).";
    case "discovery": return "Vyber jednu z troch podôb starej haly.";
    case "preparation": { const need = s.branch === "museum" ? "library" : s.branch === "market-hall" ? "market" : "park";
      return connected(s, { x: 5, y: 1 }) ? `Postav alebo presuň ${catalog[need].name.toLocaleLowerCase("sk")} do 2 políčok od stanice (F2), pri ceste.` : "Stanica (F2) potrebuje cestu k námestiu."; }
    case "opening": { const homes = items(s, "house").filter(h => connected(s, h)).length, combo = Object.values(combos(s)).some(Boolean);
      return [!connected(s, { x: 5, y: 1 }) && "napoj stanicu", homes < 3 && `napoj domy (${homes}/3)`, !combo && "vytvor jednu kombináciu (napr. škola + knižnica)"].filter(Boolean).join(", ").replace(/^./, c => c.toUpperCase()) + "."; }
  }
  return step.goal;
}

/** Krok kapitoly ako položka plánu. */
export function stepItem(s: RepublicState): PlanItem | null {
  const step = currentStep(s);
  if (!step) return null;
  const today = dailyProjectError(s), [c, m] = stepCost(step.id), done = step.id === "discovery" ? false : step.done(s);
  const affordable = s.coins >= c && s.materials >= m, reward = step.reward[0] || step.reward[1] ? { coins: step.reward[0], materials: step.reward[1] } : null;
  const status: PlanItem["status"] = today ? "later" : step.id === "discovery" || done && affordable ? "ready" : "todo";
  const detail = today ? "Dnešný krok projektu je hotový. Ďalší krok otvoríš zajtra." : step.id === "discovery" ? "Vyber podobu starej haly." : done && !affordable ? `Na krok potrebuješ ${c} mincí a ${m} materiály. Máš ${s.coins} a ${s.materials}.` : done ? "Splnené. Potvrď krok." : stepMissing(s);
  return { key: `step:${step.id}`, title: step.name, detail, status, reward, cost: c || m ? { coins: c, materials: m } : null, progress: null,
    action: status === "ready" ? (step.id === "discovery" ? { type: "branch" } : { type: "step" }) : { type: "none" } };
}

/** Prečo hráč nemôže pokračovať na ďalší deň príbehu: nesplnené ciele s presným stavom a radou. */
export function festivalGaps(f: Festival) {
  if (f.response === null) return [];
  const r = festivalResult(f), b = festivalBrief(f), gaps: { key: string; label: string; have: string; need: string; hint: string }[] = [];
  if (r.happy < b.happy) {
    const low = r.mood.map((v, i) => ({ v, i })).filter(x => x.v < 3).sort((a, z) => a.v - z.v);
    const hints = ["tichý kútik dve políčka od programu alebo krytý stánok priamo vedľa", "miesto ďalej od centra alebo piknik a pri komplikácii lacnejšie riešenie", "uvítací stolík do 2 políčok od námestia alebo miesto bližšie k námestiu"];
    gaps.push({ key: "happy", label: "Spokojní susedia", have: `${r.happy}/3`, need: `aspoň ${b.happy}`, hint: low.map(x => `${neighbours[x.i]} má ${Math.max(0, x.v)}/5 (spokojnosť začína od 3), pomôže ${hints[x.i]}.`).join(" ") });
  }
  if (!r.special) gaps.push({ key: "special", label: b.specialLabel, have: "zatiaľ nesplnené", need: "", hint: b.goal });
  if (r.reserve < b.reserve) gaps.push({ key: "reserve", label: "Rezerva bodov", have: `${r.reserve}`, need: `aspoň ${b.reserve}`, hint: "Vyber lacnejšie zázemie alebo pri komplikácii lacnejšie riešenie." });
  return gaps;
}

/** Celý plán hráča pre aktuálny deň. */
export function playerPlan(s: RepublicState) {
  const step = stepItem(s), tasks = tasksFor(s).map(t => taskItem(s, t));
  const parcel: PlanItem = s.pending ? { key: "parcel", title: "Vybrať ozdobu zo zásielky", detail: "Zásielka je otvorená a čaká na tvoj výber.", status: "ready", reward: { coins: 8, materials: 4 }, action: { type: "parcel" } }
    : s.charges ? { key: "parcel", title: s.charges > 1 ? `Otvoriť zásielku (čakajú ${s.charges})` : "Otvoriť zásielku", detail: "Vyber jednu ozdobu do zbierky.", status: "ready", reward: { coins: 8, materials: 4 }, action: { type: "parcel" } }
    : { key: "parcel", title: "Zásielka", detail: "Nová zásielka príde zajtra.", status: "later", reward: { coins: 8, materials: 4 }, action: { type: "none" } };
  const finalReward: PlanItem | null = s.completed.includes("opening") && !s.finalReward ? { key: "final", title: "Vybrať finálnu dekoráciu", detail: "Kapitola je hotová. Vyber si ľubovoľnú ozdobu.", status: "ready", action: { type: "final" } } : null;
  const stage = s.festivalJourney?.stage ?? 0, inProgress = !!s.festival && s.festival.response === null;
  const story: PlanItem = stage >= 7
    ? { key: "story", title: "Dnešná výzva slávnosti", detail: s.festival?.mode !== "journey" && s.festival?.day === s.lastDay ? `Najlepší dnešný výsledok: ${s.festival.best}/3.` : "Nové denné zadanie.", status: s.festival?.mode !== "journey" && s.festival?.day === s.lastDay && s.festival.best === 3 ? "done" : "ready", action: { type: "story" } }
    : { key: "story", title: inProgress ? "Dokončiť rozpracovanú slávnosť" : `Slávnosť · deň ${stage + 1} zo 7: ${journeyDays[stage].title}`, detail: "Splň 3 ciele a príbeh sa posunie. Na konci získaš slávnostnú bránu.", status: "ready", progress: { have: stage, need: 7 }, action: { type: "story" } };
  const all = [step, finalReward, ...tasks, parcel, story].filter((x): x is PlanItem => !!x);
  const ready = all.filter(x => x.status === "ready"), todo = all.filter(x => x.status === "todo"), done = all.filter(x => x.status === "done" || x.status === "later" && x.key.startsWith("step"));
  // Ďalší krok: najprv to, čo dá odmenu hneď (krok projektu, objednávky, zásielka), potom slávnosť, potom čo chýba.
  const order = (x: PlanItem) => x.key.startsWith("step") ? 0 : x.key === "final" ? 1 : x.key.startsWith("task") ? 2 : x.key === "parcel" ? 3 : 4;
  const next = ready.slice().sort((a, b) => order(a) - order(b))[0] ?? todo[0] ?? null;
  return { step, tasks, parcel, story, ready, todo, done, next, idle: !ready.some(x => x.key !== "story") && !todo.length, blockers: blockers(s) };
}

/** Zablokovanie: plná štvrť, žiadne voľné miesto pri ceste, žiadne miesto pre aktuálny cieľ. */
export function blockers(s: RepublicState): Blocker[] {
  const free = freeCells(s), open = connectableCells(s), out: Blocker[] = [];
  if (!free.length) out.push({ key: "full", tone: "warning", title: "Štvrť je plná, nemáš kam stavať.", detail: "Uvoľni miesto: v detaile budovy zvoľ Odložiť (vráti sa do zásoby zadarmo) alebo odstráň cestu v režime Cesty." });
  else if (!open.length) out.push({ key: "no-road", tone: "warning", title: "Žiadne voľné miesto nie je pri ceste.", detail: `Voľných políčok je ${free.length}, ale žiadne nemá susednú cestu k námestiu. Polož cestu k voľnému políčku alebo presuň budovu.` });
  const step = currentStep(s);
  if (step && !dailyProjectError(s) && step.id !== "discovery" && !step.done(s) && open.length) {
    const school = connectedOf(s, "school");
    const target = step.id === "school-yard" || step.id === "books" ? (school.length ? near(s, school) : null)
      : step.id === "square" ? near(s, [{ x: 2, y: 2 }])
      : step.id === "preparation" ? near(s, [{ x: 5, y: 1 }])
      : step.id === "care" ? open.filter(p => items(s, "house").filter(h => connected(s, h) && distance(h, p) <= 2).length >= 2) : null;
    if (target && !target.length) out.push({ key: "goal-space", tone: "warning", title: `Pre krok „${step.name}“ už nie je voľné miesto.`,
      detail: step.id === "care" ? "Žiadne voľné miesto pri ceste nemá do 2 políčok dva napojené domy. Presuň dom alebo uvoľni miesto medzi domami." : `V dosahu 2 políčok od ${step.id === "square" ? "námestia" : step.id === "preparation" ? "stanice" : "školy"} nie je voľné miesto s cestou. Presuň niečo z okolia (presun je zadarmo) alebo polož cestu bližšie.` });
  }
  return out;
}

/** Kam sa dá budova priestorovo postaviť alebo presunúť (voľné políčka) a koľko z nich má cestu. Zdroje rieši cena v paneli. */
export function placementOptions(s: RepublicState) {
  const free = freeCells(s);
  return { cells: free, connected: free.filter(p => connected(s, p)) };
}
export const rewardText = (r: Reward | null | undefined) => !r || !r.coins && !r.materials ? "" : [r.coins ? `+${r.coins} ${plural(r.coins, "minca", "mince", "mincí")}` : "", r.materials ? `+${r.materials} ${plural(r.materials, "materiál", "materiály", "materiálov")}` : ""].filter(Boolean).join(", ");
