import { branchNames, catalog, connected, currentStep, distance, homesServed, items, MAP_SIZE, network, taskClaimed, taskNames, taskReady, tasksFor, type ItemId, type Point, type RepublicState, type Task } from "./republic.ts";
import { homeNeeds, type Need } from "./republic-trust.ts";
import { connectableCells } from "./republic-plan.ts";

/*
  Čo je na mape a čo robí. Každý objekt má kategóriu (farba a ikona na mape), krátky názov, jednu vetu
  o účinku a z aktuálnej štvrte vypočítaný stav: napojenie, komu pomáha, čo mu chýba a či súvisí
  s krokom projektu alebo dnešnou objednávkou. Navyše políčka, ktoré má mapa zvýrazniť.
  Čisté funkcie: nič nemenia, ekonomika aj uloženie ostávajú v lib/republic.ts. UI: components/republic-info.tsx.
*/
export type Category = "byvanie" | "vzdelanie" | "zdravie" | "zelen" | "obchod" | "kultura" | "srdce" | "stanica" | "ozdoba";
export const categories: Record<Category, { label: string; color: string }> = {
  byvanie: { label: "Bývanie", color: "#a85a36" },
  vzdelanie: { label: "Vzdelanie", color: "#33679e" },
  zdravie: { label: "Zdravie", color: "#b8373d" },
  zelen: { label: "Zeleň", color: "#3b8146" },
  obchod: { label: "Obchod a remeslá", color: "#a86d12" },
  kultura: { label: "Kultúra", color: "#7354a3" },
  srdce: { label: "Srdce štvrte", color: "#245c48" },
  stanica: { label: "Stanica", color: "#535b66" },
  ozdoba: { label: "Ozdoba", color: "#86764f" },
};
type Info = { short: string; category: Category; tagline: string; does: string };
const decoration = (short: string, green = false): Info => ({ short, category: "ozdoba", tagline: "Ozdoba", does: green ? "Ozdoba na oddych a zeleň. Ekonomiku nemení, ale susedia si viac cenia zelenú štvrť." : "Ozdoba pre krajšiu štvrť. Ekonomiku nemení." });
export const info: Record<ItemId, Info> = {
  house: { short: "Dom", category: "byvanie", tagline: "Tu bývajú susedia", does: "Tu bývajú susedia. Chcú cestu k námestiu, zeleň a ambulanciu do 2 políčok a v štvrti školu a tržnicu." },
  school: { short: "Škola", category: "vzdelanie", tagline: "Pre všetky napojené domy", does: "Deti zo všetkých napojených domov majú kam chodiť do školy. S knižnicou alebo dielňou do 2 políčok vznikne bonus." },
  library: { short: "Knižnica", category: "vzdelanie", tagline: "Pri škole = Školská štvrť", does: "Knihy a čítanie pre deti. Do 2 políčok od školy vytvorí Školskú štvrť." },
  clinic: { short: "Ambulancia", category: "zdravie", tagline: "Lekár do 2 políčok", does: "Lekár pre domy do 2 políčok. Dom aj ambulancia musia mať cestu k námestiu." },
  park: { short: "Park", category: "zelen", tagline: "Zeleň do 2 políčok", does: "Zeleň pre domy do 2 políčok. Pri škole slúži ako školský dvor." },
  garden: { short: "Záhrada", category: "zelen", tagline: "Zeleň do 2 políčok", does: "Zeleň pre domy do 2 políčok, rovnako ako park." },
  market: { short: "Tržnica", category: "obchod", tagline: "Nákupy pre celú sieť", does: "Nákupy pre všetky napojené domy. Do 2 políčok od námestia oživí centrum." },
  workshop: { short: "Dielňa", category: "obchod", tagline: "Pri škole = Remeselná štvrť", does: "Remeslá a práca. Do 2 políčok od školy vytvorí Remeselnú štvrť." },
  culture: { short: "Kult. dom", category: "kultura", tagline: "Stretnutia susedov", does: "Miesto na susedské stretnutia. Odomkne sa po otvorení stanice a susedia si ho cenia aj vo voľbách." },
  "town-hall": { short: "Radnica", category: "srdce", tagline: "Sídlo štvrte", does: "Sídlo štvrte. Tu sa 24. 10. volí starosta a poslanci. Nedá sa presunúť." },
  plaza: { short: "Námestie", category: "srdce", tagline: "Začiatok cestnej siete", does: "Začiatok cestnej siete. Budova funguje, len keď ju cesty spájajú s námestím." },
  station: { short: "Stanica", category: "stanica", tagline: "Cieľ projektu", does: "Stará stanica je cieľ celého projektu: sedem krokov ju znova otvorí pre štvrť." },
  bench: decoration("Lavička", true), "flower-bed": decoration("Záhon", true), linden: decoration("Lipa", true), fountain: decoration("Fontána", true), pergola: decoration("Pergola", true),
  "book-kiosk": decoration("Kiosk"), clock: decoration("Hodiny"), bandstand: decoration("Pavilón"), sculpture: decoration("Socha"), observatory: decoration("Hvezdáreň"), glasshouse: decoration("Skleník"),
  "ceremonial-gate": decoration("Brána"),
};
export const coords = (p: Point) => `${String.fromCharCode(65 + p.x)}${p.y + 1}`;
const plaza = { x: 2, y: 2 };
const same = (a: Point, b: Point) => a.x === b.x && a.y === b.y;
/** Políčka mapy do vzdialenosti r (bez samotného políčka), napr. dosah parku. */
export const within = (p: Point, r = 2) => Array.from({ length: MAP_SIZE * MAP_SIZE }, (_, i) => ({ x: i % MAP_SIZE, y: Math.floor(i / MAP_SIZE) })).filter(c => !same(c, p) && distance(c, p) <= r);
const plural = (n: number, one: string, few: string, many: string) => n === 1 ? one : n >= 2 && n <= 4 ? few : many;
const domov = (n: number) => `${n} ${plural(n, "domu", "domom", "domom")}`;
const list = (ps: Point[]) => ps.map(coords).join(", ");

