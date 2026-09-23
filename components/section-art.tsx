"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import "@/app/section-art.css";

// Ilustrácie do hlavičiek sekcií. Vytvorené v Higgsfield (Nano Banana Pro), originály s vodoznakom mimo repa;
// vodoznak ani popis o AI sa neodstraňujú. Tlačidlo na obrázku zdieľa odkaz na sekciu (na mobile systémové zdieľanie).
const art = {
  zodpovednost: "Ilustrácia: model parlamentnej sály s odrezaným stropom, lavice okolo rečníckeho pultu",
  hospodarenie: "Ilustrácia: malé domy na stĺpcoch mincí v otvorenej účtovnej knihe, žeriav dvíha mincu",
  "mala-republika": "Ilustrácia: stolová dioráma Malej republiky s radnicou, stanicou, parkom a potokom",
  volby: "Ilustrácia: model školy s odkrytou strechou, vo vnútri volebná miestnosť s urnami a plentami",
  prieskumy: "Ilustrácia: námestie malého mesta so stĺpcovým grafom z drevených kociek",
} as const;

export type SectionArtName = keyof typeof art;

export default function SectionArt({ name }: { name: SectionArtName }) {
  const base = `/images/illustrations/${name}`;
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) { await navigator.share({ title: document.title, url }); return; }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch { /* zdieľanie zrušené */ }
  }
  return <figure className="section-art">
    {/* eslint-disable-next-line @next/next/no-img-element -- pripravené WebP varianty so srcSet, next/image pri unoptimized nepomôže */}
    <img src={`${base}-720.webp`} srcSet={`${base}-720.webp 720w, ${base}-1280.webp 1280w`} sizes="(max-width: 900px) calc(100vw - 32px), 460px" width={1280} height={714} alt={art[name]} decoding="async"/>
    <button type="button" className="section-share" onClick={share} aria-label={copied ? "Odkaz je skopírovaný" : "Zdieľať túto sekciu"}>{copied ? <Check size={16} aria-hidden="true"/> : <Share2 size={16} aria-hidden="true"/>}<span>{copied ? "Skopírované" : "Zdieľať"}</span></button>
    <figcaption>Ilustrácia vytvorená pomocou AI</figcaption>
  </figure>;
}
