"use client";

import { useEffect, useState, type DetailedHTMLProps, type HTMLAttributes } from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { Box, ScanLine, X } from "lucide-react";
import { date } from "@/lib/polls";
import { PARLIAMENT_MODEL, parliamentSeats } from "@/lib/parliament-model";
import { track } from "@/lib/track";
import "@/app/parliament-ar.css";

/*
  „Parlament v 3D a na stole“: 3D model snemovne (public/models/parlament.glb, 150 kresiel vo farbách strán podľa
  Modelu Mandát) v prehliadači; na telefóne tlačidlo „Položiť na stôl“ otvorí rozšírenú realitu (Android: WebXR alebo
  Scene Viewer, iPhone: AR Quick Look). Knižnica <model-viewer> (Google, s three.js) sa načíta až po otvorení,
  z nášho vlastného servera — web ostáva rýchly a nič sa neposiela tretím stranám.
*/
type ModelViewerProps = DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & Record<string, unknown>;
declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX { interface IntrinsicElements { "model-viewer": ModelViewerProps } }
}

const model = parliamentSeats();

export default function ParliamentAR() {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!open || ready) return;
    let alive = true;
    import("@google/model-viewer").then(() => { if (alive) setReady(true); }).catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [open, ready]);

  return <DialogPrimitive.Root open={open} onOpenChange={next => { setOpen(next); if (next) track("ar", "open"); }}>
    <DialogPrimitive.Trigger asChild>
      <button type="button" className="par3d-open" onPointerEnter={() => { void import("@google/model-viewer").catch(() => {}); }}><Box size={17} aria-hidden="true"/>Pozrieť v 3D a na stole</button>
    </DialogPrimitive.Trigger>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="par3d-overlay"/>
      <DialogPrimitive.Content className="par3d" aria-describedby="par3d-desc">
        <div className="par3d-head">
          <div><DialogPrimitive.Title className="par3d-title">Parlament v 3D</DialogPrimitive.Title>
            <p id="par3d-desc" className="par3d-desc">150 kresiel podľa Modelu Mandát k {date(model.asOf)}: koalícia vľavo, opozícia vpravo. Otáčaj prstom, približuj dvoma prstami.</p></div>
          <DialogPrimitive.Close className="par3d-close" aria-label="Zavrieť"><X size={20}/></DialogPrimitive.Close>
        </div>
        <div className="par3d-stage">
          {ready
            ? <model-viewer src={PARLIAMENT_MODEL} alt={`3D model parlamentu: ${model.ordered.map(m => `${m.short} ${m.seats}`).join(", ")}`}
                ar="" ar-modes="webxr scene-viewer quick-look" ar-scale="auto" ar-placement="floor"
                camera-controls="" touch-action="none" auto-rotate="" auto-rotate-delay="1200" rotation-per-second="14deg" interaction-prompt="none"
                loading="eager" reveal="auto" camera-orbit="0deg 62deg auto" min-camera-orbit="auto 15deg auto" max-camera-orbit="auto 88deg auto"
                shadow-intensity="0.9" shadow-softness="0.9" exposure="1.05" environment-image="neutral" class="par3d-viewer">
                <button slot="ar-button" type="button" className="par3d-ar" onClick={() => track("ar", "table")}><ScanLine size={18} aria-hidden="true"/>Položiť na stôl</button>
              </model-viewer>
            : <p className="par3d-loading" role="status">{failed ? "3D model sa nepodarilo načítať. Skúste to znova neskôr." : "Načítavame 3D model…"}</p>}
        </div>
        <ul className="par3d-legend" aria-label="Kreslá strán">{model.ordered.map(m => <li key={m.id}><i style={{ background: m.color }} aria-hidden="true"/>{m.short}<b>{m.seats}</b></li>)}</ul>
        <p className="par3d-note">Na telefóne s podporou rozšírenej reality tlačidlo „Položiť na stôl“ otvorí kameru a model postaví na stôl alebo podlahu. Scenár, nie predpoveď; farby slúžia len na rozlíšenie strán.</p>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>;
}