export type Check = { ok: boolean; text: string };
/** Rýchla akcia z detailu: postaviť konkrétnu budovu, cestný režim, stavba na vybrané políčko, odstránenie cesty. */
export type Quick = { label: string; kind: "build" | "road" | "build-here" | "road-here"; id?: ItemId };
/** Čo má mapa zvýrazniť: dosah (podfarbenie), komu to pomáha (zelená), čo nefunguje (oranžová). */
export type Highlight = { reach: Point[]; good: Point[]; bad: Point[] };
export type Report = { key: string; point: Point; id: ItemId | null; title: string; label: string; category: Category | null; does: string;
  summary: string; checks: Check[]; related: Check[]; notes: string[]; quick: Quick[]; highlight: Highlight; movable: boolean };

// Čo ktorý krok projektu a ktorá objednávka potrebuje (aby detail budovy povedal „súvisí s…“).
const stepUses = (s: RepublicState, id: string): ItemId[] => ({
  "school-yard": ["school", "park", "garden"], books: ["school", "library"], care: ["clinic", "house"], square: ["market", "plaza"], discovery: ["station"],
  preparation: ["station", ...(s.branch === "museum" ? ["library"] : s.branch === "market-hall" ? ["market"] : ["park", "garden"])],
  opening: ["station", "house"],
} as Record<string, ItemId[]>)[id] ?? [];
const taskUses: Record<Task, ItemId[]> = {
  "school-link": ["school"], "green-home": ["park", "garden", "house"], "three-homes": ["house"], "care-two": ["clinic", "house"],
  "market-square": ["market", "plaza"], "school-pair": ["school", "library"], "craft-pair": ["school", "workshop"], "green-two": ["park", "garden", "house"],
};
function related(s: RepublicState, id: ItemId): Check[] {
  const out: Check[] = [], step = currentStep(s);
  if (step && stepUses(s, step.id).includes(id)) {
    const ok = step.id !== "discovery" && step.done(s);
    out.push({ ok, text: `Krok projektu „${step.name}“: ${ok ? "podmienka je splnená" : step.goal.charAt(0).toLocaleLowerCase("sk") + step.goal.slice(1, -1)}.` });
  }
  for (const t of tasksFor(s)) if (taskUses[t].includes(id)) {
    const claimed = taskClaimed(s, t), ready = taskReady(s, t);
    out.push({ ok: claimed || ready, text: `Dnešná objednávka „${taskNames[t]}“: ${claimed ? "vybavená" : ready ? "splnená, vyzdvihni odmenu" : "ešte nie je splnená"}.` });
  }
  return out;
}
const empty = (): Highlight => ({ reach: [], good: [], bad: [] });

