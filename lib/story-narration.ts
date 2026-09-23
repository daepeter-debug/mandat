import { MAJORITY } from "./blocs.ts";
import { edition } from "./edition.ts";
import { blocs, debtLastMeur, debtPerSecond, debtYear, down, edge, leader, lowerFirst, majorityWinner, population, ranked, storyParty, up, type SlideId } from "./story-data.ts";
import { currentSeatUncertainty } from "./uncertainty.ts";

/*
  Texty na predčítanie „Mandátu za minútu“ neurálnym hlasom (scripts/build-audio.mjs → public/audio/pribeh).
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

export type Narration = { id: SlideId; text: string };

export function narration(): Narration[] {
  const u = currentSeatUncertainty();
  const second = ranked[1], third = ranked[2];
  const win = majorityWinner();
  const perPerson = Math.floor(debtLastMeur * 1e6 / population / 1000);
  const lines: Record<SlideId, string> = {
    leader: `Mandát za minútu. ${verb(leader.partyId, "Vedie", "Vedú")} ${name(leader.partyId)}: ${percentWords(leader.value)}. Pásmo neistoty: ${decimalWords(leader.lower)} až ${decimalWords(leader.upper)} percenta. Prvé miesto ${verb(leader.partyId, "má", "majú")} ${runsWords(u.parties[leader.partyId]?.first ?? 0)}. Nasleduje ${name(second.partyId)}, ${percentWords(second.value)}, a ${name(third.partyId)}, ${percentWords(third.value)}.`,
    seats: `Kreslá dnes. ${blocSpoken(blocs.coalitionLabel)} by mala ${seatsWords(blocs.coalition)}, ${lowerFirst(blocSpoken(blocs.oppositionLabel))} ${seatsWords(blocs.opposition)}. Väčšina je ${seatsWords(MAJORITY)}. ${win ? `Mala by ju ${lowerFirst(blocSpoken(win.label))}, ${runsWords(win.share)}.` : "Nemal by ju ani jeden blok."} Pripojenie Republiky a Hnutia Slovensko k blokom je redakčný predpoklad, nie dohoda strán.`,
    month: `Za posledný mesiac. ${up ? `Najviac ${verb(up.id, "rastie", "rastú")} ${name(up.id)}: plus ${decimalWords(up.delta)} percentuálneho bodu, teraz ${percentWords(up.value)}.` : ""} ${down ? `Najviac ${verb(down.id, "klesá", "klesajú")} ${name(down.id)}: mínus ${decimalWords(down.delta)} percentuálneho bodu, teraz ${percentWords(down.value)}.` : ""}`.replace(/\s+/g, " ").trim(),
    edge: edge.length
      ? `Na hrane piatich percent. ${edge.map(v => `${name(v.partyId)} ${verb(v.partyId, "má", "majú")} ${percentWords(v.value)} a nad hranicou ${verb(v.partyId, "je", "sú")} ${runsWords(u.parties[v.partyId]?.entry ?? 0)}`).join(". ")}. O vstupe do parlamentu rozhodnú voľby, nie prieskum.`
      : "Na hrane piatich percent dnes nie je žiadna strana.",
    debt: `Dlh štátu. Rastie asi o ${numberWords(Math.round(debtPerSecond))} eur každú sekundu. Ku koncu roka ${numberWords(debtYear)} dosiahol ${numberWords(Math.round(debtLastMeur / 1000))} miliárd eur, teda viac ako ${numberWords(perPerson)}tisíc eur na každého obyvateľa.`,
    you: "A čo ty? Na Mandáte zadaj rok narodenia a pozri sa, koľko vlád, premiérov a eur dlhu prešlo tvojím životom.",
  };
  return (Object.keys(lines) as SlideId[]).map(id => ({ id, text: lines[id] }));
}

export const narrationEdition = edition.asOf;
