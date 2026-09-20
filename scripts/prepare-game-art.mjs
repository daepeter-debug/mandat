// Re-encode the generated atlas to a browser-friendly compressed format; no visual editing.
import sharp from 'sharp';
const source = 'research/town-seasons-v2-source.png';
const target = 'public/images/games/town-seasons-v2.webp';
const input = await sharp(source).metadata();
if (input.width !== 1536 || input.height !== 1024) throw new Error('Unexpected atlas dimensions');
await sharp(source).webp({ quality: 90 }).toFile(target);
const decoded = await sharp(target).raw().toBuffer();
if (decoded.length !== 1536 * 1024 * 3) throw new Error('Incomplete decoded atlas');
console.log('Validated 1536 × 1024 seasonal atlas:', target);
