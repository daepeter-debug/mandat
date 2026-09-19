"use client";

import { lazy, Suspense, useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { hemicycleSeats } from "@/lib/parliament";
import DecemberTown from "@/components/december-town";
import "@/app/games-room.css";

/*
  Herňa: jedna záložka, viac hier. Výber hry je v adrese (g=majority | g=december), aby sa dal
  zdieľať odkaz priamo na hru; návrat „Všetky hry“ vráti fokus na kartu hry, z ktorej sa odišlo.
  Hry sa načítajú až pri otvorení, Herňa sama je ľahká.
*/
const DailyGame = lazy(() => import("@/components/daily-game"));
const DecemberGame = lazy(() => import("@/components/december-game"));
const seats = hemicycleSeats(150);
export type GameId = "majority" | "december";
export const gameIds: GameId[] = ["majority", "december"];

export default function GamesRoom({ game, onGame }: { game: GameId | null; onGame: (game: GameId | null) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const lastGame = useRef<GameId>(game ?? "majority");
  function open(next: GameId | null) {
    if (next) lastGame.current = next;
    onGame(next);
    requestAnimationFrame(() => {
      const target = container.current?.querySelector<HTMLElement>(next ? ".games-back" : `[data-game="${lastGame.current}"]`);
      target?.focus({ preventScroll: true });
      container.current?.scrollIntoView({ block: "start", behavior: "instant" });
    });
  }
  return <div className="games-room" ref={container}>
    {game ? <>
      <button type="button" className="games-back" onClick={() => open(null)}><ArrowLeft size={17} aria-hidden="true"/> Všetky hry</button>
      {game === "majority"
        ? <Suspense fallback={<p className="chart-loading" role="status">Načítavame Dennú väčšinu…</p>}><DailyGame/></Suspense>
        : <Suspense fallback={<p className="chart-loading" role="status">Načítavame Mandátovce…</p>}><DecemberGame/></Suspense>}
    </> : <>
      <header className="games-room-heading"><h1>Herňa</h1><p>Na chvíľu vymeň prieskumy za vlastné ťahy. Dve hry, každá na pár minút, nová výzva každý deň.</p></header>
      <div className="games-collection">
        <article className="games-entry games-majority">
          <div className="games-parliament" aria-hidden="true"><svg viewBox="-1.08 -1.08 2.16 1.2">{seats.map((seat, i) => <circle key={i} cx={seat.x} cy={seat.y} r="0.023" fill={i < 35 ? "#496bd1" : i < 76 ? "#dcf59b" : "#536e61"}/>)}</svg><span>76 <small>zo 150 kresiel</small></span></div>
          <div className="games-entry-body"><h2>Denná väčšina</h2><div className="games-entry-meta"><span>Logický hlavolam</span><span>1–3 min</span></div><p>Šesť fiktívnych strán. Zostav najtesnejšiu koalíciu, ktorá splní všetky pravidlá.</p><p className="games-entry-detail">Nová výzva každý deň + voľný tréning.</p><button type="button" className="games-play" data-game="majority" onClick={() => open("majority")}>Zahrať si <ArrowRight size={17} aria-hidden="true"/></button></div>
        </article>
        <article className="games-entry games-december">
          <div className="games-town"><DecemberTown month={11} flags={["bridge-fixed", "playground", "market", "tree", "bus", "led"]} decorative/></div>
          <div className="games-entry-body"><h2>Do decembra</h2><div className="games-entry-meta"><span>Malé mesto, veľké rozhodnutia</span><span>5–8 min</span></div><p>Postaraj sa o Mandátovce. Dvanásť mesačných správ, dve možnosti pri každej — a rozpočet, ktorý nestačí na všetko.</p><p className="games-entry-detail">Denná sezóna rovnaká pre všetkých + tréning.</p><button type="button" className="games-play" data-game="december" onClick={() => open("december")}>Zahrať si <ArrowRight size={17} aria-hidden="true"/></button></div>
        </article>
      </div>
      <p className="games-room-footnote">Fiktívne situácie, priestor na vlastné rozhodnutia. Hry nehodnotia skutočné politické strany ani obce.</p>
    </>}
  </div>;
}
