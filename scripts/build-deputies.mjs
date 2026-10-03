// Poslanci a ich hlasy naprieč hlasovaniami NR SR (zo súborov public/data/hlasovania/<id>.json, ktoré sťahuje fetch-votes.mjs).
// Výstupy:
//  - public/data/hlasovania/poslanci.json: pre stránku Parlament (profil poslanca, prehrávanie, kreslá bez ďalších požiadaviek);
//    pri každom poslancovi reťazec hlasov `h` a reťazec klubov `k` v poradí zoznamu hlasovaní (od najnovšieho),
//    „-“ = v čase hlasovania nebol poslancom (napr. náhradník, člen vlády).
//  - lib/parliament-clubs.data.ts: kluby k poslednému hlasovaniu (malý súbor, ide staticky do stránky a 3D sály).
// Použitie (v outputs/web): node scripts/build-deputies.mjs — spúšťa ho aj fetch-votes.mjs na konci behu.
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { SEAT_ORDER, clubParty } from "../lib/votes.ts";

const ROOT = new URL("../", import.meta.url);

export function buildDeputies() {
  const dir = new URL("public/data/hlasovania/", ROOT);
  const read = name => JSON.parse(readFileSync(new URL(name, dir), "utf8"));
  const index = read("index.json");
  const votes = index.hlasovania;
  const clubs = [];
  const clubIndex = name => { let i = clubs.indexOf(name); if (i < 0) { i = clubs.length; clubs.push(name); } return i; };
  const deputies = new Map();
  votes.forEach((v, j) => {
    const detail = read(`${v.id}.json`);
    for (const [id, name, club, mark] of detail.poslanci) {
      let row = deputies.get(id);
      // Zoznam ide od najnovšieho hlasovania, meno sa preto berie z posledného výskytu.
      if (!row) deputies.set(id, row = { id, meno: name, h: Array(votes.length).fill("-"), k: Array(votes.length).fill("-") });
      row.h[j] = mark;
      row.k[j] = clubIndex(detail.kluby[club]).toString(36);
    }
  });
  if (clubs.length > 36) throw new Error(`Priveľa klubov na jednoznakový zápis: ${clubs.length}`);
  const poslanci = [...deputies.values()]
    .sort((a, b) => a.meno.localeCompare(b.meno, "sk") || a.id - b.id)
    .map(row => ({ id: row.id, meno: row.meno, h: row.h.join(""), k: row.k.join("") }));
  writeFileSync(new URL("poslanci.json", dir), JSON.stringify({ v: 1, obdobie: index.obdobie, aktualizovane: index.aktualizovane, hlasovania: votes.map(v => v.id), kluby: clubs, poslanci }));

  // Kluby k poslednému hlasovaniu v poradí sály (rovnaké poradie ako rozsadenie v režime Hlasovania).
  const latest = read(`${votes[0].id}.json`);
  const counts = latest.kluby.map((club, i) => ({ club, party: clubParty(club) ?? "nezaradeni", seats: latest.poslanci.filter(p => p[2] === i).length }));
  counts.sort((a, b) => SEAT_ORDER.indexOf(a.party) - SEAT_ORDER.indexOf(b.party));
  const summary = { asOf: votes[0].datum, voteId: votes[0].id, votes: votes.length, deputies: poslanci.length, since: votes.at(-1).datum, clubs: counts.filter(c => c.seats > 0) };
  writeFileSync(new URL("lib/parliament-clubs.data.ts", ROOT), `// Generuje scripts/build-deputies.mjs z public/data/hlasovania (kluby k poslednému hlasovaniu). Needitovať ručne.
export const parliamentClubs = ${JSON.stringify(summary, null, 2)} as const;
`);
  return { votes: votes.length, deputies: poslanci.length, clubs: clubs.length, latest: counts };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const r = buildDeputies();
  console.log(`Poslanci: ${r.deputies} · hlasovaní ${r.votes} · klubov za obdobie ${r.clubs} → public/data/hlasovania/poslanci.json`);
  console.log(`Kluby k poslednému hlasovaniu: ${r.latest.map(c => `${c.party} ${c.seats}`).join(", ")} → lib/parliament-clubs.data.ts`);
}
