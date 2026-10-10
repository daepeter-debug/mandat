declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    // Tridsiatka online (rebríček kvízu dňa a výzvy), worker/quiz-board.ts
    QUIZ?: DurableObjectNamespace<import("./worker/quiz-board").QuizBoard>;
    // Podpora cez Stripe (docs/podpora-stripe.md): tajomstvá Workera, nikdy nie vo wrangler konfigurácii ani v repe.
    STRIPE_SECRET_KEY?: string;
    STRIPE_PUBLISHABLE_KEY?: string;
    STRIPE_WEBHOOK_SECRET?: string;
    PODPORA_OSTRA?: string;
  }
}
