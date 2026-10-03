"use client";

import { useEffect, useRef, useState, type DetailedHTMLProps, type HTMLAttributes, type Ref } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import Image from 'next/image';
import { ArrowLeft, Armchair, Box, Check, ExternalLink, RotateCcw, ScanLine, Search, X, Play, Pause, Share2, TriangleAlert } from "lucide-react";
import { VOTES_INDEX, clubLabel, clubTotals, kindNames, markColors, markNames, marks, matchesQuery, required, seatMembers, skDay, voteFile, voteSource, type SeatedMember, type VoteDetail, type VoteIndex, type VoteKind } from "@/lib/votes";
import { chamberSeats } from "@/lib/parliament-model";
import { date } from "@/lib/polls";
import { MAJORITY, type BlocSummary } from "@/lib/blocs";
import { partnerWording } from "@/lib/edition";
import { PARLIAMENT_MODEL, parliamentSeats, parliamentVariants, allParliamentVariants, parliamentTimeline, parliamentEdges, type ParliamentVariant, type VariantId } from "@/lib/parliament-model";
import { currentSeatUncertainty } from '@/lib/uncertainty';
import { hemicycleSeats } from '@/lib/parliament';
import { parliamentShareCard } from './parliament-share';
import { ParliamentNavigation, type NavigableViewer } from './parliament-navigation';
import { coalitionSelection, partyFocus, seatChanges, seatSweep, SEAT_SWEEP_MS, deputyView } from '@/lib/parliament-experience';
import type { TextureInfo } from '@google/model-viewer/lib/features/scene-graph/api.js';
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
type Material = { name: string; isLoaded?: boolean; ensureLoaded?: () => Promise<void>; pbrMetallicRoughness: { setBaseColorFactor: (c: string | number[]) => void; baseColorTexture: TextureInfo | null }; emissiveTexture?: TextureInfo | null; setEmissiveFactor: (c: string | number[]) => void; setAlphaMode: (mode: 'BLEND' | 'MASK' | 'OPAQUE') => void };
type Viewer = NavigableViewer & { model?: { materials: Material[] }; loaded?: boolean; currentTime: number; pause: () => void; play: (o?: { repetitions?: number }) => void; dismissPoster: () => void; resetTurntableRotation: (theta?: number) => void; jumpCameraToGoal: () => void; materialFromPoint: (x: number, y: number) => Material | null; toBlob: (o?: { idealAspect?: boolean; mimeType?: string }) => Promise<Blob>;
  createTexture: (uri: string) => Promise<Parameters<TextureInfo["setTexture"]>[0]>; positionAndNormalFromPoint: (x: number, y: number) => { position: { x: number; y: number; z: number } } | null };
type Mode = "strany" | "bloky" | "koalicia" | "vyvoj" | "hlasovania";
// Hlasovania NR SR (lib/votes.ts): zoznam a detaily sa načítajú až v režime Hlasovania, potom ostanú v pamäti.
let voteIndex: Promise<VoteIndex> | null = null;
const loadVoteIndex = () => voteIndex ??= fetch(VOTES_INDEX).then(r => r.ok ? r.json() as Promise<VoteIndex> : Promise.reject(new Error(`${r.status}`))).catch(e => { voteIndex = null; throw e; });
const voteDetails = new Map<number, Promise<VoteDetail>>();
const loadVote = (id: number) => { if (!voteDetails.has(id)) voteDetails.set(id, fetch(voteFile(id)).then(r => r.ok ? r.json() as Promise<VoteDetail> : Promise.reject(new Error(`${r.status}`))).catch(e => { voteDetails.delete(id); throw e; })); return voteDetails.get(id)!; };
const VOTE_KINDS: (VoteKind | "vsetky")[] = ["vsetky", "ustavny", "nedovera", "rozpocet", "veto", "zakon"];
const VOTE_PAGE = 20;
// Keep the existing GLB clip and variants; voting uses a color sweep, not the old columns.
/** Klip „obsadenie“ na čas t: najprv ho aktivovať (inak posun nemá stopy), potom hrať ďalej alebo zastaviť. */
function seekClip(viewer: Viewer, t: number, keepPlaying: boolean) {
  viewer.play({ repetitions: 1 });
  if (!keepPlaying) viewer.pause();
  viewer.currentTime = t;
}
const logos = partyLogos as Record<string, { src: string }>;

