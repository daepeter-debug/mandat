"use client";

import Image from 'next/image';
import { ArrowUpRight, UserRound, X } from 'lucide-react';
import portraits from '@/lib/deputy-portraits.json';
import { displayName, type DeputyRow } from '@/lib/deputies';
import { clubLabel, markNames, type SeatedMember } from '@/lib/votes';

type Portrait = { name: string; photo: string; source: string; author: string; license: string; licenseUrl: string };
const photos = portraits as Record<string, Portrait>;

export default function ChamberInspection({ row, seat, voting, onProfile, onClose }: {
  row: DeputyRow; seat: SeatedMember | null; voting: boolean; onProfile: () => void; onClose: () => void;
}) {
  const name = displayName(row.meno), portrait = photos[String(row.id)];
  const initials = name.split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join('');
  return <aside className="parl-inspect" aria-label="Vybraný poslanec" aria-live="polite">
    <div className="parl-inspect-person">
      {portrait ? <Image src={portrait.photo} alt="" width={52} height={64} unoptimized loading="lazy" className="parl-inspect-portrait"/>
        : <span className="parl-inspect-monogram" aria-hidden="true">{initials}</span>}
      <div><b>{name}</b><span>{seat ? clubLabel(seat.club) : 'V tomto hlasovaní nebol poslancom.'}</span>
        {voting && seat && <strong className="parl-inspect-vote">{markNames[seat.mark]}</strong>}</div>
      <button type="button" className="parl-inspect-close" aria-label="Zrušiť výber poslanca" onClick={onClose}><X size={16} aria-hidden="true"/></button>
    </div>
    <div className="parl-inspect-actions">
      <button type="button" onClick={onProfile}><UserRound size={14} aria-hidden="true"/>Profil a hlasovania<ArrowUpRight size={13} aria-hidden="true"/></button>
      {portrait && <details className="parl-inspect-credit"><summary>Foto</summary><p>{portrait.author} · <a href={portrait.licenseUrl} target="_blank" rel="noopener noreferrer">{portrait.license}</a> · <a href={portrait.source} target="_blank" rel="noopener noreferrer">Zdroj fotografie</a></p></details>}
    </div>
  </aside>;
}
