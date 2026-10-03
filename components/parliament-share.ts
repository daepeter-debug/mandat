import { coalitionSelection } from '@/lib/parliament-experience';
import { parliamentTimeline, type ParliamentVariant } from '@/lib/parliament-model';
import { aggregateUpdated } from '@/lib/aggregate';
import { CLUBS_AS_OF } from '@/lib/parliament-clubs';

/** Snapshot data and image are supplied together; no hidden live model state is read. */
export async function parliamentShareCard(image: Blob, variant: ParliamentVariant, ids: string[]) {
  await document.fonts.ready;
  const scene = await createImageBitmap(image), canvas = document.createElement('canvas');
  canvas.width = 1080; canvas.height = 1350;
  const ctx = canvas.getContext('2d');
  if (!ctx) { scene.close(); throw new Error('Canvas unavailable'); }
  const own = coalitionSelection(variant, ids), font = '"IBM Plex Sans Variable", "Segoe UI", sans-serif';
  ctx.fillStyle = '#20392f'; ctx.fillRect(0, 0, 1080, 1350);
  ctx.fillStyle = '#f5f4ee'; ctx.font = `650 44px ${font}`; ctx.fillText('Moja koalícia v parlamente', 64, 100);
  // Mesiac vývoja nesie dátum svojho bodu; súčasný Model Mandát (aj scenár bez strany) dátum aktualizácie ako zvyšok webu.
  const point = parliamentTimeline().find(m => m.variant.id === variant.id)?.point.date;
  const skDate = (day: string) => new Date(`${day}T12:00:00Z`).toLocaleDateString('sk-SK', { timeZone: 'UTC' });
  const date = variant.id === 'volby-2023' ? '30. 9. 2023' : variant.id === 'kluby' ? `kluby k ${skDate(CLUBS_AS_OF)}` : point ? `bod k ${skDate(point)}` : `aktualizované ${skDate(aggregateUpdated)}`;
  ctx.fillStyle = '#cfe0d6'; ctx.font = `400 26px ${font}`; ctx.fillText(`${variant.label} · ${date}`, 64, 147);
  ctx.fillStyle = '#3b423a'; ctx.fillRect(40, 187, 1000, 720);
  const scale = Math.min(1000 / scene.width, 720 / scene.height);
  ctx.drawImage(scene, 40 + (1000 - scene.width * scale) / 2, 187 + (720 - scene.height * scale) / 2, scene.width * scale, scene.height * scale); scene.close();
  ctx.fillStyle = '#f5f4ee'; ctx.font = `650 90px ${font}`; ctx.fillText(`${own.seats} kresiel`, 64, 1010);
  ctx.fillStyle = '#dcf59b'; ctx.font = `500 32px ${font}`; ctx.fillText(own.majority ? 'Parlamentná väčšina · hranica 76' : `Do väčšiny chýba ${own.missing} · hranica 76`, 64, 1062);
  let x = 64, y = 1120; ctx.font = `600 26px ${font}`;
  for (const p of own.members) {
    const text = `${p.short} ${p.seats}`, width = ctx.measureText(text).width + 38;
    if (x + width > 1016) { x = 64; y += 44; }
    ctx.fillStyle = p.color; ctx.fillRect(x, y - 19, 16, 16);
    ctx.fillStyle = '#f5f4ee'; ctx.fillText(text, x + 26, y); x += width + 20;
  }
  ctx.font = `400 23px ${font}`; ctx.fillStyle = '#cfe0d6';
  ctx.fillText('Vlastná kombinácia, nie odporúčanie ani predpoveď.', 64, 1260);
  ctx.fillText('mandat-preview.mandat.workers.dev', 64, 1305);
  return new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('PNG unavailable')), 'image/png'));
}
