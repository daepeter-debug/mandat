import { DurableObject } from "cloudflare:workers";
import { QuizStore, type Reply } from "@/lib/quiz-store";

// Odpoveď cez RPC: stavový kód a hotový JSON (Durable Object ho serializuje sám, route.ts ho len odovzdá).
export type RpcReply = { status: number; json: string };
const pack = (r: Reply): RpcReply => ({ status: r.status, json: JSON.stringify(r.body) });

/*
  Durable Object Tridsiatky online: jedna inštancia („tridsiatka“) so SQLite úložiskom drží rebríčky kvízu dňa,
  úspešnosť otázok a výzvy (logika v lib/quiz-store.ts). Volá ho len app/api/kviz/route.ts cez RPC.
  Limit pokusov: najviac 60 zápisov za minútu z jednej IP adresy (aj trieda v školskej sieti); kľúč je jej odtlačok s dátumom,
  drží sa iba v pamäti a nikam sa neukladá.
*/
const WINDOW = 60_000, LIMIT = 60;

export class QuizBoard extends DurableObject<Cloudflare.Env> {
  private store: QuizStore;
  private hits = new Map<string, number[]>();
  constructor(ctx: DurableObjectState, env: Cloudflare.Env) {
    super(ctx, env);
    this.store = new QuizStore(ctx.storage.sql, fn => ctx.storage.transactionSync(fn));
  }
  read(search: string): RpcReply {
    return pack(this.store.get(new URLSearchParams(search)));
  }
  write(input: Record<string, unknown>, client: string): RpcReply {
    const now = Date.now(), recent = (this.hits.get(client) ?? []).filter(t => now - t < WINDOW);
    recent.push(now);
    if (this.hits.size > 10_000) this.hits.clear();
    this.hits.set(client, recent);
    if (recent.length > LIMIT) return pack({ status: 429, body: { error: "Príliš veľa pokusov za minútu. Skús to o chvíľu." } });
    return pack(this.store.post(input));
  }
}
