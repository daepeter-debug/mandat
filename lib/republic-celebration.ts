import { distance, network, type Point, type RepublicState } from "./republic.ts";
import { festivalResult, neighbours, themes, type Theme } from "./republic-festival.ts";
import { sceneHash, type ResidentKind } from "./republic-living.ts";

export const CELEBRATION_SECONDS = 24;
export type FestivalGuest = {
  key: string; kind: ResidentKind; point: Point; offset: Point;
  arrival: number; activity: "watch" | "read" | "picnic" | "dance";
};
export type Celebration = {
  key: string; opened: boolean; theme: Theme; site: Point; happy: number;
  guests: FestivalGuest[]; lanterns: boolean;
};

/** Presentation only: no clock, commands, rewards or saved fields. */
export function celebrationScene(town: RepublicState): Celebration | null {
  const f = town.festival;
  if (!f?.site || !f.theme) return null;
  const opened = f.response !== null, happy = opened ? festivalResult(f).happy : 0;
  const key = `${town.seed}:${f.day}:${f.mode ?? "daily"}:${f.stage ?? 0}:${f.round}:${f.theme}`;
  // Guests stand on nearby connected paving, never in houses or across their roofs.
  const places = network(town).filter(p => distance(p, f.site!) <= 3)
    .sort((a, b) => distance(a, f.site!) - distance(b, f.site!) || a.y - b.y || a.x - b.x);
  const count = places.length ? opened ? 4 + happy * 5 : 3 : 0;
  const slots = [{x:-13,y:1},{x:0,y:8},{x:13,y:1},{x:0,y:-7}];
  const kinds: ResidentKind[] = f.theme === "books" ? ["child", "adult", "child", "senior"] : ["adult", "senior", "child", "adult"];
  const activity = {books:"read",food:"picnic",music:"dance"} as const;
  const guests = Array.from({length:Math.min(count, places.length * slots.length)}, (_, i): FestivalGuest => {
    const slot = Math.floor(i / places.length), seed = sceneHash(`${key}:${i}`);
    return {key:`${key}:${i}`,kind:kinds[seed % kinds.length],point:{...places[i % places.length]},offset:{...slots[slot]},
      arrival:opened ? 1 + (seed % 85) / 10 : 0,activity:opened ? activity[f.theme!] : "watch"};
  });
  return {key,opened,theme:f.theme,site:{...f.site},happy,guests,lanterns:opened};
}

/** A bounded opening, followed by a quiet scene which can be replayed. */
export function celebrationFrame(scene: Celebration, elapsed: number) {
  const seconds = Number.isFinite(elapsed) ? Math.max(0, Math.min(CELEBRATION_SECONDS, elapsed)) : CELEBRATION_SECONDS;
  return {seconds,finished:seconds >= CELEBRATION_SECONDS,lit:scene.lanterns && seconds >= .6,
    guests:scene.guests.filter(g => !scene.opened || seconds >= g.arrival),
    performing:scene.opened && seconds >= 5 && seconds < CELEBRATION_SECONDS};
}

export function festivalPostcardData(town: RepublicState) {
  const f = town.festival;
  if (!f?.theme || !f.site || f.response === null) return null;
  const result = festivalResult(f);
  return {town:town.name,title:themes[f.theme].name,day:f.day,stars:result.stars,
    reactions:neighbours.map((name,i) => ({name,mood:result.mood[i],text:result.reactions[i]})),
    filename:`mala-republika-slavnost-${f.day}.png`};
}
