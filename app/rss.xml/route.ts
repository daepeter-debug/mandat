import { buildPollsFeed } from "@/lib/rss";

// RSS odber nových prieskumov. Adresa webu sa berie z požiadavky (preview aj budúca doména).
export function GET(request: Request) {
  const origin = new URL(request.url).origin;
  return new Response(buildPollsFeed(origin), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=900",
    },
  });
}
