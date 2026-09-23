import { flushSync } from "react-dom";

/*
  „Preletenie“ prvku (shared-element View Transition): zdrojový prvok v starom stave a cieľ v novom stave majú
  rovnaké view-transition-name, prehliadač medzi nimi plynulo presunie polohu aj veľkosť (logo strany → hlavička
  profilu, krúžok „Mandát za minútu“ → karta príbehu). Cieľ dostane meno cez triedu na <html>, ktorá sa pridá až
  po zachytení starého stavu (inak by meno bolo dvakrát). Štýly animácií: app/motion.css.
  Bez podpory View Transitions alebo pri „obmedziť pohyb“ sa stav zmení hneď, bez animácie.
*/
export const canMorph = (from: Element | null | undefined): from is HTMLElement =>
  !!from && typeof document !== "undefined" && typeof document.startViewTransition === "function" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function run(start: () => void, go: () => void, done: () => void) {
  start();
  let fired = false;
  const once = () => { if (fired) return; fired = true; go(); };
  const transition = document.startViewTransition(once);
  window.setTimeout(once, 400);   // prehliadač, ktorý práve nevykresľuje, zmení stav aj bez animácie
  transition.ready.catch(() => {});
  transition.updateCallbackDone.catch(() => {});
  transition.finished.catch(() => {}).finally(done);
}

/** Otvorenie: `from` → cieľ (CSS `html.<htmlClass> .cieľ { view-transition-name: <name> }`). */
export function morphTo(from: HTMLElement, name: string, htmlClass: string, update: () => void) {
  const root = document.documentElement;
  run(
    () => { from.style.viewTransitionName = name; },
    () => { from.style.viewTransitionName = ""; root.classList.add(htmlClass); flushSync(update); },
    () => root.classList.remove(htmlClass),
  );
}

/** Zatvorenie: pomenovaný cieľ (trieda na <html> už v starom stave) → späť do `to`. Cieľ musí po zmene zmiznúť. */
export function morphBack(to: HTMLElement, name: string, htmlClass: string, update: () => void) {
  const root = document.documentElement;
  run(
    () => root.classList.add(htmlClass),
    () => { to.style.viewTransitionName = name; flushSync(update); },
    () => { to.style.viewTransitionName = ""; root.classList.remove(htmlClass); },
  );
}