/** Detail objektu na mape: čo to je, čo robí, komu pomáha, čo chýba a čo s tým. */
export function objectReport(s: RepublicState, instanceId: string): Report | null {
  const o = s.placed.find(p => p.instanceId === instanceId);
  if (!o) return null;
  const meta = info[o.id], building = catalog[o.id].kind === "building", linked = connected(s, o);
  const title = o.id === "station" && s.branch ? branchNames[s.branch] : catalog[o.id].name;
  const checks: Check[] = [], notes: string[] = [], quick: Quick[] = [], hl = empty();
  let summary = "";
  if (building && o.id !== "plaza" && o.id !== "town-hall" && o.id !== "house") {
    checks.push(linked ? { ok: true, text: "Napojené cestou na námestie." } : { ok: false, text: "Bez cesty k námestiu, preto zatiaľ nefunguje." });
    if (!linked) { notes.push("Polož cestu na susedné políčko a spoj ju s námestím (C3)."); quick.push({ label: "Položiť cestu", kind: "road" }); }
  }
  const linkedHomes = items(s, "house").filter(h => connected(s, h));
  switch (o.id) {
    case "house": {
      const met = homeNeeds(s, o), order: Need[] = ["cesta", "zelen", "lekar", "skola", "obchod"];
      const text: Record<Need, [string, string]> = {
        cesta: ["Cesta k námestiu", "Chýba cesta k námestiu"], zelen: ["Zeleň do 2 políčok", "Chýba park alebo záhrada do 2 políčok"],
        lekar: ["Ambulancia do 2 políčok", "Chýba ambulancia do 2 políčok"], skola: ["Škola v cestnej sieti", "Chýba napojená škola"], obchod: ["Tržnica v cestnej sieti", "Chýba napojená tržnica"],
      };
      for (const n of order) checks.push({ ok: met[n], text: text[n][met[n] ? 0 : 1] });
      const count = order.filter(n => met[n]).length;
      summary = count === 5 ? "Susedia tu majú všetko, čo potrebujú." : `Splnené priania: ${count} z 5.`;
      if (!met.cesta) { notes.push("Bez cesty k námestiu sa nepočíta nič iné. Polož cestu na susedné políčko."); quick.push({ label: "Položiť cestu", kind: "road" }); }
      else {
        if (!met.zelen) quick.push({ label: "Postaviť park", kind: "build", id: "park" });
        if (!met.lekar) quick.push({ label: "Postaviť ambulanciu", kind: "build", id: "clinic" });
        if (!met.skola) quick.push({ label: items(s, "school").length ? "Napojiť školu" : "Postaviť školu", kind: items(s, "school").length ? "road" : "build", id: items(s, "school").length ? undefined : "school" });
        if (!met.obchod) quick.push({ label: items(s, "market").length ? "Napojiť tržnicu" : "Postaviť tržnicu", kind: items(s, "market").length ? "road" : "build", id: items(s, "market").length ? undefined : "market" });
      }
      hl.reach = within(o, 2);
      hl.good = met.cesta ? s.placed.filter(x => connected(s, x) && (["park", "garden", "clinic"].includes(x.id) && distance(x, o) <= 2 || x.id === "school" || x.id === "market")) : [];
      if (!met.cesta) hl.bad = [o];
      break;
    }
    case "park": case "garden": case "clinic": {
      const served = homesServed(s, o), near = items(s, "house").filter(h => distance(h, o) <= 2), cut = near.filter(h => !connected(s, h));
      summary = served.length ? `Pomáha ${domov(served.length)}: ${list(served)}.` : linked ? "Zatiaľ nepomáha žiadnemu domu." : "Bez cesty nepomáha nikomu.";
      if (linked && !served.length) notes.push(`${o.id === "clinic" ? "Ambulancia" : o.id === "park" ? "Park" : "Záhrada"} pomáha len domom do 2 políčok. Presuň ju bližšie k domom s cestou, presun je zadarmo.`);
      if (linked && cut.length) notes.push(`${cut.length === 1 ? "Dom" : "Domy"} ${list(cut)} v dosahu ${cut.length === 1 ? "nemá" : "nemajú"} cestu, preto sa nepočíta${cut.length === 1 ? "" : "jú"}.`);
      hl.reach = within(o, 2); hl.good = served; hl.bad = linked ? cut : near;
      break;
    }
    case "school": {
      const lib = items(s, "library").filter(x => connected(s, x) && distance(x, o) <= 2), work = items(s, "workshop").filter(x => connected(s, x) && distance(x, o) <= 2);
      summary = linked ? `Slúži všetkým napojeným domom (${linkedHomes.length}).` : "Bez cesty do nej deti nedôjdu.";
      checks.push({ ok: linked && lib.length > 0, text: linked && lib.length ? "Školská štvrť: knižnica do 2 políčok." : "Školská štvrť: chýba napojená knižnica do 2 políčok." });
      checks.push({ ok: linked && work.length > 0, text: linked && work.length ? "Remeselná štvrť: dielňa do 2 políčok." : "Remeselná štvrť: chýba napojená dielňa do 2 políčok." });
      hl.reach = within(o, 2); hl.good = linked ? [...linkedHomes, ...lib, ...work] : [];
      break;
    }
    case "library": case "workshop": {
      const schools = items(s, "school").filter(x => connected(s, x) && distance(x, o) <= 2), combo = o.id === "library" ? "Školská štvrť" : "Remeselná štvrť";
      summary = o.id === "library" ? "Deti sem chodia za knihami." : "Susedia tu majú remeslá a prácu.";
      checks.push({ ok: linked && schools.length > 0, text: linked && schools.length ? `${combo}: škola do 2 políčok.` : `${combo}: chýba napojená škola do 2 políčok.` });
      hl.reach = within(o, 2); hl.good = linked ? schools : [];
      break;
    }
    case "market": {
      const centre = linked && distance(o, plaza) <= 2;
      summary = linked ? `Nakupujú tu všetky napojené domy (${linkedHomes.length}).` : "Bez cesty sem nikto nepríde nakúpiť.";
      checks.push({ ok: centre, text: centre ? "Živé centrum: do 2 políčok od námestia." : "Živé centrum: tržnica musí byť najviac 2 políčka od námestia (C3)." });
      hl.reach = within(plaza, 2); hl.good = linked ? linkedHomes : [];
      break;
    }
    case "plaza": {
      const all = s.placed.filter(x => catalog[x.id].kind === "building" && x.id !== "plaza"), ok = all.filter(x => connected(s, x)), cut = all.filter(x => !connected(s, x));
      summary = `Na námestie je napojených ${ok.length} z ${all.length} budov.`;
      if (cut.length) notes.push(`Bez spojenia: ${cut.map(b => `${info[b.id].short} ${coords(b)}`).join(", ")}.`);
      hl.reach = network(s).filter(p => !same(p, plaza)); hl.good = ok; hl.bad = cut;
      break;
    }
    case "town-hall": summary = "Sídlo štvrte a volebná miestnosť."; break;
    case "station": {
      const step = currentStep(s);
      summary = s.completed.includes("opening") ? "Stanica znova žije." : `Projekt: ${s.completed.length} zo 7 krokov${step ? `, teraz „${step.name}“` : ""}.`;
      if (step?.id === "preparation") {
        const need: ItemId[] = s.branch === "museum" ? ["library"] : s.branch === "market-hall" ? ["market"] : ["park", "garden"];
        const near = s.placed.filter(x => need.includes(x.id) && connected(s, x) && distance(x, o) <= 2);
        checks.push({ ok: near.length > 0, text: near.length ? `${catalog[need[0]].name} do 2 políčok od stanice je pripravená.` : `Chýba ${need.map(n => catalog[n].name.toLocaleLowerCase("sk")).join(" alebo ")} do 2 políčok od stanice.` });
        hl.reach = within(o, 2); hl.good = near;
      }
      break;
    }
    case "culture": summary = linked ? "Susedia sa tu stretávajú." : "Bez cesty sa sem susedia nedostanú."; break;
    default: summary = meta.does;
  }
  return { key: o.instanceId, point: { x: o.x, y: o.y }, id: o.id, title, label: `${categories[meta.category].label} · ${coords(o)}`, category: meta.category,
    does: meta.does, summary, checks, related: related(s, o.id), notes, quick, highlight: hl, movable: !o.fixed };
}

