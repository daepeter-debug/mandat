/*
  Do decembra — fiktívne mesto Mandátovce, dvanásť mesiacov, dvanásť rozhodnutí.
  Je to hra o rozpočte a prioritách: každý mesiac príde jedna mestská správa s dvoma možnosťami,
  jedna zväčša stojí mince, druhá stojí niečo iné. Nehodnotí skutočné strany, obce ani ľudí.
  Rovnaký deň = rovnaká sezóna pre všetkých (zrnko z dátumu); tréning má náhodné zrnko.
*/
import { previousDay, slovakDay } from "./daily-game.ts";
export { previousDay, slovakDay };

export const MONTHS = ["Január", "Február", "Marec", "Apríl", "Máj", "Jún", "Júl", "August", "September", "Október", "November", "December"];
export const MONTHS_IN = ["v januári", "vo februári", "v marci", "v apríli", "v máji", "v júni", "v júli", "v auguste", "v septembri", "v októbri", "v novembri", "v decembri"];
export type SeasonName = "winter" | "spring" | "summer" | "autumn";
export const seasonOf = (month: number): SeasonName => month <= 1 || month === 11 ? "winter" : month <= 4 ? "spring" : month <= 7 ? "summer" : "autumn";

export type MeterId = "schools" | "health" | "transport";
export const METERS: { id: MeterId; label: string }[] = [{ id: "schools", label: "Školy" }, { id: "health", label: "Zdravie" }, { id: "transport", label: "Doprava" }];
export type Effect = Partial<Record<MeterId, number>>;
// Príznaky menia scénu mesta: čo sa rozhodlo, to je vidieť.
export type Flag = "bridge-fixed" | "bridge-temp" | "playground" | "gym-tarp" | "gym-roof" | "clinic-wing" | "ambulance" | "led" | "bus" | "fountain" | "market" | "tree" | "flood-wall" | "flooded" | "bike-path" | "trees" | "boiler" | "pool" | "path";
export type Later = { after: number; cost?: number; effect?: Effect; add?: Flag[]; remove?: Flag[]; note: string };
export type Option = { label: string; cost: number; hint: string; effect?: Effect; income?: number; add?: Flag[]; remove?: Flag[]; later?: Later };
export type GameEvent = { id: string; title: string; question: string; months: number[]; requires?: Flag[]; forbids?: Flag[]; options: [Option, Option] };

