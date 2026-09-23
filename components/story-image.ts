import { MAJORITY } from "@/lib/blocs";
import { edition, signed } from "@/lib/edition";
import { date, fmt } from "@/lib/polls";
import { blocs, debtAt, debtLastMeur, debtPerSecond, debtYear, down, edge, leader, lowerFirst, majorityWinner, population, pollWordNew, ranked, seatPoints, seatSide, slides, storyParty, up, type SlideId } from "@/lib/story-data";
import { currentSeatUncertainty, inRuns } from "@/lib/uncertainty";

/*
  Karta „Mandát za minútu“ ako obrázok 1080 × 1920 (formát príbehov na Instagrame a pod.). Kreslí sa priamo
  na canvas z rovnakých dát ako karta na webe; dôležitý obsah je mimo horných a dolných 250 px, kam siete
  vkladajú vlastné ovládanie. Vpravo dole je adresa webu a dátum údajov.
*/
const W = 1080, H = 1920, X = 96, R = W - 96;
const FONT = `"IBM Plex Sans Variable", "IBM Plex Sans", "Segoe UI", Arial, sans-serif`;
const INK = "#f3f7ef", SOFT = "#cfe0d6", FAINT = "#b8ccbf", LIME = "#dcf59b";
type Ctx = CanvasRenderingContext2D;

const font = (ctx: Ctx, weight: number, size: number) => { ctx.font = `${weight} ${size}px ${FONT}`; };
function wrap(ctx: Ctx, text: string, max: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > max && line) { lines.push(line); line = word; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}
function para(ctx: Ctx, text: string, x: number, y: number, max: number, lh: number, align: CanvasTextAlign = "left") {
  ctx.textAlign = align;
  const lines = wrap(ctx, text, max);
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lh));
  ctx.textAlign = "left";
  return y + lines.length * lh;
}
function fit(ctx: Ctx, text: string, max: number) {
  if (ctx.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1);
  return `${t}…`;
}
function round(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}
function dot(ctx: Ctx, x: number, y: number, r: number, color: string, ring = false) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
  if (ring) { ctx.lineWidth = 5; ctx.strokeStyle = "#ffffff"; ctx.stroke(); }
}
function arrow(ctx: Ctx, cx: number, cy: number, upward: boolean, color: string) {
  const s = upward ? -1 : 1;
  ctx.strokeStyle = color; ctx.lineWidth = 8; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath(); ctx.moveTo(cx - 16, cy - 16 * s); ctx.lineTo(cx + 16, cy + 16 * s); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 16, cy + 16 * s); ctx.lineTo(cx + 16, cy); ctx.moveTo(cx + 16, cy + 16 * s); ctx.lineTo(cx, cy + 16 * s); ctx.stroke();
}

// Logo Mandátu: rovnaké bodky ako favicon (mriežka 64 × 64).
const logoDots: [number, number, boolean][] = [[10, 43, true], [16.4, 27.4, true], [32, 21, true], [21, 43, true], [32, 32, true], [47.6, 27.4, false], [54, 43, false], [43, 43, false]];
function frame(ctx: Ctx, bg: string, label: string, index: number) {
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  const g1 = ctx.createRadialGradient(W * 0.85, -H * 0.08, 0, W * 0.85, -H * 0.08, W * 1.25);
  g1.addColorStop(0, "rgba(255,255,255,0.13)"); g1.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g1; ctx.fillRect(0, 0, W, H);
  const g2 = ctx.createRadialGradient(-W * 0.1, H * 1.08, 0, -W * 0.1, H * 1.08, W);
  g2.addColorStop(0, "rgba(220,245,155,0.10)"); g2.addColorStop(1, "rgba(220,245,155,0)");
  ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);
  // značka
  for (const [x, y, light] of logoDots) dot(ctx, X + x * 1.25, 150 + y * 1.25, 5.8, light ? "#f5f4ee" : "#9dbb86");
  font(ctx, 700, 58); ctx.fillStyle = INK; ctx.fillText("mandát", X + 92, 210);
  const w = ctx.measureText("mandát").width; ctx.fillStyle = "#9dbb86"; ctx.fillText(".", X + 92 + w, 210);
  font(ctx, 600, 30); ctx.fillStyle = FAINT; ctx.textAlign = "right"; ctx.fillText(`Mandát za minútu · ${index + 1}/${slides.length}`, R, 204); ctx.textAlign = "left";
  // nadpis karty
  if ("letterSpacing" in ctx) (ctx as Ctx & { letterSpacing: string }).letterSpacing = "5px";
  font(ctx, 650, 34); ctx.fillStyle = LIME; ctx.fillText(label.toUpperCase(), X, 420);
  if ("letterSpacing" in ctx) (ctx as Ctx & { letterSpacing: string }).letterSpacing = "0px";
}
function footer(ctx: Ctx, source: string) {
  font(ctx, 500, 30); ctx.fillStyle = FAINT;
  para(ctx, source, X, 1545, R - X, 42);
  font(ctx, 650, 36); ctx.fillStyle = LIME; ctx.fillText(window.location.host, X, 1650);
}

