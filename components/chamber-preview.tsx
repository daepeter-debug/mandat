import Image from 'next/image';
import { Box, ArrowUpRight } from 'lucide-react';
import '@/app/visual-discovery.css';

/** A committed render is deliberately cheaper than mounting WebGL in the homepage. */
export default function ChamberPreview() {
  return <a className="chamber-preview" href="/parlament?sala=3d" aria-label="Vstúpiť do interaktívneho 3D parlamentu">
    <Image src="/models/chamber-clubs-2026-10-01.webp" alt="Ilustračná sála nad Dunajom s panorámou Bratislavy" width={1209} height={518} unoptimized loading="lazy"/>
    <span className="chamber-preview-action"><Box size={19} aria-hidden="true"/><span><b>Vstúpte do parlamentu</b><small>150 kresiel. Vlastná koalícia. Skutočné hlasovania.</small></span><ArrowUpRight size={20} aria-hidden="true"/></span>
    <span className="chamber-preview-caption">Náhľad klubov k 1. 10. 2026 · živé 3D až po otvorení</span>
  </a>;
}