const ALL = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
// V nápovede možnosti sa {month} nahradí mesiacom, keď príde odložený účet alebo odmena.
export const EVENTS: GameEvent[] = [
  { id: "most", title: "Most má opäť vlastný názor na nosnosť.", question: "Opraviť hneď, alebo získať čas?", months: [1, 2, 3], forbids: ["bridge-fixed", "bridge-temp"], options: [
    { label: "Opraviť teraz", cost: 4, hint: "Doprava +2 · problém vyriešený", effect: { transport: 2 }, add: ["bridge-fixed"] },
    { label: "Dočasne zabezpečiť", cost: 1, hint: "Doprava −1 · {month} doplatíš 4 mince", effect: { transport: -1 }, add: ["bridge-temp"], later: { after: 4, cost: 4, effect: { transport: 1 }, add: ["bridge-fixed"], remove: ["bridge-temp"], note: "dokončenie mosta" } }] },
  { id: "sneh", title: "Snehová kalamita zasypala ulice aj plány.", question: "Kto odhrnie cesty?", months: [0, 1, 11], options: [
    { label: "Objednať pluhy", cost: 2, hint: "Doprava +1 · ulice prejazdné do rána", effect: { transport: 1 } },
    { label: "Počkať na odmäk", cost: 0, hint: "Doprava −2 · Zdravie −1 (šmykľavé chodníky)", effect: { transport: -2, health: -1 } }] },
  { id: "chripka", title: "Chrípka zatvára triedy aj čakárne.", question: "Zasiahnuť, alebo nechať vírus vyhrať?", months: [0, 1, 2, 10, 11], options: [
    { label: "Očkovanie a dezinfekcia", cost: 2, hint: "Zdravie +1 · školy ostávajú otvorené", effect: { health: 1 } },
    { label: "Chrípkové prázdniny", cost: 0, hint: "Školy −1 · Zdravie −1", effect: { schools: -1, health: -1 } }] },
  { id: "kotol", title: "Kotolňa v škole vypovedala službu. Práve keď sa ochladilo.", question: "Deti sedia v bundách. Čo teraz?", months: [0, 1, 9, 10], forbids: ["boiler"], options: [
    { label: "Nový kotol", cost: 3, hint: "Školy +1 · teplo na roky", effect: { schools: 1 }, add: ["boiler"] },
    { label: "Prenosné ohrievače", cost: 1, hint: "Školy −1 · {month} aj tak kúpiš kotol za 3", effect: { schools: -1 }, later: { after: 1, cost: 3, add: ["boiler"], note: "kotol pre školu" } }] },
  { id: "trhy", title: "Vianočné trhy: rozsvietiť námestie?", question: "Posledné rozhodnutie roka.", months: [11], options: [
    { label: "Trhy so svetielkami", cost: 2, hint: "Školy +1 · Zdravie +1 · mesto sa stretne", effect: { schools: 1, health: 1 }, add: ["market", "tree"] },
    { label: "Skromne, len stromček", cost: 0, hint: "Bez zmeny · stromček svieti aj tak", add: ["tree"] }] },
  { id: "ihrisko", title: "Deti chcú ihrisko, rodičia lavičky.", question: "Priestor pred školou čaká.", months: [2, 3, 4, 5, 8, 9], forbids: ["playground"], options: [
    { label: "Postaviť ihrisko", cost: 2, hint: "Školy +1 · šmykľavka aj hojdačky", effect: { schools: 1 }, add: ["playground"] },
    { label: "Zatiaľ len lavičky", cost: 0, hint: "Bez zmeny · deti sa hrajú na parkovisku" }] },
  { id: "lekar", title: "Obvodný lekár odchádza do dôchodku.", question: "Náhrada sa hľadá ťažko.", months: [2, 3, 4, 8, 9], options: [
    { label: "Náborový bonus", cost: 3, hint: "Zdravie +1 · nová lekárka do mesiaca", effect: { health: 1 } },
    { label: "Hľadať bez bonusu", cost: 0, hint: "Zdravie −2 · ambulancia pol roka prázdna", effect: { health: -2 } }] },
  { id: "autobus", title: "Dopravca ruší ranný spoj do okresu.", question: "Bez dotácie autobus nepríde.", months: ALL, forbids: ["bus"], options: [
    { label: "Dotovať spoj", cost: 2, hint: "Doprava +1 · autobus ostáva", effect: { transport: 1 }, add: ["bus"] },
    { label: "Nech si ľudia zvyknú", cost: 0, hint: "Doprava −2 · stopovanie zažíva návrat", effect: { transport: -2 } }] },
  { id: "cyklotrasa", title: "Výzva na cyklotrasu popri rieke.", question: "Eurofondy zaplatia väčšinu, mesto zvyšok.", months: [2, 3, 4, 5], forbids: ["bike-path"], options: [
    { label: "Spolufinancovať", cost: 3, hint: "{month} Doprava +2 · trasa hotová", later: { after: 3, effect: { transport: 2 }, add: ["bike-path"], note: "otvorenie cyklotrasy" } },
    { label: "Nechať výzvu tak", cost: 0, hint: "Bez zmeny · papierovanie ušetrené" }] },
  { id: "vytlky", title: "Po zime ostali výtlky veľkosti vane.", question: "Cesty volajú o pomoc.", months: [2, 3], options: [
    { label: "Vyplátať cesty", cost: 2, hint: "Doprava +1", effect: { transport: 1 } },
    { label: "Kužele sú tiež riešenie", cost: 0, hint: "Doprava −1 · autoservis ďakuje", effect: { transport: -1 } }] },
  { id: "alej", title: "Alej pri škole schne.", question: "Stromy sadili ešte prastarí rodičia.", months: [2, 3, 9, 10], forbids: ["trees"], options: [
    { label: "Vysadiť nové stromy", cost: 1, hint: "Zdravie +1 · tieň o pár rokov", effect: { health: 1 }, add: ["trees"] },
    { label: "Vyrúbať a nechať", cost: 0, hint: "Zdravie −1 · leto bez tieňa", effect: { health: -1 } }] },
  { id: "povoden", title: "Rieka sa dvíha. Tretia storočná voda za desať rokov.", question: "Hrádza, alebo vrecia s pieskom?", months: [5, 6], forbids: ["flood-wall"], options: [
    { label: "Postaviť hrádzu", cost: 3, hint: "Doprava +1 · mesto ostáva v suchu", effect: { transport: 1 }, add: ["flood-wall"] },
    { label: "Vrecia s pieskom", cost: 1, hint: "Doprava −1 · Zdravie −1 · zaplavené ulice", effect: { transport: -1, health: -1 }, add: ["flooded"], later: { after: 1, remove: ["flooded"], note: "voda opadla" } }] },
  { id: "horucavy", title: "Tropické dni: asfalt sa topí, ľudia tiež.", question: "Námestie je ako panvica.", months: [5, 6, 7], forbids: ["fountain"], options: [
    { label: "Pitné fontánky a tieň", cost: 1, hint: "Zdravie +1", effect: { health: 1 }, add: ["fountain"] },
    { label: "Odporučiť viac piť", cost: 0, hint: "Zdravie −1 · záchranka má napilno", effect: { health: -1 } }] },
  { id: "tabor", title: "Letný tábor pre deti, ktorým doma ostal len telefón.", question: "Škola má program, nemá peniaze.", months: [5, 6, 7], options: [
    { label: "Zaplatiť tábor", cost: 2, hint: "Školy +1 · dva týždne bez obrazoviek", effect: { schools: 1 } },
    { label: "Prázdniny sú prázdniny", cost: 0, hint: "Školy −1", effect: { schools: -1 } }] },
  { id: "slavnosti", title: "Kapela z okresu chce hrať na námestí.", question: "Slávnosti stoja peniaze, stánky ich vracajú.", months: [5, 6, 7, 8], options: [
    { label: "Mestské slávnosti", cost: 2, hint: "Zdravie +1 · {month} sa vrátia 3 mince zo stánkov", effect: { health: 1 }, later: { after: 1, cost: -3, note: "tržby zo stánkov" } },
    { label: "Ticho je tiež hudba", cost: 0, hint: "Bez zmeny" }] },
  { id: "kupalisko", title: "Kúpalisko má dieru vo dne aj v rozpočte.", question: "Sezóna sa blíži.", months: [4, 5], forbids: ["pool"], options: [
    { label: "Opraviť bazén", cost: 3, hint: "Zdravie +1 · Školy +1 · plavecké kurzy", effect: { health: 1, schools: 1 }, add: ["pool"] },
    { label: "Zavrieť sezónu", cost: 0, hint: "Zdravie −1 · deti sa kúpu v rieke", effect: { health: -1 } }] },
  { id: "ucitelka", title: "Učiteľka matematiky dostala ponuku z krajského mesta.", question: "Bez nej odchádza aj krúžok robotiky.", months: [7, 8, 9], options: [
    { label: "Príplatok každý mesiac", cost: 0, hint: "Školy +1 · príjem mesta −1 mesačne", effect: { schools: 1 }, income: -1 },
    { label: "Prajeme veľa šťastia", cost: 0, hint: "Školy −2", effect: { schools: -2 } }] },
  { id: "kanaly", title: "Lístie upchalo kanály, dážď dokončil zvyšok.", question: "Po uliciach sa dá plaviť.", months: [8, 9, 10], options: [
    { label: "Vyčistiť kanály", cost: 1, hint: "Doprava +1", effect: { transport: 1 } },
    { label: "Jeseň to vyrieši sama", cost: 0, hint: "Doprava −1", effect: { transport: -1 } }] },
  { id: "lampy", title: "Lampy blikajú ako diskotéka.", question: "Staré výbojky míňajú aj rozpočet.", months: [1, 2, 8, 9, 10], forbids: ["led"], options: [
    { label: "Vymeniť za LED", cost: 3, hint: "Príjem mesta +1 mesačne · svieti celú noc", income: 1, add: ["led"] },
    { label: "Vypínať o polnoci", cost: 0, hint: "Zdravie −1 · nočné úrazy", effect: { health: -1 } }] },
  { id: "ultrazvuk", title: "Poliklinika žiada nový ultrazvuk.", question: "Starý zobrazuje už len optimizmus.", months: ALL, forbids: ["clinic-wing"], options: [
    { label: "Kúpiť prístroj", cost: 3, hint: "Zdravie +2 · vyšetrenia doma", effect: { health: 2 }, add: ["clinic-wing"] },
    { label: "Posielať do okresu", cost: 0, hint: "Zdravie −1 · Doprava −1", effect: { health: -1, transport: -1 } }] },
  { id: "kamiony", title: "Kamióny si skracujú cestu cez námestie.", question: "Fontána sa trasie, okná tiež.", months: ALL, options: [
    { label: "Zákaz a obchádzka", cost: 1, hint: "Doprava +1 · Zdravie +1 (menej hluku)", effect: { transport: 1, health: 1 } },
    { label: "Nechať ich", cost: 0, hint: "Doprava −1 · Zdravie −1", effect: { transport: -1, health: -1 } }] },
  { id: "audit", title: "Kontrola našla chýbajúce faktúry za lavičky.", question: "Lavičky stoja, papiere nie.", months: [3, 4, 5, 6, 7, 8, 9], options: [
    { label: "Zaplatiť pokutu", cost: 2, hint: "Poriadok v účtoch · hotovo" },
    { label: "Odvolať sa", cost: 0, hint: "{month} prehráš a zaplatíš 3", later: { after: 2, cost: 3, note: "prehraté odvolanie" } }] },
  { id: "dar", title: "Rodák z Kanady poslal mestu dar: 4 mince.", question: "Kam ich dať?", months: ALL, options: [
    { label: "Do školy", cost: -4, hint: "Školy +1 · +4 mince", effect: { schools: 1 } },
    { label: "Do polikliniky", cost: -4, hint: "Zdravie +1 · +4 mince", effect: { health: 1 } }] },
  { id: "internet", title: "Škola nemá poriadny internet.", question: "Deti sťahujú úlohy cez mobil učiteľa.", months: ALL, options: [
    { label: "Optika do školy", cost: 2, hint: "Školy +1", effect: { schools: 1 } },
    { label: "Mobil učiteľa vydrží", cost: 0, hint: "Školy −1", effect: { schools: -1 } }] },
  { id: "sanitka", title: "Sanitka je zo severu ďalej než pizza.", question: "Záchranka chce stanovište v meste.", months: ALL, forbids: ["ambulance"], options: [
    { label: "Stanovište záchranky", cost: 3, hint: "Zdravie +2 · dojazd 8 minút", effect: { health: 2 }, add: ["ambulance"] },
    { label: "Pizza je tiež rýchla", cost: 0, hint: "Zdravie −1", effect: { health: -1 } }] },
  { id: "chodnik", title: "Chodník k škole končí v blate.", question: "Ranný pochod v gumákoch.", months: [2, 3, 4, 5, 6, 7, 8, 9], forbids: ["path"], options: [
    { label: "Dokončiť chodník", cost: 2, hint: "Školy +1 · Doprava +1", effect: { schools: 1, transport: 1 }, add: ["path"] },
    { label: "Gumáky pre všetkých", cost: 0, hint: "Doprava −1", effect: { transport: -1 } }] },
  { id: "telocvicna", title: "Strecha telocvične zateká.", question: "Na basketbal treba dážďovník.", months: [2, 3, 4, 5, 6, 7, 8], forbids: ["gym-roof", "gym-tarp"], options: [
    { label: "Nová strecha", cost: 3, hint: "Školy +1", effect: { schools: 1 }, add: ["gym-roof"] },
    { label: "Plachta a vedrá", cost: 0, hint: "Školy −1 · {month} sanácia plesne za 2", effect: { schools: -1 }, add: ["gym-tarp"], later: { after: 3, cost: 2, effect: { schools: -1 }, note: "sanácia plesne v telocvični" } }] },
  { id: "dusicky", title: "Cintorín je pred Dušičkami bez svetla.", question: "Chodníky, korene, tma.", months: [9, 10], options: [
    { label: "Osvetlenie a zábradlie", cost: 1, hint: "Zdravie +1 · nikto si nezlomí nohu", effect: { health: 1 } },
    { label: "Sviečky svietia dosť", cost: 0, hint: "Zdravie −1", effect: { health: -1 } }] },
  { id: "olympiada", title: "Deviatak vyhral krajskú olympiádu.", question: "Celoštátne kolo je v Bratislave, cesta stojí.", months: [3, 4, 5, 9, 10], options: [
    { label: "Zaplatiť cestu a učiteľa", cost: 1, hint: "Školy +1", effect: { schools: 1 } },
    { label: "Gratulovať aspoň online", cost: 0, hint: "Školy −1", effect: { schools: -1 } }] },
  { id: "hasici", title: "Dobrovoľní hasiči majú auto staršie než veliteľ.", question: "Bez techniky nevyjdú.", months: ALL, options: [
    { label: "Prispieť na techniku", cost: 2, hint: "Zdravie +1", effect: { health: 1 } },
    { label: "Vydrží ešte rok", cost: 0, hint: "Zdravie −1", effect: { health: -1 } }] },
];
const EVENTS_BY_MONTH = ALL.map(month => EVENTS.filter(e => e.months.includes(month)));

