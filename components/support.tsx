"use client";

import { lazy, Suspense, useEffect, useState, useSyncExternalStore } from "react";
import { Heart } from "lucide-react";
import { isCheckoutSessionId, SUPPORT_ENDPOINT, type SupportConfig } from "@/lib/support";
import { track } from "@/lib/track";
import "@/app/support-entry.css";

/*
  Vstupy do podpory Mandátu (hlavička, pätička, panel Viac, O dátach) a hostiteľ platobného panela.
  Podpora sa ukáže, len keď ju server zapne (kľúče Stripe sú nastavené). Testovací režim je viditeľný všetkým
  (web zatiaľ nie je verejne propagovaný, Petrovo rozhodnutie 10. 10. 2026) a panel ho výrazne označuje; skutočnú
  kartu Stripe v teste odmietne. Stripe.js sa načíta až v paneli po výbere sumy, nie pri návšteve webu.
  Adresa ?podpora=1 (aj staršia ?podpora=test) panel otvorí rovno.
*/
const OPEN_EVENT = "mandat:podpora";
const SupportSheet = lazy(() => import("@/components/support-sheet"));

type State = { config: SupportConfig | null };
const initial: State = { config: null };
let state = initial, started = false;
const listeners = new Set<() => void>();

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  // Zistenie stavu až po načítaní stránky, nech nezdržiava prvé vykreslenie.
  setTimeout(() => {
    fetch(SUPPORT_ENDPOINT, { cache: "no-store" })
      .then(r => r.ok ? r.json() as Promise<SupportConfig> : { enabled: false as const })
      .catch(() => ({ enabled: false as const }))
      .then(config => { state = { config }; listeners.forEach(l => l()); });
  }, 800);
}
function subscribe(listener: () => void) { start(); listeners.add(listener); return () => { listeners.delete(listener); }; }

/** Konfigurácia podpory, ak je zapnutá, inak null. */
export function useSupport() {
  const s = useSyncExternalStore(subscribe, () => state, () => initial);
  return s.config?.enabled ? s.config : null;
}

export const openSupport = () => window.dispatchEvent(new Event(OPEN_EVENT));

/** Nenápadné tlačidlo „Podporiť Mandát“; kým podpora nie je zapnutá, nevykreslí nič. */
export function SupportButton({ variant, onBeforeOpen }: { variant: "header" | "footer" | "more" | "inline"; onBeforeOpen?: () => void }) {
  const config = useSupport();
  if (!config) return null;
  const open = () => { onBeforeOpen?.(); openSupport(); };
  if (variant === "more") return <button type="button" className="support-entry support-entry-more" onClick={open}><Heart aria-hidden="true"/><b>Podporiť Mandát</b><small>Dobrovoľný príspevok na prevádzku</small></button>;
  return <button type="button" className={`support-entry support-entry-${variant}`} onClick={open} aria-label={variant === "header" ? "Podporiť Mandát" : undefined}>
    <Heart size={variant === "inline" ? 17 : 15} aria-hidden="true"/><span>{variant === "header" ? "Podporiť" : "Podporiť Mandát"}</span>
  </button>;
}

/** Pokojná sekcia na konci úvodnej stránky (Prehľad): text a jedno tlačidlo, bez vyskakovania. */
export function SupportSection() {
  const config = useSupport();
  if (!config) return null;
  return <section className="support-section" aria-labelledby="support-section-title">
    <Heart className="support-section-mark" size={26} aria-hidden="true"/>
    <div>
      <h2 id="support-section-title">Podporte nezávislý Mandát</h2>
      <p>Mandát je nezávislý projekt bez reklamy. Ak ho považujete za užitočný, môžete dobrovoľne prispieť na jeho prevádzku a ďalší rozvoj.</p>
    </div>
    <button type="button" className="support-entry support-entry-inline" onClick={openSupport}><Heart size={17} aria-hidden="true"/><span>Podporiť Mandát</span></button>
  </section>;
}

/** Doplnok do „Súkromie a štatistika“: platí len vtedy, keď je podpora zapnutá. */
export function SupportPrivacyNote() {
  if (!useSupport()) return null;
  return <p>Platobný formulár Stripe sa načíta až vtedy, keď sa rozhodnete Mandát podporiť, a na bezpečnosť platby používa vlastné cookies. Platbu spracuje Stripe podľa svojich <a className="source-link" href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">zásad ochrany súkromia</a>. Mandát číslo karty nevidí; v administrácii Stripe vidí sumu, e-mail a meno zadané pri platbe a nezverejňuje ich.</p>;
}

/** Jeden platobný panel pre celý web. Otvára ho openSupport() alebo adresa ?podpora=1 (a návrat zo Stripe ?podpora=hotovo). */
export function SupportHost() {
  const config = useSupport();
  const [open, setOpen] = useState(false);
  const [returned, setReturned] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const show = () => { setMounted(true); setOpen(true); track("podpora", "otvorenie"); };
    window.addEventListener(OPEN_EVENT, show);
    return () => window.removeEventListener(OPEN_EVENT, show);
  }, []);

  // Parametre v adrese sa spracujú raz, keď je jasné, že podpora je zapnutá, a z adresy sa odstránia.
  useEffect(() => {
    if (!config) return;
    const params = new URLSearchParams(location.search), value = params.get("podpora");
    if (!value) return;
    const session = params.get("session_id");
    params.delete("podpora"); params.delete("session_id");
    const rest = params.toString();
    history.replaceState(history.state, "", `${location.pathname}${rest ? `?${rest}` : ""}${location.hash}`);
    setTimeout(() => {
      if (value === "hotovo" && session && isCheckoutSessionId(session)) setReturned(session);
      setMounted(true); setOpen(true);
    }, 0);
  }, [config]);

  if (!config || !mounted) return null;
  return <Suspense fallback={null}>
    <SupportSheet config={config} open={open} returnedSession={returned} onOpenChange={next => { setOpen(next); if (!next) setReturned(null); }}/>
  </Suspense>;
}
