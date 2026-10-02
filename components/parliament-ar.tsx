"use client";

import { useEffect, useRef, useState, type DetailedHTMLProps, type HTMLAttributes, type Ref } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import Image from 'next/image';
import { Box, RotateCcw, ScanLine, X } from "lucide-react";
import { date } from "@/lib/polls";
import { MAJORITY, type BlocSummary } from "@/lib/blocs";
import { partnerWording } from "@/lib/edition";
import { PARLIAMENT_MODEL, parliamentSeats, parliamentVariants, tierTop, type ParliamentVariant, type VariantId } from "@/lib/parliament-model";
import { track } from "@/lib/track";
import partyLogos from '@/lib/party-logos.json';
import "@/app/parliament-ar.css";

/*
  „Parlament v 3D a na stole“: rokovacia sála (public/models/parlament.glb zo scripts/build-parliament-glb.mjs)
  s 150 kreslami vo farbách strán. Po otvorení kamera priletí zhora a kreslá sa zaplnia zľava doprava.
  - Prepínač „Podľa prieskumov | Voľby 2023“ prefarbí kreslá v tej istej sále (varianty glTF).
  - „Strany“: čísla nad klinmi strán; ťuknutie na stranu ju zvýrazní, ostatné stíchnu a kamera sa k nej priblíži.
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
type Viewer = HTMLElement & { model?: { materials: Material[] }; loaded?: boolean; currentTime: number; pause: () => void; play: (o?: { repetitions?: number }) => void; dismissPoster: () => void; resetTurntableRotation: (theta?: number) => void };
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

export default function ParliamentAR() {
  const [open, setOpen] = useState(false), [ready, setReady] = useState(false), [failed, setFailed] = useState(false);
  const [viewer, setViewer] = useState<Viewer | null>(null), [loaded, setLoaded] = useState(false), [labels, setLabels] = useState(false);
  const [variantId, setVariantId] = useState<VariantId>("prieskumy"), [mode, setMode] = useState<"strany" | "bloky">("strany");
  const [selected, setSelected] = useState<string | null>(null), [partners, setPartners] = useState(true), [camera, setCamera] = useState(INTRO);
  const [reduced, setReduced] = useState(false), [visible, setVisible] = useState(true);
  const previousVariant = useRef<VariantId>('prieskumy');
  const current = variants.find(v => v.id === variantId) as ParliamentVariant;
  const summary = partners ? current.withPartners : current.blocs;

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)'), update = () => setReduced(media.matches);
    update(); media.addEventListener('change', update); return () => media.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (!viewer) return;
    let inView = true;
    const update = () => { const active = inView && !document.hidden; setVisible(active); if (!active) viewer.pause(); else if (!reduced && viewer.currentTime < 3) viewer.play({ repetitions: 1 }); };
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; update(); });
    observer.observe(viewer); document.addEventListener('visibilitychange', update); update();
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, [viewer, reduced]);
  useEffect(() => {
    if (!viewer || !loaded) return;
    const observer = new ResizeObserver(() => { if (!selected) setCamera(fit(viewer).view); });
    observer.observe(viewer);
    if (reduced) {
      // currentTime is an imperative custom-element API, not mutable React application state.
      // eslint-disable-next-line react-hooks/immutability
      viewer.currentTime = 3; viewer.pause();
    }
    return () => observer.disconnect();
  }, [viewer, loaded, selected, reduced]);
  // Anotácie rozostúpime v obrazových súradniciach; nemeníme metre modelu ani príslušnosť kresiel.
  // Po otočení/priblížení sa meranie zopakuje až po ustálení kamery, bez stálej animačnej slučky.
  useEffect(() => {
    if (!viewer || !labels || mode !== 'strany' || !visible) return;
    let timer = 0;
    const notBefore = performance.now() + (reduced ? 0 : 450);
    const arrange = () => {
      if (document.hidden) return;
      const stage = viewer.getBoundingClientRect(), controls = viewer.parentElement?.querySelector('.par3d-controls')?.getBoundingClientRect();
      const minY = (controls?.bottom ?? stage.top) + 8, maxY = stage.bottom - 12;
      const placed: { left: number; right: number; top: number; bottom: number }[] = [];
      for (const tag of viewer.querySelectorAll<HTMLElement>('.par3d-tag')) {
        const rect = tag.getBoundingClientRect(), previous = Number.parseFloat(tag.style.getPropertyValue('--tag-offset')) || 0;
        const baseTop = rect.top - previous, baseBottom = rect.bottom - previous;
        const candidates = [0, -38, 38, -76, 76, -114, 114];
        const offset = candidates.find(shift => baseTop + shift >= minY && baseBottom + shift <= maxY && placed.every(other => rect.right + 5 <= other.left || rect.left >= other.right + 5 || baseBottom + shift + 5 <= other.top || baseTop + shift >= other.bottom + 5)) ?? 0;
        tag.style.setProperty('--tag-offset', `${offset}px`);
        placed.push({ left: rect.left, right: rect.right, top: baseTop + offset, bottom: baseBottom + offset });
      }
    };
    const schedule = () => { clearTimeout(timer); timer = window.setTimeout(arrange, Math.max(140, notBefore - performance.now())); };
    const observer = new ResizeObserver(schedule); observer.observe(viewer);
    viewer.addEventListener('camera-change', schedule);
    timer = window.setTimeout(arrange, reduced ? 0 : 450);
    return () => { clearTimeout(timer); observer.disconnect(); viewer.removeEventListener('camera-change', schedule); };
  }, [viewer, labels, mode, selected, variantId, visible, reduced]);

  useEffect(() => {
    if (!open || ready) return;
    let alive = true;
    import("@google/model-viewer").then(() => { if (alive) setReady(true); }).catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [open, ready]);
  // Úvod: kamera zhora do pohľadu na sálu, kreslá sa zaplnia, potom sa ukážu čísla nad stranami.
  useEffect(() => {
    if (!viewer) return;
    let timers: number[] = [];
    const start = () => {
      timers.forEach(clearTimeout);
      const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const cam = fit(viewer);
      viewer.resetTurntableRotation(0);
      setLoaded(true); setLabels(reduce); setCamera(reduce ? cam.view : cam.intro);
      viewer.currentTime = reduce ? 3 : 0;
      if (reduce) viewer.pause(); else viewer.play({ repetitions: 1 });
      // Časovač, nie requestAnimationFrame: beží aj vtedy, keď je karta práve na pozadí.
      timers = [window.setTimeout(() => { viewer.dismissPoster(); setCamera(cam.view); }, 60), window.setTimeout(() => setLabels(true), reduce ? 0 : 2300)];
    };
    const onLoad = () => start();
    viewer.addEventListener("load", onLoad);
    viewer.addEventListener("par3d-replay", onLoad);
    const raf = viewer.loaded ? requestAnimationFrame(start) : 0;   // model už bol načítaný skôr (napr. z vyrovnávacej pamäte)
    return () => { viewer.removeEventListener("load", onLoad); viewer.removeEventListener("par3d-replay", onLoad); cancelAnimationFrame(raf); timers.forEach(clearTimeout); };
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
      const color = mode === "bloky" ? BLOC_COLOR[blocOf(summary, id)] : selected && selected !== id ? DIM : own;
      const glow = strength + (mode === 'strany' && selected === id ? .045 : 0);
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
  }, [viewer, loaded, mode, selected, summary, current, variantId, reduced, visible]);
  // Kamera k zvolenej strane (bližšie, so stredom v jej kline); bez výberu späť na celú sálu.
  function choose(id: string | null) {
    setSelected(id);
    const label = id && current.labels.find(l => l.id === id);
    const cam = fit(viewer);
    setCamera(label ? { orbit: `0deg 48deg ${(cam.r * 0.7).toFixed(2)}m`, target: `${(label.position[0] * 0.8).toFixed(3)}m ${tierTop(3).toFixed(3)}m ${(label.position[2] * 0.8).toFixed(3)}m` } : cam.view);
    if (id) track("ar", `party:${id}`);
  }
  function switchVariant(id: VariantId) { setVariantId(id); setSelected(null); setCamera(fit(viewer).view); track("ar", `variant:${id}`); }
  function switchMode(next: "strany" | "bloky") { setMode(next); setSelected(null); setCamera(fit(viewer).view); }

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
    return { title: variantId === "prieskumy" ? `Scenár podľa Modelu Mandát · aktualizované ${date(seatsNow.updated)}` : "Výsledok volieb 30. septembra 2023", note: "Ťukni na číslo nad kreslami alebo na stranu v zozname." };
  })();

  return <DialogPrimitive.Root open={open} onOpenChange={next => { setOpen(next); if (next) track("ar", "open"); else { setViewer(null); setLoaded(false); setLabels(false); setSelected(null); setCamera(INTRO); } }}>
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
        <div className="par3d-stage">
          {ready
            ? <model-viewer ref={setViewer as unknown as Ref<HTMLElement>} src={PARLIAMENT_MODEL} variant-name={variantId}
                alt={`3D rokovacia sála: ${current.ordered.map(m => `${m.short} ${m.seats}`).join(", ")}`}
                ar="" ar-modes="webxr scene-viewer quick-look" ar-scale="auto" ar-placement="floor"
                camera-controls="" touch-action="none" interaction-prompt="none" reveal="manual" loading="eager"
                camera-orbit={camera.orbit} camera-target={camera.target} field-of-view="30deg" interpolation-decay={reduced ? '0' : '140'}
                min-camera-orbit="auto 10deg 0.35m" max-camera-orbit="auto 86deg 3.2m"
                tone-mapping="aces" shadow-intensity="0.8" shadow-softness="0.85" exposure="1.3" environment-image="/models/parlament-evening.hdr" class="par3d-viewer"
                onError={() => setFailed(true)}>
                {labels && mode === "strany" && current.labels.filter(l => !selected || l.id === selected).map(l => <button key={`${variantId}-${l.id}`} type="button" slot={`hotspot-${variantId}-${l.id}`} data-party={l.id}
                  data-position={`${l.position[0]}m ${l.position[1]}m ${l.position[2]}m`} data-normal="0m 1m 0m" className="par3d-tag" style={{ ["--c" as string]: l.color }}
                  aria-pressed={selected === l.id} aria-label={`${l.short}: ${l.seats} ${plural(l.seats)}`} onClick={() => choose(selected === l.id ? null : l.id)}><i aria-hidden="true"/><b>{l.seats}</b>{selected === l.id && <span>{l.short}</span>}</button>)}
                <button slot="ar-button" type="button" className="par3d-ar" onClick={() => track("ar", "table")}><ScanLine size={18} aria-hidden="true"/>Položiť na stôl</button>
              </model-viewer>
            : <p className="par3d-loading" role="status">{failed ? "3D model sa nepodarilo načítať. Skúste to znova neskôr." : "Staviame rokovaciu sálu…"}</p>}
          <div className="par3d-controls">
            <div className="par3d-seg" role="group" aria-label="Obsadenie sály">{variants.map(v => <button key={v.id} type="button" aria-pressed={variantId === v.id} onClick={() => switchVariant(v.id)}>{v.label}</button>)}</div>
            <div className="par3d-seg" role="group" aria-label="Zafarbenie">{(["strany", "bloky"] as const).map(m => <button key={m} type="button" aria-pressed={mode === m} onClick={() => switchMode(m)}>{m === "strany" ? "Strany" : "Bloky"}</button>)}</div>
            <button type="button" className="par3d-replay" aria-label="Prehrať úvod znova" onClick={() => { setSelected(null); viewer?.dispatchEvent(new Event("par3d-replay")); }}><RotateCcw size={16} aria-hidden="true"/></button>
          </div>
          {failed && ready && <p className="par3d-loading" role="alert">Model sa nepodarilo načítať. Zavri okno a skús ho otvoriť znova.</p>}
        </div>
        <div className="par3d-caption" data-ready={loaded} aria-live="polite">
          <b>{caption.title}</b>
          {"note" in caption && caption.note && <span>{caption.note}</span>}
          {mode === "bloky" && "c" in caption && <>
            <div className="par3d-bar" role="img" aria-label={`Koalícia ${caption.c}, ostatní ${caption.rest}, opozícia ${caption.o} zo 150; väčšina ${MAJORITY}`}>
              <i style={{ width: `${caption.c! / 1.5}%`, background: BLOC_COLOR.coalition }}/><i style={{ width: `${caption.rest! / 1.5}%`, background: BLOC_COLOR.others }}/><i style={{ width: `${caption.o! / 1.5}%`, background: BLOC_COLOR.opposition }}/>
              <em style={{ left: `${MAJORITY / 1.5}%` }} aria-hidden="true"/>
            </div>
            <label className="par3d-partners"><input type="checkbox" checked={partners} onChange={e => setPartners(e.target.checked)}/><span>Republika ku koalícii, Hnutie Slovensko (OĽANO) k opozícii <small>· redakčný predpoklad</small></span></label>
          </>}
        </div>
        {mode === "strany"
          ? <ul className="par3d-legend" aria-label="Kreslá strán">{current.ordered.map(m => <li key={m.id}><button type="button" aria-pressed={selected === m.id} onClick={() => choose(selected === m.id ? null : m.id)}><i style={{ background: m.color }} aria-hidden="true"/>{logos[m.id]?.src && <Image className="par3d-party-logo" src={logos[m.id].src} alt="" width={23} height={18} unoptimized loading="lazy"/>}{m.short}<b>{m.seats}</b></button></li>)}</ul>
          : <ul className="par3d-legend" aria-label="Bloky">{(["coalition", "others", "opposition"] as const).filter(b => summary[b].seats > 0).map(b => <li key={b}><span className="par3d-bloc"><i style={{ background: BLOC_COLOR[b] }} aria-hidden="true"/>{b === "others" ? "Ostatní" : blocLabel(summary, b, partners)}<b>{summary[b].seats}</b></span></li>)}</ul>}
        <p className="par3d-note">Scenár, nie predpoveď. Farba kresla a značka na operadle rozlišujú strany. „Položiť na stôl“ otvorí AR na podporovanom telefóne; Android Scene Viewer používa pôvodný model prieskumov, iOS prenáša aktuálny výber.</p>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>;
}
