// Hlasovania NR SR 9. volebného obdobia (od 25. 10. 2023) z nrsr.sk → public/data/hlasovania/ (index.json + <id>.json).
// Vyberá podľa objektívnych pravidiel, nič ručne: hlasovania o zákonoch a ústavných zákonoch ako celku (aj opätovné
// po vete prezidenta) a o vyslovení nedôvery vláde či jej členovi. Hlas každého poslanca s klubom v čase hlasovania.
// Použitie (v outputs/web): node scripts/fetch-votes.mjs [--cache ../hlasovania-praca/cache]
// Surové stránky hlasovaní sa ukladajú do cache (nemenia sa), zoznamy sa sťahujú vždy nanovo; 1 požiadavka za sekundu.
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildDeputies } from "./build-deputies.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const arg = name => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : null; };
const CACHE = path.resolve(ROOT, arg("--cache") ?? "../hlasovania-praca/cache");
const OUT = path.join(ROOT, "public/data/hlasovania");
const BASE = "https://www.nrsr.sk/web/", TERM = 9, SINCE = "2023-10-25";
const HEADERS = { "User-Agent": "MandatBot/1.0 (+https://mandat-preview.mandat.workers.dev)" };
mkdirSync(CACHE, { recursive: true }); mkdirSync(OUT, { recursive: true });

