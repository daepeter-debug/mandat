import { currentAggregate } from "./aggregate.ts";
import { MAJORITY } from "./blocs.ts";
import { edition } from "./edition.ts";
import { allocateSeats, validVotes2023 } from "./parliament.ts";
import { systematicErrors } from "./poll-accuracy.ts";
import { parties } from "./polls.ts";
import { blocs, debtLastMeur, debtPerSecond, debtYear, down, edge, leader, lowerFirst, majorityWinner, population, ranked, storyParty, up, type SlideId } from "./story-data.ts";
import { currentSeatUncertainty, thresholdStatus } from "./uncertainty.ts";

/*
  Texty na predčítanie neurálnym hlasom (scripts/build-audio.mjs → public/audio/<sada>): Mandát za minútu, rýchle odpovede,
  profily strán a vysvetlenie „Ako sa z hlasov stanú kreslá“.
  Čísla a skratky strán sú rozpísané do slov, aby ich hlas prečítal správne po slovensky („devätnásť celých tri
  percenta“, „Progresívne Slovensko“ namiesto „PS“). Obsah je ten istý ako na kartách (lib/story-data.ts).
*/
const units = ["nula", "jeden", "dva", "tri", "štyri", "päť", "šesť", "sedem", "osem", "deväť"];
const teens = ["desať", "jedenásť", "dvanásť", "trinásť", "štrnásť", "pätnásť", "šestnásť", "sedemnásť", "osemnásť", "devätnásť"];
const tens = ["", "", "dvadsať", "tridsať", "štyridsať", "päťdesiat", "šesťdesiat", "sedemdesiat", "osemdesiat", "deväťdesiat"];
const hundreds = ["", "sto", "dvesto", "tristo", "štyristo", "päťsto", "šesťsto", "sedemsto", "osemsto", "deväťsto"];

function below1000(n: number): string {
  const h = Math.floor(n / 100), rest = n % 100;
  const t = rest < 10 ? (rest ? units[rest] : "") : rest < 20 ? teens[rest - 10] : tens[Math.floor(rest / 10)] + (rest % 10 ? units[rest % 10] : "");
  return hundreds[h] + t;
}
/** Celé číslo slovom (spisovne spolu: „stodeväťdesiatsedem“, „šestnásťtisíc“); gender: tvar pre 1 a 2. */
export function numberWords(n: number, gender: "m" | "f" | "n" = "m"): string {
  n = Math.round(Math.abs(n));
  if (n === 0) return "nula";
  if (n === 1) return gender === "m" ? "jeden" : gender === "f" ? "jedna" : "jedno";
  if (n === 2) return gender === "m" ? "dva" : "dve";
  if (n < 1000) return below1000(n);
  const th = Math.floor(n / 1000), rest = n % 1000;
  const thWords = th === 1 ? "tisíc" : th === 2 ? "dvetisíc" : `${below1000(th)}tisíc`;
  return thWords + (rest ? below1000(rest) : "");
}
/** Tvar podstatného mena podľa počtu (1 / 2–4 / 0 a 5+). */
const plural = (n: number, one: string, few: string, many: string) => n === 1 ? one : n >= 2 && n <= 4 ? few : many;
/** Desatinné číslo s jedným miestom: „devätnásť celých tri“, „jedna celá štyri“, „dve celé šesť“. */
export function decimalWords(v: number): string {
  const r = Math.round(Math.abs(v) * 10) / 10;
  const whole = Math.floor(r), tenth = Math.round((r - whole) * 10);
  if (!tenth) return numberWords(whole, "n");
  const celych = whole === 1 ? "jedna celá" : whole >= 2 && whole <= 4 ? `${numberWords(whole, "f")} celé` : whole === 0 ? "nula celá" : `${numberWords(whole)} celých`;
  return `${celych} ${numberWords(tenth, "f")}`;
}
/** „devätnásť celých tri percenta“ / „dvanásť percent“ / „dve percentá“. */
export function percentWords(v: number): string {
  const r = Math.round(Math.abs(v) * 10) / 10;
  return Number.isInteger(r) ? `${numberWords(r, "n")} ${plural(r, "percento", "percentá", "percent")}` : `${decimalWords(r)} percenta`;
}
/** „dva celé tri percentuálneho bodu“ / „jeden percentuálny bod“ / „päť percentuálnych bodov“. */
function pointsWords(v: number): string {
  const r = Math.round(Math.abs(v) * 10) / 10;
  return Number.isInteger(r) ? `${numberWords(r)} ${plural(r, "percentuálny bod", "percentuálne body", "percentuálnych bodov")}` : `${decimalWords(r)} percentuálneho bodu`;
}
/** „šesťdesiatosem celých päť miliardy“ / „sedemdesiat miliárd“. */
function billionsWords(v: number): string {
  const r = Math.round(Math.abs(v) * 10) / 10;
  return Number.isInteger(r) ? `${numberWords(r, "f")} ${plural(r, "miliarda", "miliardy", "miliárd")}` : `${decimalWords(r)} miliardy`;
}
const seatsWords = (n: number) => `${numberWords(n, "n")} ${plural(n, "kreslo", "kreslá", "kresiel")}`;
const locative = ["", "jednom", "dvoch", "troch", "štyroch", "piatich", "šiestich", "siedmich", "ôsmich", "deviatich"];
/** „v deviatich z desiatich prepočtov“ (ako inRuns, ale slovom). */
export function runsWords(share: number): string {
  if (share >= 0.95) return "takmer vo všetkých prepočtoch";
  if (share <= 0.05) return "takmer v žiadnom prepočte";
  return `v ${locative[Math.round(share * 10)]} z desiatich prepočtov`;
}
const spoken: Record<string, string> = {
  ps: "Progresívne Slovensko", smer: "Smer", rep: "Republika", slovensko: "Hnutie Slovensko", sas: "Sloboda a Solidarita",
  hlas: "Hlas", kdh: "Kresťanskodemokratické hnutie", dem: "Demokrati", aliancia: "Maďarská aliancia", rodina: "Sme rodina",
  pnp: "Právo na pravdu", sns: "Slovenská národná strana", lsns: "Kotlebovci", ku: "Konzervatívci", vidiek: "Strana vidieka", zaludi: "Za ľudí",
};
const name = (id: string) => spoken[id] ?? storyParty(id)?.name ?? id;
// Strany v množnom čísle („Demokrati majú“, „Kotlebovci vedú“).
const pluralParties = new Set(["dem", "lsns", "ku"]);
const verb = (id: string, singular: string, pluralForm: string) => pluralParties.has(id) ? pluralForm : singular;
const blocSpoken = (label: string) => label;
const joinAnd = (items: string[]) => items.length > 1 ? `${items.slice(0, -1).join(", ")} a ${items[items.length - 1]}` : items[0] ?? "";
const upperFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export type Narration = { id: SlideId; text: string };

