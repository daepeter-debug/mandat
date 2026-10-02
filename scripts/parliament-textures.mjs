// Deterministické malé PBR textúry. Neutrálna tkanina sa násobí pôvodnou farbou strany.
import fs from 'node:fs';
import sharp from 'sharp';

const logos = JSON.parse(fs.readFileSync('lib/party-logos.json', 'utf8'));
const clamp = n => Math.max(0, Math.min(255, Math.round(n)));
async function texture(kind, normal = false) {
  const size = kind === 'wood' ? 512 : 256, data = Buffer.alloc(size * size * 3);
  const height = (x, y) => {
    const u = x / size * Math.PI * 2, v = y / size * Math.PI * 2;
    if (kind === 'wood') return Math.sin(u * 18 + Math.sin(v) * 1.8) * .55 + Math.sin(u * 61 + Math.sin(v * 3)) * .15;
    if (kind === 'fabric') return (Math.sin(u * 64) + Math.sin(v * 64)) * .3;
    return Math.sin(u * 29) * Math.sin(v * 31) * .4 + Math.cos(u * 43 + v * 37) * .2;
  };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = (y * size + x) * 3, h = height(x, y);
    const color = normal ? [128 + (height(x - 1, y) - height(x + 1, y)) * 18, 128 + (height(x, y - 1) - height(x, y + 1)) * 18, 254]
      : kind === 'wood' ? [235 + h * 16, 222 + h * 18, 205 + h * 20] : [248 + h * 7, 248 + h * 7, 248 + h * 7];
    color.forEach((c, k) => { data[i + k] = clamp(c); });
  }
  const image = sharp(data, { raw: { width: size, height: size, channels: 3 } });
  return normal ? image.png({ compressionLevel: 9 }).toBuffer() : image.jpeg({ quality: 82 }).toBuffer();
}

export async function parliamentTextures(ids) {
  const textures = {};
  for (const kind of ['wood', 'fabric', 'stone']) {
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
// Vlastný HDR bez externého hostovania/licencie, 128 × 64; nie textúra vo vnútri GLB.
export function writeParliamentEnvironment() {
  const w = 128, h = 64, pixels = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const a = x / w * Math.PI * 2, v = y / h;
    const panel = Math.exp(-(((v - .23) / .075) ** 2)) * (Math.max(0, Math.cos(a - .7)) ** 12 + Math.max(0, Math.cos(a + 1.8)) ** 12);
    const fill = .22 + .30 * Math.max(0, Math.cos(v * Math.PI));
    const rim = Math.exp(-(((v - .42) / .065) ** 2)) * Math.max(0, Math.cos(a - 3.4)) ** 20;
    const rgb = [fill + panel * 6.4 + rim * 2.8, fill * .94 + panel * 5.2 + rim * 2.2, fill * .9 + panel * 4.0 + rim * 1.65];
    const exp = Math.ceil(Math.log2(Math.max(...rgb))), factor = 256 / 2 ** exp, i = (y * w + x) * 4;
    rgb.forEach((c, k) => { pixels[i + k] = clamp(c * factor); }); pixels[i + 3] = exp + 128;
  }
  // Flat RGBE (legal old-style scanline encoding; loader recognizes pixels without RLE signature).
  fs.writeFileSync('public/models/parlament-evening.hdr', Buffer.concat([Buffer.from(`#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ${h} +X ${w}\n`), pixels]));
}