export type TownState = { month: number; coins: number; income: number; meters: Record<MeterId, number>; flags: Flag[]; pending: (Later & { due: number })[]; log: { month: number; event: string; choice: 0 | 1 }[]; ended: { kind: "december" | "collapse"; month: number; meter?: MeterId } | null };
export type SeasonPlan = { id: string; seed: string; startCoins: number; startMeters: Record<MeterId, number>; fallback?: boolean };
export const INCOME = 1;

function hash(text: string) { let seed = 2166136261; for (const char of text) seed = Math.imul(seed ^ char.charCodeAt(0), 16777619); return seed >>> 0; }
function rng(text: string) { let s = hash(text) || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }; }

export function candidates(state: TownState) {
  const used = new Set(state.log.map(l => l.event));
  const list = EVENTS_BY_MONTH[state.month].filter(e => !used.has(e.id) && (e.requires ?? []).every(f => state.flags.includes(f)) && !(e.forbids ?? []).some(f => state.flags.includes(f)));
  return list.length ? list : EVENTS_BY_MONTH[state.month];
}
// Správa mesiaca závisí od zrnka aj od doterajších rozhodnutí (čo je opravené, už nezateká).
export function eventFor(plan: SeasonPlan, state: TownState): GameEvent {
  const list = candidates(state);
  return list[Math.floor(rng(`${plan.seed}:${state.month}`)() * list.length)];
}
export function start(plan: SeasonPlan): TownState {
  return { month: 0, coins: plan.startCoins, income: INCOME, meters: { ...plan.startMeters }, flags: [], pending: [], log: [], ended: null };
}
const clamp = (n: number) => Math.max(0, Math.min(10, n));
function apply(s: TownState, effect?: Effect, add?: Flag[], remove?: Flag[]) {
  for (const m of METERS) if (effect?.[m.id]) s.meters[m.id] = clamp(s.meters[m.id] + effect[m.id]!);
  if (remove) s.flags = s.flags.filter(f => !remove.includes(f));
  if (add) for (const f of add) if (!s.flags.includes(f)) s.flags.push(f);
}
const collapsed = (s: TownState) => METERS.find(m => s.meters[m.id] <= 0)?.id;