export function narration(): Narration[] {
  const u = currentSeatUncertainty();
  const second = ranked[1], third = ranked[2];
  const win = majorityWinner();
  const perPerson = Math.floor(debtLastMeur * 1e6 / population / 1000);
  const lines: Record<SlideId, string> = {
    leader: `Mandát za minútu. ${verb(leader.partyId, "Vedie", "Vedú")} ${name(leader.partyId)}: ${percentWords(leader.value)}. Pásmo neistoty: ${decimalWords(leader.lower)} až ${decimalWords(leader.upper)} percenta. Prvé miesto ${verb(leader.partyId, "má", "majú")} ${runsWords(u.parties[leader.partyId]?.first ?? 0)}. Nasleduje ${name(second.partyId)}, ${percentWords(second.value)}, a ${name(third.partyId)}, ${percentWords(third.value)}.`,
    seats: `Kreslá dnes. ${blocSpoken(blocs.coalitionLabel)} by mala ${seatsWords(blocs.coalition)}, ${lowerFirst(blocSpoken(blocs.oppositionLabel))} ${seatsWords(blocs.opposition)}. Väčšina je ${seatsWords(MAJORITY)}. ${win ? `Mala by ju ${lowerFirst(blocSpoken(win.label))}, ${runsWords(win.share)}.` : "Nemal by ju ani jeden blok."} Pripojenie Republiky a Hnutia Slovensko k blokom je redakčný predpoklad, nie dohoda strán.`,
    month: `Za posledný mesiac. ${up ? `Najviac ${verb(up.id, "rastie", "rastú")} ${name(up.id)}: plus ${pointsWords(up.delta)}, teraz ${percentWords(up.value)}.` : ""} ${down ? `Najviac ${verb(down.id, "klesá", "klesajú")} ${name(down.id)}: mínus ${pointsWords(down.delta)}, teraz ${percentWords(down.value)}.` : ""}`.replace(/\s+/g, " ").trim(),
    edge: edge.length
      ? `Na hrane piatich percent. ${edge.map(v => `${name(v.partyId)} ${verb(v.partyId, "má", "majú")} ${percentWords(v.value)} a nad hranicou ${verb(v.partyId, "je", "sú")} ${runsWords(u.parties[v.partyId]?.entry ?? 0)}`).join(". ")}. O vstupe do parlamentu rozhodnú voľby, nie prieskum.`
      : "Na hrane piatich percent dnes nie je žiadna strana.",
    debt: `Dlh štátu. Rastie asi o ${numberWords(Math.round(debtPerSecond))} eur každú sekundu. Ku koncu roka ${numberWords(debtYear)} dosiahol ${numberWords(Math.round(debtLastMeur / 1000))} miliárd eur, teda viac ako ${numberWords(perPerson)}tisíc eur na každého obyvateľa.`,
    you: "A čo ty? Na Mandáte zadaj rok narodenia a pozri sa, koľko vlád, premiérov a eur dlhu prešlo tvojím životom.",
  };
  return (Object.keys(lines) as SlideId[]).map(id => ({ id, text: lines[id] }));
}

