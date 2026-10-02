"use client";

import { useEffect, useRef, useState, type DetailedHTMLProps, type HTMLAttributes, type Ref } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import Image from 'next/image';
import { ArrowLeft, Box, Check, RotateCcw, ScanLine, X } from "lucide-react";
import { date } from "@/lib/polls";
import { MAJORITY, type BlocSummary } from "@/lib/blocs";
import { partnerWording } from "@/lib/edition";
import { PARLIAMENT_MODEL, parliamentSeats, parliamentVariants, type ParliamentVariant, type VariantId } from "@/lib/parliament-model";
import { coalitionSelection, partyFocus } from '@/lib/parliament-experience';
import { track } from "@/lib/track";
import partyLogos from '@/lib/party-logos.json';
import "@/app/parliament-ar.css";

/*
  „Parlament v 3D a na stole“: rokovacia sála (public/models/parlament.glb zo scripts/build-parliament-glb.mjs)
  s 150 kreslami vo farbách strán. Po otvorení krátky prejazd od detailu kresiel k celej sále.
  - Prepínač „Podľa prieskumov | Voľby 2023“ prefarbí kreslá v tej istej sále (varianty glTF).
  - „Strany“: čistá sála, ťuknutie na kreslo alebo stranu otvorí detail. „Koalícia“: vlastný výber k väčšine 76.
  - „Bloky“: koalícia, opozícia a ostatní v troch farbách, s pásikom k väčšine 76 a s voliteľnými partnermi
    (REPUBLIKA ku koalícii, Hnutie Slovensko k opozícii — redakčný predpoklad, ako v titulku vydania).
  Na telefóne „Položiť na stôl“ otvorí rozšírenú realitu. Knižnica <model-viewer> (Google, three.js) sa načíta
  až po otvorení, z nášho servera — web ostáva rýchly a nič sa neposiela tretím stranám.
*/
type ModelViewerProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & Record<string, unknown>;
declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX { interface IntrinsicElements { "model-viewer": ModelViewerProps } }
}
type Material = { name: string; isLoaded?: boolean; ensureLoaded?: () => Promise<void>; pbrMetallicRoughness: { setBaseColorFactor: (c: string) => void }; setEmissiveFactor: (c: string | number[]) => void };
type Viewer = HTMLElement & { model?: { materials: Material[] }; loaded?: boolean; currentTime: number; pause: () => void; play: (o?: { repetitions?: number }) => void; dismissPoster: () => void; resetTurntableRotation: (theta?: number) => void; jumpCameraToGoal: () => void; materialFromPoint: (x: number, y: number) => Material | null };
const logos = partyLogos as Record<string, { src: string }>;

const variants = parliamentVariants();
const seatsNow = parliamentSeats();
const BLOC_COLOR = { coalition: "#c4553f", opposition: "#3c6db4", others: "#aab2ac" } as const;
const DIM = "#d6d9d2";
/** Kamera tak, aby sa celá sála zmestila na šírku aj na úzkom mobile (zorné pole 32°, polovičná šírka sály ~0,37 m). */
function fit(el: HTMLElement | null) {
  const aspect = el && el.clientHeight ? el.clientWidth / el.clientHeight : 1.3, r = Math.min(2.4, Math.max(0.8, 0.385 / (Math.tan(16 * Math.PI / 180) * aspect)));
  return { r, view: { orbit: `0deg ${aspect < 1 ? 46 : 54}deg ${r.toFixed(2)}m`, target: aspect < 1 ? "0m 0.085m -0.1m" : "0m 0.05m -0.1m" }, intro: { orbit: `0deg 10deg ${(r * 1.35).toFixed(2)}m`, target: "0m 0.02m -0.08m" } };
}
const INTRO = { orbit: "0deg 10deg 2.2m", target: "0m 0.02m -0.08m" };
const plural = (n: number) => n === 1 ? "kreslo" : n >= 2 && n <= 4 ? "kreslá" : "kresiel";
const blocLabel = (summary: BlocSummary, bloc: "coalition" | "opposition", partners: boolean) => {
  const base = bloc === "coalition" ? "Koalícia" : "Opozícia";
  if (!partners) return base;
  const words = summary[bloc].members.filter(m => partnerWording[m.id] || (bloc === "opposition" && m.id === "election-2023-5")).map(m => partnerWording[m.id] ?? "s OĽANO");
  return words.length ? `${base} ${words.join(" a ")}` : base;
};
const blocOf = (summary: BlocSummary, id: string) => summary.coalition.members.some(m => m.id === id) ? "coalition" : summary.opposition.members.some(m => m.id === id) ? "opposition" : "others";

