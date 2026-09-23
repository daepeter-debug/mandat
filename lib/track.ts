/*
  Anonymná štatistika používania Mandátu. Posiela sa len názov udalosti a krátky údaj (napr. ktorá sekcia),
  či ide o mobil a tmavý režim — bez cookies, identifikátorov, IP adries v dátach a osobných údajov.
  Príjemca je vlastný Worker (/api/udalost), ktorý záznam zapíše do Cloudflare Workers Logs; tretie strany
  nič nedostanú. Pri „Do Not Track“ alebo Global Privacy Control a na lokálnom serveri sa neposiela nič.
  Zoznam povolených udalostí a údajov kontroluje aj server (app/api/udalost/route.ts).
*/
export const TRACK_EVENTS = ["view", "story", "theme", "install", "rss", "share", "year", "tax", "ar", "listen"] as const; // listen: detail = id nahrávky (story, kresla, profil-…, rychla-…)
export type TrackEvent = typeof TRACK_EVENTS[number];
export const TRACK_ENDPOINT = "/api/udalost";

export function track(event: TrackEvent, detail?: string) {
  if (typeof window === "undefined") return;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  if (nav.doNotTrack === "1" || nav.globalPrivacyControl === true) return;
  if (["localhost", "127.0.0.1"].includes(window.location.hostname)) return;
  const body = JSON.stringify({
    e: event,
    d: detail,
    m: window.matchMedia("(max-width: 760px)").matches,
    t: document.documentElement.dataset.theme === "dark",
    a: window.matchMedia("(display-mode: standalone)").matches,
  });
  try {
    if (!navigator.sendBeacon?.(TRACK_ENDPOINT, new Blob([body], { type: "application/json" }))) {
      void fetch(TRACK_ENDPOINT, { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {});
    }
  } catch { /* štatistika nesmie nič pokaziť */ }
}
