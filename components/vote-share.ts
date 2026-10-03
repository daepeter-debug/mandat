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
  ctx.fillStyle = '#dcf59b'; ctx.font = `600 38px ${font}`;
  ctx.fillText('mandát.', 64, 84);
  ctx.fillStyle = '#cfe0d6'; ctx.font = `500 24px ${font}`;
  ctx.textAlign = 'right'; ctx.fillText(skDay(vote.datum), 1016, 82); ctx.textAlign = 'left';
  ctx.fillStyle = '#f5f4ee'; ctx.font = `650 44px ${font}`;
  const lines = wrap(ctx, vote.nazov, 952, 4);
  lines.forEach((l, i) => ctx.fillText(l, 64, 158 + i * 54));
  ctx.fillStyle = '#cfe0d6'; ctx.font = `400 23px ${font}`;
  ctx.fillText(`Národná rada SR · ${kindNames[vote.druh]}`, 64, 374);
  // Pevné regióny: ani štvorriadkový názov neposunie sálu do výsledku alebo zdroja.
  const k = 1450, cx = 540, cy = 892;
  ctx.fillStyle = '#192f25'; ctx.beginPath(); ctx.arc(cx, cy, 460, Math.PI, 0); ctx.lineTo(cx + 460, cy + 45); ctx.lineTo(cx - 460, cy + 45); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#53705e'; ctx.lineWidth = 1.5;
  for (let r = 0; r < CHAMBER.ROWS; r++) { ctx.beginPath(); ctx.arc(cx, cy, (rowRadius(r) + .004) * k, Math.PI, 0); ctx.stroke(); }
  ctx.fillStyle = '#9f9f83'; ctx.beginPath(); ctx.roundRect(cx - 66, cy + 22, 132, 22, 5); ctx.fill();
  for (const seat of seated) {
    const s = chamberSeats[seat.seat];
    ctx.beginPath(); ctx.arc(cx + s.x * k, cy + s.z * k, 13.5, 0, Math.PI * 2);
    ctx.fillStyle = markColors[seat.mark]; ctx.fill();
    ctx.strokeStyle = '#ffffff50'; ctx.lineWidth = 1; ctx.stroke();
  }
  // Tabuľa: päť kategórií hlasu.
  const counts: Record<Mark, number> = { Z: vote.za, P: vote.proti, '?': vote.zdrzalo, N: vote.nehlasovalo, '0': vote.nepritomni };
  const boardTop = 1005;
  (['Z', 'P', '?', 'N', '0'] as const).forEach((m, i) => {
    const x = 64 + i * 192;
    ctx.fillStyle = markColors[m]; ctx.beginPath(); ctx.arc(x + 9, boardTop - 9, 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#cfe0d6'; ctx.font = `500 23px ${font}`; ctx.fillText(LABELS[m], x + 26, boardTop);
    ctx.fillStyle = '#ffffff'; ctx.font = `600 64px ${font}`; ctx.fillText(String(counts[m]), x, boardTop + 70);
  });
  const need = required(vote);
  ctx.fillStyle = vote.preslo ? '#a4ecbf' : '#ffb3ad'; ctx.font = `650 40px ${font}`;
  ctx.fillText(vote.preslo ? 'Návrh prešiel' : 'Návrh neprešiel', 64, 1150);
  ctx.fillStyle = '#cfe0d6'; ctx.font = `400 24px ${font}`;
  wrap(ctx, `Treba ${need.votes} hlasov (${need.rule}).`, 952, 2).forEach((l, i) => ctx.fillText(l, 64, 1194 + i * 30));
  ctx.strokeStyle = '#53705e'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(64, 1250); ctx.lineTo(1016, 1250); ctx.stroke();
  ctx.font = `400 20px ${font}`;
  ctx.fillText('Ilustrácia podľa klubov, nie zasadací poriadok. Zdroj: nrsr.sk', 64, 1284);
  ctx.fillStyle = '#dcf59b'; ctx.font = `600 24px ${font}`;
  ctx.fillText(`${host}/parlament?h=${vote.id}`, 64, 1322);
  return new Promise<Blob>((resolve, reject) => canvas.toBlob(b => b ? resolve(b) : reject(new Error('PNG unavailable')), 'image/png'));
}
