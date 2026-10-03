"use client";
import { useEffect, useRef, useState } from 'react';
import { Hand, Rotate3D, Maximize, Minus, Plus } from 'lucide-react';
import { cameraAttributes, panCamera, rotateCamera, touchFrame, zoomCamera, type ChamberCamera } from '@/lib/parliament-camera';

export type NavigableViewer = HTMLElement & {
  getCameraOrbit: () => { theta: number; phi: number; radius: number };
  getCameraTarget: () => { x: number; y: number; z: number };
  getFieldOfView: () => number;
};
type Props = { viewer: NavigableViewer | null; enabled: boolean; touch: boolean;
  /** Zamknutá sála (telefón na šírku): bez posúvania cieľa, ťahanie otáča v medziach vieweru, dva prsty len približujú. */
  lock?: boolean;
  onCamera: (c: { orbit: string; target: string }) => void; onStart: () => void;
  onPick: (x: number, y: number) => void; onReset: () => void };

export function ParliamentNavigation(props: Props) {
  const [mode, setMode] = useState<'pan' | 'rotate'>('pan');
  const latest = useRef(props);
  useEffect(() => { latest.current = props; });
  const snapshot = (v: NavigableViewer): ChamberCamera => ({ ...v.getCameraOrbit(), target: { ...v.getCameraTarget() } });
  useEffect(() => {
    const v = props.viewer;
    if (!v || !props.enabled) return;
    const pointers = new Map<number, { x: number; y: number }>();
    let camera = snapshot(v), frame = 0;
    let press: { x: number; y: number; at: number; moved: boolean; multi: boolean } | null = null;
    const apply = (next: ChamberCamera) => {
      camera = next;
      if (!frame) frame = requestAnimationFrame(() => { frame = 0; latest.current.onCamera(cameraAttributes(camera)); });
    };
    const start = () => { camera = snapshot(v); latest.current.onStart(); latest.current.onCamera(cameraAttributes(camera)); };
    const down = (e: PointerEvent) => {
      if (e.composedPath().some(n => n instanceof HTMLButtonElement) || (e.pointerType === 'mouse' && e.button !== 0 && e.button !== 2)) return;
      if (!pointers.size) { start(); press = { x: e.clientX, y: e.clientY, at: e.timeStamp, moved: false, multi: false }; }
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (press && pointers.size > 1) press.multi = true;
      v.setPointerCapture(e.pointerId); v.focus({ preventScroll: true }); e.preventDefault();
    };
    const move = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      const before = touchFrame([...pointers.values()]);
      const old = pointers.get(e.pointerId)!;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (press && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 7) press.moved = true;
      if (!press?.moved && !press?.multi) return;
      if (pointers.size > 1) {
        const after = touchFrame([...pointers.values()]);
        const scaled = zoomCamera(camera, before.span > 2 && after.span > 2 ? before.span / after.span : 1);
        apply(latest.current.lock ? scaled : panCamera(scaled, after.x - before.x, after.y - before.y, v.clientHeight, v.getFieldOfView()));
      } else {
        const rotate = latest.current.lock || e.buttons === 2 || (mode === 'rotate' ? !e.shiftKey : e.shiftKey);
        apply(rotate ? rotateCamera(camera, e.clientX - old.x, e.clientY - old.y, v.clientHeight) : panCamera(camera, e.clientX - old.x, e.clientY - old.y, v.clientHeight, v.getFieldOfView()));
      }
      e.preventDefault();
    };
    const up = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      const tap = (e.pointerType !== 'mouse' || e.button === 0) && pointers.size === 1 && press && !press.moved && !press.multi && e.timeStamp - press.at < 500;
      pointers.delete(e.pointerId);
      if (v.hasPointerCapture(e.pointerId)) v.releasePointerCapture(e.pointerId);
      if (!pointers.size) {
        press = null;
        if (tap) { if (frame) { cancelAnimationFrame(frame); frame = 0; } latest.current.onPick(e.clientX, e.clientY); }
      }
    };
    const cancel = (e: PointerEvent) => { pointers.delete(e.pointerId); if (press) press.multi = true; if (!pointers.size) press = null; };
    const clear = () => { pointers.clear(); press = null; if (frame) cancelAnimationFrame(frame); frame = 0; };
    const hidden = () => { if (document.hidden) clear(); };
    const wheel = (e: WheelEvent) => {
      e.preventDefault(); start();
      const delta = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? v.clientHeight : 1);
      apply(zoomCamera(camera, Math.exp(Math.max(-200, Math.min(200, delta)) * .002)));
    };
    const key = (e: KeyboardEvent) => {
      if (!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(e.key)) return;
      e.preventDefault();
      if (e.key === 'Home') { clear(); latest.current.onReset(); return; }
      start();
      if (['+','=','-'].includes(e.key)) apply(zoomCamera(camera, e.key === '-' ? 1.2 : 1 / 1.2));
      else {
        const dx = e.key === 'ArrowLeft' ? 24 : e.key === 'ArrowRight' ? -24 : 0;
        const dy = e.key === 'ArrowUp' ? 24 : e.key === 'ArrowDown' ? -24 : 0;
        apply((latest.current.lock || mode === 'rotate' || e.shiftKey) ? rotateCamera(camera, dx, dy, v.clientHeight) : panCamera(camera, dx, dy, v.clientHeight, v.getFieldOfView()));
      }
    };
    const context = (e: Event) => e.preventDefault();
    v.addEventListener('pointerdown', down); v.addEventListener('pointermove', move);
    v.addEventListener('pointerup', up); v.addEventListener('pointercancel', cancel); v.addEventListener('lostpointercapture', cancel);
    v.addEventListener('wheel', wheel, { passive: false }); v.addEventListener('keydown', key); v.addEventListener('contextmenu', context);
    window.addEventListener('blur', clear); document.addEventListener('visibilitychange', hidden);
    return () => {
      for (const id of pointers.keys()) if (v.hasPointerCapture(id)) v.releasePointerCapture(id);
      clear();
      v.removeEventListener('pointerdown', down); v.removeEventListener('pointermove', move);
      v.removeEventListener('pointerup', up); v.removeEventListener('pointercancel', cancel); v.removeEventListener('lostpointercapture', cancel);
      v.removeEventListener('wheel', wheel); v.removeEventListener('keydown', key); v.removeEventListener('contextmenu', context);
      window.removeEventListener('blur', clear); document.removeEventListener('visibilitychange', hidden);
    };
  }, [props.viewer, props.enabled, mode]);

  const zoom = (factor: number) => {
    if (!props.viewer || !props.enabled) return;
    const camera = snapshot(props.viewer); props.onStart(); props.onCamera(cameraAttributes(zoomCamera(camera, factor)));
  };
  return <div className="par3d-navigation" data-lock={props.lock || undefined}>
    <fieldset disabled={!props.enabled} className="par3d-nav-tools" aria-label="Pohyb v sále">
      {!props.lock && <div className="par3d-seg" role="group" aria-label="Ťahanie v sále">
        <button type="button" aria-pressed={mode === 'pan'} onClick={() => setMode('pan')}><Hand size={15} aria-hidden="true"/>Posúvať</button>
        <button type="button" aria-pressed={mode === 'rotate'} onClick={() => setMode('rotate')}><Rotate3D size={15} aria-hidden="true"/>Otáčať</button>
      </div>}
      <div className="par3d-nav-zoom">
        <button type="button" aria-label="Oddialiť sálu" onClick={() => zoom(1.25)}><Minus size={17} aria-hidden="true"/></button>
        <button type="button" aria-label="Priblížiť sálu" onClick={() => zoom(.8)}><Plus size={17} aria-hidden="true"/></button>
      </div>
      <button type="button" className="par3d-nav-reset" onClick={props.onReset}><Maximize size={15} aria-hidden="true"/>Celá sála</button>
    </fieldset>
    <p id="par3d-navigation-help">{props.lock ? 'Dvoma prstami približuješ, ťahaním sa rozhliadneš.' : props.touch ? 'Ťahaj jedným prstom. Dvoma posúvaš aj približuješ.' : 'Ťahaj myšou, približuj kolieskom. Pravé tlačidlo otáča.'} Ťuknutie vyberie kreslo.<span className="sr-only">Šípky posúvajú, Shift so šípkami otáča, plus a mínus menia priblíženie, Home vráti celú sálu.</span></p>
  </div>;
}