function leaderCard(ctx: Ctx) {
  const u = currentSeatUncertainty();
  const p = storyParty(leader.partyId);
  dot(ctx, X + 22, 530, 22, p?.color ?? "#8a968c");
  font(ctx, 650, 72); ctx.fillStyle = INK; ctx.fillText(p?.short ?? leader.partyId, X + 64, 556);
  font(ctx, 650, 300); const big = fmt(leader.value); ctx.fillText(big, X - 10, 840);
  const bw = ctx.measureText(big).width; font(ctx, 600, 112); ctx.fillStyle = SOFT; ctx.fillText(" %", X - 10 + bw, 840);
  font(ctx, 400, 44); ctx.fillStyle = "#dde9e0";
  let y = para(ctx, `Pásmo neistoty ${fmt(leader.lower)}–${fmt(leader.upper)} %. Prvé miesto ${inRuns(u.parties[leader.partyId]?.first ?? 0)}.`, X, 940, R - X, 60);
  const top = ranked.slice(0, 5), max = Math.max(...top.map(v => v.upper));
  y += 60;
  for (const v of top) {
    const party = storyParty(v.partyId);
    font(ctx, 600, 38); ctx.fillStyle = INK; ctx.fillText(fit(ctx, party?.short ?? v.partyId, 250), X, y + 13);
    round(ctx, 370, y - 13, 480 * v.value / max, 26, 13); ctx.fillStyle = party?.color ?? "#8a968c"; ctx.fill();
    ctx.textAlign = "right"; ctx.fillStyle = "#dde9e0"; ctx.fillText(`${fmt(v.value)} %`, R, y + 13); ctx.textAlign = "left";
    y += 78;
  }
  footer(ctx, `Model Mandát k ${date(edition.asOf)} · ${edition.agencies.length} agentúr · scenár, nie predpoveď`);
}

function seatsCard(ctx: Ctx) {
  const cx = W / 2, cy = 930, Rh = 420;
  seatPoints.forEach((p, i) => { const s = seatSide(i); dot(ctx, cx + p.x * Rh, cy + p.y * Rh, 13.5, s === "c" ? "#d98b7e" : s === "o" ? "#8db6dc" : "rgba(255,255,255,0.19)"); });
  font(ctx, 650, 160); ctx.fillStyle = "#f1b1a6"; ctx.fillText(String(blocs.coalition), X, 1140);
  ctx.textAlign = "right"; ctx.fillStyle = "#b3d3f0"; ctx.fillText(String(blocs.opposition), R, 1140); ctx.textAlign = "left";
  font(ctx, 600, 30); ctx.fillStyle = FAINT; ctx.textAlign = "center"; ctx.fillText(`VÄČŠINA ${MAJORITY}`, cx, 1105); ctx.textAlign = "left";
  font(ctx, 500, 36); ctx.fillStyle = SOFT;
  const lc = para(ctx, blocs.coalitionLabel, X, 1196, 400, 46);
  const lo = para(ctx, blocs.oppositionLabel, R, 1196, 400, 46, "right");
  const win = majorityWinner();
  font(ctx, 400, 44); ctx.fillStyle = "#dde9e0";
  const y = para(ctx, win ? `Väčšinu by mala ${lowerFirst(win.label)}, ${inRuns(win.share)}.` : "Väčšinu by nemal ani jeden blok.", X, Math.max(lc, lo) + 70, R - X, 60);
  font(ctx, 400, 30); ctx.fillStyle = FAINT;
  para(ctx, "Republiku ku koalícii a Hnutie Slovensko k opozícii radíme ako redakčný predpoklad, nie dohodu strán.", X, y + 10, R - X, 42);
  footer(ctx, `Model Mandát k ${date(edition.asOf)} · kreslá podľa § 68 · scenár, nie predpoveď`);
}

