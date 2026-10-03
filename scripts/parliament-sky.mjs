// Obloha 3D scény: ekvirektangulárna panoráma 4096 × 2048 (public/models/bratislava-sky.jpg) zložená z ilustrácie
// večernej Bratislavy (public/models/bratislava-evening.jpg, vytvorená pomocou AI). model-viewer ju kreslí ako
// „skybox“ v nekonečnej diaľke, takže oknami vidno mesto so správnou perspektívou: pri otáčaní sa posúva, pri
// priblížení k oknu sa nezväčšuje (ako skutočný výhľad). Mesto s dominantami je za oknami (smer −Z); po stranách
// pokračuje mestom bez dominánt (stredná časť obrázka, striedavo zrkadlená), ďalej rozmazanými okrajmi (predmestia),
// nad tým obloha do tmavomodrého zenitu, pod tým hladina do tmy.
// Spúšťa build-parliament-glb.mjs; samostatne: node scripts/parliament-sky.mjs
import fs from 'node:fs';
import sharp from 'sharp';

export const SKY_FILE = 'public/models/bratislava-sky.jpg';
const SOURCE = 'public/models/bratislava-evening.jpg';
const W = 4096, H = 2048;
// Panoráma pokrýva 80° azimutu so stredom za oknami (three.js: smer −Z je u = 0,25), takže z celkového pohľadu vidno
// oknami most SNP aj hrad. Hladina rieky (77 % výšky obrázka) je 17° pod obzorom: sála stojí na kopci nad Dunajom;
// z galérie (celkový pohľad) vidno oknami mesto, z podlahy sály cez vysoké okná oblohu, ako v skutočnej budove na kopci.
const SPAN = 80, CENTER_U = .25, HORIZON_EL = -17, WATERLINE = .77;

const gradient = (stops, height) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${height}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient></defs><rect width="${W}" height="${height}" fill="url(#g)"/></svg>`);
/** Alfa maska: okraje obrázka prechádzajú do pozadia mäkko (zľava a sprava podľa `side`, zhora 8 %, zdola 6 %). */
function featherMask(w, h, side = .05, topK = .08, bottomK = .06) {
  const a = Buffer.alloc(w * h), ramp = (i, n, k) => k > 0 ? Math.min(1, i / (n * k), (n - 1 - i) / (n * k)) : 1;
  for (let y = 0; y < h; y++) {
    const fy = Math.min(1, y / (h * topK), (h - 1 - y) / (h * bottomK));
    for (let x = 0; x < w; x++) a[y * w + x] = Math.round(255 * Math.max(0, fy) * Math.max(0, ramp(x, w, side)));
  }
  return sharp(a, { raw: { width: w, height: h, channels: 1 } }).png().toBuffer();
}

export async function writeParliamentSky() {
  const source = sharp(SOURCE);
  const meta = await source.metadata();
  const panoW = Math.round(W * SPAN / 360), panoH = Math.round(panoW * meta.height / meta.width);
  const horizonRow = Math.round((.5 - HORIZON_EL / 180) * H), top = Math.round(horizonRow - panoH * WATERLINE);
  const pano = await source.resize(panoW, panoH).sharpen({ sigma: .8 }).toBuffer();
  const mask = await featherMask(panoW, panoH);
  const masked = await sharp(pano).joinChannel(mask).png().toBuffer();
  // Pokračovanie mesta po stranách: stredná časť obrázka bez dominánt (30–70 % šírky), striedavo zrkadlená, o niečo tlmenejšia.
  const segW = Math.round(panoW * .4), segment = await sharp(pano).extract({ left: Math.round(panoW * .3), top: 0, width: segW, height: panoH }).toBuffer();
  const segMask = await featherMask(segW, panoH, .12);
  const tile = async flop => sharp(await (flop ? sharp(segment).flop() : sharp(segment)).modulate({ brightness: .88, saturation: .92 }).toBuffer()).joinChannel(segMask).png().toBuffer();
  const [segA, segB] = await Promise.all([tile(false), tile(true)]);
  // Celý obzor dookola: stredná časť obrázka roztiahnutá, silno rozmazaná a stlmená (vzdialené predmestia za súmraku);
  // vidno ju len tam, kde nie je ostrejšie mesto, a nikdy cez okná sály (tie smerujú k mestu).
  const far = await sharp(await sharp(segment).resize(W, panoH, { fit: 'fill' }).blur(26).modulate({ brightness: .4, saturation: .7 }).toBuffer()).joinChannel(await featherMask(W, panoH, 0, .35, .3)).png().toBuffer();
  // Trojnásobne široké plátno, aby sa panoráma mohla pretáčať cez okraj (u = 0), potom sa tri diely preložia.
  const x0 = Math.round(W * CENTER_U - panoW / 2) + W, overlap = Math.round(segW * .1);
  // Tri diely na každú stranu: mesto pokrýva ±136° od stredu, teda celý polkruh okien (±90°) a ešte rezervu.
  const layers = [
    { input: segB, left: x0 - 3 * segW + 3 * overlap, top }, { input: segA, left: x0 - 2 * segW + 2 * overlap, top }, { input: segB, left: x0 - segW + overlap, top },
    { input: segB, left: x0 + panoW - overlap, top }, { input: segA, left: x0 + panoW + segW - 2 * overlap, top }, { input: segB, left: x0 + panoW + 2 * segW - 3 * overlap, top },
    { input: masked, left: x0, top },
  ];
  const strip = await sharp({ create: { width: W * 3, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(layers).png().toBuffer();
  const tiles = await Promise.all([0, 1, 2].map(i => sharp(strip).extract({ left: i * W, top: 0, width: W, height: H }).png().toBuffer()));
  // Obloha a hladina pod obrázkom: farby jeho okrajov (zhora #165bb0, zdola #1d3c67) do tmy zenitu a nadiru.
  const t = top / H, b = (top + panoH) / H;
  const sky = gradient([[0, '#040a1c'], [Math.max(0, t - .22), '#0b2250'], [t + .02, '#165bb0'], [b - .02, '#1d3c67'], [Math.min(1, b + .12), '#101c38'], [1, '#03060e']], H);
  // Vzdialený pás ide pod všetko ako prvý (raz, cez celú šírku), až potom tri preložené diely s mestom.
  const image = await sharp(sky).composite([{ input: far, left: 0, top }, ...tiles.map(input => ({ input }))]).flatten().jpeg({ quality: 86, mozjpeg: true }).toBuffer();
  fs.writeFileSync(SKY_FILE, image);
  return { bytes: image.length, panoW, panoH, horizonRow };
}

if (process.argv[1] && import.meta.url === new URL(`file:///${process.argv[1].replace(/\\/g, '/')}`).href) {
  const r = await writeParliamentSky();
  console.log(`${SKY_FILE}: ${Math.round(r.bytes / 1024)} kB, mesto ${r.panoW} × ${r.panoH} px, hladina na riadku ${r.horizonRow}`);
}
