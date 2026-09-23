import { archive, fmt, parties, type Poll } from "./polls.ts";

/*
  RSS odber nových prieskumov (/rss.xml, app/rss.xml/route.ts). Jedna položka = jedno meranie z archívu,
  zoradené od najnovšieho zverejnenia; odkaz vedie na detail merania v Mandáte (?v=polls&d=<id>).
  Obsah je daný len dátami, nie časom požiadavky, takže sa dá bezpečne cachovať.
*/
export const RSS_PATH = "/rss.xml";
export const RSS_TITLE = "Mandát — nové prieskumy";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const short = (id: string) => parties.find(p => p.id === id)?.short ?? id;
const day = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return `${d}. ${m}. ${y}`; };
// RFC 822 dátum; čas 10:00 UTC (zverejnenie sa uvádza len na deň).
const rfc822 = (iso: string) => new Date(`${iso}T10:00:00Z`).toUTCString();
const released = (p: Poll) => p.published ?? p.end;
const ranked = (p: Poll) => Object.entries(p.values).filter(([, v]) => typeof v === "number").sort((a, b) => b[1] - a[1]);

export const feedPolls = () => [...archive].sort((a, b) => released(b).localeCompare(released(a)) || a.agency.localeCompare(b.agency));

export function pollItemTitle(p: Poll) {
  const top = ranked(p).slice(0, 3).map(([id, v]) => `${short(id)} ${fmt(v)} %`).join(", ");
  return `${p.agency}, ${p.month.toLowerCase()} ${p.end.slice(0, 4)}: ${top}`;
}

function pollItem(p: Poll, origin: string) {
  const link = `${origin}/?v=polls&d=${encodeURIComponent(p.id)}`;
  const all = ranked(p).map(([id, v]) => `${short(id)} ${fmt(v)} %`).join(" · ");
  const meta = [`zber ${day(p.start)} – ${day(p.end)}`, p.sample ? `vzorka ${p.sample.toLocaleString("sk-SK")}` : null, p.type, p.method, p.client ? `objednávateľ: ${p.client}` : null].filter(Boolean).join(" · ");
  const html = `<p>${esc(all)}</p><p>${esc(meta)}</p><p>Zdroj: <a href="${esc(p.source)}">${esc(p.sourceName)}</a> · <a href="${esc(link)}">Meranie v Mandáte</a></p><p>Jedno meranie nie je predpoveď; Model Mandát spája merania viacerých agentúr.</p>`;
  return [
    "    <item>",
    `      <title>${esc(pollItemTitle(p))}</title>`,
    `      <link>${esc(link)}</link>`,
    `      <guid isPermaLink="false">mandat-meranie-${esc(p.id)}</guid>`,
    `      <pubDate>${rfc822(released(p))}</pubDate>`,
    `      <category>${esc(p.agency)}</category>`,
    `      <description><![CDATA[${html.replace(/]]>/g, "]]]]><![CDATA[>")}]]></description>`,
    "    </item>",
  ].join("\n");
}

export function buildPollsFeed(origin: string) {
  const items = feedPolls();
  const newest = items[0] ? released(items[0]) : "2026-01-01";
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${esc(RSS_TITLE)}</title>`,
    `    <link>${esc(origin)}/?v=polls</link>`,
    `    <atom:link href="${esc(origin + RSS_PATH)}" rel="self" type="application/rss+xml"/>`,
    "    <description>Každé nové meranie volebných preferencií, ktoré Mandát zapracuje: výsledky strán, termín zberu, vzorka a odkaz na pôvodný zdroj.</description>",
    "    <language>sk</language>",
    `    <lastBuildDate>${rfc822(newest)}</lastBuildDate>`,
    "    <ttl>180</ttl>",
    `    <image><url>${esc(origin)}/icon-192.png</url><title>${esc(RSS_TITLE)}</title><link>${esc(origin)}/?v=polls</link></image>`,
    ...items.map(p => pollItem(p, origin)),
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");
}
