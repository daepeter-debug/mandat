import { kindNames, required, skDay, type VoteSummary } from "./votes.ts";

/*
  Veľká tabuľa na stene 3D sály: desať polí medzi pilastrami okien (components/parliament-wall.tsx ju kreslí do textúry).
  Ukazuje to isté, čo text pod sálou, len veľkým písmom: pri hlasovaní päť kategórií hlasu, výsledok, potrebnú
  väčšinu a počet hlasov inak ako klub; inak kreslá strán alebo klubov aktuálneho obsadenia a väčšinu 76.
  Čísla sa len preberajú, nič sa tu neprepočítava okrem zlúčenia malých strán do „Ostatní“ (viac ako 8 položiek).
*/
export const WALL_PANELS = 10;
export const WALL_SLOTS = 8;
export type WallPanel = { label: string; value: string; note?: string; color: string; bar?: string; dim?: boolean; word?: boolean; empty?: boolean };
export type WallItem = { short: string; color: string; seats: number; dim?: boolean };
export type WallSeats = { title: string; date: string; items: WallItem[]; footer: { label: string; value: string; note?: string } };
export type WallScene = { kind: "vote"; vote: VoteSummary; differ: number } | ({ kind: "seats" } & WallSeats);

// Jasné tóny farieb hlasu pre svietiacu tabuľu (rovnaké poradie a význam ako markColors v lib/votes.ts).
export const WALL_VOTE = { Z: "#8fe3aa", P: "#ff9d96", "?": "#f8d47c", N: "#d4deea", "0": "#c5cbc8" } as const;
export const WALL_INK = "#f5eee0", WALL_SOFT = "#bfd2c8";
const deputies = (n: number) => n === 1 ? "poslanec" : n >= 2 && n <= 4 ? "poslanci" : "poslancov";

export function voteWall(vote: VoteSummary, differ: number): WallPanel[] {
  const need = required(vote);
  return [
    { label: "HLASOVANIE", value: skDay(vote.datum), note: vote.cas, color: WALL_INK, word: true },
    { label: kindNames[vote.druh].toUpperCase(), value: `${vote.schodza}.`, note: "schôdza", color: WALL_INK },
    { label: "ZA", value: String(vote.za), color: WALL_VOTE.Z, bar: WALL_VOTE.Z },
    { label: "PROTI", value: String(vote.proti), color: WALL_VOTE.P, bar: WALL_VOTE.P },
    { label: "ZDRŽALI SA", value: String(vote.zdrzalo), color: WALL_VOTE["?"], bar: WALL_VOTE["?"] },
    { label: "NEHLASOVALI", value: String(vote.nehlasovalo), color: WALL_VOTE.N, bar: WALL_VOTE.N },
    { label: "NEPRÍTOMNÍ", value: String(vote.nepritomni), color: WALL_VOTE["0"], bar: WALL_VOTE["0"] },
    { label: "VÝSLEDOK", value: vote.preslo ? "PREŠIEL" : "NEPREŠIEL", color: vote.preslo ? WALL_VOTE.Z : WALL_VOTE.P, word: true },
    { label: "POTREBNÝCH", value: String(need.votes), note: need.votes === 90 ? "tri pätiny" : /všetkých/.test(need.rule) ? "zo 150" : "z prítomných", color: WALL_INK },
    { label: "INAK AKO KLUB", value: String(differ), note: deputies(differ), color: WALL_INK },
  ];
}

/** Strany alebo kluby uprostred tabule; viac ako osem položiek sa zlúči do „Ostatní“, menej sa vycentruje. */
export function seatsWall(s: WallSeats): WallPanel[] {
  const items = s.items.length <= WALL_SLOTS ? s.items
    : [...s.items.slice(0, WALL_SLOTS - 1), { short: "Ostatní", color: "#9aa39c", seats: s.items.slice(WALL_SLOTS - 1).reduce((a, p) => a + p.seats, 0), dim: s.items.slice(WALL_SLOTS - 1).every(p => p.dim) }];
  const slots: WallPanel[] = Array.from({ length: WALL_SLOTS }, () => ({ label: "", value: "", color: WALL_SOFT, empty: true }));
  const offset = Math.floor((WALL_SLOTS - items.length) / 2);
  items.forEach((p, i) => { slots[offset + i] = { label: p.short, value: String(p.seats), color: p.dim ? "#6f7d76" : WALL_INK, bar: p.color, dim: p.dim }; });
  return [{ label: s.title, value: s.date, color: WALL_INK, word: true }, ...slots, { label: s.footer.label, value: s.footer.value, note: s.footer.note, color: WALL_INK }];
}

export const wallPanels = (scene: WallScene) => scene.kind === "vote" ? voteWall(scene.vote, scene.differ) : seatsWall(scene);
/** Text tabule pre čítačky obrazovky. */
export const wallText = (scene: WallScene) => wallPanels(scene).filter(p => !p.empty).map(p => [p.label, p.value, p.note].filter(Boolean).join(" ")).join(". ");