function monthCard(ctx: Ctx) {
  const row = (m: typeof up, y: number, rising: boolean) => {
    if (!m) return;
    round(ctx, X, y, R - X, 220, 36); ctx.fillStyle = "rgba(255,255,255,0.07)"; ctx.fill();
    dot(ctx, X + 86, y + 110, 50, rising ? LIME : "#f1b1a6");
    arrow(ctx, X + 86, y + 110, rising, rising ? "#1d3a2c" : "#4a1d18");
    const p = storyParty(m.id);
    dot(ctx, X + 190, y + 92, 14, p?.color ?? "#8a968c");
    font(ctx, 650, 56); ctx.fillStyle = INK; ctx.fillText(fit(ctx, m.short, 330), X + 216, y + 112);
    font(ctx, 500, 34); ctx.fillStyle = SOFT; ctx.fillText(`teraz ${fmt(m.value)} %`, X + 180, y + 164);
    ctx.textAlign = "right";
    font(ctx, 650, 104); ctx.fillStyle = rising ? LIME : "#f5b8ad"; ctx.fillText(signed(m.delta), R - 40, y + 128);
    font(ctx, 600, 32); ctx.fillStyle = SOFT; ctx.fillText("p. b.", R - 40, y + 176);
    ctx.textAlign = "left";
  };
  row(up, 520, true);
  row(down, 790, false);
  font(ctx, 400, 44); ctx.fillStyle = "#dde9e0";
  para(ctx, `Najväčší rast a pokles v Modeli Mandát od ${date(edition.monthAgo)}. Za ten čas pribudlo ${edition.newPolls.length} ${pollWordNew(edition.newPolls.length)}.`, X, 1130, R - X, 62);
  footer(ctx, `Model Mandát k ${date(edition.asOf)} · ${edition.agencies.length} agentúr · zmena v percentuálnych bodoch`);
}

function edgeCard(ctx: Ctx) {
  const u = currentSeatUncertainty();
  if (!edge.length) {
    font(ctx, 400, 48); ctx.fillStyle = "#dde9e0"; para(ctx, "Pásmo žiadnej strany dnes nepretína hranicu 5 %.", X, 560, R - X, 66);
    footer(ctx, `Model Mandát k ${date(edition.asOf)} · pásmo neistoty 95 %`);
    return;
  }
  const big = edge.length <= 2, x0 = big ? 420 : 360, x1 = 850, at = (v: number) => x0 + (x1 - x0) * Math.min(10, Math.max(0, v)) / 10;
  const top = big ? 660 : 560, step = big ? 180 : 130, track = big ? 60 : 44;
  font(ctx, 500, big ? 34 : 30); ctx.fillStyle = FAINT;
  ctx.fillText("0 %", x0, top); ctx.textAlign = "center"; ctx.fillText("5 %", at(5), top); ctx.textAlign = "right"; ctx.fillText("10 %", x1, top); ctx.textAlign = "left";
  let y = top + (big ? 110 : 90);
  for (const v of edge) {
    const p = storyParty(v.partyId);
    font(ctx, 600, big ? 44 : 40); ctx.fillStyle = INK; ctx.fillText(fit(ctx, p?.short ?? v.partyId, x0 - X - 24), X, y + 15);
    round(ctx, x0, y - track / 2, x1 - x0, track, track / 2); ctx.fillStyle = "rgba(255,255,255,0.07)"; ctx.fill();
    round(ctx, at(v.lower), y - track / 4, at(v.upper) - at(v.lower), track / 2, track / 4); ctx.globalAlpha = 0.6; ctx.fillStyle = p?.color ?? "#8a968c"; ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = LIME; ctx.fillRect(at(5) - 2, y - track / 2 - 16, 4, track + 32);
    dot(ctx, at(v.value), y, big ? 21 : 16, p?.color ?? "#8a968c", true);
    ctx.textAlign = "right"; font(ctx, 600, big ? 44 : 38); ctx.fillStyle = "#dde9e0"; ctx.fillText(`${fmt(v.value)} %`, R, y + 15); ctx.textAlign = "left";
    y += step;
  }
  font(ctx, 400, big ? 46 : 42); ctx.fillStyle = "#dde9e0";
  y = para(ctx, edge.map(v => `${storyParty(v.partyId)?.short}: nad 5 % ${inRuns(u.parties[v.partyId]?.entry ?? 0)}`).join(" · ") + ".", X, y + 30, R - X, 60);
  font(ctx, 400, 30); ctx.fillStyle = FAINT;
  para(ctx, "Pásmo neistoty týchto strán pretína hranicu 5 %. O vstupe do parlamentu rozhodnú voľby, nie prieskum.", X, y + 20, R - X, 42);
  footer(ctx, `Model Mandát k ${date(edition.asOf)} · ${edition.agencies.length} agentúr · scenár, nie predpoveď`);
}

