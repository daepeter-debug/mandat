"use client";
import { useEffect, useRef, useState } from "react";
import type { Texture, TextureInfo } from "@google/model-viewer/lib/features/scene-graph/api.js";
import { WALL_PANELS, WALL_SOFT, wallPanels, wallText, type WallPanel, type WallScene } from "@/lib/parliament-wall";

/*
  Tabuľa na stene 3D sály: pás okien (materiál „okná:Bratislava“ z GLB) slúži ako zakrivená obrazovka s desiatimi
  poľami medzi pilastrami. Výhľad na Bratislavu je za sálou (components/parliament-backdrop.tsx), stena ukazuje
  hlasovanie alebo kreslá veľkým písmom (lib/parliament-wall.ts), aby sa dalo čítať aj na telefóne.
  - Textúra je jeden canvas 4096 × 368 (pomer pásu okien, bez skreslenia), kreslí sa len pri zmene.
  - Pás okien má UV obrázka glTF (otočené oproti canvasu), preto sa obsah kreslí zrkadlovo zvisle.
  - Pri novom hlasovaní sa čísla napočítajú (8 krokov); pri obmedzenom pohybe hneď konečný stav.
*/
export type WallViewer = HTMLElement & {
  createCanvasTexture: () => Texture;
  model?: { materials: { name: string; isLoaded?: boolean; ensureLoaded?: () => Promise<void>; pbrMetallicRoughness: { baseColorTexture: TextureInfo | null } }[] };
};
const W = 4096, H = 368, PW = W / WALL_PANELS;
const FONT = '"IBM Plex Sans Variable", "IBM Plex Sans", "Segoe UI", sans-serif';

function fitFont(ctx: CanvasRenderingContext2D, text: string, weight: number, size: number, max: number) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  const width = ctx.measureText(text).width;
  if (width > max) ctx.font = `${weight} ${Math.floor(size * max / width)}px ${FONT}`;
}

function drawPanel(ctx: CanvasRenderingContext2D, p: WallPanel, x: number, shown: string) {
  const cx = x + PW / 2, inner = PW - 70;
  const panel = ctx.createLinearGradient(0, 14, 0, H - 14);
  panel.addColorStop(0, '#14251f'); panel.addColorStop(.45, '#0d1915'); panel.addColorStop(1, '#08120f');
  ctx.fillStyle = panel;
  ctx.beginPath(); ctx.roundRect(x + 14, 14, PW - 28, H - 28, 18); ctx.fill();
  ctx.strokeStyle = '#486052'; ctx.lineWidth = 2; ctx.stroke();
  if (p.empty) {
    ctx.fillStyle = "#1d2c26";
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.arc(cx + i * 30, H / 2, 7, 0, Math.PI * 2); ctx.fill(); }
    return;
  }
  ctx.globalAlpha = p.dim ? .62 : 1;
  if (p.bar) { ctx.fillStyle = p.bar; ctx.beginPath(); ctx.roundRect(cx - 70, 38, 140, 12, 6); ctx.fill(); }
  ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
  ctx.fillStyle = WALL_SOFT; fitFont(ctx, p.label, 620, 36, inner); ctx.fillText(p.label, cx, 104);
  ctx.fillStyle = p.color;
  ctx.shadowColor = p.color; ctx.shadowBlur = 3;
  if (p.word) fitFont(ctx, shown, 660, 92, inner); else fitFont(ctx, shown, 640, 168, inner);
  ctx.fillText(shown, cx, p.word ? 232 : 270);
  ctx.shadowBlur = 0;
  if (p.note) { ctx.fillStyle = WALL_SOFT; fitFont(ctx, p.note, 500, 32, inner); ctx.fillText(p.note, cx, 330); }
  ctx.globalAlpha = 1;
}

/** Celá tabuľa do canvasu; `progress` 0–1 napočíta číselné polia od predchádzajúcich hodnôt. */
function drawWall(target: HTMLCanvasElement, panels: WallPanel[], from: WallPanel[] | null, progress: number) {
  const off = document.createElement("canvas");
  off.width = W; off.height = H;
  const ctx = off.getContext("2d"), out = target.getContext("2d");
  if (!ctx || !out) return;
  ctx.fillStyle = "#08100d"; ctx.fillRect(0, 0, W, H);
  panels.forEach((p, i) => {
    const old = from?.[i], a = Number(old?.value), b = Number(p.value);
    const counting = progress < 1 && old && !p.word && Number.isFinite(a) && Number.isFinite(b) && old.label === p.label;
    drawPanel(ctx, p, i * PW, counting ? String(Math.round(a + (b - a) * (1 - (1 - progress) ** 3))) : p.value);
  });
  // Jemná mriežka LED bodov.
  ctx.fillStyle = "#00000030";
  for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
  out.save(); out.setTransform(1, 0, 0, -1, 0, H); out.drawImage(off, 0, 0); out.restore();
}

export function ParliamentWall({ viewer, loaded, scene, reduced }: { viewer: WallViewer | null; loaded: boolean; scene: WallScene; reduced: boolean }) {
  const [binding, setBinding] = useState<{ viewer: WallViewer; texture: Texture; canvas: HTMLCanvasElement } | null>(null);
  const shown = useRef<WallPanel[] | null>(null);
  useEffect(() => {
    if (!viewer?.model || !loaded) return;
    let alive = true;
    const material = viewer.model.materials.find(m => m.name === "okná:Bratislava");
    if (!material) return;
    void (async () => {
      if (material.isLoaded === false) await material.ensureLoaded?.();
      await document.fonts.ready;
      if (!alive) return;
      const texture = viewer.createCanvasTexture(), canvas = texture.source.element;
      if (!(canvas instanceof HTMLCanvasElement)) return;
      canvas.width = W; canvas.height = H;
      material.pbrMetallicRoughness.baseColorTexture?.setTexture(texture);
      shown.current = null;
      setBinding({ viewer, texture, canvas });
    })().catch(() => { /* Text pod sálou nesie tie isté údaje aj bez tabule. */ });
    return () => { alive = false; };
  }, [viewer, loaded]);
  const key = JSON.stringify(scene);
  useEffect(() => {
    if (!binding || binding.viewer !== viewer) return;
    const panels = wallPanels(JSON.parse(key) as WallScene), from = shown.current;
    const paint = (progress: number) => { drawWall(binding.canvas, panels, from, progress); binding.texture.source.update(); };
    const count = !reduced && from && from.some((p, i) => p.value !== panels[i].value && p.label === panels[i].label);
    shown.current = panels;
    if (!count) { paint(1); return; }
    let step = 0;
    const timers: number[] = [];
    const tick = () => { step++; paint(step / 8); if (step < 8) timers.push(window.setTimeout(tick, 80)); };
    paint(0); timers.push(window.setTimeout(tick, 80));
    return () => { timers.forEach(clearTimeout); paint(1); };
  }, [binding, viewer, key, reduced]);
  return <span className="sr-only">Tabuľa v sále: {wallText(scene)}.</span>;
}