const variants = parliamentVariants();
const allVariants = allParliamentVariants(), timeline = parliamentTimeline(), edges = parliamentEdges();
const posterPoints = hemicycleSeats(150, 6);
let library: Promise<unknown> | null = null;
// 1 agentúra, 2 – 4 agentúry, 5 a viac agentúr.
const agencyWord = (n: number) => n === 1 ? "agentúra" : n >= 2 && n <= 4 ? "agentúry" : "agentúr";
const loadLibrary = () => library ??= import('@google/model-viewer').then(m => {
  // Retain adaptive rendering, but keep small party logos legible.
  m.ModelViewerElement.minimumRenderScale = .6;
}).catch(e => { library = null; throw e; });
// Model (1,4 MB) sa sťahuje až pri zámere otvoriť (prejdenie myšou nad tlačidlom alebo otvorenie), nie každému návštevníkovi úvodu.
const prefetchModel = () => { void fetch(PARLIAMENT_MODEL, { cache: 'force-cache' }).catch(() => {}); };
const seatsNow = parliamentSeats();
const BLOC_COLOR = { coalition: "#c4553f", opposition: "#3c6db4", others: "#aab2ac" } as const;
const DIM = "#d6d9d2";
const linearColor = (hex: string) => [0, 2, 4].map(i => { const v = parseInt(hex.slice(i + 1, i + 3), 16) / 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; });
const changes = seatChanges(variants[1], variants[0]);
// A historical coalition is not a current party: don't display its disappearance as a party's loss.
const biggestGain = changes.find(p => p.delta > 0), biggestLoss = changes.find(p => p.delta < 0 && variants[0].ordered.some(m => m.id === p.id));
/** Kamera tak, aby sa celá sála zmestila na šírku aj na úzkom mobile (zorné pole 32°, polovičná šírka sály ~0,37 m). */
function fit(el: HTMLElement | null) {
  const aspect = el && el.clientHeight ? el.clientWidth / el.clientHeight : 1.3, r = Math.min(2.4, Math.max(0.78, 0.375 / (Math.tan(15 * Math.PI / 180) * aspect)));
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
  const [variantId, setVariantId] = useState<VariantId>("prieskumy"), [mode, setMode] = useState<Mode>("strany");
  const [votes, setVotes] = useState<VoteIndex | null>(null), [voteError, setVoteError] = useState(false);
  const [voteId, setVoteId] = useState<number | null>(null), [voteDetail, setVoteDetail] = useState<VoteDetail | null>(null);
  const [voteQuery, setVoteQuery] = useState(""), [voteKind, setVoteKind] = useState<VoteKind | "vsetky">("vsetky"), [voteLimit, setVoteLimit] = useState(VOTE_PAGE);
  const [voteSeat, setVoteSeat] = useState<SeatedMember | null>(null);
  const selectedVoteSeat = useRef<number | null>(null), voteColors = useRef<number[][]>([]);
  const [playing, setPlaying] = useState(false), [touch, setTouch] = useState(false);
  const [sharing, setSharing] = useState(false), [shareMessage, setShareMessage] = useState('');
  const [sharePreview, setSharePreview] = useState<string | null>(null);
  const [nativeShareReady, setNativeShareReady] = useState(false);
  const shareFile = useRef<File | null>(null);
  const trigger = useRef<HTMLButtonElement>(null), shareLock = useRef(false);
  const [selected, setSelected] = useState<string | null>(null), [partners, setPartners] = useState(true), [camera, setCamera] = useState(INTRO);
  const [reduced, setReduced] = useState(false), [visible, setVisible] = useState(true);
  const [combination, setCombination] = useState<string[]>([]), [touring, setTouring] = useState(false);
  const [immersive, setImmersive] = useState(false);
  const [displayVariant, setDisplayVariant] = useState<VariantId | 'prechod' | 'hlasovanie'>('prieskumy');
  const [transition, setTransition] = useState<{ from: VariantId; to: VariantId } | null>(null);
  const majorityWasOn = useRef(false);
  const introTimers = useRef<number[]>([]), introActive = useRef(false);
  const manuallyNavigated = useRef(false);
  const previousVariant = useRef<VariantId>('prieskumy');
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
  const vote = votes?.hlasovania.find(v => v.id === voteId) ?? null;
  const seated = mode === 'hlasovania' && voteDetail && voteDetail.id === voteId ? seatMembers(voteDetail) : null;
  const voteList = votes ? votes.hlasovania.filter(v => (voteKind === 'vsetky' || v.druh === voteKind) && matchesQuery(v, voteQuery)) : [];

  useEffect(() => {
    const media = matchMedia('(pointer: coarse)'), update = () => setTouch(media.matches);
    update(); media.addEventListener('change', update);
    const el = trigger.current;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
      if (connection?.saveData) return;
      void loadLibrary().catch(() => {});
      void fetch('/models/parlament-evening.hdr', { cache: 'force-cache' }).catch(() => {});
    }, { rootMargin: '120px' });
    if (el) observer.observe(el);
    return () => { observer.disconnect(); media.removeEventListener('change', update); };
  }, []);

  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)'), update = () => setReduced(media.matches);
    update(); media.addEventListener('change', update); return () => media.removeEventListener('change', update);
  }, []);
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
    const observer = new ResizeObserver(() => { if (!manuallyNavigated.current && !selected && !immersive && !introActive.current) setCamera(fit(viewer).view); });
    observer.observe(viewer);
    return () => observer.disconnect();
  }, [viewer, loaded, selected, immersive]);
  useEffect(() => {
    if (!viewer || !loaded || !reduced) return;
    const timer = window.setTimeout(() => viewer.dispatchEvent(new Event('par3d-replay')), 0);
    return () => clearTimeout(timer);
  }, [viewer, loaded, reduced]);
  useEffect(() => {
    if (!open || ready) return;
    let alive = true;
    loadLibrary().then(() => { if (alive) setReady(true); }).catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [open, ready]);
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
    const finish = () => { if (alive) { setDisplayVariant(transition.to); setTransition(null); } };
    const animate = () => {
      if (!alive || running || viewer.getAttribute('variant-name') !== 'prechod') return;
      running = true;
      const seats = to.seatParty.map((id, i) => ({
        material: materials.get(`prechod:${i}`)!, logo: materials.get(`prechod-logo:${i}`)!,
        start: linearColor(from.ordered.find(p => p.id === from.seatParty[i])!.color), end: linearColor(to.ordered.find(p => p.id === id)!.color),
        texture: materials.get(`logo:${id}`)!.pbrMetallicRoughness.baseColorTexture!.texture, swapped: false,
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
          if (!seat.swapped && p >= .5) { seat.logo.pbrMetallicRoughness.baseColorTexture!.setTexture(seat.texture); seat.swapped = true; }
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
        materials.get(`prechod-logo:${i}`)!.pbrMetallicRoughness.baseColorTexture!.setTexture(materials.get(`logo:${id}`)!.pbrMetallicRoughness.baseColorTexture!.texture);
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
    if (!loaded || !materials) return;
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
  // A single, bounded authored moment at the 76-seat crossing; equal treatment for every combination.
  useEffect(() => {
    if (!viewer?.model || !loaded) return;
    const on = mode === 'koalicia' && coalition.majority, crossed = on && !majorityWasOn.current;
    majorityWasOn.current = on;
    const light = viewer.model.materials.find(m => m.name === 'väčšina:svetlo');
    if (!light) return;
    const chosen = viewer.model.materials.filter(m => m.name.startsWith('strana:') && combination.includes(m.name.slice(7)));
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
  }, [viewer, loaded, mode, coalition.majority, combination, reduced, visible]);
  // Hlasovania: zoznam pri prvom otvorení režimu (predvolené je najnovšie hlasovanie), potom detail vybraného.
  useEffect(() => {
    if (mode !== 'hlasovania' || votes) return;
    let alive = true;
    loadVoteIndex().then(index => { if (alive) { setVotes(index); setVoteError(false); setVoteId(id => id ?? index.hlasovania[0]?.id ?? null); } }).catch(() => { if (alive) setVoteError(true); });
    return () => { alive = false; };
  }, [mode, votes]);
  useEffect(() => {
    if (voteId === null) return;
    let alive = true;
    loadVote(voteId).then(detail => { if (alive) { setVoteDetail(detail); setVoteError(false); } }).catch(() => { if (alive) setVoteError(true); });
    return () => { alive = false; };
  }, [voteId]);
  // Selected-seat feedback is independent of the sweep: picking a deputy never replays the vote.
  useEffect(() => {
    selectedVoteSeat.current = voteSeat?.seat ?? null;
    if (!viewer?.model || !loaded || mode !== 'hlasovania' || !voteDetail || voteDetail.id !== voteId) return;
    let alive = true;
    const materials = new Map(viewer.model.materials.map(m => [m.name, m]));
    void (async () => {
      await Promise.all([...materials.values()].filter(m => /^prechod:\d+$/.test(m.name)).map(m => m.isLoaded === false ? m.ensureLoaded?.() : undefined));
      if (!alive) return;
      seatMembers(voteDetail).forEach((member, i) => {
        const pigment = voteColors.current[i] ?? linearColor(markColors[member.mark]);
        materials.get(`prechod:${i}`)?.setEmissiveFactor(pigment.map(v => (member.mark === '0' ? 0 : v * .12) + (voteSeat?.seat === i ? .16 : 0)));
      });
    })().catch(() => {});
    return () => { alive = false; };
  }, [viewer, loaded, mode, voteDetail, voteId, voteSeat]);
  // One bounded sweep through the real seats. Vote colors, club logos and final totals stay factual.
  useEffect(() => {
    if (!viewer?.model || !loaded || mode !== 'hlasovania' || !voteDetail || voteDetail.id !== voteId) return;
    let alive = true, frame = 0, fallback = 0, running = false;
    const materials = new Map(viewer.model.materials.map(m => [m.name, m]));
    const members = seatMembers(voteDetail);
    const starts = members.map((_, i) => [...(voteColors.current[i] ?? linearColor('#65736b'))]);
    const paint = (i: number, progress: number) => {
      const member = members[i], pigment = linearColor(markColors[member.mark]);
      const color = progress === 1 ? pigment : starts[i].map((v, k) => v + (pigment[k] - v) * progress);
      voteColors.current[i] = color;
      const seat = materials.get(`prechod:${i}`);
      seat?.pbrMetallicRoughness.setBaseColorFactor([...color, 1]);
      seat?.setEmissiveFactor(color.map(v => (member.mark === '0' ? 0 : v * .12) + (selectedVoteSeat.current === i ? .16 : 0)));
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
  }, [viewer, loaded, mode, voteDetail, voteId, reduced, visible]);
  function chooseVote(id: number) {
    if (shareLock.current) return;
    setVoteSeat(null); setVoteId(id); setCamera(fit(viewer).view);
    track("ar", "vote");
  }
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
    setPlaying(false); stopIntro(); setSelected(null); setVoteSeat(null); setImmersive(false);
    setCamera(fit(viewer).view);
  }
  function settleTransition() { setTransition(null); setDisplayVariant(mode === 'hlasovania' && seated ? 'hlasovanie' : variantId); }
  function switchVariant(id: VariantId) {
    if (shareLock.current) return;
    if (id === variantId) return;
    setSharePreview(null); stopIntro(); setImmersive(false); setVariantId(id); setCombination([]); setSelected(null); setCamera(fit(viewer).view);
    if (loaded && visible && !reduced && (mode === 'strany' || mode === 'vyvoj')) setTransition({ from: variantId, to: id });
    else { setTransition(null); setDisplayVariant(id); }
    track("ar", `variant:${id}`);
  }
  function switchMode(next: Mode) {
    if (shareLock.current) return;
    setPlaying(false); stopIntro(); setTransition(null); setImmersive(false); setMode(next); setSelected(null); setVoteSeat(null); setCamera(fit(viewer).view);
    if (next === 'vyvoj') { setVariantId(timeline[0].variant.id); setDisplayVariant(timeline[0].variant.id); setCombination([]); }
    else if (next !== 'hlasovania') {
      setDisplayVariant(variantId);
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
  function pickSeat(x: number, y: number) {
    if (transition) return;
    if (mode === 'hlasovania') {
      if (!viewer || !seated) return;
      // Individual seat material; a nearby wooden seat part can use the same physical seat centre.
      const own = viewer.materialFromPoint(x, y)?.name.match(/^prechod(?:-logo)?:(\d+)$/);
      let seat = own ? Number(own[1]) : -1;
      if (seat < 0) {
        const hit = viewer.positionAndNormalFromPoint(x, y)?.position;
        if (hit) { let best = Infinity; chamberSeats.forEach((s, i) => { const d = (s.x - hit.x) ** 2 + (s.z - hit.z) ** 2; if (d < best && d < .0004) { best = d; seat = i; } }); }
      }
      setVoteSeat(seat >= 0 && voteSeat?.seat !== seat ? seated[seat] : null);
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
      return { title: `${party.short} · ${party.seats} ${plural(party.seats)}`, note: bloc === "coalition" ? "dnešná vládna koalícia" : bloc === "opposition" ? "dnešná opozícia" : "mimo dnešných blokov" };
    }
    return { title: variantId === "prieskumy" ? `Scenár podľa Modelu Mandát · aktualizované ${date(seatsNow.updated)}` : variantId === 'volby-2023' ? "Výsledok volieb 30. septembra 2023" : exclusion ? `Čo ak ${exclusion.party.short} nepostúpia?` : `Model Mandát · ${current.label}`, note: exclusion ? 'Hypotetický scenár pri nezmenenej podpore ostatných strán. Nie predpoveď.' : "Ťukni na kreslo alebo vyber stranu zo zoznamu a pozri si ju zblízka." };
  })();

  return <DialogPrimitive.Root open={open} onOpenChange={next => { if (sharing) return; setOpen(next); setFailed(false); setPlaying(false); if (next) track("ar", "open"); else { setViewer(null); setLoaded(false); setSelected(null); setImmersive(false); settleTransition(); majorityWasOn.current = false; setCamera(INTRO); } }}>
    <DialogPrimitive.Trigger asChild>
      <button ref={trigger} type="button" className="par3d-open" onPointerEnter={() => { void loadLibrary().catch(() => {}); prefetchModel(); }}><Box size={17} aria-hidden="true"/>Pozrieť v 3D a na stole</button>
    </DialogPrimitive.Trigger>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="par3d-overlay"/>
      <DialogPrimitive.Content className="par3d" aria-describedby="par3d-desc">
        <div className="par3d-head">
          <div><DialogPrimitive.Title className="par3d-title">Parlament v 3D</DialogPrimitive.Title>
            <p id="par3d-desc" className="par3d-desc">150 kresiel · {mode === 'hlasovania' ? 'Hlasovania NR SR' : current.label}{mode !== 'hlasovania' && variantId === 'prieskumy' ? ` · ${date(seatsNow.updated)}` : ''}. Preskúmaj sálu vlastným pohľadom.</p></div>
          <DialogPrimitive.Close className="par3d-close" aria-label="Zavrieť"><X size={20}/></DialogPrimitive.Close>
        </div>
        <fieldset className="par3d-controls" disabled={sharing}>
          {mode !== 'hlasovania' && <div className="par3d-seg" role="group" aria-label="Obsadenie sály">{variants.map(v => <button key={v.id} type="button" aria-pressed={variantId === v.id} onClick={() => { setPlaying(false); if (mode === 'vyvoj') setMode('strany'); switchVariant(v.id); }}>{v.label}</button>)}</div>}
          <div className="par3d-seg par3d-modes" role="group" aria-label="Režim sály">{(["strany", "koalicia", "bloky", "vyvoj", "hlasovania"] as const).map(m => <button key={m} type="button" aria-pressed={mode === m} onClick={() => switchMode(m)}>{m === "strany" ? "Strany" : m === 'koalicia' ? 'Koalícia' : m === 'vyvoj' ? 'Vývoj 2026' : m === 'hlasovania' ? 'Hlasovania' : "Bloky"}</button>)}</div>
          <button type="button" className="par3d-seat-view" aria-label="Z kresla poslanca" aria-pressed={immersive} disabled={!loaded} onClick={toggleImmersive}><Armchair size={16} aria-hidden="true"/><span>Z kresla<span className="par3d-seat-long"> poslanca</span></span></button>
          <button type="button" className="par3d-replay" aria-label="Prehrať úvod znova" onClick={() => { setPlaying(false); setSelected(null); setImmersive(false); settleTransition(); viewer?.dispatchEvent(new Event("par3d-replay")); }}><RotateCcw size={16} aria-hidden="true"/></button>
        </fieldset>
        <div className="par3d-stage" data-detail={!!selected}>
          {ready
            ? <model-viewer ref={setViewer as unknown as Ref<HTMLElement>} src={PARLIAMENT_MODEL} variant-name={displayVariant} animation-name="obsadenie"
                alt={`3D rokovacia sála: ${current.ordered.map(m => `${m.short} ${m.seats}`).join(", ")}`}
                ar="" ar-modes="webxr scene-viewer quick-look" ar-scale="auto" ar-placement="floor"
                tabIndex={0} aria-describedby="par3d-navigation-help" interaction-prompt="none" reveal="manual" loading="eager"
                camera-orbit={camera.orbit} camera-target={camera.target} field-of-view={immersive ? '68deg' : '30deg'} interpolation-decay={reduced ? '0' : touring ? '220' : '100'}
                min-camera-orbit="auto 0.57deg 0.015m" max-camera-orbit="auto 179.43deg 20m"
                tone-mapping="aces" shadow-intensity="1.1" shadow-softness="0.7" exposure="1.2" environment-image="/models/parlament-evening.hdr" class="par3d-viewer"
                onError={() => setFailed(true)}>
                <button slot="ar-button" type="button" className="par3d-ar" onClick={() => track("ar", "table")}><ScanLine size={18} aria-hidden="true"/>Položiť na stôl</button>
              </model-viewer>
            : null}
          {!loaded && <div className="par3d-loading" role="status"><svg viewBox="-1.08 -1.08 2.16 1.2" aria-hidden="true">{posterPoints.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={.032} fill={current.ordered.find(m => m.id === current.seatParty[i])?.color ?? '#aaa'}/>)}</svg><span>{failed ? '3D model sa nepodarilo načítať. Zavri okno a skús znova.' : 'Načítava sa 3D sála…'}</span></div>}
          {touring && <button type="button" className="par3d-skip" onClick={() => { stopIntro(); setCamera(fit(viewer).view); }}>Preskočiť úvod</button>}
          {transition && <div className="par3d-transition" role="status"><span>{allVariants.find(v => v.id === transition.from)?.label} → {current.label}</span><button type="button" onClick={settleTransition}>Preskočiť</button></div>}
          {immersive && <div className="par3d-detail"><Armchair size={22} aria-hidden="true"/><span><b>Pohľad z kresla</b><small>Ilustračná sála · rozhliadni sa {touch ? 'prstom' : 'myšou'}</small></span><button type="button" onClick={toggleImmersive}><ArrowLeft size={16} aria-hidden="true"/>Celá sála</button></div>}
          {failed && ready && <p className="par3d-loading" role="alert">Model sa nepodarilo načítať. Zavri okno a skús ho otvoriť znova.</p>}
        </div>
        <ParliamentNavigation viewer={viewer} enabled={loaded && visible && !sharing} touch={touch} onCamera={setCamera}
          onStart={() => { manuallyNavigated.current = true; setPlaying(false); stopIntro(); }} onPick={pickSeat} onReset={resetCamera}/>
          {selectedParty && (mode === 'strany' || mode === 'vyvoj') && <div className="par3d-detail par3d-inspection" style={{ ['--party-color' as string]: selectedParty.color }}>
            {logos[selectedParty.id]?.src && <Image src={logos[selectedParty.id].src} alt="" width={40} height={30} unoptimized/>}
            <span><b>{selectedParty.short}</b><small>{selectedParty.seats} {plural(selectedParty.seats)}</small></span>
            <button type="button" onClick={() => choose(null)}><ArrowLeft size={16} aria-hidden="true"/>Celá sála</button>
          </div>}
          {mode === 'hlasovania' && vote && seated && <div className="par3d-board" role="img" aria-label={`Výsledok: za ${vote.za}, proti ${vote.proti}, zdržalo sa ${vote.zdrzalo}, nehlasovalo ${vote.nehlasovalo}, neprítomní ${vote.nepritomni}. ${vote.preslo ? 'Návrh prešiel' : 'Návrh neprešiel'}.`}>
            {(["Z", "P", "?", "N", "0"] as const).map(k => <span key={k} data-mark={k}><small><i style={{ background: markColors[k] }} aria-hidden="true"/>{k === "Z" ? "Za" : k === "P" ? "Proti" : k === "?" ? "Zdržalo sa" : k === "N" ? "Nehlasovalo" : "Neprítomní"}</small><b>{k === "Z" ? vote.za : k === "P" ? vote.proti : k === "?" ? vote.zdrzalo : k === "N" ? vote.nehlasovalo : vote.nepritomni}</b></span>)}
            <strong data-passed={vote.preslo}>{vote.preslo ? 'Návrh prešiel' : 'Návrh neprešiel'}</strong>
          </div>}
          {mode === 'hlasovania' && voteSeat && <div className="par3d-detail par3d-inspection" style={{ ['--party-color' as string]: markColors[voteSeat.mark] }}>
            {logos[voteSeat.party]?.src ? <Image src={logos[voteSeat.party].src} alt="" width={40} height={30} unoptimized/> : <i className="par3d-detail-dot" style={{ background: markColors[voteSeat.mark] }} aria-hidden="true"/>}
            <span><b>{voteSeat.name}</b><small>{clubLabel(voteSeat.club)} · <em>{markNames[voteSeat.mark]}</em></small></span>
            <button type="button" onClick={() => setVoteSeat(null)}><X size={16} aria-hidden="true"/>Zavrieť</button>
          </div>}
        <div className="par3d-caption" data-ready={loaded} aria-live="polite">
          {mode === 'hlasovania' && <div className="par3d-vote">
            {voteError && <p role="alert">Hlasovanie sa nepodarilo načítať. Skontroluj pripojenie a skús to znova.</p>}
            {!votes && !voteError && <p role="status">Načítavam hlasovania NR SR…</p>}
            {vote && <>
              <p className="par3d-vote-meta">{skDay(vote.datum)} · {vote.schodza}. schôdza · {kindNames[vote.druh]}</p>
              <b className="par3d-vote-title">{vote.nazov}</b>
              <p className="par3d-vote-rule">Na prijatie {vote.druh === 'nedovera' ? 'nedôvery' : 'návrhu'} treba {required(vote).votes} hlasov ({required(vote).rule}). Za hlasovalo {vote.za}. <a href={voteSource(vote.id)} target="_blank" rel="noopener noreferrer">nrsr.sk <ExternalLink size={12} aria-hidden="true"/></a></p>
              {seated && voteDetail && <ul className="par3d-clubs" aria-label="Hlasovanie podľa klubov">{clubTotals(voteDetail).map(row => <li key={row.club}>
                <span>{clubLabel(row.club)}<small>{row.total}</small></span>
                <span className="par3d-club-bar" aria-hidden="true">{marks.map(k => row.counts[k] > 0 && <i key={k} style={{ flexGrow: row.counts[k], background: markColors[k] }}/>)}</span>
                <small>{marks.filter(k => row.counts[k] > 0).map(k => `${markNames[k]} ${row.counts[k]}`).join(' · ')}</small>
              </li>)}</ul>}
            </>}
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
            <div className="par3d-coalition-summary"><div><b>Poskladaj vlastnú koalíciu</b><span>{coalition.members.length ? coalition.majority ? 'Táto kombinácia má parlamentnú väčšinu.' : `Do väčšiny chýba ${coalition.missing} ${plural(coalition.missing)}.` : 'Vyber strany zo zoznamu alebo ťukni na ich kreslá.'}</span></div><strong aria-hidden="true">{displayedSeats}<small>/ 150</small></strong></div>
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
          </>}
          {mode === 'strany' && !selected && (variantId === 'prieskumy' || variantId === 'volby-2023') && <div className="par3d-changes"><span>2023 → Model Mandát</span>{[biggestGain, biggestLoss].filter(p => !!p).map(p => <span key={p.id}><i style={{ background: p.color }} aria-hidden="true"/>{p.short} <b>{p.delta > 0 ? '+' : '−'}{Math.abs(p.delta)}</b></span>)}<span>kresiel</span></div>}
        </div>
        {mode === 'hlasovania' ? <section className="par3d-votes" aria-label="Výber hlasovania">
          <label className="par3d-vote-search"><Search size={16} aria-hidden="true"/><span className="sr-only">Hľadať hlasovanie</span>
            <input type="search" value={voteQuery} placeholder="Hľadať v názvoch, napr. rozpočet, trestný" enterKeyHint="search" onChange={e => { setVoteQuery(e.target.value); setVoteLimit(VOTE_PAGE); }}/></label>
          <div className="par3d-vote-kinds" role="group" aria-label="Druh hlasovania">{VOTE_KINDS.map(k => <button key={k} type="button" aria-pressed={voteKind === k} onClick={() => { setVoteKind(k); setVoteLimit(VOTE_PAGE); }}>{k === 'vsetky' ? 'Všetky' : kindNames[k]}{votes && <small>{k === 'vsetky' ? votes.hlasovania.length : votes.hlasovania.filter(v => v.druh === k).length}</small>}</button>)}</div>
          {votes && <ol className="par3d-vote-list">{voteList.slice(0, voteLimit).map(v => <li key={v.id}><button type="button" aria-pressed={voteId === v.id} onClick={() => chooseVote(v.id)}>
            <span className="par3d-vote-meta">{skDay(v.datum)} · {kindNames[v.druh]}</span>
            <b>{v.nazov}</b>
            <span className="par3d-vote-result" data-passed={v.preslo}>{v.preslo ? <Check size={13} aria-hidden="true"/> : <X size={13} aria-hidden="true"/>}{v.preslo ? 'Prešiel' : 'Neprešiel'} · za {v.za}, proti {v.proti}</span>
          </button></li>)}</ol>}
          {votes && !voteList.length && <p className="par3d-note">Nič sa nenašlo. Skús iné slovo alebo druh hlasovania.</p>}
          {voteList.length > voteLimit && <button type="button" className="par3d-vote-more" onClick={() => setVoteLimit(n => n + VOTE_PAGE)}>Zobraziť ďalšie ({voteList.length - voteLimit})</button>}
          {votes && <p className="par3d-note">Hlasovania o zákonoch ako celku, ústavných zákonoch a nedôvere v 9. volebnom období podľa nrsr.sk (aktualizované {skDay(votes.aktualizovane)}). Poslanci sedia podľa klubov v čase hlasovania, nie podľa skutočného zasadacieho poriadku. Ťukni na kreslo a uvidíš meno a hlas. Vlna farieb odhaľuje výsledok, neukazuje poradie hlasovania.</p>}
        </section> : mode !== "bloky"
          ? <ul className="par3d-legend" aria-label={mode === 'koalicia' ? 'Strany do vlastnej koalície' : 'Kreslá strán'}>{current.ordered.map(m => <li key={m.id}><button type="button" disabled={sharing} data-edge={variantId === 'prieskumy' && edges.some(p => p.party.id === m.id)} aria-pressed={mode === 'koalicia' ? combination.includes(m.id) : selected === m.id} onClick={() => mode === 'koalicia' ? toggleCoalition(m.id) : choose(selected === m.id ? null : m.id)}><i style={{ background: m.color }} aria-hidden="true"/>{logos[m.id]?.src && <Image className="par3d-party-logo" src={logos[m.id].src} alt="" width={23} height={18} unoptimized loading="lazy"/>}{m.short}<b>{m.seats}</b>{variantId === 'prieskumy' && edges.some(p => p.party.id === m.id) && <TriangleAlert size={12} aria-label="Na hrane 5 %"/>}{mode === 'koalicia' && combination.includes(m.id) && <Check size={13} aria-hidden="true"/>}</button></li>)}</ul>
          : <ul className="par3d-legend" aria-label="Bloky">{(["coalition", "others", "opposition"] as const).filter(b => summary[b].seats > 0).map(b => <li key={b}><span className="par3d-bloc"><i style={{ background: BLOC_COLOR[b] }} aria-hidden="true"/>{b === "others" ? "Ostatní" : blocLabel(summary, b, partners)}<b>{summary[b].seats}</b></span></li>)}</ul>}
        {mode !== 'hlasovania' && <p className="par3d-note">Scenár, nie predpoveď. Farba kresla a značka na operadle rozlišujú strany. „Položiť na stôl“ otvorí AR na podporovanom telefóne; Android Scene Viewer používa pôvodný model prieskumov, iOS prenáša aktuálny výber.</p>}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>;
}