/**
 * Kde nová stavba (alebo presun) hneď pomôže: voľné políčka pri ceste, na ktorých splní niečo užitočné.
 * Zeleň a ambulancia: čo najviac napojených domov, ktorým chýba. Knižnica a dielňa: pri napojenej škole.
 * Tržnica: pri námestí (Živé centrum). Dom: kde bude mať najviac prianí splnených hneď. Prázdne = netreba radiť.
 */
export function usefulSites(s: RepublicState, id: ItemId): Point[] { return siteAdvice(s, id).cells; }
/** To isté ako usefulSites, s vetou, prečo sú miesta dobré (pod mapou a pri potvrdení stavby). */
export function siteAdvice(s: RepublicState, id: ItemId): { cells: Point[]; why: string } {
  const cells = sites(s, id), step = currentStep(s);
  const why = !cells.length ? "" : step?.id === "preparation" && distance(cells[0], { x: 5, y: 1 }) <= 2 && id !== "house" && id !== "clinic" && id !== "school" ? "do 2 políčok od stanice pripraví halu (krok projektu)."
    : (id === "park" || id === "garden") && step?.id === "school-yard" && items(s, "school").some(x => connected(s, x) && distance(x, cells[0]) <= 2) ? "pri škole splní krok projektu Školský dvor."
    : ({ park: "pomôže domom, ktorým chýba zeleň.", garden: "pomôže domom, ktorým chýba zeleň.", clinic: "dosiahne na najviac domov bez lekára.", library: "pri škole vytvorí Školskú štvrť.",
      workshop: "pri škole vytvorí Remeselnú štvrť.", market: "pri námestí vytvorí Živé centrum.", school: "prvá napojená škola pomôže všetkým domom.", house: "tu bude mať dom hneď najviac prianí splnených." } as Partial<Record<ItemId, string>>)[id] ?? "";
  return { cells, why };
}
function sites(s: RepublicState, id: ItemId): Point[] {
  const open = connectableCells(s), homes = items(s, "house").filter(h => connected(s, h));
  const best = (score: (p: Point) => number) => { const top = Math.max(0, ...open.map(score)); return top ? open.filter(p => score(p) === top) : []; };
  const step = currentStep(s), stationNeed = step?.id === "preparation" && (s.branch === "museum" ? id === "library" : s.branch === "market-hall" ? id === "market" : id === "park" || id === "garden");
  if (stationNeed) return open.filter(p => distance(p, { x: 5, y: 1 }) <= 2);
  switch (id) {
    case "park": case "garden": {
      const schools = items(s, "school").filter(x => connected(s, x));
      if (step?.id === "school-yard" && schools.length) return open.filter(p => schools.some(x => distance(x, p) <= 2));
      const lacking = homes.filter(h => !homeNeeds(s, h).zelen);
      return best(p => lacking.filter(h => distance(h, p) <= 2).length);
    }
    case "clinic": { const lacking = homes.filter(h => !homeNeeds(s, h).lekar); return best(p => lacking.filter(h => distance(h, p) <= 2).length); }
    case "library": case "workshop": { const schools = items(s, "school").filter(x => connected(s, x)); return open.filter(p => schools.some(x => distance(x, p) <= 2)); }
    case "market": return open.filter(p => distance(p, plaza) <= 2);
    case "school": return items(s, "school").some(x => connected(s, x)) ? [] : open;
    case "house": {
      const near = (ids: ItemId[]) => (p: Point) => s.placed.some(o => ids.includes(o.id) && connected(s, o) && distance(o, p) <= 2) ? 1 : 0;
      const green = near(["park", "garden"]), doctor = near(["clinic"]);
      return best(p => 1 + green(p) + doctor(p));
    }
    default: return [];
  }
}