export function choose(plan: SeasonPlan, state: TownState, choice: 0 | 1): TownState {
  if (state.ended) return state;
  const event = eventFor(plan, state);
  const option = event.options[choice];
  const s: TownState = { ...state, meters: { ...state.meters }, flags: [...state.flags], pending: [...state.pending], log: [...state.log, { month: state.month, event: event.id, choice }] };
  s.coins -= option.cost;
  s.income += option.income ?? 0;
  apply(s, option.effect, option.add, option.remove);
  if (option.later) s.pending.push({ ...option.later, due: state.month + option.later.after });
  const dead = collapsed(s);
  if (dead) return { ...s, ended: { kind: "collapse", month: s.month, meter: dead } };
  if (s.month === 11) return { ...s, ended: { kind: "december", month: 11 } };
  // Nový mesiac: dane, splatné účty a odmeny; v dlhu platia úsporné opatrenia.
  s.month += 1;
  s.coins += s.income;
  const due = s.pending.filter(p => p.due === s.month);
  s.pending = s.pending.filter(p => p.due !== s.month);
  for (const p of due) { s.coins -= p.cost ?? 0; apply(s, p.effect, p.add, p.remove); }
  if (s.coins < 0) for (const m of METERS) s.meters[m.id] = clamp(s.meters[m.id] - 1);
  const dead2 = collapsed(s);
  if (dead2) return { ...s, ended: { kind: "collapse", month: s.month, meter: dead2 } };
  return s;
}
export function replay(plan: SeasonPlan, choices: (0 | 1)[]) {
  let s = start(plan);
  for (const c of choices) { if (s.ended) break; s = choose(plan, s, c); }
  return s;
}

