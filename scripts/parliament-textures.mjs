// Deterministické malé PBR textúry. Neutrálna tkanina sa násobí pôvodnou farbou strany.
import fs from 'node:fs';
import sharp from 'sharp';

const logos = JSON.parse(fs.readFileSync('lib/party-logos.json', 'utf8'));
const clamp = n => Math.max(0, Math.min(255, Math.round(n)));
// Parketa do V (rybia kosť v stĺpcoch): stĺpce 32 px, dosky 16 px, farba dosky podľa hashu (opakuje sa bez švu).
const PARQUET = 512, COLUMN = 64, PLANK = 32;
const hash = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
function parquet(x, y) {
  x = ((x % PARQUET) + PARQUET) % PARQUET; y = ((y % PARQUET) + PARQUET) % PARQUET;
  const col = Math.floor(x / COLUMN), local = x - col * COLUMN, slant = col % 2 ? -1 : 1;
  const along = y + slant * local + PARQUET, plank = Math.floor(along / PLANK), inPlank = along - plank * PLANK;
  const seam = Math.min(inPlank, PLANK - inPlank, local, COLUMN - local) / 2;
  const tone = hash(col % (PARQUET / COLUMN), plank % (PARQUET / PLANK)), grain = Math.sin((local * .9 - slant * y * .9) * .55 + tone * 40) * .5 + Math.sin(local * 2.7 + tone * 9) * .2;
  return { tone, grain, seam };
}
async function texture(kind, normal = false) {
  const size = kind === 'wood' || kind === 'parquet' ? 512 : 256, data = Buffer.alloc(size * size * 3);
  const height = (x, y) => {
    if (kind === 'parquet') { const p = parquet(x, y); return (p.seam < 1.2 ? -1 : 0) + p.grain * .08; }
    const u = x / size * Math.PI * 2, v = y / size * Math.PI * 2;
    if (kind === 'wood') return Math.sin(u * 18 + Math.sin(v) * 1.8) * .55 + Math.sin(u * 61 + Math.sin(v * 3)) * .15;
    if (kind === 'fabric') return (Math.sin(u * 64) + Math.sin(v * 64)) * .3;
    return Math.sin(u * 29) * Math.sin(v * 31) * .4 + Math.cos(u * 43 + v * 37) * .2;
  };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 3, h = height(x, y);
    const color = normal ? [128 + (height(x - 1, y) - height(x + 1, y)) * 18, 128 + (height(x, y - 1) - height(x, y + 1)) * 18, 254]
      : kind === 'wood' ? [235 + h * 16, 222 + h * 18, 205 + h * 20]
      : kind === 'parquet' ? (p => { const k = .78 + p.tone * .3 + p.grain * .05, edge = p.seam < 1.2 ? .55 : 1; return [122 * k * edge, 84 * k * edge, 58 * k * edge]; })(parquet(x, y))
      : [248 + h * 7, 248 + h * 7, 248 + h * 7];
    color.forEach((c, k) => { data[i + k] = clamp(c); });
  }
  const image = sharp(data, { raw: { width: size, height: size, channels: 3 } });
  // Normálové mapy ako JPEG: vizuálne rovnaké pri tejto mierke, model je o desiatky kB menší (limit 1,5 MB).
  return normal ? image.jpeg({ quality: 90 }).toBuffer() : image.jpeg({ quality: 82 }).toBuffer();
}

export async function parliamentTextures(ids) {
  const textures = {};
  for (const kind of ['wood', 'fabric', 'stone', 'parquet']) {
    textures[kind] = await texture(kind);
    textures[`${kind}Normal`] = await texture(kind, true);
  }
  for (const id of ids) {
    // Historická koalícia nemá overený spoločný symbol v našom archíve. Použijeme čitateľné označenie,
    // nie dnešné logo hnutia Slovensko. Pri všetkých ostatných ide o existujúce zdrojované logá.
    if (id === 'election-2023-5') {
      textures[`logo:${id}`] = await sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="256" height="128"><rect width="256" height="128" rx="12" fill="#fffefa"/><text x="128" y="58" text-anchor="middle" font-family="sans-serif" font-size="39" font-weight="700" fill="#20392f">OĽANO</text><text x="128" y="98" text-anchor="middle" font-family="sans-serif" font-size="22" fill="#20392f">a priatelia · 2023</text></svg>')).png().toBuffer();
    } else {
      if (!logos[id]?.src) throw new Error(`Chýba overené logo ${id}`);
      const mark = await sharp(`public${logos[id].src}`, { density: 150 }).trim().resize(210, 104, { fit: 'inside' }).png().toBuffer();
      textures[`logo:${id}`] = await sharp({ create: { width: 256, height: 128, channels: 4, background: '#fffefa' } }).composite([{ input: mark, gravity: 'centre' }]).png().toBuffer();
    }
  }
  return textures;
}

// Malá analytická panoráma RGBE: mäkké teplé stropné panely + chladnejšie okolité svetlo.
// Vlastný HDR bez externého hostovania/licencie, 512 × 256; nie textúra vo vnútri GLB.
export function writeParliamentEnvironment() {
  const w = 512, h = 256, pixels = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const a = x / w * Math.PI * 2, v = y / h;
    const panel = Math.exp(-(((v - .23) / .075) ** 2)) * (Math.max(0, Math.cos(a - .7)) ** 12 + Math.max(0, Math.cos(a + 1.8)) ** 12);
    const fill = .22 + .30 * Math.max(0, Math.cos(v * Math.PI));
    const rim = Math.exp(-(((v - .42) / .065) ** 2)) * Math.max(0, Math.cos(a - 3.4)) ** 20;
    // Súmrak za oknami: smer −Z je v ekvirektangulárnej mape azimut π/2 (ako obloha scény v parliament-sky.mjs).
    const dusk = Math.exp(-(((v - .5) / .07) ** 2)) * Math.max(0, Math.cos(a - Math.PI / 2)) ** 2 * 1.6;
    const rgb = [fill + panel * 6.4 + rim * 2.8 + dusk, fill * .94 + panel * 5.2 + rim * 2.2 + dusk * .5, fill * .9 + panel * 4.0 + rim * 1.65 + dusk * .22];
    const exp = Math.ceil(Math.log2(Math.max(...rgb))), factor = 256 / 2 ** exp, i = (y * w + x) * 4;
    rgb.forEach((c, k) => { pixels[i + k] = clamp(c * factor); }); pixels[i + 3] = exp + 128;
  }
  // Flat RGBE (legal old-style scanline encoding; loader recognizes pixels without RLE signature).
  fs.writeFileSync('public/models/parlament-evening.hdr', Buffer.concat([Buffer.from(`#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ${h} +X ${w}\n`), pixels]));
}
