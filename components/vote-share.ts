import { chamberSeats, rowRadius, CHAMBER } from '@/lib/parliament-model';
import { kindNames, markColors, required, skDay, type Mark, type SeatedMember, type VoteSummary } from '@/lib/votes';

/*
  Karta hlasovania na zdieľanie (1080 × 1350): sála zhora vo farbách hlasov, výsledok a pravidlo väčšiny.
  Kreslí sa v 2D z tých istých 150 miest ako 3D sála, takže funguje aj bez WebGL. Rozsadenie je ilustrácia podľa klubov.
*/
const LABELS: Record<Mark, string> = { Z: 'Za', P: 'Proti', '?': 'Zdržali sa', N: 'Nehlasovali', '0': 'Neprítomní' };

function wrap(ctx: CanvasRenderingContext2D, text: string, width: number, max: number) {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > width) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  if (lines.length > max) { lines.length = max; lines[max - 1] = `${lines[max - 1].replace(/\s+\S*$/, '')} …`; }
  return lines;
}

export async function voteShareCard(vote: VoteSummary, seated: SeatedMember[], host: string) {
  await document.fonts.ready;
  const canvas = document.createElement('canvas');
  canvas.width = 1080; canvas.height = 1350;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  const font = '"IBM Plex Sans Variable", "Segoe UI", sans-serif';
  ctx.fillStyle = '#20392f'; ctx.fillRect(0, 0, 1080, 1350);
  ctx.fillStyle = '#cfe0d6'; ctx.font = `500 28px ${font}`;
  ctx.fillText(`Hlasovanie NR SR · ${skDay(vote.datum)} · ${kindNames[vote.druh]}`, 64, 96);
  ctx.fillStyle = '#f5f4ee'; ctx.font = `650 48px ${font}`;
  const lines = wrap(ctx, vote.nazov, 952, 4);
  lines.forEach((l, i) => ctx.fillText(l, 64, 166 + i * 60));
  // Sála zhora: 0,3 m polomer → 450 px.
  const top = 166 + lines.length * 60 + 10, k = 1500, cx = 540, cy = top + 480;
  ctx.strokeStyle = '#3d5a4c'; ctx.lineWidth = 2;
  for (let r = 0; r < CHAMBER.ROWS; r++) { ctx.beginPath(); ctx.arc(cx, cy, (rowRadius(r) + .004) * k, Math.PI, 0); ctx.stroke(); }
  ctx.fillStyle = '#3d5a4c'; ctx.fillRect(cx - 66, cy + 22, 132, 26);
  for (const seat of seated) {
    const s = chamberSeats[seat.seat];
    ctx.beginPath(); ctx.arc(cx + s.x * k, cy + s.z * k, 13.5, 0, Math.PI * 2);
    ctx.fillStyle = markColors[seat.mark]; ctx.fill();
  }
  // Tabuľa: päť kategórií hlasu.
  const counts: Record<Mark, number> = { Z: vote.za, P: vote.proti, '?': vote.zdrzalo, N: vote.nehlasovalo, '0': vote.nepritomni };
  const boardTop = cy + 96;
  (['Z', 'P', '?', 'N', '0'] as const).forEach((m, i) => {
    const x = 64 + i * 192;
    ctx.fillStyle = markColors[m]; ctx.beginPath(); ctx.arc(x + 9, boardTop - 9, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#cfe0d6'; ctx.font = `500 24px ${font}`; ctx.fillText(LABELS[m], x + 26, boardTop);
    ctx.fillStyle = '#ffffff'; ctx.font = `600 64px ${font}`; ctx.fillText(String(counts[m]), x, boardTop + 72);
  });
  const need = required(vote);
  ctx.fillStyle = vote.preslo ? '#a4ecbf' : '#ffb3ad'; ctx.font = `650 40px ${font}`;
  ctx.fillText(vote.preslo ? 'Návrh prešiel' : 'Návrh neprešiel', 64, boardTop + 150);
  ctx.fillStyle = '#cfe0d6'; ctx.font = `400 25px ${font}`;
  ctx.fillText(`Treba ${need.votes} hlasov (${need.rule}).`, 64, boardTop + 192);
  ctx.font = `400 22px ${font}`;
  ctx.fillText('Kreslá podľa klubov, nie skutočný zasadací poriadok. Zdroj: nrsr.sk', 64, 1268);
  ctx.fillStyle = '#dcf59b'; ctx.font = `600 24px ${font}`;
  ctx.fillText(`mandát · ${host}/parlament`, 64, 1306);
  return new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('PNG unavailable')), 'image/png'));
}