export type Grade = { stars: 0 | 1 | 2 | 3; title: string; text: string };
export function grade(state: TownState): Grade {
  if (state.ended?.kind === "collapse") {
    const meter = METERS.find(m => m.id === state.ended?.meter)?.label ?? "mesto";
    return { stars: 0, title: "Mesto to nezvládlo.", text: `${MONTHS_IN[state.ended.month].replace(/^./, c => c.toUpperCase())} klesla oblasť ${meter} na nulu. Skús inú postupnosť.` };
  }
  const low = Math.min(...METERS.map(m => state.meters[m.id]));
  if (low >= 7 && state.coins >= 0) return { stars: 3, title: "Vzorové mesto.", text: "Všetky oblasti aspoň na 7 a bez dlhu. Sem sa chodí odpisovať." };
  if (low >= 5 && state.coins >= 0) return { stars: 2, title: "Stabilné mesto.", text: "Nič nespadlo, nikto neutiekol a účty sú zaplatené." };
  return { stars: 1, title: "Prežili sme.", text: state.coins < 0 ? "December prišiel, dlh ostal. Budúci rok bude o úsporách." : "December prišiel, no niektorá oblasť ledva dýcha." };
}

// Prehľad všetkých 4 096 ciest sezónou: sezóna je férová, keď sa dá dohrať na tri hviezdy a zároveň sa dá aj padnúť.
export function survey(plan: SeasonPlan) {
  let best = 0, collapses = 0, three = 0;
  for (let mask = 0; mask < 4096; mask++) {
    let s = start(plan);
    for (let m = 0; m < 12 && !s.ended; m++) s = choose(plan, s, ((mask >> m) & 1) as 0 | 1);
    const g = grade(s);
    best = Math.max(best, g.stars);
    if (g.stars === 3) three++;
    if (s.ended?.kind === "collapse") collapses++;
  }
  return { best, collapses, three };
}
export function createSeason(id: string): SeasonPlan {
  for (let trial = 0; trial < 40; trial++) {
    const seed = trial ? `${id}#${trial}` : id;
    const r = rng(`mandatovce-v1:${seed}`);
    const plan: SeasonPlan = { id, seed, startCoins: 8 + Math.floor(r() * 5), startMeters: { schools: 5 + Math.floor(r() * 3), health: 5 + Math.floor(r() * 3), transport: 5 + Math.floor(r() * 3) } };
    const result = survey(plan);
    if (result.best === 3 && result.collapses > 0 && result.three <= 2048) return plan;
  }
  return { ...fallbackPlan, id };
}
// Záložná sezóna pri vyčerpaní generátora; jej férovosť stráži verify-data.
export const fallbackPlan: SeasonPlan = { id: "fallback", seed: "fallback", startCoins: 10, startMeters: { schools: 6, health: 6, transport: 6 }, fallback: true };

export type DecemberSave = { choices: (0 | 1)[]; stars: number | null };
export function readSave(value: unknown): DecemberSave {
  const empty: DecemberSave = { choices: [], stars: null };
  if (!value || typeof value !== "object") return empty;
  const s = value as Partial<DecemberSave>;
  const choices = Array.isArray(s.choices) ? s.choices.filter((c): c is 0 | 1 => c === 0 || c === 1).slice(0, 12) : [];
  const stars = typeof s.stars === "number" && Number.isInteger(s.stars) && s.stars >= 0 && s.stars <= 3 ? s.stars : null;
  return { choices, stars };
}
