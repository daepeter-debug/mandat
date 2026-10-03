"use client";
import type { Ref } from "react";
import "@/app/parliament-backdrop.css";

/*
  Pozadie sály na stránke Parlament: večerná Bratislava nad Dunajom cez celú scénu (2D aj 3D).
  Hore obloha, v strede panoráma mesta (Most SNP vľavo, hrad vpravo), dole rieka so zrkadlením a odleskami svetiel.
  Obrázok public/models/bratislava-evening.jpg je ilustrácia vytvorená pomocou AI (zadanie v .prompt.txt vedľa neho).
  Vrstvy sa v 3D posúvajú podľa kamery cez CSS premenné --pan, --tilt, --zoom (nastavuje ich priamo 3D sála, bez
  prekresľovania Reactu); v 2D sú v pokoji. Rozloženie počíta s mierkou plochy (container units), takže na úzkom
  telefóne ostane viditeľný most aj hrad a obloha s riekou vyplnia výšku.
*/
export const BACKDROP_IMAGE = "/models/bratislava-evening.jpg";

export default function ParliamentBackdrop({ ref, className = "" }: { ref?: Ref<HTMLDivElement>; className?: string }) {
  return <div ref={ref} className={`parl-backdrop ${className}`} aria-hidden="true">
    <div className="parl-backdrop-sky"/>
    {/* eslint-disable-next-line @next/next/no-img-element -- dekoratívna vrstva pozadia, veľkosť riadi CSS */}
    <img className="parl-backdrop-city" src={BACKDROP_IMAGE} alt="" decoding="async" draggable={false}/>
    <div className="parl-backdrop-water"/>
    {/* eslint-disable-next-line @next/next/no-img-element -- zrkadlenie rieky z toho istého obrázka */}
    <img className="parl-backdrop-mirror" src={BACKDROP_IMAGE} alt="" decoding="async" draggable={false}/>
    <div className="parl-backdrop-glints"/>
    <div className="parl-backdrop-vignette"/>
  </div>;
}
