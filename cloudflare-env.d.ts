declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    // Tridsiatka online (rebríček kvízu dňa a výzvy), worker/quiz-board.ts
    QUIZ?: DurableObjectNamespace<import("./worker/quiz-board").QuizBoard>;
  }
}
