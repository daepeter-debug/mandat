import type { NextConfig } from "next";

/*
  Bezpečnostné hlavičky pre stránky a API (vinext ich pridá ku každej odpovedi Workera).
  Statické súbory z dist/client obsluhuje Cloudflare priamo, tie majú rovnaké hlavičky v public/_headers.

  Content-Security-Policy povoľuje len vlastný web a Stripe (platobný formulár podpory, docs/podpora-stripe.md):
  - script-src 'unsafe-inline': React vkladá pri streamovaní malé inline skripty a layout má skript tmavého režimu
    (nonce vinext nepodporuje). Cudzie skripty sa načítať nedajú, okrem js.stripe.com.
  - 'wasm-unsafe-eval': model-viewer (3D sála) kompiluje WebAssembly dekodér; povoľuje len WebAssembly, nie eval JavaScriptu.
  - connect-src blob:/data:: model-viewer (3D sála) načítava textúry modelu cez blob adresy.
  - frame-ancestors 'none' + X-Frame-Options: Mandát (a platobný panel) nejde vložiť do cudzej stránky (clickjacking).
  Nový externý zdroj (CDN, vložené video, analytika) treba pridať sem, inak ho prehliadač zablokuje.
*/
const stripe = "https://js.stripe.com https://*.js.stripe.com";
export const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' ${stripe}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.stripe.com",
  "font-src 'self' data:",
  "media-src 'self' data: blob:",
  "connect-src 'self' blob: data: https://api.stripe.com https://*.stripe.com",
  `frame-src ${stripe} https://hooks.stripe.com https://checkout.stripe.com`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

export const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  // Funkcie zariadenia, ktoré Mandát nepoužíva. Platby (Apple Pay vo formulári Stripe) a WebXR (AR) sa neobmedzujú.
  { key: "Permissions-Policy", value: "geolocation=(), microphone=(), usb=(), serial=(), hid=(), bluetooth=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    // vinext vzor „/:path*“ na samotný koreň „/“ nepoužije, preto má úvodná stránka vlastné pravidlo.
    return [{ source: "/", headers: securityHeaders }, { source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
