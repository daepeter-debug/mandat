"use client";
import { useEffect, useRef, type CSSProperties } from "react";
import "@/app/parliament-backdrop.css";

/*
  Pozadie sály na stránke Parlament: večerná Bratislava nad Dunajom cez celú scénu (2D aj 3D).
  Hore obloha, v strede panoráma mesta (Most SNP vľavo, hrad vpravo), dole rieka so zrkadlením a odleskami svetiel.
  Obrázok public/models/bratislava-evening.jpg je ilustrácia vytvorená pomocou AI (zadanie v .prompt.txt vedľa neho).
  Vrstvy v 3D dostávajú CSS premenné --pan, --tilt, --zoom z tej istej riadenej kamery ako sála;
  nepotrebujú odloženú udalosť WebGL. V 2D sú v pokoji. Rozloženie počíta s mierkou plochy (container units), takže na úzkom
  telefóne ostane viditeľný most aj hrad a obloha s riekou vyplnia výšku.
*/
export const BACKDROP_IMAGE = "/models/bratislava-evening.jpg";

type CameraStyle = CSSProperties & { '--pan': number; '--tilt': number; '--zoom': number };
export default function ParliamentBackdrop({ cameraStyle, className = "" }: { cameraStyle?: CameraStyle; className?: string }) {
  const own = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = own.current;
    if (!el) return;
    let inView = false;
    const update = () => { el.dataset.active = String(inView && !document.hidden); };
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; update(); });
    observer.observe(el); document.addEventListener('visibilitychange', update);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, []);
  return <div ref={own} style={cameraStyle} className={`parl-backdrop ${className}`} data-active="false" aria-hidden="true">
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
