/** Shared, lightweight catalogue; importing navigation never loads the games. */
export const gameIds = ["quiz", "words", "majority", "december", "republic"] as const;
export type GameId = typeof gameIds[number];
export const gameCount = gameIds.length;