export const narrationEdition = edition.asOf;

// Názvy písané veľkými písmenami by hlas mohol hláskovať — pre hlas ich píšeme ako slová; STVR celým názvom.
const speakable: [RegExp, string][] = [
  [/\bSMER\b/g, "Smer"], [/\bREPUBLIKA\b/g, "Republika"], [/\bHLAS\b/g, "Hlas"], [/\bSME RODINA\b/g, "Sme rodina"],
  [/ZA ĽUDÍ/g, "Za ľudí"], [/OĽANO/g, "Oľano"], [/\bSTVR\b/g, "Slovenská televízia a rozhlas"],
];
const forSpeech = (text: string) => speakable.reduce((t, [re, word]) => t.replace(re, word), text);

/** Profily strán: rovnaký formát pre všetky strany — celý názov a redakčné zhrnutie z lib/party-profiles.json. */
export function profileNarrations(profiles: Record<string, { summary: string }>): Narration2[] {
  return parties.filter(p => profiles[p.id]?.summary).map(p => ({ id: p.id, text: forSpeech(`${p.name.replace(/ – /g, ", ")}. Čím sa profiluje: ${profiles[p.id].summary}`) }));
}

/** Ako sa z hlasov stanú kreslá: štyri kroky na dnešnom Modeli Mandát (rovnaké čísla ako karta pri otvorení). */
export function seatsNarration(): string {
  const base = Object.values(currentAggregate.values).filter(v => v.value >= 0.5);
  const a = allocateSeats(base.map(v => ({ id: v.partyId, share: v.value, kind: "party" as const })));
  const wasted = base.filter(v => !a.qualifying.includes(v.partyId)).reduce((s, v) => s + v.value, 0);
  const whole = base.reduce((s, v) => s + (a.qualifying.includes(v.partyId) && a.number ? Math.floor(v.value / a.number) : 0), 0);
  const rest = 150 - whole;
  const votesPerSeat = Math.round(validVotes2023 * a.number / 100 / 100) * 100;
  const restText = rest === 1 ? "Posledné kreslo dostane strana" : `Zvyšné ${seatsWords(rest)} dostanú ${rest < 5 ? "strany" : "strany"}`;
  return [
    "Ako sa z hlasov stanú kreslá.",
    `Prvý krok: hranica. Do rozdeľovania postupujú len strany, ktoré získajú aspoň päť percent hlasov. Koalícia dvoch alebo troch strán potrebuje sedem percent, štyroch a viac desať percent. Hlasy pre ostatné strany, dnes ${percentWords(wasted)}, nezískajú žiadne kreslo.`,
    `Druhý krok: volebné číslo. Hlasy postupujúcich strán sa vydelia číslom stopäťdesiatjeden. Pri účasti ako v roku dvetisícdvadsaťtri tak jedno kreslo stojí približne ${numberWords(votesPerSeat)} hlasov.`,
    `Tretí krok: celé kreslá. Podiel každej strany sa vydelí volebným číslom a celá časť výsledku sú jej kreslá. Takto sa dnes rozdá ${numberWords(whole, "n")} zo stopäťdesiat kresiel.`,
    `Štvrtý krok: zvyšky. ${restText} s najväčším zvyškom po delení. Na väčšinu treba ${seatsWords(MAJORITY)}.`,
  ].join(" ");
}

