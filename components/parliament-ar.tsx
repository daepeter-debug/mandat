"use client";

import { useEffect, useRef, useState, type DetailedHTMLProps, type HTMLAttributes, type Ref } from "react";
import Image from 'next/image';
import { ArrowLeft, Armchair, Check, Maximize2, Minimize2, RotateCcw, ScanLine, X, Play, Pause, Share2, TriangleAlert, UserRound } from "lucide-react";
import { clubLabel, markColors, markNames, marks, skDay, type SeatedMember, type VoteSummary } from "@/lib/votes";
import { chamberSeats } from "@/lib/parliament-model";
import { date } from "@/lib/polls";
import { MAJORITY, type BlocSummary } from "@/lib/blocs";
import { partnerWording } from "@/lib/edition";
import { PARLIAMENT_MODEL, parliamentSeats, parliamentVariants, allParliamentVariants, parliamentTimeline, parliamentEdges, type ParliamentVariant, type VariantId } from "@/lib/parliament-model";
import { CLUBS_AS_OF, UNAFFILIATED, clubSeatParty, clubsVariant } from "@/lib/parliament-clubs";
import { displayName } from "@/lib/deputies";
import { currentSeatUncertainty } from '@/lib/uncertainty';
import { parliamentShareCard } from './parliament-share';
import { ParliamentNavigation, type NavigableViewer } from './parliament-navigation';
import Chamber2D from './chamber-2d';
import { coalitionSelection, partyFocus, seatChanges, seatSweep, SEAT_SWEEP_MS, deputyView } from '@/lib/parliament-experience';
import type { TextureInfo } from '@google/model-viewer/lib/features/scene-graph/api.js';
import { track } from "@/lib/track";
import partyLogos from '@/lib/party-logos.json';
import "@/app/parliament-ar.css";

/*
  3D sála na stránke Parlament (public/models/parlament.glb zo scripts/build-parliament-glb.mjs) so 150 kreslami.
  Načíta sa až po voľbe „3D sála“ na stránke (components/parliament-page.tsx); po načítaní krátky prejazd k celej sále.
  - Obsadenie: „Kluby dnes“ (skutočné kluby k poslednému hlasovaniu, lib/parliament-clubs.ts — nie je v GLB, kreslá sa
    farbia po jednom cez materiály prechod:<i>), „Podľa prieskumov“ a „Voľby 2023“ (varianty glTF).
  - „Strany“: čistá sála, výber strany alebo klubu priblíži jeho kreslá; pri kluboch ťuknutie na kreslo ukáže poslanca.
    „Koalícia“: vlastný výber k väčšine 76. „Bloky“: koalícia, opozícia a ostatní, s voliteľnými partnermi
    (REPUBLIKA ku koalícii, Hnutie Slovensko k opozícii — redakčný predpoklad). „Vývoj 2026“: mesiace modelu.
  - „Hlasovania“: kreslá vo farbe hlasu, vlna prefarbenia; hlasovanie vyberá stránka (zoznam, listovanie, prehrávanie).
  - Vybraný poslanec (zo stránky alebo ťuknutím) má jemne rozsvietené kreslo a kamera k nemu priletí.
  Na telefóne „Položiť na stôl“ otvorí rozšírenú realitu; „Na celú obrazovku“ prekryje stránku. Knižnica <model-viewer>
  (Google, three.js) sa načíta z nášho servera — nič sa neposiela tretím stranám.
*/
type ModelViewerProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & Record<string, unknown>;
declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX { interface IntrinsicElements { "model-viewer": ModelViewerProps } }
}
type Material = { name: string; isLoaded?: boolean; ensureLoaded?: () => Promise<void>; pbrMetallicRoughness: { setBaseColorFactor: (c: string | number[]) => void; baseColorTexture: TextureInfo | null }; emissiveTexture?: TextureInfo | null; setEmissiveFactor: (c: string | number[]) => void; setAlphaMode: (mode: 'BLEND' | 'MASK' | 'OPAQUE') => void };
type Viewer = NavigableViewer & { model?: { materials: Material[] }; loaded?: boolean; currentTime: number; pause: () => void; play: (o?: { repetitions?: number }) => void; dismissPoster: () => void; resetTurntableRotation: (theta?: number) => void; jumpCameraToGoal: () => void; materialFromPoint: (x: number, y: number) => Material | null; toBlob: (o?: { idealAspect?: boolean; mimeType?: string }) => Promise<Blob>;
  positionAndNormalFromPoint: (x: number, y: number) => { position: { x: number; y: number; z: number } } | null };
export type Mode = "strany" | "bloky" | "koalicia" | "vyvoj" | "hlasovania";
type Props = {
  mode: Mode; onMode: (mode: Mode) => void;
  /** Vybrané hlasovanie a rozsadenie poslancov pri ňom (zo stránky); null mimo režimu Hlasovania. */
  vote: VoteSummary | null; voteSeats: SeatedMember[] | null;
  /** Rozsadenie pri poslednom hlasovaní: poslanci v kreslách „Klubov dnes“. */
  latestSeats: SeatedMember[] | null;
  deputy: number | null; onDeputy: (id: number | null) => void; onProfile: () => void;
  highlightDiff: boolean; differing: ReadonlySet<number>;
};
// Keep the existing GLB clip and variants; voting uses a color sweep, not the old columns.
/** Klip „obsadenie“ na čas t: najprv ho aktivovať (inak posun nemá stopy), potom hrať ďalej alebo zastaviť. */
function seekClip(viewer: Viewer, t: number, keepPlaying: boolean) {
  viewer.play({ repetitions: 1 });
  if (!keepPlaying) viewer.pause();
  viewer.currentTime = t;
}
const logos = partyLogos as Record<string, { src: string }>;

