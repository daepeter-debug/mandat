// Náhľady pri zdieľaní (1200 × 630) pre sekcie z lib/share-cards.ts → public/og/<view>.jpg.
// Spúšťa sa ručne po zmene textov alebo ilustrácií: node scripts/build-og.mjs
// Podklad je ilustrácia sekcie orezaná len zhora, takže vodoznak v pravom dolnom rohu ostáva.
// Písmo Segoe UI je systémové (Windows); text sa vypáli do obrázka, písmo sa nikam nešíri.
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { shareCards } from '../lib/share-cards.ts';

const W = 1200, H = 630;
const ink = '#20392f', text2 = '#3c5145', muted = '#5b6b5d';
const seats = [[3, 26, 1], [4.7, 19.6, 1], [9.3, 15, 1], [16, 13.2, 1], [8.8, 26, 1], [11.9, 20.2, 1], [22.7, 15, 0], [27.3, 19.6, 0], [29, 26, 0], [20.1, 20.2, 0], [23.2, 26, 0]];
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

// Zalomenie podľa odhadu šírky znakov (Segoe UI); texty sú krátke a kontrolujú sa okom.
// Jednopísmenové predložky a spojky sa neodtrhnú od nasledujúceho slova.
function wrap(str, size, maxWidth, em) {
  const lines = [];
  let line = '';
  for (const word of str.replace(/(^| )([aikosuvzAIKOSUVZ]) /g, '$1$2\u00a0').split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (line && next.length * size * em > maxWidth) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

function overlay(card) {
  const title = wrap(card.title, 66, 560, 0.53);
  const body = wrap(card.text, 28, 500, 0.49);
  const titleTop = 214, titleLead = 74;
  const bodyTop = titleTop + (title.length - 1) * titleLead + 58;
  const mark = seats.map(([x, y, m]) => `<circle cx="${x}" cy="${y}" r="2.3" fill="${m ? ink : '#a9bf98'}"/>`).join('');
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs><linearGradient id="fade" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="#f6f2e9" stop-opacity=".97"/><stop offset=".4" stop-color="#f6f2e9" stop-opacity=".9"/><stop offset=".66" stop-color="#f6f2e9" stop-opacity="0"/>
  </linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#fade)"/>
  <g transform="translate(62 58) scale(2.1) translate(-0.4 -10.6)">${mark}</g>
  <text x="138" y="92" font-family="Segoe UI" font-weight="700" font-size="42" fill="${ink}" letter-spacing="-0.5">mandát<tspan fill="#6f9460">.</tspan></text>
  ${title.map((l, i) => `<text x="64" y="${titleTop + i * titleLead}" font-family="Segoe UI" font-weight="700" font-size="66" fill="${ink}" letter-spacing="-1.2">${esc(l)}</text>`).join('\n  ')}
  ${body.map((l, i) => `<text x="66" y="${bodyTop + i * 40}" font-family="Segoe UI" font-size="28" fill="${text2}">${esc(l)}</text>`).join('\n  ')}
  <text x="66" y="584" font-family="Segoe UI" font-size="17" fill="${muted}">Ilustrácia vytvorená pomocou AI</text>
</svg>`);
}

mkdirSync('public/og', { recursive: true });
for (const card of shareCards) {
  const bg = await sharp(`public/images/illustrations/${card.image}-1280.webp`).resize({ width: W }).toBuffer({ resolveWithObject: true });
  const top = bg.info.height - H;
  const out = `public/og/${card.view}.jpg`;
  const info = await sharp(bg.data).extract({ left: 0, top, width: W, height: H })
    .composite([{ input: overlay(card) }])
    .jpeg({ quality: 84, mozjpeg: true }).toFile(out);
  console.log(out, `${Math.round(info.size / 1024)} kB`);
}
