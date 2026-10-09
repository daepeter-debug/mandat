"use client";
import { useRef, type RefObject, type PointerEvent, type KeyboardEvent } from "react";

/** Both story formats share gestures, progress timing and export fallback. */
export function useStoryGestures({ card, next, prev, close, hold, pause }: {
  card: RefObject<HTMLDivElement | null>; next: () => void; prev: () => void; close: () => void;
  hold: (value: boolean) => void; pause: () => void;
}) {
  const press = useRef<{ x: number; y: number; t: number } | null>(null);
  const drag = (y: number) => card.current?.style.setProperty("--drag", `${Math.max(0, y)}px`);
  const cancel = () => { press.current = null; hold(false); drag(0); };
  return {
    onPointerDown(e: PointerEvent<HTMLDivElement>) {
      if ((e.target as HTMLElement).closest("button,a,input,form,label")) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      press.current = { x: e.clientX, y: e.clientY, t: performance.now() }; hold(true);
    },
    onPointerMove(e: PointerEvent<HTMLDivElement>) {
      const p = press.current; if (!p) return;
      const dy = e.clientY - p.y; if (dy > 0 && dy > Math.abs(e.clientX - p.x)) drag(dy);
    },
    onPointerUp(e: PointerEvent<HTMLDivElement>) {
      const p = press.current; cancel(); if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      if (dy > 90 && dy > Math.abs(dx)) { close(); return; }
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) { if (dx < 0) next(); else prev(); return; }
      if (performance.now() - p.t < 300 && Math.abs(dx) < 12 && Math.abs(dy) < 12) {
        const box = e.currentTarget.getBoundingClientRect(); if (e.clientX - box.left < box.width * .3) prev(); else next();
      }
    },
    onPointerCancel: cancel,
    onKeyDown(e: KeyboardEvent) {
      if ((e.target as HTMLElement).closest("input,textarea,select")) return;
      if (e.key === "ArrowRight") { e.preventDefault(); next(); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
      else if (e.key === " " && !(e.target as HTMLElement).closest("button,a")) { e.preventDefault(); pause(); }
    },
  };
}
export function StoryProgress({ count, index, onNext }: { count: number; index: number; onNext: () => void }) {
  return <div className="story-progress" aria-hidden="true">{Array.from({ length: count }, (_, i) => <i key={i} className={i < index ? "is-done" : i === index ? "is-active" : undefined}>
    {i === index ? <b key={`run-${index}`} onAnimationEnd={() => { if (index < count - 1) onNext(); }}/> : <b/>}
  </i>)}</div>;
}
export async function shareStoryImage(blob: Blob, name: string, title: string) {
  const file = new File([blob], name, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title }); return "shared"; }
    catch (e) { if ((e as Error).name === "AbortError") return "cancelled"; }
  }
  const url = URL.createObjectURL(blob), a = document.createElement("a");
  a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  return "downloaded";
}