/** Detail voľného políčka alebo cesty (ťuknutie mimo budovy). */
export function cellReport(s: RepublicState, p: Point): Report {
  const road = s.roads.some(r => same(r, p)), homes = items(s, "house").filter(h => distance(h, p) <= 2), hl: Highlight = { reach: within(p, 2), good: [], bad: [] };
  if (road) {
    const joined = network(s).some(n => same(n, p));
    return { key: `cell:${coords(p)}`, point: p, id: null, title: `Cesta ${coords(p)}`, label: "Cesta", category: null, does: "Cesty spájajú budovy s námestím. Budova funguje, keď má susednú cestu vedúcu na námestie.",
      summary: joined ? "Spojená s námestím." : "Nie je spojená s námestím, budovy pri nej nefungujú.", checks: [], related: [], notes: [],
      quick: [{ label: "Odstrániť cestu", kind: "road-here" }], highlight: { reach: [], good: [], bad: [] }, movable: false };
  }
  const linked = connected(s, p), linkedHomes = homes.filter(h => connected(s, h));
  hl.good = linkedHomes; hl.bad = homes.filter(h => !connected(s, h));
  return { key: `cell:${coords(p)}`, point: p, id: null, title: `Voľný pozemok ${coords(p)}`, label: linked ? "Pri ceste" : "Bez cesty", category: null,
    does: linked ? "Budova postavená tu bude hneď fungovať." : "Budova by tu nefungovala: najprv polož cestu vedľa, ktorá vedie na námestie.",
    summary: linkedHomes.length ? `Do 2 políčok: ${linkedHomes.length} ${plural(linkedHomes.length, "napojený dom", "napojené domy", "napojených domov")} (${list(linkedHomes)}). Park, záhrada alebo ambulancia tu ${linkedHomes.length === 1 ? "mu" : "im"} pomôže.` : "Do 2 políčok nie je žiadny napojený dom.",
    checks: [], related: [], notes: [], quick: linked ? [{ label: "Postaviť sem", kind: "build-here" }, { label: "Cesta sem", kind: "road-here" }] : [{ label: "Cesta sem", kind: "road-here" }, { label: "Postaviť sem", kind: "build-here" }],
    highlight: hl, movable: false };
}
