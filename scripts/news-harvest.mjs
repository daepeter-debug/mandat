// Podklady pre Deň v politike: všetky položky Denník N Minúta po minúte (verejné API) a titulky TASR (teraz.sk,
// sekcie Slovensko a Ekonomika) za zvolené dni. Výstup: <out>/minuta-<deň>.json a <out>/teraz-<deň>.json.
// Z podkladov potom editor (agent) vyberie ~5 najdôležitejších udalostí dňa — postup v docs/den-v-politike.md.
//   node scripts/news-harvest.mjs --from=2026-09-24 [--to=2026-09-24] [--out=<priečinok>]
import fs from "node:fs";

const option = name => process.argv.find(a => a.startsWith(`--${name}=`))?.split("=")[1];
const FROM = option("from");
const TO = option("to") ?? FROM;
const OUT = option("out") ?? "news-harvest";
if (!/^\d{4}-\d{2}-\d{2}$/.test(FROM ?? "")) throw new Error("Zadaj --from=RRRR-MM-DD");
fs.mkdirSync(OUT, { recursive: true });
const UA = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/140 Safari/537.36" };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const strip = h => String(h ?? "").replace(/<[^>]+>/g, " ").replace(/&#8222;|&#8220;|&#8221;/g, "\"").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#8211;/g, "–").replace(/&#8230;/g, "…").replace(/&#\d+;/g, " ").replace(/\s+/g, " ").trim();
const bratislavaDay = iso => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bratislava" }).format(new Date(iso));
const inRange = d => d >= FROM && d <= TO;

// Denník N Minúta po minúte: /api/v2/mpm/posts, staršie cez ?before=<id>
const SK = /Fico|vláda|Smer|Hlas|SNS|Progresívne|SaS|KDH|Hnutie Slovensko|Matovič|Republika|Demokrati|Aliancia|Pellegrini|Taraba|Danko|Šimečka|Kaliňák|Šutaj|Raši|Gašpar|Huliak|Kamenický|Saková|Ráž|Blanár|parlament|Národná rada|voľby|Konsolidačné|Transakčná|Žilinka|polícia|NAKA|Ústavný súd|prokuratúra|STVR|ministerstvo/i;
const minuta = [];
let before = "";
for (let page = 0; page < 80; page++) {
  const j = await (await fetch(`https://dennikn.sk/api/v2/mpm/posts${before ? `?before=${before}` : ""}`, { headers: UA })).json();
  const posts = j.posts ?? [];
  if (!posts.length) break;
  for (const p of posts) {
    const d = bratislavaDay(p.published_at);
    if (!inRange(d)) continue;
    const cats = (p.categories ?? []).map(c => c.slug), tags = (p.tags ?? []).map(t => t.name);
    if (!(cats.includes("slovensko") || tags.some(t => SK.test(t)))) continue;
    minuta.push({ src: "minuta", id: p.id, url: `https://dennikn.sk/minuta/${p.id}`, time: p.published_at, day: d, cats, tags, locked: Boolean(p.lock?.type && p.lock.type !== "none"), text: `${strip(p.excerpt_simple || p.excerpt)} ${strip(p.content)}`.trim().slice(0, 900) });
  }
  const last = posts[posts.length - 1];
  if (bratislavaDay(last.published_at) < FROM) break;
  before = last.id;
  await sleep(400);
}

// TASR teraz.sk: /slovensko/?p=N a /ekonomika/?p=N, dátum z <time dateTime>
const teraz = [];
for (const section of ["slovensko", "ekonomika"]) {
  for (let p = 1; p <= 40; p++) {
    const html = await (await fetch(`https://www.teraz.sk/${section}/?p=${p}`, { headers: UA })).text();
    let oldest = "9999";
    for (const c of html.split('class="mediaListing-item').slice(1)) {
      const a = c.match(/media-title"><a href="([^"?]+)[^"]*">([^<]+)<\/a>/), t = c.match(/<time dateTime="([^"]+)"/), txt = c.match(/media-text">([^<]*)</);
      if (!a || !t) continue;
      const d = t[1].slice(0, 10);
      if (d < oldest) oldest = d;
      if (inRange(d)) teraz.push({ src: `teraz-${section}`, url: `https://www.teraz.sk${a[1]}`, time: t[1], day: d, title: strip(a[2]), text: strip(txt?.[1] ?? "") });
    }
    if (oldest < FROM) break;
    await sleep(300);
  }
}

for (const [name, rows] of Object.entries({ minuta, teraz })) {
  const byDay = {};
  for (const r of new Map(rows.map(x => [x.url, x])).values()) (byDay[r.day] ??= []).push(r);
  for (const [d, list] of Object.entries(byDay)) fs.writeFileSync(`${OUT}/${name}-${d}.json`, JSON.stringify(list.sort((a, b) => a.time.localeCompare(b.time)), null, 1));
  console.log(name, Object.entries(byDay).sort().map(([d, l]) => `${d}: ${l.length}`).join(", ") || "nič");
}
