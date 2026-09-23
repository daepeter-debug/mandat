"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download, Share } from "lucide-react";

// Inštalácia Mandátu na plochu. Chrome/Edge/Android: vlastné tlačidlo (udalosť beforeinstallprompt zachytí skript
// v app/layout.tsx, lebo môže prísť skôr, než sa načíta React). iPhone/iPad: návod cez Zdieľať. Nainštalovaná
// aplikácia (display-mode: standalone) tlačidlo nevidí. Service worker (public/sw.js) sa registruje len na webe, nie lokálne.
type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
declare global { interface Window { __mandatInstall?: InstallPrompt | null } }

type InstallState = "prompt" | "ios" | "none";
const EVENT = "mandat-install";

function subscribe(onChange: () => void) {
  const installed = () => { window.__mandatInstall = null; onChange(); };
  window.addEventListener(EVENT, onChange);
  window.addEventListener("appinstalled", installed);
  return () => { window.removeEventListener(EVENT, onChange); window.removeEventListener("appinstalled", installed); };
}
function getState(): InstallState {
  const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (standalone) return "none";
  if (window.__mandatInstall) return "prompt";
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return ios ? "ios" : "none";
}

export function useServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator) || ["localhost", "127.0.0.1"].includes(location.hostname)) return;
    const register = () => { navigator.serviceWorker.register("/sw.js").catch(() => { /* bez offline režimu */ }); };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);
}

export default function InstallApp() {
  const state = useSyncExternalStore(subscribe, getState, () => "none" as InstallState);
  const [help, setHelp] = useState(false);
  if (state === "none") return null;
  async function install() {
    const prompt = window.__mandatInstall;
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice.catch(() => null);
    window.__mandatInstall = null;             // výzvu možno použiť len raz
    window.dispatchEvent(new Event(EVENT));
  }
  return <div className="app-install">
    <button type="button" className="app-install-button" aria-expanded={state === "ios" ? help : undefined} onClick={state === "prompt" ? install : () => setHelp(h => !h)}>
      <Download size={20} aria-hidden="true"/>
      <span>Pridať Mandát na plochu<small>Otvára sa ako aplikácia, naposledy videné časti aj offline</small></span>
    </button>
    {state === "ios" && help && <p className="app-install-help">V Safari ťuknite na <b><Share size={15} aria-label="Zdieľať"/> Zdieľať</b> a potom na <b>Pridať na plochu</b>.</p>}
  </div>;
}
