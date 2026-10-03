'use client';
import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import type { Texture, TextureInfo } from '@google/model-viewer/lib/features/scene-graph/api.js';
import { displayFacts, displayPhase } from '@/lib/parliament-display';
import type { VoteSummary } from '@/lib/votes';
export type DisplayViewer = HTMLElement & {
  createCanvasTexture: () => Texture;
  model?: { materials: { name: string; isLoaded?: boolean; ensureLoaded?: () => Promise<void>; pbrMetallicRoughness: { baseColorTexture: TextureInfo | null } }[] };
};
type Binding = { viewer: DisplayViewer; texture: Texture; canvas: HTMLCanvasElement };
/** One reusable CanvasTexture attached to the GLB wainscot through the public scene API. */
export function ParliamentDisplay({ viewer, loaded, visible, reduced, vote, caption }: {
  viewer: DisplayViewer | null; loaded: boolean; visible: boolean; reduced: boolean; vote: VoteSummary | null; caption: string;
}) {
  const [paused, setPaused] = useState(false), [binding, setBinding] = useState<Binding | null>(null);
  const phase = useRef(0);
  useEffect(() => {
    if (!viewer?.model || !loaded) return;
    let alive = true;
    const material = viewer.model.materials.find(m => m.name === 'tabula:hlasovanie');
    if (!material) return;
    void (async () => {
      if (material.isLoaded === false) await material.ensureLoaded?.();
      await document.fonts.ready;
      if (!alive) return;
      const texture = viewer.createCanvasTexture(), canvas = texture.source.element;
      if (!(canvas instanceof HTMLCanvasElement)) return;
      canvas.width = 2048; canvas.height = 128;
      material.pbrMetallicRoughness.baseColorTexture?.setTexture(texture);
      setBinding({ viewer, texture, canvas });
    })().catch(() => { /* Existing textual vote totals remain available if the scene API cannot bind. */ });
    return () => { alive = false; };
  }, [viewer, loaded]);
  useEffect(() => {
    if (!binding || binding.viewer !== viewer) return;
    const ctx = binding.canvas.getContext('2d');
    if (!ctx) return;
    const facts = displayFacts(vote, caption), width = binding.canvas.width;
    ctx.font = '600 68px "IBM Plex Sans", sans-serif';
    const spans = facts.map(f => ({ ...f, width: ctx.measureText(f.text).width + 90 }));
    const loopWidth = Math.max(width, spans.reduce((n, f) => n + f.width, 0));
    let frame = 0, previous = 0, lastPaint = 0, elapsed = phase.current;
    const paint = (offset: number) => {
      ctx.fillStyle = '#101a18'; ctx.fillRect(0, 0, width, 128); ctx.textBaseline = 'middle';
      ctx.font = '600 68px "IBM Plex Sans", sans-serif';
      if (reduced) {
        const text = facts.slice(0, vote ? 6 : 2).map(f => f.text).join('   ·   ');
        ctx.font = `600 ${Math.min(68, 68 * (width - 60) / Math.max(1, ctx.measureText(text).width))}px "IBM Plex Sans", sans-serif`;
        ctx.fillStyle = '#f5eee0'; ctx.fillText(text, 30, 64);
      } else for (let repeat = -1; repeat <= 1; repeat++) {
        let x = offset + repeat * loopWidth + 30;
        for (const fact of spans) {
          if (x < width && x + fact.width > 0) { ctx.fillStyle = fact.color; ctx.fillText(fact.text, x, 65); }
          x += fact.width;
        }
      }
      ctx.fillStyle = '#101a1820';
      for (let x = 0; x < width; x += 4) ctx.fillRect(x, 0, 1, 128);
      binding.texture.source.update();
    };
    paint(reduced ? 0 : displayPhase(elapsed, loopWidth));
    if (visible && !reduced && !paused) {
      const tick = (now: number) => {
        if (document.hidden) return;
        if (previous) elapsed += Math.min(100, now - previous);
        previous = now; phase.current = elapsed;
        if (now - lastPaint >= 100) { paint(displayPhase(elapsed, loopWidth)); lastPaint = now; }
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }
    return () => cancelAnimationFrame(frame);
  }, [binding, viewer, visible, reduced, paused, vote, caption]);
  return <>{binding?.viewer === viewer && !reduced && <button type="button" className="par3d-display-pause" aria-pressed={paused} aria-label={paused ? 'Spustiť text tabule' : 'Pozastaviť text tabule'} onClick={() => setPaused(!paused)}>
    {paused ? <Play size={15} aria-hidden="true"/> : <Pause size={15} aria-hidden="true"/>}<span>Tabuľa</span>
  </button>}<span className="sr-only">Integrovaná tabuľa: {displayFacts(vote, caption).map(f => f.text).join('. ')}. Výhľad na Bratislavu je ilustrácia.</span></>;
}
