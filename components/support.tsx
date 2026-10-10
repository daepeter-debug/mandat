"use client";

import { lazy, Suspense, useEffect, useState, useSyncExternalStore } from "react";
import { Heart } from "lucide-react";
import { isCheckoutSessionId, SUPPORT_ENDPOINT, type SupportConfig } from "@/lib/support";
import { track } from "@/lib/track";
import "@/app/support-entry.css";

/*
  Vstupy do podpory Mandátu (hlavička, pätička, panel Viac, O dátach) a hostiteľ platobného panela.
  Podpora sa ukáže, len keď ju server zapne (kľúče Stripe sú nastavené). V testovacom režime ju vidí iba ten,
  kto otvoril web s ?podpora=test (pamätá sa do zatvorenia karty), aby sa testovacie okno neukazovalo verejnosti.
  Stripe.js sa načíta až v paneli po výbere sumy, nie pri návšteve webu.
*/
const OPEN_EVENT = "mandat:podpora";
const TEST_KEY = "mandat:podpora-test";
const SupportSheet = lazy(() => import("@/components/support-sheet"));

type State = { config: SupportConfig | null; test: boolean };
const initial: State = { config: null, test: false };
let state = initial, started = false;
const listeners = new Set<() => void>();

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  try {
    if (new URLSearchParams(location.search).get("podpora") === "test") sessionStorage.setItem(TEST_KEY, "1");
    state = { ...state, test: sessionStorage.getItem(TEST_KEY) === "1" };
  } catch { /* súkromné okno bez úložiska */ }
  // Zistenie stavu až po načítaní stránky, nech nezdržiava prvé vykreslenie.
  setTimeout(() => {
    fetch(SUPPORT_ENDPOINT, { cache: "no-store" })
      .then(r => r.ok ? r.json() as Promise<SupportConfig> : { enabled: false as const })
      .catch(() => ({ enabled: false as const }))
      .then(config => { state = { ...state, config }; listeners.forEach(l => l()); });
  }, 800);
}
function subscribe(listener: () => void) { start(); listeners.add(listener); return () => { listeners.delete(listener); }; }

/** Konfigurácia podpory, ak sa má tomuto návštevníkovi ukázať, inak null. */
export function useSupport() {
  const s = useSyncExternalStore(subscribe, () => state, () => initial);
  return s.config?.enabled && (s.config.mode === "live" || s.test) ? s.config : null;
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
