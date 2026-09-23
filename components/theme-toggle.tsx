"use client";

import { useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { Moon, Sun } from "lucide-react";
import { darkThemeColor } from "@/lib/theme-colors";
import "@/app/theme-toggle.css";

// Tmavý režim len na požiadanie: predvolený je svetlý, voľba sa pamätá v prehliadači. Skript v app/layout.tsx
// ju nastaví ešte pred prvým vykreslením, aby stránka pri načítaní neblikla. Štýly: app/theme-dark.css (generované).
export const THEME_KEY = "mandat-theme";
const LIGHT_COLOR = "#f4f6f0";
const EVENT = "mandat-theme";

function apply(dark: boolean) {
  const root = document.documentElement;
  // Tlačidlá a odkazy majú prechod farieb; pri prepnutí režimu by sa rozbehli naraz (a v obrázku preliatia boli staré).
  const still = document.createElement("style");
  still.textContent = "*,*::before,*::after{transition:none!important}";
  document.head.appendChild(still);
  if (dark) root.dataset.theme = "dark"; else delete root.dataset.theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? darkThemeColor : LIGHT_COLOR);
  void window.getComputedStyle(document.body).color;
  window.setTimeout(() => still.remove(), 30);
}

function subscribe(onChange: () => void) {
  // Voľba z inej karty prehliadača sa prejaví aj tu.
  const onStorage = (e: StorageEvent) => { if (e.key === THEME_KEY) { apply(e.newValue === "dark"); onChange(); } };
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => { window.removeEventListener(EVENT, onChange); window.removeEventListener("storage", onStorage); };
}
const isDark = () => document.documentElement.dataset.theme === "dark";

// Prepnutie s kruhovým preliatím od tlačidla (View Transitions); bez podpory alebo pri obmedzení pohybu okamžite.
export function setTheme(dark: boolean, origin?: { x: number; y: number }) {
  try { localStorage.setItem(THEME_KEY, dark ? "dark" : "light"); } catch { /* súkromné okno: voľba platí do zatvorenia */ }
  let done = false;
  const update = () => { if (done) return; done = true; apply(dark); flushSync(() => window.dispatchEvent(new Event(EVENT))); };
  const root = document.documentElement;
  if (!origin || !document.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { update(); return; }
  root.classList.add("vt-theme");
  const transition = document.startViewTransition(update);
  window.setTimeout(update, 400);   // prehliadač, ktorý práve nevykresľuje (karta na pozadí), prepne aj bez animácie
  transition.ready.then(() => {
    const radius = Math.hypot(Math.max(origin.x, innerWidth - origin.x), Math.max(origin.y, innerHeight - origin.y));
    root.animate({ clipPath: [`circle(0px at ${origin.x}px ${origin.y}px)`, `circle(${radius}px at ${origin.x}px ${origin.y}px)`] },
      { duration: 520, easing: "cubic-bezier(.2,.7,.2,1)", pseudoElement: "::view-transition-new(root)" });
  }).catch(() => {});
  transition.finished.finally(() => root.classList.remove("vt-theme"));
}

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const dark = useSyncExternalStore(subscribe, isDark, () => false);
  return <button type="button" className={`theme-toggle ${className}`.trim()} aria-pressed={dark} aria-label="Tmavý režim" title={dark ? "Prepnúť na svetlý režim" : "Prepnúť na tmavý režim"}
    onClick={e => { const r = e.currentTarget.getBoundingClientRect(); setTheme(!dark, { x: r.left + r.width / 2, y: r.top + r.height / 2 }); }}>
    {dark ? <Sun size={17} aria-hidden="true"/> : <Moon size={17} aria-hidden="true"/>}
  </button>;
}
