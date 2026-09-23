// Ikony aplikácie (inštalácia na plochu) z geometrie favicon.svg: node scripts/build-icons.mjs
// icon-192/512 = zaoblená značka ako favicon; maskable a apple-touch = plný podklad, značka v bezpečnej zóne
// (Android si tvar orezáva sám, iOS zaobľuje rohy).
import sharp from 'sharp';

const ink = '#20392f', paper = '#f5f4ee', green = '#9dbb86';
const dots = `<g fill="${paper}"><circle cx="10" cy="43" r="4.6"/><circle cx="16.4" cy="27.4" r="4.6"/><circle cx="32" cy="21" r="4.6"/><circle cx="21" cy="43" r="4.6"/><circle cx="32" cy="32" r="4.6"/></g><g fill="${green}"><circle cx="47.6" cy="27.4" r="4.6"/><circle cx="54" cy="43" r="4.6"/><circle cx="43" cy="43" r="4.6"/></g>`;
// Stred skupiny bodiek je (32, 32); pri plnom podklade ju zmenšíme do bezpečnej zóny.
const svg = ({ rounded, scale }) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" ${rounded ? 'rx="14"' : ''} fill="${ink}"/><g transform="translate(32 32) scale(${scale}) translate(-32 -32)">${dots}</g></svg>`;

const out = [
  ['public/icon-192.png', 192, { rounded: true, scale: 1 }],
  ['public/icon-512.png', 512, { rounded: true, scale: 1 }],
  ['public/icon-maskable-512.png', 512, { rounded: false, scale: 0.66 }],
  ['public/apple-touch-icon.png', 180, { rounded: false, scale: 0.78 }],
];
for (const [file, size, opts] of out) {
  await sharp(Buffer.from(svg(opts)), { density: Math.ceil(72 * size / 64) }).resize(size, size).png({ compressionLevel: 9 }).toFile(file);
  console.log(file, size);
}
