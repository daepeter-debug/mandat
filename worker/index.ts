import handler from "vinext/server/fetch-handler";

/*
  Vstup Workera: celý web obsluhuje vinext (stránky, API cesty, statické súbory), tento súbor k nemu len pridáva
  triedy Durable Objects, ktoré musia byť exportované z hlavného modulu (väzby vo wrangler.preview.jsonc a vite.config.ts).
*/
export { QuizBoard } from "./quiz-board";
export default handler;