const sleep = ms => new Promise(r => setTimeout(r, ms));
const decode = s => s.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const text = s => decode(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
let cookie = "", last = 0;
async function request(url, init = {}) {
  for (let attempt = 1; ; attempt++) {
    const wait = 1000 - (Date.now() - last); if (wait > 0) await sleep(wait);
    last = Date.now();
    try {
      const res = await fetch(url, { ...init, headers: { ...HEADERS, ...(cookie ? { Cookie: cookie } : {}), ...init.headers }, redirect: "manual" });
      const set = res.headers.get("set-cookie"); if (set) cookie = set.split(";")[0];
      if (res.status === 302) return request(new URL(res.headers.get("location"), BASE).href);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) {
      if (attempt >= 3) throw new Error(`${url}: ${e.message}`);
      await sleep(3000 * attempt);
    }
  }
}

// ── Zoznam hlasovaní (vyhľadávanie v názvoch, stránkovanie cez ASP.NET postback) ─────────────────────
const hidden = h => Object.fromEntries([...h.matchAll(/<input type="hidden" name="([^"]+)" id="[^"]*" value="([^"]*)"/g)].map(m => [m[1], decode(m[2])]));
function rows(h) {
  return [...h.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)].map(m => m[1]).filter(r => r.includes("hlasklub&ID=")).map(r => {
    const td = [...r.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(m => m[1]);
    return { id: +r.match(/hlasklub&ID=(\d+)/)[1], schodza: +text(td[0]), title: text(td[4]) };
  });
}
async function search(phrase) {
  const url = `${BASE}Default.aspx?sid=schodze/hlasovanie/vyhladavanie_vysledok&ZakZborID=13&CisObdobia=${TERM}&Text=${encodeURIComponent(phrase)}&CPT=&CisSchodze=0&DatumOd=1900-1-1%200:0:0&DatumDo=2100-1-1%200:0:0&FullText=False`;
  let html = await request(url);
  const found = new Map(rows(html).map(r => [r.id, r])), seen = new Set([1]);
  for (;;) {
    const next = [...html.matchAll(/__doPostBack\((?:&#39;|')([^&']+)(?:&#39;|'),(?:&#39;|')Page\$(\d+)(?:&#39;|')\)/g)].map(m => ({ target: decode(m[1]), page: +m[2] })).find(p => !seen.has(p.page));
    if (!next) break;
    seen.add(next.page);
    const body = new URLSearchParams({ ...hidden(html), __EVENTTARGET: next.target, __EVENTARGUMENT: `Page$${next.page}` });
    html = await request(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
    for (const r of rows(html)) found.set(r.id, r);
    process.stdout.write(`  „${phrase}“ strana ${next.page}: ${found.size}\r`);
  }
  console.log(`  „${phrase}“: ${found.size} hlasovaní (${seen.size} strán)`);
  return [...found.values()];
}

// ── Výber podľa názvu ─────────────────────────────────────────────────────────────────────────────
// Záverečné hlasovanie o zákone (aj ústavnom, aj po vete), nie o programe schôdze či o pozmeňujúcich návrhoch.
const FINAL = /(zákon[ea]?|návrhu (ústavného )?zákona|ústavnom zákone) ako (o )?celku/i;
const NO_CONFIDENCE = /vyslovenie nedôvery/i;
// Ústavný zákon (nie zákon o Ústavnom súde či o ústavnej zdravotnej starostlivosti).
const CONSTITUTIONAL = /ústavného zákona|ústavnom zákone|ústavný zákon/i;
export function kindOf(title) {
  // Len samotné hlasovanie o nedôvere („o návrhu na vyslovenie / o vyslovení nedôvery“, „o návrhu uznesenia“),
  // nie prezentácia, tajné hlasovanie ani procedurálne návrhy k nemu.
  if (NO_CONFIDENCE.test(title)) return /Hlasovanie o ((návrhu na vyslovenie|vyslovení) nedôvery|návrhu uznesenia)/i.test(title) ? "nedovera" : null;
  if (!FINAL.test(title) || /programe/i.test(title)) return null;
  if (/vrátený prezident|opätovné prerokovanie/i.test(title)) return "veto";
  if (CONSTITUTIONAL.test(title)) return "ustavny";
  if (/štátnom rozpočte/i.test(title)) return "rozpocet";
  return "zakon";
}

// ── Detail hlasovania podľa klubov ────────────────────────────────────────────────────────────────
const field = (h, label) => { const m = h.match(new RegExp(`<strong>${label}</strong>\\s*<span>([\\s\\S]*?)</span>`)); return m ? text(m[1]) : null; };
const count = (h, label) => { const m = h.match(new RegExp(`${label}[\\s\\S]{0,120}?<span>(\\d+)`)); return m ? +m[1] : null; };
function parseVote(id, h) {
  const when = field(h, "Dátum a čas") ?? "", d = when.match(/(\d{1,2})\. (\d{1,2})\. (\d{4})\s+(\d{1,2}:\d{2})/);
  const title = field(h, "Názov hlasovania") ?? "";
  const clubs = [], members = [];
  for (const m of h.matchAll(/hpo_result_block_title"[^>]*>([^<]+)<|\[(Z|P|\?|N|0)\]\s*<a href="[^"]*PoslanecID=(\d+)[^"]*">([^<]+)<\/a>/g)) {
    if (m[1]) clubs.push(text(m[1]));
    else members.push([+m[3], text(m[4]), clubs.length - 1, m[2]]);
  }
  return {
    id, date: d ? `${d[3]}-${d[2].padStart(2, "0")}-${d[1].padStart(2, "0")}` : null, time: d ? d[4].padStart(5, "0") : null,
    schodza: +(field(h, "Schôdza")?.match(/\d+/)?.[0] ?? 0), cislo: +(field(h, "Číslo hlasovania") ?? 0),
    title, passed: /prešiel/i.test(field(h, "Výsledok hlasovania") ?? "") && !/neprešiel/i.test(field(h, "Výsledok hlasovania") ?? ""),
    official: { pritomni: count(h, "Prítomní"), hlasujucich: count(h, "Hlasujúcich"), za: count(h, "Za hlasovalo"), proti: count(h, "Proti hlasovalo"),
      zdrzalo: count(h, "Zdržalo sa hlasovania"), nehlasovalo: count(h, "Nehlasovalo"), nepritomni: count(h, "Neprítomní") },
    clubs, members,
  };
}
// Názov bez procedurálneho chvosta („ - tretie čítanie. Hlasovanie o návrhu zákona ako o celku.“).
const shortTitle = t => t.replace(/\s*-\s*(tretie|druhé) čítanie\.?.*$/i, "").replace(/\.\s*Hlasovanie o (návrhu )?(ústavnom )?(zákon[ea]?|zákona|návrhu na vyslovenie nedôvery|návrhu uznesenia)[^.]*\.?$/i, "").trim();

const listed = [...new Map([...await search("celku"), ...await search("nedôvery")].map(r => [r.id, r])).values()];
const chosen = listed.map(r => ({ ...r, kind: kindOf(r.title) })).filter(r => r.kind);
console.log(`Vybraných ${chosen.length} z ${listed.length} (${Object.entries(Object.groupBy(chosen, r => r.kind)).map(([k, v]) => `${k} ${v.length}`).join(", ")})`);
const index = [];
for (const [i, r] of chosen.entries()) {
  const file = path.join(CACHE, `${r.id}.html`);
  let h;
  if (existsSync(file)) h = readFileSync(file, "utf8");
  else { h = await request(`${BASE}Default.aspx?sid=schodze/hlasovanie/hlasklub&ID=${r.id}`); writeFileSync(file, h); }
  process.stdout.write(`  hlasovanie ${i + 1}/${chosen.length}\r`);
  const v = parseVote(r.id, h);
  if (!v.date || v.date < SINCE || v.members.length !== 150) { console.log(`\n  preskočené ${r.id}: ${v.date} · ${v.members.length} poslancov`); continue; }
  const tally = Object.fromEntries(["Z", "P", "?", "N", "0"].map(k => [k, v.members.filter(m => m[3] === k).length]));
  writeFileSync(path.join(OUT, `${r.id}.json`), JSON.stringify({ id: r.id, kluby: v.clubs, poslanci: v.members }));
  index.push({ id: r.id, datum: v.date, cas: v.time, schodza: v.schodza, cislo: v.cislo, druh: r.kind, nazov: shortTitle(v.title), plny: v.title, preslo: v.passed,
    za: tally.Z, proti: tally.P, zdrzalo: tally["?"], nehlasovalo: tally.N, nepritomni: tally["0"], oficialne: v.official });
}
index.sort((a, b) => b.datum.localeCompare(a.datum) || b.cas.localeCompare(a.cas) || b.cislo - a.cislo);
writeFileSync(path.join(OUT, "index.json"), JSON.stringify({ v: 1, obdobie: TERM, aktualizovane: new Date().toISOString().slice(0, 10), zdroj: `${BASE}?sid=schodze%2Fhlasovanie`, hlasovania: index }));
console.log(`\nHotovo: ${index.length} hlasovaní → public/data/hlasovania (cache ${CACHE})`);
// Poslanci naprieč hlasovaniami a kluby k poslednému hlasovaniu (stránka Parlament).
const built = buildDeputies();
console.log(`Poslanci: ${built.deputies} → public/data/hlasovania/poslanci.json; kluby: ${built.latest.map(c => `${c.party} ${c.seats}`).join(", ")} → lib/parliament-clubs.data.ts`);