const [modelVariant, electionVariant] = parliamentVariants();
const clubs = clubsVariant();
const variants = [clubs, modelVariant, electionVariant];
const allVariants = [...allParliamentVariants(), clubs], timeline = parliamentTimeline(), edges = parliamentEdges();
/** Variant glTF, ktorý sa zobrazí: Kluby dnes nie sú v modeli, kreslá sa farbia v internom variante „prechod“. */
const shownVariant = (id: VariantId) => id === 'kluby' ? 'prechod' : id;
let library: Promise<unknown> | null = null;
// 1 agentúra, 2 – 4 agentúry, 5 a viac agentúr.
const agencyWord = (n: number) => n === 1 ? "agentúra" : n >= 2 && n <= 4 ? "agentúry" : "agentúr";
const loadLibrary = () => library ??= import('@google/model-viewer').then(m => {
  // Retain adaptive rendering, but keep small party logos legible.
  m.ModelViewerElement.minimumRenderScale = .6;
}).catch(e => { library = null; throw e; });
const prefetchModel = () => { void fetch(PARLIAMENT_MODEL, { cache: 'force-cache' }).catch(() => {}); };
const seatsNow = parliamentSeats();
const BLOC_COLOR = { coalition: "#c4553f", opposition: "#3c6db4", others: "#aab2ac" } as const;
const DIM = "#d6d9d2";
const linearColor = (hex: string) => [0, 2, 4].map(i => { const v = parseInt(hex.slice(i + 1, i + 3), 16) / 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; });
const changes = seatChanges(electionVariant, modelVariant);
// A historical coalition is not a current party: don't display its disappearance as a party's loss.
const biggestGain = changes.find(p => p.delta > 0), biggestLoss = changes.find(p => p.delta < 0 && modelVariant.ordered.some(m => m.id === p.id));
/** Kamera tak, aby sa celá sála zmestila na šírku aj na úzkom mobile (zorné pole 32°, polovičná šírka sály ~0,37 m). */
function fit(el: HTMLElement | null) {
  const aspect = el && el.clientHeight ? el.clientWidth / el.clientHeight : 1.3, r = Math.min(2.4, Math.max(0.78, 0.375 / (Math.tan(15 * Math.PI / 180) * aspect)));
  return { r, view: { orbit: `0deg ${aspect < 1 ? 46 : 54}deg ${r.toFixed(2)}m`, target: aspect < 1 ? "0m 0.085m -0.1m" : "0m 0.05m -0.1m" }, intro: { orbit: `0deg 10deg ${(r * 1.35).toFixed(2)}m`, target: "0m 0.02m -0.08m" } };
}
/** Kamera ku kreslu poslanca: blízko, mierne zhora, smerom od pultu. */
function seatCamera(index: number) {
  const s = chamberSeats[index], theta = (Math.PI / 2 - s.angle) * 180 / Math.PI * .55;
  return { orbit: `${theta.toFixed(1)}deg 60deg 0.24m`, target: `${s.x.toFixed(3)}m ${(s.y + .016).toFixed(3)}m ${s.z.toFixed(3)}m` };
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

export default function ParliamentChamber(props: Props) {
  const { vote, voteSeats, latestSeats, deputy, onDeputy, highlightDiff, differing } = props;
  const [ready, setReady] = useState(false), [failed, setFailed] = useState(false);
  const [viewer, setViewer] = useState<Viewer | null>(null), [loaded, setLoaded] = useState(false);
  // Vývoj 2026 začína januárom, ostatné režimy Klubmi dnes.
  const [initialVariant] = useState<VariantId>(() => props.mode === 'vyvoj' ? timeline[0].variant.id : 'kluby');
  const [variantId, setVariantId] = useState<VariantId>(initialVariant), [mode, setMode] = useState<Mode>(props.mode);
  const voteColors = useRef<number[][]>([]), spotRef = useRef<number | null>(null), dimRef = useRef<ReadonlySet<number>>(new Set());
  const [playing, setPlaying] = useState(false), [touch, setTouch] = useState(false);
  const [sharing, setSharing] = useState(false), [shareMessage, setShareMessage] = useState('');
  const [sharePreview, setSharePreview] = useState<string | null>(null);
  const [nativeShareReady, setNativeShareReady] = useState(false);
  const shareFile = useRef<File | null>(null);
  const shareLock = useRef(false);
  const [selected, setSelected] = useState<string | null>(null), [partners, setPartners] = useState(true), [camera, setCamera] = useState(INTRO);
  const [reduced, setReduced] = useState(false), [visible, setVisible] = useState(true);
  const [combination, setCombination] = useState<string[]>([]), [touring, setTouring] = useState(false);
  const [immersive, setImmersive] = useState(false), [expanded, setExpanded] = useState(false);
  const [displayVariant, setDisplayVariant] = useState<VariantId | 'prechod' | 'hlasovanie'>(props.mode === 'hlasovania' ? 'hlasovanie' : shownVariant(initialVariant));
  const [transition, setTransition] = useState<{ from: VariantId; to: VariantId } | null>(null);
  const majorityWasOn = useRef(false), firstClubPaint = useRef(true), flownTo = useRef<number | null>(null);
  const introTimers = useRef<number[]>([]), introActive = useRef(false);
  const manuallyNavigated = useRef(false);
  const previousVariant = useRef<VariantId>(initialVariant);
  const current = allVariants.find(v => v.id === variantId) as ParliamentVariant;
  const monthIndex = Math.max(0, timeline.findIndex(p => p.variant.id === variantId));
  const month = timeline[monthIndex];
  const monthlyChanges = seatChanges(timeline[0].variant, current).slice(0, 2);
  const exclusion = edges.find(p => p.variant.id === variantId);
  const selectedEdge = variantId === 'prieskumy' && edges.find(p => p.party.id === selected);
  const range = selectedEdge ? currentSeatUncertainty().parties[selectedEdge.party.id] : null;
  const summary = partners ? current.withPartners : current.blocs;
  const coalition = coalitionSelection(current, combination);
  const displayedSeats = useSeatCounter(coalition.seats, reduced, visible);
  const selectedParty = current.ordered.find(p => p.id === selected);
  const seated = mode === 'hlasovania' ? voteSeats : null;
  // Poslanec v kresle: pri hlasovaní podľa jeho rozsadenia, v Kluboch dnes podľa posledného hlasovania.
  const spotSeats = mode === 'hlasovania' ? seated : variantId === 'kluby' && (mode === 'strany' || mode === 'koalicia' || mode === 'bloky') ? latestSeats : null;
  const spotlight = deputy !== null && spotSeats ? spotSeats.find(s => s.id === deputy) ?? null : null;
  const spotSeat = spotlight?.seat ?? null;
  const dimSeats = mode === 'hlasovania' && highlightDiff && differing.size && seated ? seated.filter(s => !differing.has(s.id)).map(s => s.seat) : null;
  const dimKey = dimSeats ? dimSeats.join(',') : '';

  useEffect(() => {
    const media = matchMedia('(pointer: coarse)'), update = () => setTouch(media.matches);
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  // Komponent sa pripojí až po voľbe 3D: knižnica, model a panoráma sa sťahujú hneď.
  useEffect(() => {
    let alive = true;
    loadLibrary().then(() => { if (alive) setReady(true); }).catch(() => { if (alive) setFailed(true); });
    prefetchModel();
    void fetch('/models/parlament-evening.hdr', { cache: 'force-cache' }).catch(() => {});
    track("ar", "open");
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)'), update = () => setReduced(media.matches);
    update(); media.addEventListener('change', update); return () => media.removeEventListener('change', update);
  }, []);
  // Na celú obrazovku: stránka pod sálou sa neposúva, Escape vráti sálu do stránky.
  useEffect(() => {
    if (!expanded) return;
    const root = document.documentElement, overflow = root.style.overflow;
    root.style.overflow = 'hidden';
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setExpanded(false); };
    window.addEventListener('keydown', key);
    return () => { root.style.overflow = overflow; window.removeEventListener('keydown', key); };
  }, [expanded]);
  useEffect(() => {
    if (!viewer) return;
    let inView = true;
    const update = () => { const active = inView && !document.hidden; setVisible(active); if (!active) { setPlaying(false); viewer.pause(); if (introActive.current) { introTimers.current.forEach(clearTimeout); introActive.current = false; setTouring(false); setCamera(fit(viewer).view); } } };
    const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; update(); });
    observer.observe(viewer); document.addEventListener('visibilitychange', update); update();
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, [viewer, reduced]);
  useEffect(() => {
    if (!viewer || !loaded) return;
    const observer = new ResizeObserver(() => { if (!manuallyNavigated.current && !selected && !immersive && !introActive.current && spotRef.current === null) setCamera(fit(viewer).view); });
    observer.observe(viewer);
    return () => observer.disconnect();
  }, [viewer, loaded, selected, immersive]);
  useEffect(() => {
    if (!viewer || !loaded || !reduced) return;
    const timer = window.setTimeout(() => viewer.dispatchEvent(new Event('par3d-replay')), 0);
    return () => clearTimeout(timer);
  }, [viewer, loaded, reduced]);
  // Jeden prerušiteľný prejazd: detail pri kreslách, krátky oblúk a celá sála.
  useEffect(() => {
    if (!viewer) return;
    const start = () => {
      manuallyNavigated.current = false;
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
  // One independent material per seat in the internal transition variant. Final variants stay factual.
  useEffect(() => {
    if (!viewer || !loaded || !transition || !viewer.model) return;
    let alive = true, frame = 0, fallback = 0, running = false;
    const materials = new Map(viewer.model.materials.map(m => [m.name, m]));
    const from = allVariants.find(v => v.id === transition.from)!, to = allVariants.find(v => v.id === transition.to)!;
    const logo = (id: string) => materials.get(`logo:${id}`)?.pbrMetallicRoughness.baseColorTexture?.texture ?? null;
    const finish = () => { if (alive) { setDisplayVariant(shownVariant(transition.to)); setTransition(null); } };
    const animate = () => {
      if (!alive || running || viewer.getAttribute('variant-name') !== 'prechod') return;
      running = true;
      const seats = to.seatParty.map((id, i) => ({
        material: materials.get(`prechod:${i}`)!, logo: materials.get(`prechod-logo:${i}`)!,
        start: linearColor(from.ordered.find(p => p.id === from.seatParty[i])!.color), end: linearColor(to.ordered.find(p => p.id === id)!.color),
        texture: logo(id), swapped: false,
      }));
      const started = performance.now();
      const tick = (now: number) => {
        if (!alive) return;
        if (document.hidden) { finish(); return; }
        const elapsed = now - started;
        seats.forEach((seat, i) => {
          const p = seatSweep(i, elapsed);
          seat.material.pbrMetallicRoughness.setBaseColorFactor([...seat.start.map((v, k) => v + (seat.end[k] - v) * p), 1]);
          const glow = Math.sin(p * Math.PI) * .09;
          seat.material.setEmissiveFactor([glow, glow * .9, glow * .7]);
          if (!seat.swapped && p >= .5) { seat.logo.pbrMetallicRoughness.baseColorTexture?.setTexture(seat.texture); seat.swapped = true; }
        });
        if (elapsed < SEAT_SWEEP_MS) frame = requestAnimationFrame(tick); else finish();
      };
      frame = requestAnimationFrame(tick);
    };
    const prepare = async () => {
      if (reduced || !visible) { finish(); return; }
      await Promise.all([...materials.values()].filter(m => /^(prechod:|prechod-logo:|logo:)/.test(m.name)).map(m => m.isLoaded === false ? m.ensureLoaded?.() : undefined));
      if (!alive) return;
      from.seatParty.forEach((id, i) => {
        materials.get(`prechod:${i}`)!.pbrMetallicRoughness.setBaseColorFactor(from.ordered.find(p => p.id === id)!.color);
        materials.get(`prechod:${i}`)!.setEmissiveFactor([0, 0, 0]);
        materials.get(`prechod-logo:${i}`)!.pbrMetallicRoughness.baseColorTexture?.setTexture(logo(id));
      });
      viewer.addEventListener('variant-applied', animate);
      setDisplayVariant('prechod');
      fallback = window.setTimeout(animate, 300);
    };
    void prepare().catch(finish);
    return () => { alive = false; cancelAnimationFrame(frame); clearTimeout(fallback); viewer.removeEventListener('variant-applied', animate); };
  }, [viewer, loaded, transition, reduced, visible]);
  // Rovnaké jemné svetlo pre každú vybranú stranu; logá sú samostatné materiály a nemenia farbu.
  useEffect(() => {
    const materials = viewer?.model?.materials;
    if (!loaded || !materials || variantId === 'kluby') return;
    const colors = new Map(allVariants.flatMap(v => v.ordered).map(m => [m.id, m.color]));
    let alive = true, frame = 0;
    const wave = previousVariant.current !== variantId && !reduced && visible;
    previousVariant.current = variantId;
    const upholstery = materials.filter(m => m.name.startsWith('strana:'));
    const apply = (material: Material, strength = 0) => {
      if (!alive) return;
      const id = material.name.slice(7), own = colors.get(id) ?? DIM;
      const included = mode === 'koalicia' && combination.includes(id);
      const color = mode === "bloky" ? BLOC_COLOR[blocOf(summary, id)] : mode === 'koalicia' ? included ? own : DIM : selected && selected !== id ? DIM : own;
      const edge = variantId === 'prieskumy' && mode === 'strany' && edges.some(p => p.party.id === id);
      const glow = strength + ((mode === 'strany' && selected === id) || included ? .055 : 0);
      const pigment = linearColor(color);
      try { material.pbrMetallicRoughness.setBaseColorFactor(color); material.setEmissiveFactor(pigment.map(v => v * .13 + glow + (edge ? .04 : 0))); } catch { /* lazy variant is still loading */ }
    };
    void Promise.all(upholstery.map(async material => { if (material.isLoaded === false && material.ensureLoaded) await material.ensureLoaded(); apply(material); })).then(() => {
      if (!alive || (!wave && !(variantId === 'prieskumy' && mode === 'strany' && !reduced && visible))) return;
      const started = performance.now();
      const animate = (now: number) => {
        if (!alive || document.hidden) { upholstery.forEach(m => apply(m)); return; }
        const elapsed = now - started;
        for (const material of upholstery) {
          const order = current.ordered.findIndex(p => p.id === material.name.slice(7));
          const t = (elapsed - order * 85) / 260;
          const edge = variantId === 'prieskumy' && mode === 'strany' && edges.some(p => p.party.id === material.name.slice(7));
          apply(material, wave && order >= 0 && t > 0 && t < 1 ? Math.sin(t * Math.PI) * .075 : edge && !reduced ? (1 - Math.cos(elapsed / 8000 * Math.PI * 2)) * .025 : 0);
        }
        if (elapsed < Math.max(current.ordered.length * 85 + 260, variantId === 'prieskumy' && mode === 'strany' ? 8000 : 0)) frame = requestAnimationFrame(animate);
      };
      frame = requestAnimationFrame(animate);
    }).catch(() => {});
    return () => { alive = false; cancelAnimationFrame(frame); };
  }, [viewer, loaded, mode, selected, summary, current, variantId, reduced, visible, combination]);
  // Kluby dnes: kreslá po jednom (materiály prechod:<i>) s rovnakými pravidlami ako strany: výber stlmí ostatné,
  // koalícia ponechá farby vybraných, bloky tri farby. Prvé zobrazenie rozsvieti kreslá vlnou zľava doprava.
  useEffect(() => {
    const model = viewer?.model;
    if (!model || !loaded || variantId !== 'kluby' || mode === 'hlasovania' || mode === 'vyvoj' || transition) return;
    let alive = true, frame = 0;
    const materials = new Map(model.materials.map(m => [m.name, m]));
    const own = new Map(current.ordered.map(m => [m.id, m.color]));
    const colors = clubSeatParty.map(id => {
      const color = own.get(id) ?? DIM, included = mode === 'koalicia' && combination.includes(id);
      return linearColor(mode === 'bloky' ? BLOC_COLOR[blocOf(summary, id)] : mode === 'koalicia' ? included ? color : DIM : selected && selected !== id ? DIM : color);
    });
    const glow = clubSeatParty.map((id, i) => ((mode === 'strany' && selected === id) || (mode === 'koalicia' && combination.includes(id)) ? .055 : 0) + (spotSeat === i ? .16 : 0));
    const neutral = linearColor('#65736b');
    const paint = (i: number, p = 1) => {
      const color = p === 1 ? colors[i] : neutral.map((v, k) => v + (colors[i][k] - v) * p);
      const seat = materials.get(`prechod:${i}`);
      seat?.pbrMetallicRoughness.setBaseColorFactor([...color, 1]);
      seat?.setEmissiveFactor(color.map(v => v * .13 + glow[i] * p));
    };
    void (async () => {
      await Promise.all([...materials.values()].filter(m => /^(prechod:|prechod-logo:|logo:)/.test(m.name)).map(m => m.isLoaded === false ? m.ensureLoaded?.() : undefined));
      if (!alive) return;
      clubSeatParty.forEach((id, i) => materials.get(`prechod-logo:${i}`)?.pbrMetallicRoughness.baseColorTexture?.setTexture(materials.get(`logo:${id}`)?.pbrMetallicRoughness.baseColorTexture?.texture ?? null));
      const sweep = firstClubPaint.current && !reduced && visible && !document.hidden;
      firstClubPaint.current = false;
      if (!sweep) { colors.forEach((_, i) => paint(i)); return; }
      const started = performance.now();
      const tick = (now: number) => {
        if (!alive) return;
        const elapsed = now - started;
        if (document.hidden || elapsed >= SEAT_SWEEP_MS) { colors.forEach((_, i) => paint(i)); return; }
        colors.forEach((_, i) => paint(i, seatSweep(i, elapsed)));
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    })().catch(() => {});
    return () => { alive = false; cancelAnimationFrame(frame); };
  }, [viewer, loaded, variantId, mode, selected, combination, summary, transition, spotSeat, reduced, visible, current]);
  // A single, bounded authored moment at the 76-seat crossing; equal treatment for every combination.
  useEffect(() => {
    if (!viewer?.model || !loaded) return;
    const on = mode === 'koalicia' && coalition.majority, crossed = on && !majorityWasOn.current;
    majorityWasOn.current = on;
    const light = viewer.model.materials.find(m => m.name === 'väčšina:svetlo');
    if (!light) return;
    const byName = new Map(viewer.model.materials.map(m => [m.name, m]));
    const chosen = variantId === 'kluby'
      ? clubSeatParty.flatMap((id, i) => combination.includes(id) && byName.get(`prechod:${i}`) ? [byName.get(`prechod:${i}`)!] : [])
      : viewer.model.materials.filter(m => m.name.startsWith('strana:') && combination.includes(m.name.slice(7)));
    let alive = true, frame = 0;
    const apply = (pulse: number) => {
      light.pbrMetallicRoughness.setBaseColorFactor(on ? '#d7c49b' : '#565347');
      const strength = on ? .18 + pulse * .85 : 0;
      light.setEmissiveFactor([strength, strength * .74, strength * .38]);
      if (on) chosen.forEach(m => { const glow = .055 + pulse * .18; m.setEmissiveFactor([glow, glow * .92, glow * .8]); });
    };
    void Promise.resolve(light.isLoaded === false ? light.ensureLoaded?.() : undefined).then(() => {
      if (!alive) return;
      if (!crossed || reduced || !visible) { apply(0); return; }
      const start = performance.now();
      const tick = (now: number) => {
        if (!alive) return;
        const t = Math.min(1, (now - start) / 1500);
        apply(document.hidden ? 0 : Math.exp(-4 * t) * (1 - t));
        if (t < 1 && !document.hidden) frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }).catch(() => {});
    return () => { alive = false; cancelAnimationFrame(frame); };
  }, [viewer, loaded, mode, coalition.majority, combination, reduced, visible, variantId]);
  // Hlasovania: vybraný poslanec a zvýraznenie hlasov „inak ako klub“ bez novej vlny (farby hlasov ostávajú faktické).
  useEffect(() => {
    spotRef.current = spotSeat;
    dimRef.current = new Set(dimSeats ?? []);
    if (!viewer?.model || !loaded || mode !== 'hlasovania' || !seated) return;
    let alive = true;
    const materials = new Map(viewer.model.materials.map(m => [m.name, m]));
    void (async () => {
      await Promise.all([...materials.values()].filter(m => /^prechod:\d+$/.test(m.name)).map(m => m.isLoaded === false ? m.ensureLoaded?.() : undefined));
      if (!alive) return;
      seated.forEach((member, i) => {
        const pigment = voteColors.current[i] ?? linearColor(markColors[member.mark]), dimmed = dimRef.current.has(i);
        const seat = materials.get(`prechod:${i}`);
        seat?.pbrMetallicRoughness.setBaseColorFactor([...pigment.map(v => dimmed ? v * .22 : v), 1]);
        seat?.setEmissiveFactor(pigment.map(v => (member.mark === '0' || dimmed ? 0 : v * .12) + (spotSeat === i ? .16 : 0)));
      });
    })().catch(() => {});
    return () => { alive = false; };
    // dimKey nesie obsah dimSeats (pole sa vytvára pri každom vykreslení).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewer, loaded, mode, seated, spotSeat, dimKey]);
  // One bounded sweep through the real seats. Vote colors, club logos and final totals stay factual.
  useEffect(() => {
    if (!viewer?.model || !loaded || mode !== 'hlasovania' || !seated) return;
    let alive = true, frame = 0, fallback = 0, running = false;
    const materials = new Map(viewer.model.materials.map(m => [m.name, m]));
    const members = seated;
    const starts = members.map((_, i) => [...(voteColors.current[i] ?? linearColor('#65736b'))]);
    const paint = (i: number, progress: number) => {
      const member = members[i], pigment = linearColor(markColors[member.mark]);
      const color = progress === 1 ? pigment : starts[i].map((v, k) => v + (pigment[k] - v) * progress);
      voteColors.current[i] = color;
      const dimmed = dimRef.current.has(i);
      const seat = materials.get(`prechod:${i}`);
      seat?.pbrMetallicRoughness.setBaseColorFactor([...color.map(v => dimmed ? v * .22 : v), 1]);
      seat?.setEmissiveFactor(color.map(v => (member.mark === '0' || dimmed ? 0 : v * .12) + (spotRef.current === i ? .16 : 0)));
    };
    const finish = () => members.forEach((_, i) => paint(i, 1));
    const animate = () => {
      if (!alive || running || viewer.getAttribute('variant-name') !== 'hlasovanie') return;
      running = true;
      if (reduced || !visible || document.hidden) { finish(); return; }
      const started = performance.now();
      const tick = (now: number) => {
        if (!alive) return;
        if (document.hidden) { finish(); return; }
        const elapsed = now - started;
        members.forEach((_, i) => paint(i, seatSweep(i, elapsed)));
        if (elapsed < SEAT_SWEEP_MS) frame = requestAnimationFrame(tick); else finish();
      };
      frame = requestAnimationFrame(tick);
    };
    void (async () => {
      await Promise.all([...materials.values()].filter(m => /^(prechod:|prechod-logo:|logo:|hlasovanie:)/.test(m.name)).map(m => m.isLoaded === false ? m.ensureLoaded?.() : undefined));
      if (!alive) return;
      // Geometry stays compatible with Claude's GLB, but columns never render or take part in picking.
      const beams = materials.get('hlasovanie:stlpiky');
      beams?.setAlphaMode('BLEND');
      beams?.pbrMetallicRoughness.setBaseColorFactor([0, 0, 0, 0]);
      beams?.setEmissiveFactor([0, 0, 0]);
      seekClip(viewer, 3, false);
      members.forEach((m, i) => {
        paint(i, reduced || !visible ? 1 : 0);
        // Logo klubu (nezaradení bez loga); materiály logo:<strana> sú v modeli pre všetky strany sály.
        materials.get(`prechod-logo:${i}`)?.pbrMetallicRoughness.baseColorTexture?.setTexture(materials.get(`logo:${m.party}`)?.pbrMetallicRoughness.baseColorTexture?.texture ?? null);
      });
      viewer.addEventListener('variant-applied', animate);
      setDisplayVariant('hlasovanie');
      // Handles cached/already active variants without relying on an event firing again.
      fallback = window.setTimeout(animate, 80);
    })().catch(() => {});
    return () => { alive = false; cancelAnimationFrame(frame); clearTimeout(fallback); viewer.removeEventListener('variant-applied', animate); };
  }, [viewer, loaded, mode, seated, reduced, visible]);
  // Kamera priletí ku kreslu vybraného poslanca (raz pri výbere, nie pri každom prefarbení), až po úvodnom prejazde.
  useEffect(() => {
    if (deputy === null) { flownTo.current = null; return; }
    if (!viewer || !loaded || touring || spotSeat === null || flownTo.current === deputy) return;
    flownTo.current = deputy;
    const timer = window.setTimeout(() => { setImmersive(false); setSelected(null); setCamera(seatCamera(spotSeat)); }, 0);
    return () => clearTimeout(timer);
  }, [viewer, loaded, touring, deputy, spotSeat]);
  // Kamera k zvolenej strane (bližšie, so stredom v jej kline); bez výberu späť na celú sálu.
  function choose(id: string | null) {
    if (shareLock.current) return;
    setPlaying(false); stopIntro(); settleTransition(); setImmersive(false);
    setSelected(id);
    const focus = id ? partyFocus(current, id) : null;
    const cam = fit(viewer);
    setCamera(focus ? { orbit: `${focus.theta.toFixed(1)}deg 62deg ${Math.max(.32, Math.min(.60, cam.r * .48)).toFixed(2)}m`, target: focus.target.map(p => `${p.toFixed(3)}m`).join(' ') } : cam.view);
    if (id) track("ar", `party:${id}`);
  }
  function stopIntro() { introTimers.current.forEach(clearTimeout); introActive.current = false; setTouring(false); viewer?.pause(); }
  function resetCamera() {
    if (shareLock.current) return;
    manuallyNavigated.current = false;
    setPlaying(false); stopIntro(); setSelected(null); setImmersive(false);
    if (deputy !== null) { flownTo.current = deputy; onDeputy(null); }
    setCamera(fit(viewer).view);
  }
  function settleTransition() { setTransition(null); setDisplayVariant(mode === 'hlasovania' && seated ? 'hlasovanie' : shownVariant(variantId)); }
  function switchVariant(id: VariantId) {
    if (shareLock.current) return;
    if (id === variantId) return;
    setSharePreview(null); stopIntro(); setImmersive(false); setVariantId(id); setCombination([]); setSelected(null); setCamera(fit(viewer).view);
    if (loaded && visible && !reduced && (mode === 'strany' || mode === 'vyvoj')) setTransition({ from: variantId, to: id });
    else { setTransition(null); setDisplayVariant(shownVariant(id)); }
    track("ar", `variant:${id}`);
  }
  function switchMode(next: Mode) {
    if (shareLock.current) return;
    if (next !== props.mode) props.onMode(next);
    if (next === mode) return;
    setPlaying(false); stopIntro(); setTransition(null); setImmersive(false); setMode(next); setSelected(null); setCamera(fit(viewer).view);
    if (next === 'vyvoj') { setVariantId(timeline[0].variant.id); setDisplayVariant(timeline[0].variant.id); setCombination([]); }
    else if (next !== 'hlasovania') {
      setDisplayVariant(shownVariant(variantId));
      // Z Hlasovaní späť: klip ostane v pokojovom čase ako po úvode.
      if (mode === 'hlasovania' && viewer) seekClip(viewer, 3, false);
    }
    if (next === 'hlasovania') track("ar", "votes");
  }
  function toggleCoalition(id: string) { if (shareLock.current) return; setSharePreview(null); stopIntro(); settleTransition(); setCombination(ids => ids.includes(id) ? ids.filter(p => p !== id) : [...ids, id]); }
  function toggleImmersive() {
    if (shareLock.current) return;
    setPlaying(false); stopIntro(); settleTransition(); setSelected(null); setImmersive(!immersive);
    const view = deputyView();
    setCamera(immersive ? fit(viewer).view : { orbit: view.orbit, target: view.target.map(v => `${v}m`).join(' ') });
  }
  /** Kreslo pod prstom: vlastný materiál kresla, inak najbližšie kreslo k bodu dotyku. */
  function seatAt(x: number, y: number) {
    if (!viewer) return -1;
    const own = viewer.materialFromPoint(x, y)?.name.match(/^prechod(?:-logo)?:(\d+)$/);
    if (own) return Number(own[1]);
    const hit = viewer.positionAndNormalFromPoint(x, y)?.position;
    let seat = -1;
    if (hit) { let best = Infinity; chamberSeats.forEach((s, i) => { const d = (s.x - hit.x) ** 2 + (s.z - hit.z) ** 2; if (d < best && d < .0004) { best = d; seat = i; } }); }
    return seat;
  }
  function pickSeat(x: number, y: number) {
    if (transition) return;
    if (mode === 'hlasovania') {
      if (!seated) return;
      const seat = seatAt(x, y), member = seat >= 0 ? seated[seat] : null;
      onDeputy(member && member.id !== deputy ? member.id : null);
      return;
    }
    if (variantId === 'kluby' && mode !== 'vyvoj') {
      const seat = seatAt(x, y);
      if (seat < 0) return;
      if (mode === 'koalicia') { toggleCoalition(clubSeatParty[seat]); return; }
      const member = latestSeats?.[seat];
      if (member) onDeputy(member.id !== deputy ? member.id : null);
      return;
    }
    const material = viewer?.materialFromPoint(x, y), id = material?.name.replace(/^(strana|logo):/, '');
    if (!id || !current.ordered.some(p => p.id === id)) return;
    if (mode === 'koalicia') toggleCoalition(id); else if (mode === 'strany' || mode === 'vyvoj') choose(selected === id ? null : id);
  }

  async function shareCoalition() {
    if (!viewer || sharing || !coalition.members.length || transition) return;
    setPlaying(false); stopIntro(); settleTransition(); setSelected(null); setImmersive(false);
    setCamera(fit(viewer).view); setSharing(true); shareLock.current = true; setShareMessage('');
    const snapshot = current, ids = [...combination];
    try {
      viewer.jumpCameraToGoal();
      // React applies the overview camera and model-viewer renders before capture.
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => { viewer.jumpCameraToGoal(); resolve(); })));
      const blob = await parliamentShareCard(await viewer.toBlob({ idealAspect: false, mimeType: 'image/png' }), snapshot, ids);
      // Data URL keeps the preview/download self-contained across browser share sheets.
      const preview = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error('Preview unavailable'));
        reader.readAsDataURL(blob);
      });
      setSharePreview(preview);
      const file = new File([blob], 'moja-koalicia-mandat.png', { type: 'image/png' });
      shareFile.current = file; setNativeShareReady(!!navigator.canShare?.({ files: [file] }));
      setShareMessage('Obrázok je pripravený.');
    } catch { setShareMessage('Obrázok sa nepodarilo vytvoriť. Skús zdieľanie znova.'); }
    finally { shareLock.current = false; setSharing(false); }
  }
  async function sharePrepared() {
    const file = shareFile.current;
    if (!file) return;
    try { await navigator.share({ files: [file], title: 'Moja koalícia · Mandát' }); }
    catch (e) { if (!(e instanceof DOMException && e.name === 'AbortError')) setShareMessage('Zdieľanie nebolo dostupné. Obrázok môžeš stiahnuť ako PNG.'); }
  }

  // Režim zmenený na stránke (zoznam hlasovaní, „Späť na kluby“): rovnaké prepnutie ako tlačidlom v sále.
  useEffect(() => {
    if (props.mode === mode) return;
    const timer = window.setTimeout(() => switchMode(props.mode), 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.mode, mode]);
  useEffect(() => {
    if (!playing || !visible || !loaded || reduced || transition) return;
    const timer = window.setTimeout(() => {
      if (monthIndex >= timeline.length - 1) setPlaying(false);
      else switchVariant(timeline[monthIndex + 1].variant.id);
    }, 1600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, visible, loaded, reduced, transition, monthIndex]);

  const caption = (() => {
    if (mode === "bloky") {
      const c = summary.coalition.seats, o = summary.opposition.seats, rest = summary.others.seats;
      const holder = c >= MAJORITY ? blocLabel(summary, "coalition", partners) : o >= MAJORITY ? blocLabel(summary, "opposition", partners) : null;
      return { title: holder ? `Väčšinu ${MAJORITY} kresiel má ${holder.charAt(0).toLocaleLowerCase("sk") + holder.slice(1)}` : `Väčšinu ${MAJORITY} kresiel nemá žiadny blok`, c, o, rest };
    }
    const party = selected && current.ordered.find(m => m.id === selected);
    if (party) {
      const bloc = blocOf(current.blocs, party.id);
      return { title: `${party.short} · ${party.seats} ${plural(party.seats)}`, note: party.id === UNAFFILIATED.id ? "poslanci, ktorí nie sú členmi klubu" : bloc === "coalition" ? "dnešná vládna koalícia" : bloc === "opposition" ? "dnešná opozícia" : "mimo dnešných blokov" };
    }
    return { title: variantId === 'kluby' ? `Kluby NR SR k ${date(CLUBS_AS_OF)}` : variantId === "prieskumy" ? `Scenár podľa Modelu Mandát · aktualizované ${date(seatsNow.updated)}` : variantId === 'volby-2023' ? "Výsledok volieb 30. septembra 2023" : exclusion ? `Čo ak ${exclusion.party.short} nepostúpia?` : `Model Mandát · ${current.label}`,
      note: variantId === 'kluby' ? 'Skutočné zloženie podľa poslaneckých klubov. Ťukni na kreslo a uvidíš poslanca, klub vyberieš v zozname.' : exclusion ? 'Hypotetický scenár pri nezmenenej podpore ostatných strán. Nie predpoveď.' : "Ťukni na kreslo alebo vyber stranu zo zoznamu a pozri si ju zblízka." };
  })();
  const posterColors = seated ? seated.map(s => markColors[s.mark]) : current.seatParty.map(id => current.ordered.find(m => m.id === id)?.color ?? '#7d857f');

  return <section className={`par3d${expanded ? ' is-expanded' : ''}`} aria-label="3D sála" aria-describedby="par3d-desc">
    {expanded && <div className="par3d-head"><div><b className="par3d-title">Parlament v 3D</b><p id="par3d-desc" className="par3d-desc">150 kresiel · {mode === 'hlasovania' ? 'Hlasovania NR SR' : current.label}</p></div>
      <button type="button" className="par3d-close" aria-label="Vrátiť sálu do stránky" onClick={() => setExpanded(false)}><Minimize2 size={20}/></button></div>}
    {!expanded && <p id="par3d-desc" className="sr-only">3D sála, 150 kresiel · {mode === 'hlasovania' ? 'Hlasovania NR SR' : current.label}. Preskúmaj sálu vlastným pohľadom.</p>}
    <fieldset className="par3d-controls" disabled={sharing}>
      {mode !== 'hlasovania' && <div className="par3d-seg par3d-variants" role="group" aria-label="Obsadenie sály">{variants.map(v => <button key={v.id} type="button" aria-pressed={variantId === v.id} onClick={() => { setPlaying(false); if (mode === 'vyvoj') switchMode('strany'); switchVariant(v.id); }}>{v.label}</button>)}</div>}
      <div className="par3d-seg par3d-modes" role="group" aria-label="Režim sály">{(["strany", "koalicia", "bloky", "vyvoj", "hlasovania"] as const).map(m => <button key={m} type="button" aria-pressed={mode === m} onClick={() => switchMode(m)}>{m === "strany" ? (variantId === 'kluby' ? "Kluby" : "Strany") : m === 'koalicia' ? 'Koalícia' : m === 'vyvoj' ? 'Vývoj 2026' : m === 'hlasovania' ? 'Hlasovania' : "Bloky"}</button>)}</div>
      <button type="button" className="par3d-seat-view" aria-label="Z kresla poslanca" aria-pressed={immersive} disabled={!loaded} onClick={toggleImmersive}><Armchair size={16} aria-hidden="true"/><span>Z kresla<span className="par3d-seat-long"> poslanca</span></span></button>
      <button type="button" className="par3d-replay" aria-label="Prehrať úvod znova" onClick={() => { setPlaying(false); setSelected(null); setImmersive(false); settleTransition(); viewer?.dispatchEvent(new Event("par3d-replay")); }}><RotateCcw size={16} aria-hidden="true"/></button>
      <button type="button" className="par3d-expand" aria-pressed={expanded} aria-label={expanded ? 'Vrátiť sálu do stránky' : 'Sála na celú obrazovku'} onClick={() => setExpanded(!expanded)}>{expanded ? <Minimize2 size={16} aria-hidden="true"/> : <Maximize2 size={16} aria-hidden="true"/>}</button>
    </fieldset>
    <div className="par3d-stage" data-detail={!!selected}>
      {ready
        ? <model-viewer ref={setViewer as unknown as Ref<HTMLElement>} src={PARLIAMENT_MODEL} variant-name={displayVariant} animation-name="obsadenie"
            alt={mode === 'hlasovania' && vote ? `3D rokovacia sála, hlasovanie ${vote.nazov}: za ${vote.za}, proti ${vote.proti}, zdržalo sa ${vote.zdrzalo}, nehlasovalo ${vote.nehlasovalo}, neprítomní ${vote.nepritomni}` : `3D rokovacia sála: ${current.ordered.map(m => `${m.short} ${m.seats}`).join(", ")}`}
            ar="" ar-modes="webxr scene-viewer quick-look" ar-scale="auto" ar-placement="floor"
            tabIndex={0} aria-describedby="par3d-navigation-help" interaction-prompt="none" reveal="manual" loading="eager"
            camera-orbit={camera.orbit} camera-target={camera.target} field-of-view={immersive ? '68deg' : '30deg'} interpolation-decay={reduced ? '0' : touring ? '220' : '100'}
            min-camera-orbit="auto 0.57deg 0.015m" max-camera-orbit="auto 179.43deg 20m"
            tone-mapping="aces" shadow-intensity="1.1" shadow-softness="0.7" exposure="1.2" environment-image="/models/parlament-evening.hdr" class="par3d-viewer"
            onError={() => setFailed(true)}>
            <button slot="ar-button" type="button" className="par3d-ar" onClick={() => track("ar", "table")}><ScanLine size={18} aria-hidden="true"/>Položiť na stôl</button>
          </model-viewer>
        : null}
      {!loaded && <div className="par3d-loading" role="status"><Chamber2D colors={posterColors} label="Náhľad sály"/><span>{failed ? '3D sálu sa nepodarilo načítať. Prepni na 2D alebo skús znova.' : 'Načítava sa 3D sála…'}</span></div>}
      {touring && <button type="button" className="par3d-skip" onClick={() => { stopIntro(); setCamera(fit(viewer).view); }}>Preskočiť úvod</button>}
      {transition && <div className="par3d-transition" role="status"><span>{allVariants.find(v => v.id === transition.from)?.label} → {current.label}</span><button type="button" onClick={settleTransition}>Preskočiť</button></div>}
      {immersive && <div className="par3d-detail"><Armchair size={22} aria-hidden="true"/><span><b>Pohľad z kresla</b><small>Ilustračná sála · rozhliadni sa {touch ? 'prstom' : 'myšou'}</small></span><button type="button" onClick={toggleImmersive}><ArrowLeft size={16} aria-hidden="true"/>Celá sála</button></div>}
      {failed && ready && <p className="par3d-loading" role="alert">Model sa nepodarilo načítať. Prepni na 2D alebo obnov stránku.</p>}
    </div>
    <ParliamentNavigation viewer={viewer} enabled={loaded && visible && !sharing} touch={touch} onCamera={setCamera}
      onStart={() => { manuallyNavigated.current = true; setPlaying(false); stopIntro(); }} onPick={pickSeat} onReset={resetCamera}/>
      {spotlight && <div className="par3d-detail par3d-inspection" style={{ ['--party-color' as string]: mode === 'hlasovania' ? markColors[spotlight.mark] : current.ordered.find(m => m.id === spotlight.party)?.color }}>
        {logos[spotlight.party]?.src ? <Image src={logos[spotlight.party].src} alt="" width={40} height={30} unoptimized/> : <i className="par3d-detail-dot" style={{ background: mode === 'hlasovania' ? markColors[spotlight.mark] : UNAFFILIATED.color }} aria-hidden="true"/>}
        <span><b>{displayName(spotlight.name)}</b><small>{clubLabel(spotlight.club)}{mode === 'hlasovania' && <> · <em>{markNames[spotlight.mark]}</em>{differing.has(spotlight.id) && ' · inak ako klub'}</>}</small></span>
        <button type="button" onClick={() => { setExpanded(false); props.onProfile(); }}><UserRound size={15} aria-hidden="true"/>Profil</button>
        <button type="button" className="par3d-detail-close" aria-label="Zrušiť výber poslanca" onClick={() => onDeputy(null)}><X size={16}/></button>
      </div>}
      {mode === 'hlasovania' && deputy !== null && !spotlight && seated && <p className="par3d-note">Vybraný poslanec v tomto hlasovaní nebol poslancom NR SR.</p>}
      {selectedParty && (mode === 'strany' || mode === 'vyvoj') && <div className="par3d-detail par3d-inspection" style={{ ['--party-color' as string]: selectedParty.color }}>
        {logos[selectedParty.id]?.src && <Image src={logos[selectedParty.id].src} alt="" width={40} height={30} unoptimized/>}
        <span><b>{selectedParty.short}</b><small>{selectedParty.seats} {plural(selectedParty.seats)}</small></span>
        <button type="button" onClick={() => choose(null)}><ArrowLeft size={16} aria-hidden="true"/>Celá sála</button>
      </div>}
    <div className="par3d-caption" data-ready={loaded} aria-live="polite">
      {mode === 'hlasovania' && vote && <div className="par3d-vote">
        {expanded && <><p className="par3d-vote-meta">{skDay(vote.datum)} · {vote.preslo ? 'Návrh prešiel' : 'Návrh neprešiel'}</p><b className="par3d-vote-title">{vote.nazov}</b></>}
        <ul className="par3d-marks" aria-label="Hlasy v sále">{marks.map(k => <li key={k}><i style={{ background: markColors[k] }} aria-hidden="true"/>{k === "Z" ? "Za" : k === "P" ? "Proti" : k === "?" ? "Zdržali sa" : k === "N" ? "Nehlasovali" : "Neprítomní"} <b>{k === "Z" ? vote.za : k === "P" ? vote.proti : k === "?" ? vote.zdrzalo : k === "N" ? vote.nehlasovalo : vote.nepritomni}</b></li>)}</ul>
      </div>}
      {mode === 'vyvoj' && <div className="par3d-timeline">
        <div className="par3d-timeline-head"><span><b>{month.variant.label}</b><small>Bod k {date(month.point.date)} · {month.agencies} {agencyWord(month.agencies)}{monthIndex === timeline.length - 1 ? ' · posledný dostupný mesiac' : ''}</small></span><button type="button" disabled={!loaded || reduced || sharing} onClick={() => { if (playing) setPlaying(false); else { choose(null); if (monthIndex === timeline.length - 1) switchVariant(timeline[0].variant.id); setPlaying(true); } }}>{playing ? <Pause size={16} aria-hidden="true"/> : <Play size={16} aria-hidden="true"/>}{playing ? 'Pozastaviť' : 'Prehrať vývoj'}</button></div>
        <input type="range" min="0" max={timeline.length - 1} step="1" value={monthIndex} disabled={sharing} aria-label="Mesiac modelu" aria-valuetext={`${month.variant.label}, bod k ${date(month.point.date)}`} onChange={e => { setPlaying(false); switchVariant(timeline[Number(e.target.value)].variant.id); }}/>
        <div className="par3d-timeline-months">{timeline.map((p, i) => <button key={p.variant.id} type="button" aria-pressed={monthIndex === i} disabled={sharing} onClick={() => { setPlaying(false); switchVariant(p.variant.id); }}>{new Date(`${p.point.date}T12:00:00Z`).toLocaleDateString('sk-SK', { month: 'short', timeZone: 'UTC' })}</button>)}</div>
        {month.limited && <small className="par3d-coverage">Obmedzené pokrytie: iba {month.agencies} {agencyWord(month.agencies)}. Tento bod ber opatrne.</small>}
        {month.missing.length > 0 && <small className="par3d-coverage">Bez väčšinového pokrytia meraní: {month.missing.join(', ')}. Ich podpora do tohto bodu nevstupuje.</small>}
        {reduced && <small>Automatické prehrávanie je vypnuté podľa nastavenia obmedzeného pohybu. Mesiace vyber posuvníkom.</small>}
        <div className="par3d-changes">{current.id === timeline[0].variant.id ? <span>Január je východiskový mesiac, zmeny sa počítajú od neho.</span> : monthlyChanges.length ? <><span>Oproti januáru:</span>{monthlyChanges.map(p => <span key={p.id}><i style={{ background: p.color }}/>{p.short} <b>{p.delta > 0 ? '+' : '−'}{Math.abs(p.delta)}</b></span>)}<span>kresiel</span></> : <span>Oproti januáru bez zmeny v kreslách.</span>}</div>
      </div>}
      {mode === 'koalicia' ? <div className="par3d-coalition" data-majority={coalition.majority}>
        <div className="par3d-coalition-summary"><div><b>Poskladaj vlastnú koalíciu{variantId === 'kluby' ? ' z dnešných klubov' : ''}</b><span>{coalition.members.length ? coalition.majority ? 'Táto kombinácia má parlamentnú väčšinu.' : `Do väčšiny chýba ${coalition.missing} ${plural(coalition.missing)}.` : 'Vyber strany zo zoznamu alebo ťukni na ich kreslá.'}</span></div><strong aria-hidden="true">{displayedSeats}<small>/ 150</small></strong></div>
        <div className="par3d-majority" role="img" aria-label={`${coalition.seats} zo 150 kresiel; ${coalition.majority ? 'väčšina dosiahnutá' : `do väčšiny chýba ${coalition.missing}`}`}><span style={{ transform: `scaleX(${coalition.seats / 150})` }}/><i style={{ left: `${76 / 1.5}%` }}/></div>
        <div className="par3d-majority-label"><span>{coalition.members.length} {coalition.members.length === 1 ? 'strana' : coalition.members.length >= 2 && coalition.members.length <= 4 ? 'strany' : 'strán'}</span><span>{coalition.majority && <Check size={14} aria-hidden="true"/>}Väčšina 76</span><button type="button" disabled={!combination.length || sharing} onClick={() => { setCombination([]); setSharePreview(null); }}>Vymazať výber</button></div>
        <button className="par3d-share" type="button" disabled={!coalition.members.length || !loaded || sharing || !!transition} onClick={shareCoalition}><Share2 size={16} aria-hidden="true"/>{sharing ? 'Pripravujem obrázok…' : 'Zdieľať svoju koalíciu'}</button>
        {shareMessage && <span role="status">{shareMessage}</span>}
        {sharePreview && <div className="par3d-share-preview"><Image unoptimized src={sharePreview} alt="Vytvorená karta koalície, obsahuje záber sály a súčet vybraných strán" width="72" height="90"/><span>Obrázok tvojej kombinácie{nativeShareReady && <button className="par3d-share" type="button" onClick={sharePrepared}><Share2 size={14}/>Zdieľať obrázok</button>}<a href={sharePreview} download="moja-koalicia-mandat.png">Stiahnuť PNG</a></span><button type="button" aria-label="Skryť náhľad obrázka" onClick={() => setSharePreview(null)}><X size={16}/></button></div>}
        <p>Vlastná kombinácia, nie odporúčanie ani predpoveď dohody strán.</p>
      </div> : mode === 'hlasovania' ? null : mode !== 'vyvoj' || selected ? <><b>{caption.title}</b>{"note" in caption && caption.note && <span>{caption.note}</span>}</> : null}
      {selectedEdge && range && <p className="par3d-range"><TriangleAlert size={14} aria-hidden="true"/>Na hrane 5 % · postúpi v {Math.round(range.entry * 100)} % prepočtov · rozpätie {range.low}–{range.high} kresiel (stredných 80 %). Orientačná neistota, nie pravdepodobnosť výsledku volieb.</p>}
      {mode === 'strany' && (variantId === 'prieskumy' || exclusion) && <details className="par3d-uncertainty"><summary><TriangleAlert size={15} aria-hidden="true"/>Na hrane 5 % · čo ak nepostúpia?{exclusion && ` · bez ${exclusion.party.short}`}</summary><p>Jemne rozjasnené kreslá označujú strany, ktorých pásmo pretína hranicu 5 %. Rovnaký efekt pre každú stranu. Prepočty neistoty nie sú predpoveď.</p><div className="par3d-edge-buttons">{edges.map(p => <button key={p.party.id} type="button" disabled={sharing} aria-pressed={variantId === p.variant.id} onClick={() => switchVariant(variantId === p.variant.id ? 'prieskumy' : p.variant.id)}>Bez {p.party.short}</button>)}{exclusion && <button type="button" onClick={() => switchVariant('prieskumy')}>Späť na Model Mandát</button>}</div></details>}
      {mode === "bloky" && "c" in caption && <>
        <div className="par3d-bar" role="img" aria-label={`Koalícia ${caption.c}, ostatní ${caption.rest}, opozícia ${caption.o} zo 150; väčšina ${MAJORITY}`}>
          <i style={{ width: `${caption.c! / 1.5}%`, background: BLOC_COLOR.coalition }}/><i style={{ width: `${caption.rest! / 1.5}%`, background: BLOC_COLOR.others }}/><i style={{ width: `${caption.o! / 1.5}%`, background: BLOC_COLOR.opposition }}/>
          <em style={{ left: `${MAJORITY / 1.5}%` }} aria-hidden="true"/>
        </div>
        <label className="par3d-partners"><input type="checkbox" checked={partners} onChange={e => setPartners(e.target.checked)}/><span>Republika ku koalícii, Hnutie Slovensko (OĽANO) k opozícii <small>· redakčný predpoklad</small></span></label>
        {variantId === 'kluby' && <span className="par3d-note">Podľa klubov. Nezaradení poslanci nepatria do žiadneho bloku, hoci môžu hlasovať s koalíciou aj s opozíciou.</span>}
      </>}
      {mode === 'strany' && !selected && (variantId === 'prieskumy' || variantId === 'volby-2023') && <div className="par3d-changes"><span>2023 → Model Mandát</span>{[biggestGain, biggestLoss].filter(p => !!p).map(p => <span key={p.id}><i style={{ background: p.color }} aria-hidden="true"/>{p.short} <b>{p.delta > 0 ? '+' : '−'}{Math.abs(p.delta)}</b></span>)}<span>kresiel</span></div>}
    </div>
    {mode === 'hlasovania' ? null : mode !== "bloky"
      ? <ul className="par3d-legend" aria-label={mode === 'koalicia' ? 'Strany do vlastnej koalície' : variantId === 'kluby' ? 'Kluby v sále' : 'Kreslá strán'}>{current.ordered.map(m => <li key={m.id}><button type="button" disabled={sharing} data-edge={variantId === 'prieskumy' && edges.some(p => p.party.id === m.id)} aria-pressed={mode === 'koalicia' ? combination.includes(m.id) : selected === m.id} onClick={() => mode === 'koalicia' ? toggleCoalition(m.id) : choose(selected === m.id ? null : m.id)}><i style={{ background: m.color }} aria-hidden="true"/>{logos[m.id]?.src && <Image className="par3d-party-logo" src={logos[m.id].src} alt="" width={23} height={18} unoptimized loading="lazy"/>}{m.short}<b>{m.seats}</b>{variantId === 'prieskumy' && edges.some(p => p.party.id === m.id) && <TriangleAlert size={12} aria-label="Na hrane 5 %"/>}{mode === 'koalicia' && combination.includes(m.id) && <Check size={13} aria-hidden="true"/>}</button></li>)}</ul>
      : <ul className="par3d-legend" aria-label="Bloky">{(["coalition", "others", "opposition"] as const).filter(b => summary[b].seats > 0).map(b => <li key={b}><span className="par3d-bloc"><i style={{ background: BLOC_COLOR[b] }} aria-hidden="true"/>{b === "others" ? "Ostatní" : blocLabel(summary, b, partners)}<b>{summary[b].seats}</b></span></li>)}</ul>}
    <p className="par3d-note">{mode === 'hlasovania' ? 'Poslanci sedia podľa klubov v čase hlasovania, nie podľa skutočného zasadacieho poriadku. Vlna farieb odhaľuje výsledok, neukazuje poradie hlasovania.' : variantId === 'kluby' ? `Kluby podľa posledného hlasovania NR SR (${date(CLUBS_AS_OF)}); poradie kresiel je ilustrácia, nie zasadací poriadok.` : 'Scenár, nie predpoveď. Farba kresla a značka na operadle rozlišujú strany.'} „Položiť na stôl“ otvorí AR na podporovanom telefóne; Android Scene Viewer používa pôvodný model prieskumov, iOS prenáša aktuálny výber.</p>
  </section>;
}