/** Rýchle odpovede na úvode (components/quick-answers.tsx): tie isté čísla a vety ako karty, s otázkou na začiatku. */
export function quickNarrations(): Narration2[] {
  const values = Object.values(currentAggregate.values).sort((x, y) => y.value - x.value);
  const u = currentSeatUncertainty();
  const [a, b] = values;
  const fa = u.parties[a.partyId]?.first ?? 0, fb = u.parties[b.partyId]?.first ?? 0;
  const under = systematicErrors().filter(x => x.sameSign && x.mean <= -2);
  const w = edition.withPartners;
  const win = majorityWinner();
  const onEdge = values.filter(v => v.upper >= 3 && v.lower <= 7.5 && thresholdStatus(v) === "edge");
  const below = values.filter(v => v.value < 5 && v.value >= 1);
  const share = below.reduce((s, v) => s + v.value, 0), n = Math.round(share);
  const lost = share >= 18 && share <= 22 ? "každý piaty hlas" : share >= 9 && share <= 11 ? "každý desiaty hlas" : `${numberWords(n)} zo sto hlasov`;
  const perPerson = Math.floor(debtLastMeur * 1e6 / population / 1000);
  return [
    { id: "winner", dated: true, text: `Kto by dnes vyhral? ${name(a.partyId)} ${verb(a.partyId, "má", "majú")} ${percentWords(a.value)}, ${name(b.partyId)} ${percentWords(b.value)}. Prvé miesto v Modeli Mandát ${verb(a.partyId, "má", "majú")} ${name(a.partyId)} ${runsWords(fa)}${fb > 0.05 ? `, ${name(b.partyId)} ${runsWords(fb)}` : ""}.${under.length ? ` Pozor: v roku dvetisícdvadsaťtri prieskumy podcenili ${joinAnd(under.map(x => name(x.id)))} priemerne o ${pointsWords(under[0].mean)}.` : ""}` },
    { id: "majority", dated: true, text: `Má niekto väčšinu? ${blocSpoken(w.coalitionLabel)} by mala ${seatsWords(w.coalition)}, ${lowerFirst(blocSpoken(w.oppositionLabel))} ${seatsWords(w.opposition)}. Väčšina je ${seatsWords(MAJORITY)}. ${win ? `Mala by ju ${lowerFirst(blocSpoken(win.label))}, ${runsWords(win.share)}.` : "Nemal by ju ani jeden blok."} Bez partnerov by mala koalícia ${seatsWords(edition.now.coalition)} a opozícia ${seatsWords(edition.now.opposition)}. Priradenie Republiky ku koalícii a Hnutia Slovensko k opozícii je redakčný predpoklad, nie dohoda strán.` },
    { id: "edge", dated: true, text: onEdge.length
      ? `Kto je na hrane piatich percent? ${onEdge.map(v => `${name(v.partyId)} ${verb(v.partyId, "má", "majú")} ${percentWords(v.value)} a nad hranicou ${verb(v.partyId, "je", "sú")} ${runsWords(u.parties[v.partyId]?.entry ?? 0)}`).join(". ")}. O vstupe do parlamentu rozhodnú voľby, nie prieskum.`
      : "Kto je na hrane piatich percent? Pásmo neistoty žiadnej strany dnes nepretína hranicu piatich percent." },
    { id: "wasted", dated: true, text: `Koľko hlasov prepadne? ${upperFirst(percentWords(n))} hlasov by dnes nemalo zástupcu v parlamente, teda približne ${lost}. Pod hranicou piatich percent sú najmä ${joinAnd(below.map(v => name(v.partyId)))}.` },
    { id: "debt", text: `Aký veľký je dlh? Dlh štátu rastie asi o ${numberWords(Math.round(debtPerSecond))} eur za sekundu, tempom roku ${numberWords(debtYear)}. Posledný údaj Eurostatu je ${billionsWords(debtLastMeur / 1000)} eur ku koncu roka ${numberWords(debtYear)}, teda viac ako ${numberWords(perPerson)}tisíc eur na každého obyvateľa.` },
    { id: "year", text: "Čo zažil môj ročník? Zadaj rok narodenia a Mandát ti ukáže, koľko vlád a premiérov zažil tvoj ročník, kto vládol na tvoje osemnáste narodeniny a ako sa zmenil dlh, mzdy a ceny." },
  ];
}

/** dated = text obsahuje čísla vydania (po novom meraní nahrávka nesedí a web ju skryje). */
export type Narration2 = { id: string; text: string; dated?: boolean };
export type AudioSetId = "story" | "quick" | "seats" | "profiles";
/** Všetky sady na predčítanie v poradí nahrávania; profily závisia len od textov profilov. */
export function audioSets(profiles: Record<string, { summary: string }>): Record<AudioSetId, Narration2[]> {
  return {
    story: narration().map(n => ({ ...n, dated: true })),
    quick: quickNarrations(),
    seats: [{ id: "kroky", text: seatsNarration(), dated: true }],
    profiles: profileNarrations(profiles),
  };
}