function debtCard(ctx: Ctx) {
  const now = Date.now(), debt = debtAt(now);
  font(ctx, 650, 220); ctx.fillStyle = INK; ctx.fillText((debt / 1e9).toLocaleString("sk-SK", { minimumFractionDigits: 3, maximumFractionDigits: 3 }), X - 8, 720);
  font(ctx, 600, 88); ctx.fillStyle = SOFT; ctx.fillText("mld. €", X, 840);
  const card = (x: number, big: string, small: string) => {
    round(ctx, x, 920, 426, 200, 32); ctx.fillStyle = "rgba(255,255,255,0.07)"; ctx.fill();
    font(ctx, 650, 64); ctx.fillStyle = INK; ctx.fillText(big, x + 32, 1012);
    font(ctx, 500, 34); ctx.fillStyle = SOFT; ctx.fillText(small, x + 32, 1068);
  };
  card(X, `+${Math.round(debtPerSecond).toLocaleString("sk-SK")} €`, "každú sekundu");
  card(X + 462, `${Math.round(debt / population).toLocaleString("sk-SK")} €`, "na obyvateľa");
  font(ctx, 400, 36); ctx.fillStyle = "#dde9e0";
  const stamp = new Date(now).toLocaleString("sk-SK", { day: "numeric", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  para(ctx, `Stav k ${stamp}: odhad tempom rastu dlhu v roku ${debtYear}. Posledný údaj Eurostatu: ${(debtLastMeur / 1000).toLocaleString("sk-SK", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} mld. € ku koncu roka ${debtYear}.`, X, 1220, R - X, 54);
  footer(ctx, "Eurostat (dlh verejnej správy) · odhad Mandátu");
}

function youCard(ctx: Ctx) {
  font(ctx, 600, 112); ctx.fillStyle = INK;
  let y = para(ctx, "Čo zažil tvoj ročník?", X, 600, R - X, 124);
  font(ctx, 400, 46); ctx.fillStyle = "#dde9e0";
  y = para(ctx, "Zadaj rok narodenia a pozri, koľko vlád, premiérov a eur dlhu prešlo tvojím životom.", X, y + 40, R - X, 64);
  round(ctx, X, y + 60, R - X, 120, 30); ctx.fillStyle = LIME; ctx.fill();
  font(ctx, 650, 44); ctx.fillStyle = "#183c31"; ctx.fillText(fit(ctx, `${window.location.host} · Tvoje Slovensko`, R - X - 80), X + 40, y + 134);
  footer(ctx, "Mandát · nezávislý projekt bez reklamy");
}

const draw: Record<SlideId, (ctx: Ctx) => void> = { leader: leaderCard, seats: seatsCard, month: monthCard, edge: edgeCard, debt: debtCard, you: youCard };

export async function storyCardImage(id: SlideId): Promise<Blob | null> {
  await document.fonts?.load(`650 64px ${FONT}`).catch(() => undefined);
  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const index = slides.findIndex(s => s.id === id);
  frame(ctx, slides[index].bg, slides[index].label, index);
  draw[id](ctx);
  return new Promise(res => canvas.toBlob(res, "image/png"));
}
