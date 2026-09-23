import { MAJORITY } from './blocs.ts';

/*
  Cesty k väčšine: všetky najmenšie väčšinové kombinácie strán v scenári (súčet aspoň 76 kresiel
  a bez ktorejkoľvek strany by väčšina padla). Je to čistá aritmetika, nehovorí nič o ochote strán
  spolupracovať. Pri 7–9 stranách v parlamente je kombinácií najviac niekoľko stoviek.
*/
export type SeatedParty = { id: string; seats: number };
export type MajorityPath = { ids: string[]; seats: number; surplus: number };

export function minimalMajorities(rows: SeatedParty[], majority = MAJORITY): MajorityPath[] {
  const list = rows.filter(r => r.seats > 0);
  const paths: MajorityPath[] = [];
  for (let mask = 1; mask < 1 << list.length; mask++) {
    const members = list.filter((_, i) => mask & (1 << i));
    const seats = members.reduce((a, r) => a + r.seats, 0);
    if (seats < majority) continue;
    if (members.some(m => seats - m.seats >= majority)) continue;
    paths.push({ ids: members.map(m => m.id), seats, surplus: seats - majority });
  }
  return paths.sort((a, b) => a.ids.length - b.ids.length || a.surplus - b.surplus || b.seats - a.seats);
}