function useSeatCounter(value: number, reduced: boolean, visible: boolean) {
  const [shown, setShown] = useState(value), last = useRef(value);
  useEffect(() => {
    if (reduced || !visible) { last.current = value; return; }
    let frame = 0; const from = last.current, started = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - started) / 320), next = Math.round(from + (value - from) * (1 - (1 - t) ** 3));
      last.current = next; setShown(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
  }, [value, reduced, visible]);
  return reduced || !visible ? value : shown;
}

export default function ParliamentAR() {
  const [open, setOpen] = useState(false), [ready, setReady] = useState(false), [failed, setFailed] = useState(false);
  const [viewer, setViewer] = useState<Viewer | null>(null), [loaded, setLoaded] = useState(false);
  const [variantId, setVariantId] = useState<VariantId>("prieskumy"), [mode, setMode] = useState<"strany" | "bloky" | "koalicia">("strany");
  const [selected, setSelected] = useState<string | null>(null), [partners, setPartners] = useState(true), [camera, setCamera] = useState(INTRO);
  const [reduced, setReduced] = useState(false), [visible, setVisible] = useState(true);
  const [combination, setCombination] = useState<string[]>([]), [touring, setTouring] = useState(false);
  const introTimers = useRef<number[]>([]), introActive = useRef(false);
  const pointerStart = useRef<{ x: number; y: number; at: number; moved: boolean; multi: boolean } | null>(null);
  const pointers = useRef(new Set<number>());
  const previousVariant = useRef<VariantId>('prieskumy');
  const current = variants.find(v => v.id === variantId) as ParliamentVariant;
  const summary = partners ? current.withPartners : current.blocs;
  const coalition = coalitionSelection(current, combination);
  const displayedSeats = useSeatCounter(coalition.seats, reduced, visible);
  const selectedParty = current.ordered.find(p => p.id === selected);

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)'), update = () => setReduced(media.matches);
    update(); media.addEventListener('change', update); return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (!viewer) return;
    let inView = true;
    const update = () => { const active = inView && !document.hidden; setVisible(active); if (!active) { viewer.pause(); if (introActive.current) { introTimers.current.forEach(clearTimeout); introActive.current = false; setTouring(false); setCamera(fit(viewer).view); } } };
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; update(); });
    observer.observe(viewer); document.addEventListener('visibilitychange', update); update();
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, [viewer, reduced]);
  useEffect(() => {
    if (!viewer || !loaded) return;
    const observer = new ResizeObserver(() => { if (!selected && !introActive.current) setCamera(fit(viewer).view); });
    observer.observe(viewer);
    return () => observer.disconnect();
  }, [viewer, loaded, selected]);
  useEffect(() => {
    if (!viewer || !loaded || !reduced) return;
    const timer = window.setTimeout(() => viewer.dispatchEvent(new Event('par3d-replay')), 0);
    return () => clearTimeout(timer);
  }, [viewer, loaded, reduced]);
  useEffect(() => {
    if (!open || ready) return;
    let alive = true;
    import("@google/model-viewer").then(() => { if (alive) setReady(true); }).catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [open, ready]);
  // Jeden prerušiteľný prejazd: detail pri kreslách, krátky oblúk a celá sála.
  useEffect(() => {
    if (!viewer) return;
    const start = () => {
      introTimers.current.forEach(clearTimeout);
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const cam = fit(viewer);
      viewer.resetTurntableRotation(0);
      const animate = !reduce && !document.hidden;
      introActive.current = animate; setTouring(animate);
      setLoaded(true); setCamera(animate ? { orbit: '-18deg 76deg 0.48m', target: '-0.04m 0.045m -0.14m' } : cam.view);
      // Activate the named glTF clip before seeking: an inactive mixer has no seat scale tracks.
      viewer.play({ repetitions: 1 }); viewer.pause(); viewer.currentTime = 3; viewer.dismissPoster();
      introTimers.current = animate ? [
        window.setTimeout(() => viewer.jumpCameraToGoal(), 80),
        window.setTimeout(() => setCamera({ orbit: '14deg 66deg 0.58m', target: '0.025m 0.05m -0.14m' }), 800),
        window.setTimeout(() => setCamera(fit(viewer).view), 1800),
        window.setTimeout(() => { introActive.current = false; setTouring(false); }, 3000),
      ] : [];
    };
    const onLoad = () => start();
    viewer.addEventListener("load", onLoad);
    viewer.addEventListener("par3d-replay", onLoad);
    const raf = viewer.loaded ? requestAnimationFrame(start) : 0;   // model už bol načítaný skôr (napr. z vyrovnávacej pamäte)
    return () => { viewer.removeEventListener("load", onLoad); viewer.removeEventListener("par3d-replay", onLoad); cancelAnimationFrame(raf); introTimers.current.forEach(clearTimeout); introActive.current = false; };
  }, [viewer]);
  // Rovnaké jemné svetlo pre každú vybranú stranu; logá sú samostatné materiály a nemenia farbu.
  useEffect(() => {
    const materials = viewer?.model?.materials;
    if (!loaded || !materials) return;
    const colors = new Map(variants.flatMap(v => v.ordered).map(m => [m.id, m.color]));
    let alive = true, frame = 0;
    const wave = previousVariant.current !== variantId && !reduced && visible;
    previousVariant.current = variantId;
    const upholstery = materials.filter(m => m.name.startsWith('strana:'));
    const apply = (material: Material, strength = 0) => {
      if (!alive) return;
      const id = material.name.slice(7), own = colors.get(id) ?? DIM;
      const included = mode === 'koalicia' && combination.includes(id);
      const color = mode === "bloky" ? BLOC_COLOR[blocOf(summary, id)] : mode === 'koalicia' ? included ? own : DIM : selected && selected !== id ? DIM : own;
      const glow = strength + ((mode === 'strany' && selected === id) || included ? .055 : 0);
      try { material.pbrMetallicRoughness.setBaseColorFactor(color); material.setEmissiveFactor([glow, glow * .92, glow * .8]); } catch { /* lazy variant is still loading */ }
    };
    void Promise.all(upholstery.map(async material => { if (material.isLoaded === false && material.ensureLoaded) await material.ensureLoaded(); apply(material); })).then(() => {
      if (!alive || !wave) return;
      const started = performance.now();
      const animate = (now: number) => {
        if (!alive || document.hidden) { upholstery.forEach(m => apply(m)); return; }
        const elapsed = now - started;
        for (const material of upholstery) {
          const order = current.ordered.findIndex(p => p.id === material.name.slice(7));
          const t = (elapsed - order * 85) / 260;
          apply(material, order >= 0 && t > 0 && t < 1 ? Math.sin(t * Math.PI) * .075 : 0);
        }
        if (elapsed < current.ordered.length * 85 + 260) frame = requestAnimationFrame(animate);
      };
      frame = requestAnimationFrame(animate);
    }).catch(() => {});
    return () => { alive = false; cancelAnimationFrame(frame); };
  }, [viewer, loaded, mode, selected, summary, current, variantId, reduced, visible, combination]);
  // Kamera k zvolenej strane (bližšie, so stredom v jej kline); bez výberu späť na celú sálu.
  function choose(id: string | null) {
    stopIntro();
    setSelected(id);
    const focus = id ? partyFocus(current, id) : null;
    const cam = fit(viewer);
    setCamera(focus ? { orbit: `${focus.theta.toFixed(1)}deg 62deg ${Math.max(.32, Math.min(.60, cam.r * .48)).toFixed(2)}m`, target: focus.target.map(p => `${p.toFixed(3)}m`).join(' ') } : cam.view);
    if (id) track("ar", `party:${id}`);
  }
  function stopIntro() { introTimers.current.forEach(clearTimeout); introActive.current = false; setTouring(false); viewer?.pause(); }
  function switchVariant(id: VariantId) { stopIntro(); setVariantId(id); setCombination([]); setSelected(null); setCamera(fit(viewer).view); track("ar", `variant:${id}`); }
  function switchMode(next: "strany" | "bloky" | "koalicia") { stopIntro(); setMode(next); setSelected(null); setCamera(fit(viewer).view); }
  function toggleCoalition(id: string) { stopIntro(); setCombination(ids => ids.includes(id) ? ids.filter(p => p !== id) : [...ids, id]); }
  function pickSeat(x: number, y: number) {
    const material = viewer?.materialFromPoint(x, y), id = material?.name.replace(/^(strana|logo):/, '');
    if (!id || !current.ordered.some(p => p.id === id)) return;
    if (mode === 'koalicia') toggleCoalition(id); else if (mode === 'strany') choose(selected === id ? null : id);
  }

  const caption = (() => {
    if (mode === "bloky") {
      const c = summary.coalition.seats, o = summary.opposition.seats, rest = summary.others.seats;
      const holder = c >= MAJORITY ? blocLabel(summary, "coalition", partners) : o >= MAJORITY ? blocLabel(summary, "opposition", partners) : null;
      return { title: holder ? `Väčšinu ${MAJORITY} kresiel má ${holder.charAt(0).toLocaleLowerCase("sk") + holder.slice(1)}` : `Väčšinu ${MAJORITY} kresiel nemá žiadny blok`, c, o, rest };
    }
    const party = selected && current.ordered.find(m => m.id === selected);
    if (party) {
      const bloc = blocOf(current.blocs, party.id);
      return { title: `${party.short} · ${party.seats} ${plural(party.seats)}`, note: bloc === "coalition" ? "dnešná vládna koalícia" : bloc === "opposition" ? "dnešná opozícia" : "mimo dnešných blokov" };
    }
    return { title: variantId === "prieskumy" ? `Scenár podľa Modelu Mandát · aktualizované ${date(seatsNow.updated)}` : "Výsledok volieb 30. septembra 2023", note: "Ťukni na kreslo alebo vyber stranu zo zoznamu a pozri si ju zblízka." };
  })();

  return <DialogPrimitive.Root open={open} onOpenChange={next => { setOpen(next); if (next) track("ar", "open"); else { setViewer(null); setLoaded(false); setSelected(null); setCamera(INTRO); } }}>
    <DialogPrimitive.Trigger asChild>
      <button type="button" className="par3d-open" onPointerEnter={() => { void import("@google/model-viewer").catch(() => {}); }}><Box size={17} aria-hidden="true"/>Pozrieť v 3D a na stole</button>
    </DialogPrimitive.Trigger>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="par3d-overlay"/>
      <DialogPrimitive.Content className="par3d" aria-describedby="par3d-desc">
        <div className="par3d-head">
          <div><DialogPrimitive.Title className="par3d-title">Parlament v 3D</DialogPrimitive.Title>
            <p id="par3d-desc" className="par3d-desc">{variantId === "prieskumy" ? `150 kresiel podľa Modelu Mandát (aktualizované ${date(seatsNow.updated)})` : "150 kresiel podľa výsledku volieb 2023"}: koalícia vľavo, opozícia vpravo. Otáčaj prstom, približuj dvoma prstami.</p></div>
          <DialogPrimitive.Close className="par3d-close" aria-label="Zavrieť"><X size={20}/></DialogPrimitive.Close>
        </div>
        <div className="par3d-controls">
          <div className="par3d-seg" role="group" aria-label="Obsadenie sály">{variants.map(v => <button key={v.id} type="button" aria-pressed={variantId === v.id} onClick={() => switchVariant(v.id)}>{v.label}</button>)}</div>
          <div className="par3d-seg" role="group" aria-label="Režim sály">{(["strany", "koalicia", "bloky"] as const).map(m => <button key={m} type="button" aria-pressed={mode === m} onClick={() => switchMode(m)}>{m === "strany" ? "Strany" : m === 'koalicia' ? 'Koalícia' : "Bloky"}</button>)}</div>
          <button type="button" className="par3d-replay" aria-label="Prehrať úvod znova" onClick={() => { setSelected(null); viewer?.dispatchEvent(new Event("par3d-replay")); }}><RotateCcw size={16} aria-hidden="true"/></button>
        </div>
        <div className="par3d-stage" data-detail={!!selected}>
          {ready
            ? <model-viewer ref={setViewer as unknown as Ref<HTMLElement>} src={PARLIAMENT_MODEL} variant-name={variantId} animation-name="obsadenie"
                alt={`3D rokovacia sála: ${current.ordered.map(m => `${m.short} ${m.seats}`).join(", ")}`}
                ar="" ar-modes="webxr scene-viewer quick-look" ar-scale="auto" ar-placement="floor"
                camera-controls="" touch-action="none" interaction-prompt="none" reveal="manual" loading="eager"
                camera-orbit={camera.orbit} camera-target={camera.target} field-of-view="30deg" interpolation-decay={reduced ? '0' : touring ? '220' : '100'}
                min-camera-orbit="auto 10deg 0.35m" max-camera-orbit="auto 86deg 3.2m"
                tone-mapping="aces" shadow-intensity="1.1" shadow-softness="0.7" exposure="1.2" environment-image="/models/parlament-evening.hdr" class="par3d-viewer"
                onPointerDown={e => { pointers.current.add(e.pointerId); pointerStart.current = { x: e.clientX, y: e.clientY, at: e.timeStamp, moved: false, multi: pointers.current.size > 1 }; if (touring) { stopIntro(); setCamera(fit(viewer).view); } }}
                onPointerMove={e => { if (pointerStart.current && Math.hypot(e.clientX - pointerStart.current.x, e.clientY - pointerStart.current.y) > 7) pointerStart.current.moved = true; }}
                onPointerCancel={e => { pointers.current.delete(e.pointerId); pointerStart.current = null; }}
                onPointerUp={e => { const down = pointerStart.current; pointers.current.delete(e.pointerId); pointerStart.current = null; if (down && !down.moved && !down.multi && e.timeStamp - down.at < 500 && e.target === e.currentTarget) pickSeat(e.clientX, e.clientY); }}
                onError={() => setFailed(true)}>
                <button slot="ar-button" type="button" className="par3d-ar" onClick={() => track("ar", "table")}><ScanLine size={18} aria-hidden="true"/>Položiť na stôl</button>
              </model-viewer>
            : <p className="par3d-loading" role="status">{failed ? "3D model sa nepodarilo načítať. Skúste to znova neskôr." : "Staviame rokovaciu sálu…"}</p>}
          {touring && <button type="button" className="par3d-skip" onClick={() => { stopIntro(); setCamera(fit(viewer).view); }}>Preskočiť úvod</button>}
          {selectedParty && mode === 'strany' && <div className="par3d-detail" style={{ ['--party-color' as string]: selectedParty.color }}>
            {logos[selectedParty.id]?.src && <Image src={logos[selectedParty.id].src} alt="" width={40} height={30} unoptimized/>}
            <span><b>{selectedParty.short}</b><small>{selectedParty.seats} {plural(selectedParty.seats)}</small></span>
            <button type="button" onClick={() => choose(null)}><ArrowLeft size={16} aria-hidden="true"/>Celá sála</button>
          </div>}
          {failed && ready && <p className="par3d-loading" role="alert">Model sa nepodarilo načítať. Zavri okno a skús ho otvoriť znova.</p>}
        </div>
        <div className="par3d-caption" data-ready={loaded} aria-live="polite">
          {mode === 'koalicia' ? <div className="par3d-coalition" data-majority={coalition.majority}>
            <div className="par3d-coalition-summary"><div><b>Poskladaj vlastnú koalíciu</b><span>{coalition.members.length ? coalition.majority ? 'Táto kombinácia má parlamentnú väčšinu.' : `Do väčšiny chýba ${coalition.missing} ${plural(coalition.missing)}.` : 'Vyber strany zo zoznamu alebo ťukni na ich kreslá.'}</span></div><strong aria-hidden="true">{displayedSeats}<small>/ 150</small></strong></div>
            <div className="par3d-majority" role="img" aria-label={`${coalition.seats} zo 150 kresiel; ${coalition.majority ? 'väčšina dosiahnutá' : `do väčšiny chýba ${coalition.missing}`}`}><span style={{ transform: `scaleX(${coalition.seats / 150})` }}/><i style={{ left: `${76 / 1.5}%` }}/></div>
            <div className="par3d-majority-label"><span>{coalition.members.length} {coalition.members.length === 1 ? 'strana' : coalition.members.length >= 2 && coalition.members.length <= 4 ? 'strany' : 'strán'}</span><span>{coalition.majority && <Check size={14} aria-hidden="true"/>}Väčšina 76</span><button type="button" disabled={!combination.length} onClick={() => setCombination([])}>Vymazať výber</button></div>
            <p>Vlastná kombinácia, nie odporúčanie ani predpoveď dohody strán.</p>
          </div> : <><b>{caption.title}</b>{"note" in caption && caption.note && <span>{caption.note}</span>}</>}
          {mode === "bloky" && "c" in caption && <>
            <div className="par3d-bar" role="img" aria-label={`Koalícia ${caption.c}, ostatní ${caption.rest}, opozícia ${caption.o} zo 150; väčšina ${MAJORITY}`}>
              <i style={{ width: `${caption.c! / 1.5}%`, background: BLOC_COLOR.coalition }}/><i style={{ width: `${caption.rest! / 1.5}%`, background: BLOC_COLOR.others }}/><i style={{ width: `${caption.o! / 1.5}%`, background: BLOC_COLOR.opposition }}/>
              <em style={{ left: `${MAJORITY / 1.5}%` }} aria-hidden="true"/>
            </div>
            <label className="par3d-partners"><input type="checkbox" checked={partners} onChange={e => setPartners(e.target.checked)}/><span>Republika ku koalícii, Hnutie Slovensko (OĽANO) k opozícii <small>· redakčný predpoklad</small></span></label>
          </>}
        </div>
        {mode !== "bloky"
          ? <ul className="par3d-legend" aria-label={mode === 'koalicia' ? 'Strany do vlastnej koalície' : 'Kreslá strán'}>{current.ordered.map(m => <li key={m.id}><button type="button" aria-pressed={mode === 'koalicia' ? combination.includes(m.id) : selected === m.id} onClick={() => mode === 'koalicia' ? toggleCoalition(m.id) : choose(selected === m.id ? null : m.id)}><i style={{ background: m.color }} aria-hidden="true"/>{logos[m.id]?.src && <Image className="par3d-party-logo" src={logos[m.id].src} alt="" width={23} height={18} unoptimized loading="lazy"/>}{m.short}<b>{m.seats}</b>{mode === 'koalicia' && combination.includes(m.id) && <Check size={13} aria-hidden="true"/>}</button></li>)}</ul>
          : <ul className="par3d-legend" aria-label="Bloky">{(["coalition", "others", "opposition"] as const).filter(b => summary[b].seats > 0).map(b => <li key={b}><span className="par3d-bloc"><i style={{ background: BLOC_COLOR[b] }} aria-hidden="true"/>{b === "others" ? "Ostatní" : blocLabel(summary, b, partners)}<b>{summary[b].seats}</b></span></li>)}</ul>}
        <p className="par3d-note">Scenár, nie predpoveď. Farba kresla a značka na operadle rozlišujú strany. „Položiť na stôl“ otvorí AR na podporovanom telefóne; Android Scene Viewer používa pôvodný model prieskumov, iOS prenáša aktuálny výber.</p>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>;
}
