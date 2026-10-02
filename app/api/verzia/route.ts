// Verzia nasadenia (značka buildu z vite.config.ts) pre kontrolu po návrate aplikácie z pozadia (components/app-install.tsx).
export function GET() {
  return new Response(JSON.stringify({ v: __MANDAT_BUILD__ }), {
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}
