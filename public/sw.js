// Service worker Mandátu: inštalovateľná aplikácia a naposledy videné stránky aj bez signálu.
// Stránky: najprv sieť (vždy čerstvé údaje), bez siete posledná uložená verzia alebo offline.html.
// Súbory s hashom v názve (/_next/static) a písma: z cache. Obrázky: z cache a na pozadí sa obnovia.
// Pri zmene tohto súboru zvýšiť VERSION (staré cache sa zmažú).
const VERSION = "2026-09-23";
const PAGES = `mandat-pages-${VERSION}`;
const STATIC = `mandat-static-${VERSION}`;
const MEDIA = `mandat-media-${VERSION}`;
const OFFLINE = "/offline.html";
const MAX_PAGES = 24;
const MAX_MEDIA = 160;

self.addEventListener("install", event => {
  event.waitUntil(caches.open(PAGES).then(cache => cache.addAll([OFFLINE, "/favicon.svg"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  const keep = new Set([PAGES, STATIC, MEDIA]);
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("mandat-") && !keep.has(k)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

async function trim(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map(k => cache.delete(k)));
}

async function page(request) {
  try {
    const response = await fetch(request);
    if (response.ok && response.type === "basic") {
      const cache = await caches.open(PAGES);
      await cache.put(request, response.clone());
      trim(PAGES, MAX_PAGES);
    }
    return response;
  } catch {
    const cache = await caches.open(PAGES);
    return (await cache.match(request)) || (await cache.match("/", { ignoreSearch: true })) || (await cache.match(OFFLINE));
  }
}

async function immutable(request) {
  const cache = await caches.open(STATIC);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function media(request, event) {
  const cache = await caches.open(MEDIA);
  const hit = await cache.match(request);
  const fresh = fetch(request).then(response => {
    if (response.ok) cache.put(request, response.clone()).then(() => trim(MEDIA, MAX_MEDIA));
    return response;
  });
  if (hit) { event.waitUntil(fresh.catch(() => {})); return hit; }
  return fresh;
}

self.addEventListener("fetch", event => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === "navigate") { event.respondWith(page(request)); return; }
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/fonts/")) { event.respondWith(immutable(request)); return; }
  if (/^\/(images|logos|people|og)\//.test(url.pathname) || /^\/(icon-|apple-touch-icon|favicon)/.test(url.pathname)) { event.respondWith(media(request, event)); return; }
  // Ostatné (dáta pre navigáciu, API) idú vždy zo siete.
});
