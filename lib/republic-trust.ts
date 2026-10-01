import { connected, distance, items, type Placed, type RepublicState } from "./republic.ts";

/*
  Spokojnosť štvrte: jedno číslo 0–100 %, ktoré zhŕňa, ako sa v štvrti žije. Počíta sa z toho, čo hráč
  postavil a napojil, z kapitoly a zo slávností. Nič sa neukladá a ekonomika sa nemení; číslo je spätná
  väzba (a podklad pre komunálne voľby 24. 10., lib/republic-election.ts).
  Každý dom má päť prianí. Prvé nesplnené sa ukáže na mape ako bublinka.
*/
export type Need = "cesta" | "zelen" | "lekar" | "skola" | "obchod";
export const needs: Record<Need, { label: string; wish: string; hint: string }> = {
  cesta: { label: "Cesta", wish: "Chýba nám cesta k námestiu.", hint: "Polož cestu, ktorá spojí dom s námestím." },
  zelen: { label: "Zeleň", wish: "Chceli by sme park alebo záhradu blízko.", hint: "Park alebo záhrada s cestou do 2 políčok od domu." },
  lekar: { label: "Ambulancia", wish: "K lekárovi to máme ďaleko.", hint: "Ambulancia s cestou do 2 políčok od domu." },
  skola: { label: "Škola", wish: "Deti potrebujú cestu do školy.", hint: "Škola napojená na cesty." },
  obchod: { label: "Obchod", wish: "Kde si nakúpime?", hint: "Tržnica napojená na cesty." },
};
const ORDER: Need[] = ["cesta", "zelen", "lekar", "skola", "obchod"];

/** Ktoré priania domu sú splnené. */
export function homeNeeds(s: RepublicState, home: Placed): Record<Need, boolean> {
  const road = connected(s, home);
  const within = (ids: string[]) => s.placed.some(o => ids.includes(o.id) && connected(s, o) && distance(o, home) <= 2);
  const anywhere = (id: string) => items(s, id as Placed["id"]).some(o => connected(s, o));
  return { cesta: road, zelen: road && within(["park", "garden"]), lekar: road && within(["clinic"]), skola: road && anywhere("school"), obchod: road && anywhere("market") };
}
/** Prvé nesplnené prianie každého domu (bublinka na mape). */
export function homeWishes(s: RepublicState) {
  return items(s, "house").map(home => {
    const met = homeNeeds(s, home), missing = ORDER.filter(n => !met[n]);
    return { instanceId: home.instanceId, x: home.x, y: home.y, wish: missing[0] ?? null, missing, met: ORDER.length - missing.length };
  });
}
/**
 * Spokojnosť 0–100: 70 % domy (podiel splnených prianí), 15 % kapitola (kroky z 7), 15 % príbeh slávností
 * (hviezdy z 21). Bez domov len kapitola a slávnosti.
 */
export function townSatisfaction(s: RepublicState) {
  const wishes = homeWishes(s), homes = wishes.length;
  const housing = homes ? wishes.reduce((sum, w) => sum + w.met / ORDER.length, 0) / homes : 0;
  const chapter = s.completed.length / 7, festivals = (s.festivalJourney?.scores ?? []).reduce((a, b) => a + b, 0) / 21;
  const value = Math.round(100 * (0.7 * housing + 0.15 * chapter + 0.15 * festivals));
  const counts = ORDER.map(n => ({ need: n, homes: wishes.filter(w => w.missing.includes(n)).length })).filter(x => x.homes > 0).sort((a, b) => b.homes - a.homes);
  return { value, housing: Math.round(housing * 100), chapter: Math.round(chapter * 100), festivals: Math.round(festivals * 100), homes, wishes, counts,
    label: value >= 80 ? "Štvrť je spokojná" : value >= 55 ? "Štvrť sa zlepšuje" : value >= 30 ? "Susedia čakajú zmeny" : "Štvrť potrebuje pomoc" };
}
