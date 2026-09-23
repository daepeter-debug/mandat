import { memo, type ReactNode } from "react";
import type { Branch, ItemId } from "@/lib/republic";

/*
  Kúsky stolovej diorámy Malej republiky.
  Rovnaká izometria ako mapa: políčko 86 × 48 px, x a y v políčkach, z (výška) v px.
  Stred políčka je (0, 0). Svetlo zľava hore: ľavé steny svetlé, pravé v tieni, tiene padajú doprava dolu.
  Všetky súradnice sa zaokrúhľujú, aby server aj prehliadač vykreslili rovnaké čísla.
*/
export const TW = 43, TH = 24;
export type V = readonly [number, number, number?];
type Side = "l" | "r";
type Tone = readonly string[];
type Roof = { hi: string; lit: string; shade: string; back: string; line: string; edge: string };

const q = (n: number) => Math.round(n * 10) / 10;
export const iso = (x: number, y: number, z = 0): [number, number] => [q((x - y) * TW), q((x + y) * TH - z)];
export const pts = (...v: V[]) => v.map(p => iso(p[0], p[1], p[2]).join(",")).join(" ");
export const seg = (...v: V[]) => "M" + v.map(p => iso(p[0], p[1], p[2]).join(" ")).join("L");
// Bod na stene: „l“ je čelo otočené doľava dolu (rovina y = at), „r“ doprava dolu (rovina x = at); u beží pozdĺž steny.
const on = (s: Side, at: number, u: number, z: number): V => s === "l" ? [u, at, z] : [at, u, z];
const rect = (s: Side, at: number, u0: number, u1: number, z0: number, z1: number) => pts(on(s, at, u0, z0), on(s, at, u1, z0), on(s, at, u1, z1), on(s, at, u0, z1));
const lerp = (a: V, b: V, f: number): V => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, (a[2] ?? 0) + ((b[2] ?? 0) - (a[2] ?? 0)) * f];
// Lokálna sústava na stene (x pozdĺž steny, y dolu) — pre kruhy, hodiny a nápisy.
export const faceM = (s: Side, at: number, u: number, z: number) => { const [ex, ey] = iso(...on(s, at, u, z)); return `matrix(${s === "l" ? .874 : -.874} .488 0 1 ${ex} ${ey})`; };
// Polkruh bez goniometrie (rovnaké hodnoty na serveri aj v prehliadači).
const HALF = [[1, 0], [.924, .383], [.707, .707], [.383, .924], [0, 1], [-.383, .924], [-.707, .707], [-.924, .383], [-1, 0]] as const;
const OCT = [[.924, .383], [.383, .924], [-.383, .924], [-.924, .383], [-.924, -.383], [-.383, -.924], [.383, -.924], [.924, -.383]] as const;

const wall = {
  ivory: ["#f6e9cc", "#dcc6a0"], butter: ["#f4dca2", "#d8bd80"], mist: ["#dfe6e1", "#b9c5c1"], blush: ["#f2ddce", "#d5baa8"],
  white: ["#f8f5ee", "#dcd7cb"], stone: ["#efe5ce", "#d0c2a3"], hall: ["#f2d48f", "#d5b56d"], faded: ["#dcd2bd", "#bcb098"],
  sage: ["#e3e9d8", "#c1c9b3"], concrete: ["#ebe7da", "#cdc6b4"], school: ["#f5e4bf", "#d8c396"], craft: ["#f0e2c5", "#d3c09b"],
} as const;
const roof = {
  terracotta: { hi: "#da7d5c", lit: "#cf6f4f", shade: "#b05a41", back: "#9e4f39", line: "#98462f", edge: "#7b3827" },
  clay: { hi: "#df8f68", lit: "#d6835b", shade: "#b86b48", back: "#a65f40", line: "#a1573a", edge: "#84452d" },
  brick: { hi: "#bf705b", lit: "#b46450", shade: "#984f3e", back: "#874534", line: "#81402e", edge: "#6a3325" },
  copper: { hi: "#86b1a0", lit: "#78a594", shade: "#608c7c", back: "#557d6f", line: "#4f7669", edge: "#3f6156" },
  slate: { hi: "#93a6af", lit: "#869aa4", shade: "#70848e", back: "#647780", line: "#5f7079", edge: "#4f5e67" },
  zinc: { hi: "#a2a9ac", lit: "#959ca0", shade: "#7d8488", back: "#70777b", line: "#666d71", edge: "#555b5f" },
  sage: { hi: "#a2b7ab", lit: "#95ab9f", shade: "#7c9388", back: "#70877c", line: "#6a8076", edge: "#586b62" },
  moss: { hi: "#8cab75", lit: "#7f9f69", shade: "#698956", back: "#5d7c4c", line: "#58754a", edge: "#49623d" },
  weathered: { hi: "#ae9b85", lit: "#a4917b", shade: "#8a7865", back: "#7a6a58", line: "#706151", edge: "#5d5043" },
  teal: { hi: "#6fa198", lit: "#62958d", shade: "#4f7e77", back: "#46706a", line: "#426b65", edge: "#355853" },
} as const;
const stone = ["#cbbea3", "#ac9e82", "#ddd3bc"] as const, pale = ["#e2d9c5", "#c5baa3", "#ece5d5"] as const;
const socle = [stone[0], stone[1]] as const, ledge = ["#fbf4e2", "#e0d3b5"] as const;
const band = ["#fbf4e2", "#e0d3b5", "#fdf8eb"] as const, brick = ["#c97b5e", "#a55f47", "#8b4d3a"] as const, cap = ["#8c857a", "#6f695f", "#5f5a50"] as const;
const wood = ["#bf8b55", "#9c6c40", "#cd9b63"] as const, dark = "#3c4a44", trim = "#fbf4e2";
const leafTones = [["#4d7a4b", "#679557", "#88b264", "#aed07c"], ["#5c7c3f", "#789a4b", "#9ab85e", "#c2d67d"], ["#3e6947", "#55845a", "#72a169", "#97c07c"]] as const;
const pine = ["#5d8a5a", "#436b47"] as const;
const shadow = "#2e4a33";

function P({ p, f, o }: { p: V[]; f: string; o?: number }) { return <polygon points={pts(...p)} fill={f} opacity={o}/>; }
function Line({ d, c, w = 1, o }: { d: string; c: string; w?: number; o?: number }) { return <path d={d} stroke={c} strokeWidth={w} opacity={o} fill="none" strokeLinecap="round" strokeLinejoin="round"/>; }

function Box({ x = 0, y = 0, z = 0, w, d, h, c }: { x?: number; y?: number; z?: number; w: number; d: number; h: number; c: Tone }) {
  const x0 = x - w / 2, x1 = x + w / 2, y0 = y - d / 2, y1 = y + d / 2, t = z + h;
  return <>
    <P p={[[x1, y0, z], [x1, y1, z], [x1, y1, t], [x1, y0, t]]} f={c[1]}/>
    <P p={[[x0, y1, z], [x1, y1, z], [x1, y1, t], [x0, y1, t]]} f={c[0]}/>
    {c[2] && <P p={[[x0, y0, t], [x1, y0, t], [x1, y1, t], [x0, y1, t]]} f={c[2]}/>}
  </>;
}
// Mäkký vrhnutý tieň doprava dolu.
function Shadow({ x = 0, y = 0, w, d, len = .18 }: { x?: number; y?: number; w: number; d: number; len?: number }) {
  const x0 = x - w / 2, x1 = x + w / 2, y0 = y - d / 2, y1 = y + d / 2, far = Math.min(.5, x1 + len * 1.5), near = Math.min(.5, x1 + len);
  return <g><P p={[[x0, y0], [far, y0], [far, y1], [x0, y1]]} f={shadow} o={.06}/><P p={[[x0, y0], [near, y0], [near, y1], [x0, y1]]} f={shadow} o={.12}/></g>;
}
function Round({ x = 0, y = 0, z = 0, r, h = 0, f, side, o }: { x?: number; y?: number; z?: number; r: number; h?: number; f: string; side?: string; o?: number }) {
  const [cx, cy] = iso(x, y, z), rx = q(r * 60.8), ry = q(r * 33.9);
  return <>{side && h > 0 && <path d={`M${cx - rx} ${cy}A${rx} ${ry} 0 0 0 ${cx + rx} ${cy}V${q(cy - h)}A${rx} ${ry} 0 0 1 ${cx - rx} ${q(cy - h)}Z`} fill={side}/>}<ellipse cx={cx} cy={q(cy - h)} rx={rx} ry={ry} fill={f} opacity={o}/></>;
}

// Rady škridiel alebo drážky plechu na šikmej ploche a-b (odkvap) → d-c (hrebeň).
function glints(a: V, b: V, c: V, d: V, rows: number) {
  const at = (s: number, t: number) => lerp(lerp(a, b, s), lerp(d, c, s), t);
  let out = "";
  for (let k = 1; k <= rows; k++) { const t = k / rows - .16 / rows; out += seg(at(.02, t), at(.98, t)); }
  return out;
}
function tiles(a: V, b: V, c: V, d: V, rows: number, unit = .068, seams = false) {
  const at = (s: number, t: number) => lerp(lerp(a, b, s), lerp(d, c, s), t);
  const count = (t: number) => { const p = at(0, t), r = at(1, t); return Math.max(1, Math.round(Math.sqrt((r[0] - p[0]) ** 2 + (r[1] - p[1]) ** 2) / unit)); };
  let out = "";
  if (seams) { const n = count(0); for (let j = 1; j < n; j++) out += seg(at(j / n, 0), at(j / n, 1)); return out; }
  for (let k = 1; k < rows; k++) out += seg(at(0, k / rows), at(1, k / rows));
  for (let k = 0; k < rows; k++) { const n = count((k + .5) / rows); for (let j = k % 2 ? .5 : 1; j < n; j++) out += seg(at(j / n, k / rows), at(j / n, (k + 1) / rows)); }
  return out;
}
type RoofProps = { x?: number; y?: number; w: number; d: number; z: number; rise: number; o?: number; c: Roof; wl: Tone; seams?: boolean; children?: ReactNode };
// Sedlová strecha s hrebeňom pozdĺž x; štít je na pravej stene.
function GableX({ x = 0, y = 0, w, d, z, rise, o = .05, c, wl, seams, children }: RoofProps) {
  const x0 = x - w / 2 - o, x1 = x + w / 2 + o, xa = x + w / 2, yb = y - d / 2 - o, yf = y + d / 2 + o, t = z + rise, e = rise * o / (d / 2 + o);
  const rows = Math.max(3, Math.round(rise / 3.4)), unit = seams ? .055 : .068;
  return <>
    <P p={[[x0, yb, z], [x1, yb, z], [x1, y, t], [x0, y, t]]} f={c.back}/>
    <P p={[[xa, y - d / 2, z - 1], [xa, y + d / 2, z - 1], [xa, y + d / 2, z + e], [xa, y, t], [xa, y - d / 2, z + e]]} f={wl[1]}/>
    {children}
    <P p={[[x0, yf, z], [x1, yf, z], [x1, y, t], [x0, y, t]]} f={c.lit}/>
    {!seams && <Line d={glints([x0, yf, z], [x1, yf, z], [x1, y, t], [x0, y, t], rows)} c={c.hi} w={.55} o={.8}/>}
    <Line d={tiles([x0, yf, z], [x1, yf, z], [x1, y, t], [x0, y, t], rows, unit, seams)} c={c.line} w={.6}/>
    <P p={[[x0, yf, z], [x1, yf, z], [x1, yf, z - 1.8], [x0, yf, z - 1.8]]} f={c.edge}/>
    <Line d={seg([x1, yb, z], [x1, y, t], [x1, yf, z])} c={c.edge} w={1.8}/>
    <Line d={seg([x0, y, t], [x1, y, t])} c={c.edge} w={1.5}/>
  </>;
}
// Sedlová strecha s hrebeňom pozdĺž y; štít je na ľavej stene.
function GableY({ x = 0, y = 0, w, d, z, rise, o = .05, c, wl, seams, children }: RoofProps) {
  const x0 = x - w / 2 - o, x1 = x + w / 2 + o, yb = y - d / 2 - o, yf = y + d / 2 + o, ya = y + d / 2, t = z + rise, e = rise * o / (w / 2 + o);
  const rows = Math.max(3, Math.round(rise / 3.4)), unit = seams ? .055 : .068;
  return <>
    <P p={[[x0, yb, z], [x0, yf, z], [x, yf, t], [x, yb, t]]} f={c.back}/>
    <P p={[[x - w / 2, ya, z - 1], [x + w / 2, ya, z - 1], [x + w / 2, ya, z + e], [x, ya, t], [x - w / 2, ya, z + e]]} f={wl[0]}/>
    {children}
    <P p={[[x1, yb, z], [x1, yf, z], [x, yf, t], [x, yb, t]]} f={c.shade}/>
    {!seams && <Line d={glints([x1, yf, z], [x1, yb, z], [x, yb, t], [x, yf, t], rows)} c={c.lit} w={.55} o={.7}/>}
    <Line d={tiles([x1, yf, z], [x1, yb, z], [x, yb, t], [x, yf, t], rows, unit, seams)} c={c.line} w={.6}/>
    <P p={[[x1, yb, z], [x1, yf, z], [x1, yf, z - 1.8], [x1, yb, z - 1.8]]} f={c.edge}/>
    <Line d={seg([x0, yf, z], [x, yf, t], [x1, yf, z])} c={c.edge} w={1.8}/>
    <Line d={seg([x, yb, t], [x, yf, t])} c={c.edge} w={1.5}/>
  </>;
}
// Valbová strecha (pri štvorcovom pôdoryse ihlan).
function Hip({ x = 0, y = 0, w, d, z, rise, o = .05, c }: Omit<RoofProps, "wl" | "seams" | "children">) {
  const x0 = x - w / 2 - o, x1 = x + w / 2 + o, yb = y - d / 2 - o, yf = y + d / 2 + o, t = z + rise, run = d / 2 + o;
  const r0 = Math.min(x, x0 + run), r1 = Math.max(x, x1 - run), rows = Math.max(3, Math.round(rise / 3.4));
  return <>
    <P p={[[x0, yb, z], [x1, yb, z], [r1, y, t], [r0, y, t]]} f={c.back}/>
    <P p={[[x0, yb, z], [x0, yf, z], [r0, y, t]]} f={c.hi}/>
    <P p={[[x1, yb, z], [x1, yf, z], [r1, y, t]]} f={c.shade}/>
    <Line d={tiles([x1, yf, z], [x1, yb, z], [r1, y, t], [r1, y, t], rows)} c={c.line} w={.6}/>
    <P p={[[x0, yf, z], [x1, yf, z], [r1, y, t], [r0, y, t]]} f={c.lit}/>
    <Line d={glints([x0, yf, z], [x1, yf, z], [r1, y, t], [r0, y, t], rows)} c={c.hi} w={.55} o={.8}/>
    <Line d={tiles([x0, yf, z], [x1, yf, z], [r1, y, t], [r0, y, t], rows)} c={c.line} w={.6}/>
    <P p={[[x1, yb, z], [x1, yf, z], [x1, yf, z - 1.8], [x1, yb, z - 1.8]]} f={c.edge}/>
    <P p={[[x0, yf, z], [x1, yf, z], [x1, yf, z - 1.8], [x0, yf, z - 1.8]]} f={c.edge}/>
    <Line d={seg([x0, yf, z], [r0, y, t], [r1, y, t], [x1, yf, z]) + seg([r1, y, t], [x1, yb, z])} c={c.edge} w={1.3}/>
  </>;
}
// Hranol vyrastajúci z hrebeňa (komín, vežička). run a rise opisujú sklon strechy.
function Stack({ x, y, s, top, ridge, run, rise, axis = "x", c, capC }: { x: number; y: number; s: number; top: number; ridge: number; run: number; rise: number; axis?: "x" | "y"; c: Tone; capC?: Tone }) {
  const h = s / 2, x0 = x - h, x1 = x + h, y0 = y - h, y1 = y + h, zb = ridge - rise * h / run;
  return <>
    <polygon points={axis === "x" ? pts([x1, y0, zb], [x1, y, ridge], [x1, y1, zb], [x1, y1, top], [x1, y0, top]) : pts([x1, y0, zb], [x1, y1, zb], [x1, y1, top], [x1, y0, top])} fill={c[1]}/>
    <polygon points={axis === "x" ? pts([x0, y1, zb], [x1, y1, zb], [x1, y1, top], [x0, y1, top]) : pts([x0, y1, zb], [x, y1, ridge], [x1, y1, zb], [x1, y1, top], [x0, y1, top])} fill={c[0]}/>
    <P p={[[x0, y0, top], [x1, y0, top], [x1, y1, top], [x0, y1, top]]} f={c[2] ?? c[1]}/>
    {capC && <Box x={x} y={y} z={top} w={s + .025} d={s + .025} h={1.8} c={capC}/>}
  </>;
}
// Predstavaný štít (rizalit, portikus) napojený úžľabím na prednú plochu hlavnej strechy.
function Bay({ x, w, face, depth, z0 = 0, h, rise, o = .03, main, c, wl, children }: { x: number; w: number; face: number; depth: number; z0?: number; h: number; rise: number; o?: number; main: { z: number; rise: number; front: number; ridge: number }; c: Roof; wl: Tone; children?: ReactNode }) {
  const yf = face + depth, yo = yf + o, hw = w / 2 + o, t = h + rise, e = rise * o / hw;
  const valley = (zz: number) => Math.max(main.ridge, Math.min(yf, main.front - (main.front - main.ridge) * (zz - main.z) / main.rise));
  const vb = valley(h), vt = valley(t);
  return <>
    <Box x={x} y={face + depth / 2} z={z0} w={w} d={depth} h={h - z0} c={wl}/>
    <P p={[[x - hw, yo, h], [x - hw, vb, h], [x, vt, t], [x, yo, t]]} f={c.hi}/>
    <Line d={tiles([x - hw, yo, h], [x - hw, vb, h], [x, vt, t], [x, yo, t], Math.max(3, Math.round(rise / 3.4)))} c={c.line} w={.6}/>
    <P p={[[x - w / 2, yf, h - 1], [x + w / 2, yf, h - 1], [x + w / 2, yf, h + e], [x, yf, t], [x - w / 2, yf, h + e]]} f={wl[0]}/>
    {children}
    <P p={[[x + hw, yo, h], [x + hw, vb, h], [x, vt, t], [x, yo, t]]} f={c.shade}/>
    <Line d={tiles([x + hw, yo, h], [x + hw, vb, h], [x, vt, t], [x, yo, t], Math.max(3, Math.round(rise / 3.4)))} c={c.line} w={.6}/>
    <Line d={seg([x - hw, yo, h], [x, yo, t], [x + hw, yo, h])} c={c.edge} w={1.6}/>
    <Line d={seg([x, yo, t], [x, vt, t]) + seg([x + hw, vb, h], [x, vt, t])} c={c.edge} w={1.1}/>
  </>;
}

type Glass = "warm" | "cool" | "boarded";
function Win({ s, at, u, z, w = .085, h = 8, glass = "warm", shut }: { s: Side; at: number; u: number; z: number; w?: number; h?: number; glass?: Glass; shut?: string }) {
  const a = u - w / 2, b = u + w / 2, f = .014;
  const [g, gt] = glass === "warm" ? ["#f1c66e", "#cf9a4d"] : glass === "cool" ? ["#88aaaf", "#67878e"] : ["#5e5a51", "#48443d"];
  return <>
    {shut && <><polygon points={rect(s, at, a - w * .5 - f, a - f, z, z + h)} fill={shut}/><polygon points={rect(s, at, b + f, b + w * .5 + f, z, z + h)} fill={shut}/></>}
    <polygon points={rect(s, at, a - f, b + f, z - 1, z + h + 1)} fill={trim}/>
    <polygon points={rect(s, at, a, b, z, z + h)} fill={g}/>
    <polygon points={rect(s, at, a, b, z + h * .7, z + h)} fill={gt}/>
    {glass === "cool" && <Line d={seg(on(s, at, a + w * .2, z + 1), on(s, at, a + w * .55, z + h - 1))} c="#c9dcda" w={.7}/>}
    <Line d={seg(on(s, at, u, z), on(s, at, u, z + h)) + seg(on(s, at, a, z + h * .45), on(s, at, b, z + h * .45))} c={trim} w={.75}/>
    {glass === "boarded" && <Line d={seg(on(s, at, a - .012, z + .5), on(s, at, b + .012, z + h - .5)) + seg(on(s, at, a - .012, z + h - .5), on(s, at, b + .012, z + .5))} c="#8e6d47" w={1.7}/>}
    <Line d={seg(on(s, at, a - f * 1.6, z - 1), on(s, at, b + f * 1.6, z - 1))} c="#b3a07e" w={1.1}/>
  </>;
}
function Door({ s, at, u, z = 0, w = .1, h = 12, c = "#7b5235", step = true }: { s: Side; at: number; u: number; z?: number; w?: number; h?: number; c?: string; step?: boolean }) {
  const a = u - w / 2, b = u + w / 2;
  return <>
    <polygon points={rect(s, at, a - .016, b + .016, z, z + h + 1.6)} fill={trim}/>
    <polygon points={rect(s, at, a, b, z, z + h)} fill={c}/>
    <polygon points={rect(s, at, a + .012, b - .012, z + h * .78, z + h - 1)} fill="#f1c66e"/>
    <Line d={seg(on(s, at, u, z), on(s, at, u, z + h * .74))} c="#00000030" w={.7}/>
    {step && (s === "l" ? <Box x={u} y={at + .025} w={w + .05} d={.05} h={1.8} c={stone}/> : <Box x={at + .025} y={u} w={.05} d={w + .05} h={1.8} c={stone}/>)}
  </>;
}
function Arch({ s, at, u, z, w, h, f }: { s: Side; at: number; u: number; z: number; w: number; h: number; f: string }) {
  const r = w / 2, rz = r * 45;
  return <polygon points={pts(on(s, at, u - r, z), on(s, at, u + r, z), ...HALF.map(([c, n]) => on(s, at, u + r * c, z + h + rz * n)))} fill={f}/>;
}
function Clock({ s, at, u, z, r = 3.4, rim = "#e7dcc3" }: { s: Side; at: number; u: number; z: number; r?: number; rim?: string }) {
  return <g transform={faceM(s, at, u, z)}><circle r={r + .9} fill={rim}/><circle r={r} fill="#fcf8ee"/><path d={`M0 0V${q(-r * .72)}M0 0L${q(r * .5)} ${q(r * .22)}`} stroke="#2e3b35" strokeWidth={.75} strokeLinecap="round"/></g>;
}
function FlowerBox({ s, at, u, z, w = .1 }: { s: Side; at: number; u: number; z: number; w?: number }) {
  const [a, b] = [on(s, at, u - w / 2, z), on(s, at, u + w / 2, z)];
  return <><polygon points={rect(s, at, u - w / 2, u + w / 2, z - 2.4, z)} fill="#9a6b43"/>{[.1, .3, .5, .7, .9].map((f, i) => { const [cx, cy] = iso(...lerp(a, b, f)); return <circle key={f} cx={cx} cy={q(cy - .6)} r={1.25} fill={i % 2 ? "#e58f9d" : "#f0c64a"}/>; })}</>;
}

export function Tree({ x = 0, y = 0, s = 1, kind = "round", tone = 0 }: { x?: number; y?: number; s?: number; kind?: "round" | "pine"; tone?: number }) {
  const [bx, by] = iso(x, y), k = (n: number) => q(n * s);
  if (kind === "pine") return <g transform={`translate(${bx} ${by})`}>
    <ellipse cx={k(5)} cy={k(1)} rx={k(9)} ry={k(3.3)} fill={shadow} opacity={.15}/>
    <path d={`M${k(-1.3)} 0h${k(2.6)}v${k(-6)}h${k(-2.6)}Z`} fill="#7a5a3e"/>
    {[0, 1, 2].map(i => { const b = k(-4 - i * 7), t = k(-18 - i * 7), hw = k(10 - i * 2.7), m = k(1.8); return <g key={i}><path d={`M0 ${t}L${-hw} ${b}Q${q(-hw / 2)} ${q(b + m)} 0 ${q(b + m)}Z`} fill={pine[0]}/><path d={`M0 ${t}L${hw} ${b}Q${q(hw / 2)} ${q(b + m)} 0 ${q(b + m)}Z`} fill={pine[1]}/></g>; })}
  </g>;
  const c = leafTones[tone % 3];
  return <g transform={`translate(${bx} ${by})`}>
    <ellipse cx={k(7)} cy={k(1.4)} rx={k(12)} ry={k(4.3)} fill={shadow} opacity={.15}/>
    <path d={`M${k(-1.7)} 0L${k(-1)} ${k(-14)}h${k(2)}L${k(1.7)} 0Z`} fill="#7a5a3e"/>
    <circle cx={k(2.5)} cy={k(-19)} r={k(10.5)} fill={c[0]}/>
    <circle cx={k(-3.5)} cy={k(-21)} r={k(9)} fill={c[1]}/>
    <circle cx={k(4)} cy={k(-26)} r={k(7.5)} fill={c[1]}/>
    <circle cx={k(-4.5)} cy={k(-26.5)} r={k(6.5)} fill={c[2]}/>
    <circle cx={0} cy={k(-30)} r={k(5)} fill={c[2]}/>
    <circle cx={k(-6.5)} cy={k(-27)} r={k(2)} fill={c[3]}/><circle cx={k(-2)} cy={k(-32)} r={k(1.7)} fill={c[3]}/><circle cx={k(-8.4)} cy={k(-21)} r={k(1.6)} fill={c[3]}/>
  </g>;
}
export function Bush({ x = 0, y = 0, s = 1, flowers, tone = 0 }: { x?: number; y?: number; s?: number; flowers?: string; tone?: number }) {
  const [bx, by] = iso(x, y), k = (n: number) => q(n * s), c = leafTones[tone % 3];
  return <g transform={`translate(${bx} ${by})`}>
    <ellipse cx={k(3)} cy={k(.8)} rx={k(7.5)} ry={k(2.6)} fill={shadow} opacity={.14}/>
    <circle cx={k(2.6)} cy={k(-3.4)} r={k(4.6)} fill={c[0]}/><circle cx={k(-2.6)} cy={k(-3.8)} r={k(4.2)} fill={c[1]}/><circle cx={k(.4)} cy={k(-6.8)} r={k(3.8)} fill={c[2]}/>
    <circle cx={k(-2.2)} cy={k(-6.4)} r={k(1.3)} fill={c[3]}/>
    {flowers && [[-3.2, -5], [1, -8.6], [3.4, -4.4], [-.6, -2.6], [4.4, -7]].map(([fx, fy]) => <circle key={fx} cx={k(fx)} cy={k(fy)} r={k(1)} fill={flowers}/>)}
  </g>;
}
export function Lamp({ x = 0, y = 0, h = 19 }: { x?: number; y?: number; h?: number }) {
  const [bx, by] = iso(x, y);
  return <g transform={`translate(${bx} ${by})`}>
    <ellipse cx={2.2} cy={.6} rx={3.4} ry={1.3} fill={shadow} opacity={.16}/>
    <path d={`M0 0V${-h}M-1.7 0h3.4`} stroke={dark} strokeWidth={1.2}/>
    <circle cy={-h - 2.2} r={3.1} fill="#ffe9a8" opacity={.45}/><circle cy={-h - 2.2} r={1.8} fill="#ffe3a0"/>
    <path d={`M-2.3 ${-h - 4}h4.6l-1.1-1.5h-2.4Z`} fill={dark}/>
  </g>;
}
function Bench({ x = 0, y = 0 }: { x?: number; y?: number }) {
  return <>
    <Line d={seg([x - .11, y - .02, 0], [x - .11, y - .02, 9]) + seg([x + .11, y - .02, 0], [x + .11, y - .02, 9])} c={dark} w={1}/>
    <P p={[[x - .13, y - .025, 5.5], [x + .13, y - .025, 5.5], [x + .13, y - .025, 9.4], [x - .13, y - .025, 9.4]]} f="#b07a47"/>
    <Line d={seg([x - .13, y - .025, 7.4], [x + .13, y - .025, 7.4])} c="#8e5f35" w={.6}/>
    <Line d={seg([x - .11, y + .035, 0], [x - .11, y + .035, 4]) + seg([x + .11, y + .035, 0], [x + .11, y + .035, 4])} c={dark} w={1}/>
    <Box x={x} y={y + .007} z={4} w={.27} d={.065} h={1.4} c={["#c28c56", "#9c6d40", "#d09c65"]}/>
  </>;
}
function Dots({ at, c, r = 1.2 }: { at: readonly (readonly [number, number])[]; c: readonly string[]; r?: number }) {
  return <>{at.map(([x, y], i) => <circle key={`${x},${y}`} cx={x} cy={y} r={r} fill={c[i % c.length]}/>)}</>;
}
function Lawn({ inset = .05, f = "#b9cf8f" }: { inset?: number; f?: string }) {
  const e = .5 - inset;
  return <><P p={[[-e, -e], [e, -e], [e, e], [-e, e]]} f={f}/><Line d={seg([-e, e], [e, e], [e, -e])} c="#d6e3b5" w={.8}/></>;
}

// ——— Budovy ———
function House({ variant }: { variant: number }) {
  const v = variant % 3;
  if (v === 1) {
    const W = wall.butter, w = .48, d = .6, h = 21, rise = 20;
    return <>
      <Shadow w={w} d={d} len={.2}/>
      <Box w={w} d={d} h={h} c={W}/><Box w={w + .012} d={d + .012} h={3} c={socle}/>
      <Door s="l" at={d / 2} u={-.1}/><Win s="l" at={d / 2} u={.11} z={8} shut="#6f8f63"/>
      <Win s="r" at={w / 2} u={-.15} z={8}/><FlowerBox s="r" at={w / 2} u={-.15} z={7}/><Win s="r" at={w / 2} u={.13} z={8}/><FlowerBox s="r" at={w / 2} u={.13} z={7}/>
      <GableY w={w} d={d} z={h} rise={rise} c={roof.clay} wl={W}><Win s="l" at={d / 2} u={0} z={h + 3} w={.07} h={6}/></GableY>
      <Stack x={0} y={-.15} s={.075} top={h + rise + 6} ridge={h + rise} run={w / 2 + .05} rise={rise} axis="y" c={brick} capC={cap}/>
      <Bush x={.33} y={.37} s={.75} flowers="#e79ab0"/>
    </>;
  }
  if (v === 2) {
    const W = wall.mist, w = .56, d = .42, h = 32, rise = 15, yl = d / 2, xr = w / 2, sh = "#56745f";
    return <>
      <Shadow w={w} d={d} len={.24}/>
      <Box w={w} d={d} h={h} c={W}/><Box w={w + .012} d={d + .012} h={3} c={socle}/><Box z={15} w={w + .012} d={d + .012} h={1.4} c={ledge}/>
      <Door s="l" at={yl} u={-.12}/><Win s="l" at={yl} u={.12} z={5} shut={sh}/><Win s="l" at={yl} u={-.12} z={19} shut={sh}/><Win s="l" at={yl} u={.12} z={19} shut={sh}/>
      <Win s="r" at={xr} u={0} z={5}/><Win s="r" at={xr} u={0} z={19}/>
      <GableX w={w} d={d} z={h} rise={rise} c={roof.brick} wl={W}/>
      <Stack x={.13} y={0} s={.075} top={h + rise + 6} ridge={h + rise} run={d / 2 + .05} rise={rise} c={brick} capC={cap}/>
    </>;
  }
  const W = wall.ivory, w = .64, d = .44, y = .02, h = 22, rise = 19, yl = y + d / 2, xr = w / 2;
  return <>
    <Shadow y={y} w={w} d={d} len={.2}/>
    <Box y={y} w={w} d={d} h={h} c={W}/><Box y={y} w={w + .012} d={d + .012} h={3} c={socle}/>
    <Win s="l" at={yl} u={-.2} z={8}/><FlowerBox s="l" at={yl} u={-.2} z={7}/><Door s="l" at={yl} u={0}/><Win s="l" at={yl} u={.19} z={8}/><FlowerBox s="l" at={yl} u={.19} z={7}/>
    <Win s="r" at={xr} u={y} z={8}/>
    <GableX y={y} w={w} d={d} z={h} rise={rise} c={roof.terracotta} wl={W}><Win s="r" at={xr} u={y} z={h + 3.5} w={.06} h={5}/></GableX>
    <Stack x={-.15} y={y} s={.075} top={h + rise + 6} ridge={h + rise} run={d / 2 + .05} rise={rise} c={brick} capC={cap}/>
    <Bush x={-.37} y={.35} s={.75}/>
  </>;
}
function School() {
  const W = wall.school, w = .86, d = .46, h = 30, rise = 15, yl = d / 2, xr = w / 2, main = { z: h, rise, front: yl + .05, ridge: 0 };
  return <>
    <Shadow w={w} d={d} len={.22}/>
    <Box w={w} d={d} h={h} c={W}/><Box w={w + .012} d={d + .012} h={4} c={socle}/><Box z={15.5} w={w + .012} d={d + .012} h={1.4} c={ledge}/>
    {[-.35, -.23, .23, .35].map(u => <g key={u}><Win s="l" at={yl} u={u} z={6}/><Win s="l" at={yl} u={u} z={19.5}/></g>)}
    {[-.11, .11].map(u => <g key={u}><Win s="r" at={xr} u={u} z={6}/><Win s="r" at={xr} u={u} z={19.5}/></g>)}
    <Hip w={w} d={d} z={h} rise={rise} c={roof.terracotta}/>
    <Stack x={0} y={0} s={.09} top={h + rise + 9} ridge={h + rise} run={d / 2 + .05} rise={rise} c={[W[0], W[1], W[1]]}/>
    <Arch s="l" at={.045} u={0} z={h + rise + 2} w={.045} h={3} f="#4b4236"/>
    <Hip w={.11} d={.11} z={h + rise + 9} rise={9} o={0} c={roof.copper}/>
    <Bay x={0} w={.26} face={yl} depth={.06} h={31} rise={13} main={main} c={roof.terracotta} wl={W}><Clock s="l" at={yl + .06} u={0} z={35.4} r={2.6}/></Bay>
    <Door s="l" at={yl + .06} u={0} w={.12} h={13}/><Win s="l" at={yl + .06} u={0} z={19.5} w={.1}/>
    <Bush x={.44} y={.33} s={.65}/>
  </>;
}
function Library() {
  const W = wall.stone, w = .62, d = .46, y = -.02, h = 26, rise = 13, yl = y + d / 2, xr = w / 2, main = { z: h, rise, front: yl + .05, ridge: y };
  const col = ["#fbf8ef", "#dbd3c2", "#fffdf7"] as const;
  return <>
    <Shadow y={y} w={w} d={d} len={.2}/>
    <Box y={y} w={w} d={d} h={h} c={W}/><Box y={y} w={w + .012} d={d + .012} h={5} c={socle}/><Box y={y} z={h - 3} w={w + .014} d={d + .014} h={3} c={ledge}/>
    {[-.265, .265].map(u => <Win key={u} s="l" at={yl} u={u} z={9} w={.07} h={11} glass="cool"/>)}
    {[-.12, .12].map(u => <Win key={u} s="l" at={yl} u={u} z={8} w={.07} h={9}/>)}
    <Door s="l" at={yl} u={0} z={5} w={.1} h={12} c="#5f4430" step={false}/>
    {[-.11, .11].map(u => <Win key={u} s="r" at={xr} u={u + y} z={9} w={.075} h={11} glass="cool"/>)}
    <Hip y={y} w={w} d={d} z={h} rise={rise} c={roof.slate}/>
    <Box y={.26} w={.5} d={.1} h={5} c={stone}/><Box y={.33} w={.42} d={.05} h={3} c={stone}/><Box y={.37} w={.34} d={.04} h={1.4} c={stone}/>
    {[-.19, -.065, .065, .19].map(u => <g key={u}><Box x={u} y={.285} z={5} w={.03} d={.03} h={16} c={col}/><Box x={u} y={.285} z={19.6} w={.048} d={.048} h={1.6} c={col}/></g>)}
    <Bay x={0} w={.48} face={yl} depth={.1} z0={21.2} h={26} rise={8} o={.02} main={main} c={roof.slate} wl={W}><g transform={faceM("l", yl + .1, 0, 29.2)}><circle r={2.6} fill="#5b6d74"/><circle r={2.6} fill="none" stroke={trim} strokeWidth={.7}/></g></Bay>
  </>;
}
function Culture() {
  const W = wall.concrete, w = .8, d = .48, h = 24, yl = d / 2, xr = w / 2;
  const mosaic = ["#c9674b", "#e2b04f", "#5f8f88", "#f3ead4", "#7d93a8"];
  return <>
    <Shadow w={w} d={d} len={.2}/>
    <Box x={-.19} y={-.11} w={.34} d={.24} h={35} c={[W[0], W[1], "#d8d1bf"]}/>
    <Box w={w} d={d} h={h} c={W}/>
    <polygon points={rect("l", yl, -.34, .34, 3, 20)} fill="#8eb0b6"/>
    {[[-.34, -.2], [.07, .2], [.2, .34]].map(([a, b]) => <polygon key={a} points={rect("l", yl, a, b, 13.2, 20)} fill="#efd08b"/>)}
    <Line d={Array.from({ length: 11 }, (_, i) => seg(on("l", yl, -.34 + i * .068, 3), on("l", yl, -.34 + i * .068, 20))).join("") + seg(on("l", yl, -.34, 13), on("l", yl, .34, 13))} c="#f4f1e8" w={.8}/>
    <polygon points={rect("l", yl, -.055, .055, 0, 11)} fill="#48585a"/>
    {mosaic.flatMap((_, i) => [0, 1, 2, 3].map(j => <polygon key={`${i}-${j}`} points={rect("r", xr, -.19 + j * .095, -.19 + (j + 1) * .095 - .008, 5 + i * 3.1, 7.6 + i * 3.1)} fill={mosaic[(i * 2 + j * 3) % mosaic.length]}/>))}
    <Line d={seg([-.15, yl + .1, 0], [-.15, yl + .1, 13]) + seg([.15, yl + .1, 0], [.15, yl + .1, 13])} c="#6c7672" w={1.1}/>
    <Box y={yl + .055} z={13} w={.36} d={.12} h={1.8} c={["#f6f2e8", "#d8d1c0", "#fcfaf3"]}/>
    <Box z={h} w={w + .05} d={d + .05} h={2.6} c={["#f4f0e6", "#d7d0bf", "#cfc8b5"]}/>
    <Box x={.22} y={-.08} z={h + 2.6} w={.1} d={.08} h={3.5} c={pale}/>
    <Round x={.42} y={.36} r={.04} h={14} f="#e9dfc9" side="#e3d6bb"/>
    {["#c9674b", "#5f8f88", "#e2b04f"].map((c, i) => { const [cx, cy] = iso(.42, .36, 4 + i * 3.4); return <rect key={c} x={q(cx - 2.2)} y={q(cy - 2.6)} width={2.9} height={2.8} fill={c}/>; })}
  </>;
}
function Clinic() {
  const W = wall.white, w = .56, d = .52, h = 27, rise = 17, yl = d / 2, xr = w / 2, sh = "#a9c8ae";
  return <>
    <Shadow w={w} d={d} len={.22}/>
    <Box w={w} d={d} h={h} c={W}/><Box w={w + .012} d={d + .012} h={3} c={[pale[0], pale[1]]}/>
    <Win s="l" at={yl} u={-.13} z={6} shut={sh}/><Door s="l" at={yl} u={.12} w={.11} c="#5c8e89"/>
    <Box x={.12} y={yl + .04} z={13.5} w={.17} d={.08} h={1.5} c={["#f7f4ed", "#d9d3c6", "#fdfbf6"]}/>
    <Win s="l" at={yl} u={-.13} z={17} h={7} shut={sh}/><Win s="l" at={yl} u={.13} z={17} h={7} shut={sh}/>
    {[-.14, .12].map(u => <g key={u}><Win s="r" at={xr} u={u} z={6}/><Win s="r" at={xr} u={u} z={17} h={7}/></g>)}
    <GableY w={w} d={d} z={h} rise={rise} c={roof.sage} wl={W}>
      <g transform={faceM("l", yl, 0, h + 7.5)}><circle r={5.2} fill="#fdfbf6" stroke="#ded6c6" strokeWidth={.8}/><path d="M-1.2-3.5h2.4v2.3h2.3v2.4h-2.3v2.3h-2.4v-2.3h-2.3v-2.4h2.3Z" fill="#d24a3e"/></g>
    </GableY>
    <Bush x={.4} y={-.3} s={.7}/>
    <Line d={seg([.41, .4, 0], [.41, .4, 12])} c={dark} w={1}/>
    <g transform={faceM("l", .4, .41, 15)}><rect x={-3} y={-3} width={6} height={6} rx={.8} fill="#3f8a5e"/><path d="M-.8-2.2h1.6v1.4h1.4v1.6h-1.4v1.4h-1.6v-1.4h-1.4v-1.6h1.4Z" fill="#fff"/></g>
  </>;
}
function Stall({ x, y, awning, goods }: { x: number; y: number; awning: readonly [string, string]; goods: readonly string[] }) {
  const w = .26, d = .14, x0 = x - w / 2 - .02, x1 = x + w / 2 + .02, yb = y - d / 2 - .03, yf = y + d / 2 + .06, zb = 17, zf = 13.5, n = 6;
  return <>
    <Shadow x={x} y={y} w={w} d={d} len={.12}/>
    <Line d={seg([x - w / 2, y - d / 2, 0], [x - w / 2, y - d / 2, zb]) + seg([x + w / 2, y - d / 2, 0], [x + w / 2, y - d / 2, zb])} c="#6d5337" w={1.1}/>
    <Box x={x} y={y} w={w} d={d} h={6} c={wood}/>
    {goods.map((c, i) => { const [cx, cy] = iso(x - w / 2 + .03 + i * (w - .06) / Math.max(1, goods.length - 1), y - .01, 6.6); return <circle key={i} cx={cx} cy={cy} r={1.7} fill={c}/>; })}
    <Line d={seg([x - w / 2, y + d / 2, 0], [x - w / 2, y + d / 2 + .04, zf]) + seg([x + w / 2, y + d / 2, 0], [x + w / 2, y + d / 2 + .04, zf])} c="#6d5337" w={1.1}/>
    {Array.from({ length: n }, (_, i) => { const a = x0 + (x1 - x0) * i / n, b = x0 + (x1 - x0) * (i + 1) / n; return <P key={i} p={[[a, yb, zb], [b, yb, zb], [b, yf, zf], [a, yf, zf]]} f={awning[i % 2]}/>; })}
    <P p={[[x0, yf, zf], [x1, yf, zf], [x1, yf, zf - 2.2], [x0, yf, zf - 2.2]]} f={awning[0]}/>
    <P p={[[x1, yb, zb], [x1, yf, zf], [x1, yf, zf - 2.2], [x1, yb, zb - 1]]} f="#00000022"/>
  </>;
}
function Market() {
  return <>
    <P p={[[-.47, -.47], [.47, -.47], [.47, .47], [-.47, .47]]} f="#e4d5af"/>
    <Line d={[-.3, -.1, .1, .3].map(t => seg([t, -.47], [t, .47]) + seg([-.47, t], [.47, t])).join("")} c="#cdbb92" w={.55}/>
    <Stall x={-.2} y={-.16} awning={["#d4604a", "#fbf1dc"]} goods={["#b8483a", "#d4604a", "#e39a3b", "#98ae5c"]}/>
    <Stall x={.2} y={-.07} awning={["#5c9275", "#f7ecd0"]} goods={["#8db35a", "#6f9a45", "#e2b04f", "#a4c46a"]}/>
    <Stall x={-.03} y={.21} awning={["#e0a53a", "#fbf1dc"]} goods={["#e07b39", "#c9674b", "#f0c64a", "#e07b39"]}/>
    <Box x={.33} y={.3} w={.09} d={.09} h={5} c={wood}/><Box x={.33} y={.3} z={5} w={.09} d={.09} h={4.5} c={wood}/>
    <Dots at={[iso(.31, .3, 10), iso(.35, .29, 10), iso(.33, .32, 10)]} c={["#b8483a", "#e39a3b", "#98ae5c"]} r={1.5}/>
  </>;
}
function Workshop() {
  const W = wall.craft, x = -.03, w = .6, d = .44, h = 21, rise = 16, yl = d / 2, xr = x + w / 2, beam = "#6b4a31";
  const lp = [-.33, -.13, .07, .27], rp = [-.22, 0, .22];
  return <>
    <Shadow x={x} w={w} d={d} len={.2}/>
    <Box x={x} w={w} d={d} h={h} c={W}/><Box x={x} w={w + .012} d={d + .012} h={2.5} c={socle}/>
    <Win s="l" at={yl} u={-.23} z={13} w={.06} h={5}/><Win s="l" at={yl} u={.17} z={4} w={.07} h={6}/><Win s="r" at={xr} u={.11} z={5} w={.07} h={6}/>
    <Line d={lp.map(u => seg(on("l", yl, u, 0), on("l", yl, u, h))).join("") + [2.5, 11, h - .5].map(z => seg(on("l", yl, -.33, z), on("l", yl, .27, z))).join("")
      + seg(on("l", yl, -.33, 2.5), on("l", yl, -.13, 11)) + seg(on("l", yl, .07, h - .5), on("l", yl, .27, 11))
      + rp.map(u => seg(on("r", xr, u, 0), on("r", xr, u, h))).join("") + [2.5, 11, h - .5].map(z => seg(on("r", xr, -.22, z), on("r", xr, .22, z))).join("") + seg(on("r", xr, -.22, 2.5), on("r", xr, 0, 11))} c={beam} w={1.5}/>
    <polygon points={rect("l", yl, -.12, .06, 0, 14)} fill="#94683f"/>
    <Line d={seg(on("l", yl, -.12, 0), on("l", yl, .06, 14)) + seg(on("l", yl, -.12, 14), on("l", yl, .06, 0)) + seg(on("l", yl, -.03, 0), on("l", yl, -.03, 14))} c="#6b4629" w={1}/>
    <GableX x={x} w={w} d={d} z={h} rise={rise} c={roof.zinc} wl={W} seams/>
    <Stack x={x + .15} y={0} s={.07} top={h + rise + 7} ridge={h + rise} run={d / 2 + .05} rise={rise} c={brick} capC={cap}/>
    <Box x={.38} y={.16} w={.18} d={.12} h={9} c={["#7c5a3b", "#664931", "#8d6746"]}/>
    {[[.32, 1.8], [.38, 1.8], [.44, 1.8], [.35, 4.9], [.41, 4.9], [.38, 8]].map(([u, z]) => <g key={`${u}${z}`} transform={faceM("l", .22, u, z)}><circle r={1.6} fill="#e0bc86"/><circle r={.7} fill="none" stroke="#b58c58" strokeWidth={.45}/></g>)}
  </>;
}
function Park() {
  const [a, c1, c2, b] = [iso(-.2, .45), iso(.1, .2), iso(-.15, -.2), iso(.1, -.45)];
  const path = `M${a.join(" ")}C${c1.join(" ")} ${c2.join(" ")} ${b.join(" ")}`;
  return <>
    <Lawn/>
    <path d={path} stroke="#d2c29a" strokeWidth={7} fill="none" strokeLinecap="round"/><path d={path} stroke="#ecdfbf" strokeWidth={5} fill="none" strokeLinecap="round"/>
    <Tree x={-.26} y={-.16} s={1.05}/>
    <Tree x={.06} y={-.33} s={.8} kind="pine"/>
    <Bench x={.02} y={.12}/>
    <Lamp x={-.07} y={.3}/>
    <Tree x={.28} y={.04} s={.7} tone={1}/>
    <Dots at={[iso(.3, .32, 1), iso(.35, .28, 1.5), iso(.27, .36, 1.2), iso(-.34, .28, 1), iso(-.3, .33, 1.4)]} c={["#e58f9d", "#f0c64a", "#fbf6e8", "#d8665a", "#a98bc6"]} r={1.5}/>
  </>;
}
function Garden() {
  const fence = "#efe6d0", rail = "#d9cdb1";
  const posts = (from: number, to: number, fixed: number, axis: "x" | "y", gap?: readonly [number, number]) => {
    let d = "";
    for (let t = from; t <= to + .001; t += .075) if (!gap || t < gap[0] || t > gap[1]) d += axis === "x" ? seg([t, fixed, 0], [t, fixed, 7.5]) : seg([fixed, t, 0], [fixed, t, 7.5]);
    return d;
  };
  return <>
    <Lawn f="#b6cc8b"/>
    {[-.36, -.25, -.14].map((x, i) => { const [sx, sy] = iso(x, -.41); return <g key={x}><path d={`M${sx} ${sy}V${q(sy - 15 - i)}`} stroke="#5b8043" strokeWidth={1.1}/><circle cx={sx} cy={q(sy - 16 - i)} r={2.9} fill="#f2c23e"/><circle cx={sx} cy={q(sy - 16 - i)} r={1.2} fill="#7a5130"/><circle cx={q(sx - 2)} cy={q(sy - 9)} r={1.6} fill="#6f9a4a"/></g>; })}
    <Box x={.3} y={-.31} w={.16} d={.14} h={11} c={["#a8794c", "#8b6039"]}/>
    <polygon points={rect("l", -.24, .25, .31, 0, 8)} fill="#5f7a67"/>
    <P p={[[.21, -.4, 15], [.39, -.4, 15], [.39, -.22, 11], [.21, -.22, 11]]} f="#6d7c73"/>
    <P p={[[.39, -.4, 15], [.39, -.22, 11], [.39, -.22, 9.8], [.39, -.4, 13.8]]} f="#56635b"/>
    {[-.25, -.01, .23].map((x, i) => <g key={x}>
      <Box x={x} y={.06} w={.15} d={.46} h={4} c={["#b07c4a", "#8f6139", "#7b5b3d"]}/>
      {[-.14, -.05, .04, .13, .22].map(y => { const [cx, cy] = iso(x, y, 4.6); return <g key={y}><circle cx={cx} cy={q(cy - 1.4)} r={2.3} fill={["#9dc46a", "#6f9a45", "#7fa58f"][i]}/>{i === 1 && <circle cx={q(cx + 1)} cy={q(cy - 2)} r={.95} fill="#d24a3e"/>}{i === 2 && <circle cx={q(cx - .4)} cy={q(cy - 1.8)} r={1} fill="#9a78a8"/>}</g>; })}
    </g>)}
    <Line d={seg([-.45, .45, 2.5], [-.1, .45, 2.5]) + seg([.07, .45, 2.5], [.45, .45, 2.5], [.45, -.45, 2.5]) + seg([-.45, .45, 5.5], [-.1, .45, 5.5]) + seg([.07, .45, 5.5], [.45, .45, 5.5], [.45, -.45, 5.5])} c={rail} w={1}/>
    <Line d={posts(-.45, .45, .45, "x", [-.08, .05]) + posts(-.45, .375, .45, "y")} c={fence} w={1.4}/>
  </>;
}
function TownHall() {
  const W = wall.hall, w = .8, d = .52, h = 30, rise = 15, yl = d / 2, xr = w / 2, run = d / 2 + .05, tw = .2;
  return <>
    <Shadow w={w} d={d} len={.26}/>
    <Box w={w} d={d} h={h} c={W}/><Box w={w + .012} d={d + .012} h={5} c={socle}/><Box z={16} w={w + .012} d={d + .012} h={1.4} c={ledge}/><Box z={h - 2.4} w={w + .014} d={d + .014} h={2.4} c={ledge}/>
    {[-.3, -.17, .17, .3].map(u => <g key={u}><Win s="l" at={yl} u={u} z={7}/><Win s="l" at={yl} u={u} z={19.5}/></g>)}
    {[-.12, .12].map(u => <g key={u}><Win s="r" at={xr} u={u} z={7}/><Win s="r" at={xr} u={u} z={19.5}/></g>)}
    <polygon points={rect("l", yl, -.09, .09, 0, 15)} fill={stone[2]}/>
    <Arch s="l" at={yl} u={0} z={0} w={.12} h={9} f="#6f4a30"/>
    <Win s="l" at={yl} u={0} z={19} w={.1} h={9}/>
    <Box y={yl + .03} z={17} w={.18} d={.06} h={1.4} c={stone}/>
    <Line d={seg([-.09, yl + .06, 21], [.09, yl + .06, 21]) + [-.06, -.02, .02, .06].map(u => seg([u, yl + .06, 18.4], [u, yl + .06, 21])).join("")} c="#e9e0cb" w={.8}/>
    <Hip w={w} d={d} z={h} rise={rise} c={roof.terracotta}/>
    <Stack x={0} y={0} s={tw} top={60} ridge={h + rise} run={run} rise={rise} c={[W[0], W[1], W[1]]}/>
    <Clock s="l" at={tw / 2} u={0} z={52.5} r={3}/><Clock s="r" at={tw / 2} u={0} z={52.5} r={3}/>
    <Box z={60} w={.22} d={.22} h={1.6} c={band}/>
    <Box z={61.6} w={.17} d={.17} h={8} c={[W[0], W[1]]}/>
    <Arch s="l" at={.085} u={0} z={62.6} w={.065} h={3} f="#3b352f"/><Arch s="r" at={.085} u={0} z={62.6} w={.065} h={3} f="#2f2a25"/>
    <Box z={69.6} w={.19} d={.19} h={1.4} c={band}/>
    <Hip w={.19} d={.19} z={71} rise={17} o={.012} c={roof.copper}/>
    <Box z={87.6} w={.045} d={.045} h={3} c={["#8db7a7", "#6f9989"]}/>
    <circle cx={0} cy={-93} r={1.7} fill="#d9b25a"/><path d="M0-94.5v-5" stroke="#8a7446" strokeWidth={.8}/>
    <Box y={yl + .035} w={.2} d={.07} h={2.4} c={stone}/><Box y={yl + .075} w={.16} d={.04} h={1.2} c={stone}/>
  </>;
}
function Plaza() {
  return <>
    <P p={[[-.5, -.5], [.5, -.5], [.5, .5], [-.5, .5]]} f="#e6d8b5"/>
    <Line d={[-.4, -.3, -.2, -.1, 0, .1, .2, .3, .4].map(t => seg([t, -.5], [t, .5]) + seg([-.5, t], [.5, t])).join("")} c="#d4c49e" w={.5}/>
    <Round r={.37} f="#cbb78d"/><Round r={.32} f="#ede2c6"/>
    <Round r={.18} h={3} f="#ddd3bc" side="#aa9e85"/><Round z={3.2} r={.145} f="#87bbc7"/>
    <ellipse cx={-2.6} cy={-4.2} rx={3} ry={1.2} fill="#c6e3ea" opacity={.8}/>
    <rect x={-1.4} y={-12} width={2.8} height={9} fill="#e7dfcb"/><rect x={0} y={-12} width={1.4} height={9} fill="#cfc4ab"/>
    <ellipse cy={-12} rx={4.3} ry={2} fill="#d8cdb4"/>
    <path d="M-3.8-12q-2.4 2-2.8 7M3.8-12q2.4 2 2.8 7M0-12v-4" stroke="#c4e4eb" strokeWidth={1} fill="none"/>
    <Lamp x={.41} y={-.41}/><Lamp x={-.41} y={.41}/>
  </>;
}
function Station({ branch, finished }: { branch: Branch | null; finished: boolean }) {
  const look = branch ?? "old";
  const W = { old: wall.faded, museum: wall.ivory, "market-hall": wall.butter, "community-hall": wall.sage }[look];
  const R = { old: roof.weathered, museum: roof.teal, "market-hall": roof.terracotta, "community-hall": roof.moss }[look];
  const can = { old: ["#bdb3a0", "#a1977f", "#cbc2ae"], museum: ["#6c9c94", "#56817a", "#7aa9a1"], "market-hall": ["#c69a62", "#a67c47", "#d5aa72"], "community-hall": ["#86a371", "#6d8a5b", "#94b17f"] }[look];
  const edge = { old: "#9a8f79", museum: "#c9a24e", "market-hall": "#d4604a", "community-hall": "#6d8a5b" }[look];
  const glass: Glass = look === "old" ? "boarded" : "warm", x = -.12, w = .44, d = .78, h = 21, rise = 16, yl = d / 2, xr = x + w / 2;
  const posts = [-.32, 0, .32], teeth = look === "old" ? 9 : 14;
  let val = "";
  for (let i = 0; i <= teeth; i++) { const yy = -.41 + .82 * i / teeth; val += `${i ? "L" : "M"}${iso(.465, yy, 16).join(" ")}`; if (i < teeth) val += `L${iso(.465, yy + .41 / teeth, 13.4).join(" ")}`; }
  val += `L${iso(.465, .41, 16).join(" ")}Z`;
  const slope = (s: number, t: number) => iso(...lerp(lerp([x + w / 2 + .05, d / 2 + .05, h], [x + w / 2 + .05, -d / 2 - .05, h], s), lerp([x, d / 2 + .05, h + rise], [x, -d / 2 - .05, h + rise], s), t));
  const flags = (from: V, to: V, sag: number, n: number) => Array.from({ length: n }, (_, i) => { const f = (i + .5) / n, p = lerp(from, to, f), dz = sag * 4 * f * (1 - f); const [fx, fy] = iso(p[0], p[1], (p[2] ?? 0) - dz); return <path key={i} d={`M${q(fx - 1.6)} ${fy}h3.2l-1.6 3.4Z`} fill={["#d4604a", "#e2b04f", "#5f8f88", "#fbf1dc"][i % 4]}/>; });
  const string = (from: V, to: V, sag: number) => { let s = ""; for (let i = 0; i <= 8; i++) { const f = i / 8, p = lerp(from, to, f); s += `${i ? "L" : "M"}${iso(p[0], p[1], (p[2] ?? 0) - sag * 4 * f * (1 - f)).join(" ")}`; } return s; };
  return <>
    <Shadow x={x} w={w} d={d} len={.12}/>
    {look === "community-hall" && <Tree x={-.42} y={-.43} s={.7} tone={1}/>}
    <Box x={x} w={w} d={d} h={h} c={W}/><Box x={x} w={w + .012} d={d + .012} h={3} c={socle}/>
    {[-.25, .25].map(u => <Win key={u} s="r" at={xr} u={u} z={5.5} glass={glass}/>)}
    <Door s="r" at={xr} u={0} z={2.5} w={.12} h={12} c={look === "old" ? "#6b5a48" : "#7b5235"} step={false}/>
    <Arch s="l" at={yl} u={x} z={4} w={.16} h={6} f={trim}/>
    <Arch s="l" at={yl} u={x} z={4.8} w={.13} h={5.4} f={glass === "boarded" ? "#5e5a51" : "#f1c66e"}/>
    {glass === "boarded" && <Line d={seg(on("l", yl, x - .07, 5), on("l", yl, x + .07, 12)) + seg(on("l", yl, x - .07, 12), on("l", yl, x + .07, 5))} c="#8e6d47" w={1.8}/>}
    <polygon points={rect("l", yl, x - .14, x + .14, 16, 19.6)} fill={look === "old" ? "#6f7a70" : "#3f6457"}/>
    <Line d={[-.1, -.05, 0, .05, .1].map(u => seg(on("l", yl, x + u - .015, 17.8), on("l", yl, x + u + .015, 17.8))).join("")} c="#efe6cf" w={.8} o={look === "old" ? .45 : 1}/>
    <P p={[[.1, -.45, 0], [.5, -.45, 0], [.5, .45, 0], [.1, .45, 0]]} f="#cfc3a8"/>
    <Box x={.3} w={.4} d={.9} h={2.5} c={["#ddd2ba", "#c1b497", "#e7ddc7"]}/>
    <Line d={seg([.48, -.45, 2.6], [.48, .45, 2.6])} c="#f2eee2" w={1.2}/>
    <Line d={posts.map(p => seg([.42, p, 2.5], [.42, p, 16]) + seg([.42, p, 13], [.3, p, 16])).join("")} c="#46534e" w={1.3}/>
    <P p={[[.465, -.41, 16], [.465, .41, 16], [.465, .41, 17.6], [.465, -.41, 17.6]]} f={can[1]}/>
    <P p={[[.095, .41, 16], [.465, .41, 16], [.465, .41, 17.6], [.095, .41, 17.6]]} f={can[0]}/>
    <P p={[[.095, -.41, 17.6], [.465, -.41, 17.6], [.465, .41, 17.6], [.095, .41, 17.6]]} f={look === "old" ? "#d9e3df" : "#dcebe8"} o={.38}/>
    <Line d={Array.from({ length: 9 }, (_, i) => seg([.095, -.41 + i * .1025, 17.6], [.465, -.41 + i * .1025, 17.6])).join("") + seg([.095, -.41, 17.6], [.465, -.41, 17.6], [.465, .41, 17.6])} c={can[1]} w={.9}/>
    {look === "old" && <Line d={seg([.2, -.2, 17.6], [.33, -.13, 17.6]) + seg([.3, .12, 17.6], [.4, .26, 17.6])} c="#8b8170" w={.7}/>}
    <path d={val} fill={edge}/>
    <GableY x={x} w={w} d={d} z={h} rise={rise} c={R} wl={W}><Clock s="l" at={yl} u={x} z={h + 5} r={2.8} rim={look === "museum" ? "#d7b45e" : "#e7dcc3"}/></GableY>
    {look === "old" && <>
      <polygon points={[slope(.36, .42), slope(.5, .42), slope(.5, .74), slope(.36, .74)].map(p => p.join(",")).join(" ")} fill="#3c362f"/>
      <Line d={`M${slope(.36, .54).join(" ")}L${slope(.5, .54).join(" ")}M${slope(.36, .64).join(" ")}L${slope(.5, .64).join(" ")}`} c="#a88a62" w={.8}/>
      <Dots at={[iso(-.34, .4, 3), iso(-.33, .41, 7), iso(-.34, .4, 11), iso(-.31, .41, 5), iso(-.3, .41, 1.5)]} c={["#6f8f58", "#58794a"]} r={2.4}/>
      <Dots at={[iso(.47, -.2, 3.3), iso(.47, .15, 3.3), iso(.25, .44, 3)]} c={["#7f9a5a"]} r={1.4}/>
    </>}
    {look === "museum" && <>
      {[-.32, .32].map(p => <g key={p}><polygon points={rect("r", .425, p - .03, p + .03, 7, 14)} fill="#3f7470"/><polygon points={rect("r", .425, p - .03, p + .03, 12.4, 13.4)} fill="#d7b45e"/></g>)}
      <Box x={.3} y={.4} w={.05} d={.03} h={3} c={stone}/>
      <g transform={faceM("l", .41, .3, 9)}><circle r={5.4} fill="none" stroke="#b4473a" strokeWidth={1.7}/><path d="M0-5.4V5.4M-5.4 0H5.4M-3.8-3.8l7.6 7.6M-3.8 3.8l7.6-7.6" stroke="#b4473a" strokeWidth={.8}/><circle r={1.3} fill="#8a3329"/></g>
    </>}
    {look === "market-hall" && <>
      {[-.2, .12].map(yy => <g key={yy}><Box x={.3} y={yy} z={2.5} w={.1} d={.18} h={5} c={wood}/><Dots at={[iso(.3, yy - .06, 8.2), iso(.3, yy, 8.2), iso(.3, yy + .06, 8.2)]} c={["#d4604a", "#e39a3b", "#98ae5c"]} r={1.6}/></g>)}
      {Array.from({ length: 8 }, (_, i) => <polygon key={i} points={rect("r", .47, -.41 + i * .1025, -.41 + (i + 1) * .1025, 13.2, 16)} fill={i % 2 ? "#fbf1dc" : "#d4604a"}/>)}
      <Box x={.2} y={.38} z={2.5} w={.07} d={.07} h={4} c={wood}/>
    </>}
    {look === "community-hall" && <>
      <Line d={string([.44, -.32, 14], [.44, 0, 14], 2.2) + string([.44, 0, 14], [.44, .32, 14], 2.2)} c="#4b4a3c" w={.5}/>
      <Dots at={[-.28, -.2, -.12, -.04, .04, .12, .2, .28].map(yy => iso(.44, yy, 14 - 2.2 * 4 * ((yy + .32) % .32 / .32) * (1 - (yy + .32) % .32 / .32) - .8))} c={["#ffd978"]} r={1.1}/>
      {[-.18, .2].map(yy => <g key={yy}><Box x={.36} y={yy} z={2.5} w={.08} d={.1} h={3.5} c={["#a8794c", "#8b6039", "#7b5b3d"]}/><Bush x={.36} y={yy} s={.5} flowers="#e58f9d"/></g>)}
    </>}
    {finished && <>
      <Line d={string([x - w / 2 - .02, yl + .06, h + 1.5], [x + w / 2 + .02, yl + .06, h + 1.5], 3.5)} c="#6b5a45" w={.5}/>
      {flags([x - w / 2 - .02, yl + .06, h + 1.5], [x + w / 2 + .02, yl + .06, h + 1.5], 3.5, 7)}
      <Line d={string([.47, -.4, 16], [.47, .4, 16], 2.5)} c="#6b5a45" w={.5}/>
      {flags([.47, -.4, 16], [.47, .4, 16], 2.5, 9)}
    </>}
  </>;
}

// ——— Dekorácie ———
function Decoration({ id }: { id: ItemId }) {
  if (id === "bench") return <>
    <Round r={.3} f="#e5d9bb"/>
    <Tree x={-.2} y={-.24} s={.8} tone={1}/>
    <Bush x={-.3} y={.05} s={.55} tone={2}/>
    <Bench y={.03}/>
    <Lamp x={.23} y={-.13}/>
    <Bush x={.22} y={.22} s={.65} flowers="#f0c64a"/>
  </>;
  if (id === "flower-bed") {
    const rows = [[-7, [-9, -3, 3, 9]], [-3, [-13, -7, -1, 5, 11]], [1, [-14, -8, -2, 4, 10, 15]], [5, [-11, -5, 1, 7, 12]], [8, [-6, 0, 6]]] as const;
    const sorted = rows.flatMap(([dy, xs]) => xs.map(fx => [fx, dy] as const));
    return <>
      <ellipse cx={3} cy={2} rx={26} ry={13} fill={shadow} opacity={.1}/>
      <Round r={.36} h={5} f="#dccfb4" side="#a8997d"/><Round z={5.3} r={.3} f="#7b5b3d"/>
      {sorted.map(([fx, fy], i) => <g key={`${fx}${fy}`}><circle cx={fx} cy={q(fy - 4.3)} r={2.8} fill={leafTones[0][i % 2 + 1]}/><circle cx={fx + .6} cy={q(fy - 6)} r={1.9} fill={["#d8665a", "#e79ab0", "#f0c64a", "#fbf6e8", "#a98bc6"][(i * 3) % 5]}/><circle cx={fx + .6} cy={q(fy - 6)} r={.6} fill="#f7e6a6"/></g>)}
    </>;
  }
  if (id === "linden") return <>
    <path d="M-15 1A15 7.5 0 0 1 15 1" stroke="#9c6d40" strokeWidth={3.4} fill="none"/>
    <ellipse cx={11} cy={2} rx={22} ry={7} fill={shadow} opacity={.15}/>
    <path d="M-3 0-2-19-6.5-26-4.6-27.4-1-22V-30H1.2V-23L5-28 6.6-26.4 2.2-19 3 0Z" fill="#76583d"/>
    {([[6, -31, 15, 0], [-9, -30, 12.5, 0], [-4, -36, 13.5, 1], [9, -40, 11, 1], [-13, -40, 9, 1], [-7, -45, 9.5, 2], [3, -48, 8.5, 2], [-15, -34, 5.5, 2], [12, -33, 6, 1]] as const).map(([cx, cy, r, t]) => <circle key={`${cx}${cy}`} cx={cx} cy={cy} r={r} fill={leafTones[0][t]}/>)}
    <Dots at={[[-10, -46], [-3, -50], [-16, -38], [4, -43], [-8, -38]]} c={[leafTones[0][3]]} r={1.9}/>
    <path d="M-15 1A15 7.5 0 0 0 15 1" stroke="#b37d49" strokeWidth={3.4} fill="none"/><path d="M-14 .2A14 7 0 0 0 14 .2" stroke="#cf9a63" strokeWidth={1} fill="none"/>
    <Dots at={[[-18, 6], [19, 4], [-8, 9], [11, 9]]} c={["#e58f9d", "#f0c64a", "#fbf6e8"]} r={1.3}/>
  </>;
  if (id === "fountain") return <>
    <ellipse cx={4} cy={3} rx={28} ry={13} fill={shadow} opacity={.1}/>
    <Round r={.4} h={6} f="#e2d8c1" side="#ada186"/><Round z={6.3} r={.34} f="#84b9c6"/>
    <ellipse cx={-8} cy={-7} rx={6} ry={2} fill="#bfe0e8" opacity={.7}/><ellipse cx={0} cy={-6.3} rx={13} ry={6.6} fill="none" stroke="#a9d3dd" strokeWidth={.7}/>
    <rect x={-2.3} y={-26} width={4.6} height={20} fill="#e8dfca"/><rect x={0} y={-26} width={2.3} height={20} fill="#cfc4ab"/>
    <path d="M-10-17a10 4.4 0 0 0 20 0Z" fill="#b9ad93"/><ellipse cy={-17} rx={10} ry={4.4} fill="#ddd2b8"/><ellipse cy={-17.4} rx={8} ry={3.3} fill="#8fc1cc"/>
    <path d="M-5.2-27a5.2 2.4 0 0 0 10.4 0Z" fill="#b9ad93"/><ellipse cy={-27} rx={5.2} ry={2.4} fill="#ddd2b8"/><ellipse cy={-27.3} rx={3.8} ry={1.6} fill="#8fc1cc"/>
    <circle cy={-31} r={1.9} fill="#e8dfca"/>
    <path d="M-9.6-16q-3.4 3-4.4 9.4M9.6-16q3.4 3 4.4 9.4M-5-26q-2.4 2.4-3 8.4M5-26q2.4 2.4 3 8.4M0-33v-3.5" stroke="#c9e7ee" strokeWidth={1.1} fill="none" opacity={.9}/>
  </>;
  if (id === "book-kiosk") {
    const spines = ["#c9674b", "#5f8f88", "#e2b04f", "#7d93a8", "#9a78a8", "#d8665a", "#6f9a45"];
    return <>
      <Round r={.26} f="#e5d9bb"/>
      <Box w={.045} d={.045} h={11} c={["#6d4c33", "#56392a"]}/>
      <Box z={11} w={.22} d={.15} h={13} c={["#c4935c", "#a37443"]}/>
      {[12.2, 17.6].map(z => spines.map((c, i) => <polygon key={`${z}${i}`} points={rect("l", .075, -.085 + i * .024, -.085 + i * .024 + .019, z, z + 4.2 - (i % 3) * .5)} fill={c}/>))}
      <polygon points={rect("l", .075, -.095, .095, 11.6, 23.2)} fill="#dbeeed" opacity={.42}/>
      <Line d={seg(on("l", .075, -.095, 17.2), on("l", .075, .095, 17.2)) + seg(on("l", .075, 0, 11.6), on("l", .075, 0, 23.2))} c="#f4ede0" w={.8}/>
      <GableX w={.22} d={.15} z={24} rise={7} o={.03} c={roof.clay} wl={["#c4935c", "#a37443"]}/>
      <Bench x={.19} y={.21}/>
      <Bush x={-.24} y={.2} s={.55} flowers="#e79ab0"/>
    </>;
  }
  if (id === "pergola") {
    const post = (x: number, y: number) => <Box key={`${x}${y}`} x={x} y={y} w={.035} d={.035} h={20} c={wood}/>;
    const vines = [[-.24, -.2], [-.1, -.2], [.06, -.2], [.2, -.2], [-.18, .2], [-.02, .2], [.14, .2], [.24, .2]] as const;
    return <>
      <P p={[[-.32, -.28], [.32, -.28], [.32, .28], [-.32, .28]]} f="#e3d6b7"/>
      <Line d={[-.16, 0, .16].map(t => seg([t, -.28], [t, .28])).join("") + [-.14, 0, .14].map(t => seg([-.32, t], [.32, t])).join("")} c="#cdbc93" w={.5}/>
      {post(-.24, -.2)}{post(.24, -.2)}
      <Bench y={0}/>
      {post(-.24, .2)}{post(.24, .2)}
      <Box y={-.2} z={20} w={.58} d={.03} h={2} c={wood}/><Box y={.2} z={20} w={.58} d={.03} h={2} c={wood}/>
      {[-.24, -.12, 0, .12, .24].map(x => <Box key={x} x={x} z={22} w={.022} d={.5} h={1.3} c={["#d2a06a", "#aa7a4a", "#dcae78"]}/>)}
      {vines.map(([x, y], i) => { const [cx, cy] = iso(x, y, 22); return <g key={i}><circle cx={cx} cy={cy} r={3.6} fill={leafTones[0][i % 2]}/><circle cx={q(cx - 1.4)} cy={q(cy - 1.4)} r={2.2} fill={leafTones[0][2]}/></g>; })}
      {[-.2, -.06, .08, .22].map(x => { const [cx, cy] = iso(x, .21, 19); return <g key={x}><circle cx={cx} cy={cy} r={1.6} fill="#b39ad0"/><circle cx={cx} cy={q(cy + 2.6)} r={1.3} fill="#a488c4"/><circle cx={cx} cy={q(cy + 4.8)} r={.9} fill="#9a7dbb"/></g>; })}
    </>;
  }
  if (id === "clock") {
    const body = ["#c9826a", "#a86651", "#b87259"] as const;
    return <>
      <Shadow w={.2} d={.2} len={.3}/>
      <Box w={.27} d={.27} h={3} c={stone}/>
      <Box z={3} w={.2} d={.2} h={38} c={body}/>
      <Line d={seg([-.1, .1, 3], [-.1, .1, 41]) + seg([.1, .1, 3], [.1, .1, 41]) + seg([.1, -.1, 3], [.1, -.1, 41])} c="#e8d9bd" w={1.2}/>
      <polygon points={rect("l", .1, -.03, .03, 3, 12)} fill="#6f4a30"/>
      <Clock s="l" at={.1} u={0} z={34} r={3.1}/><Clock s="r" at={.1} u={0} z={34} r={3.1}/>
      <Box z={41} w={.23} d={.23} h={1.6} c={band}/>
      <Hip w={.23} d={.23} z={42.6} rise={15} o={0} c={roof.copper}/>
      <circle cy={-60} r={1.5} fill="#d9b25a"/>
      <Bush x={-.2} y={.2} s={.55} flowers="#d8665a"/><Bush x={.21} y={.17} s={.5} flowers="#f0c64a"/>
    </>;
  }
  if (id === "bandstand") {
    const r0 = .31, rc = .27, rr = .33, zf = 3, zc = 22, apex = 37;
    const at = (r: number, i: number, z: number): V => [OCT[i % 8][0] * r, OCT[i % 8][1] * r, z];
    const faces = OCT.map((_, i) => ({ i, m: (OCT[i][0] + OCT[(i + 1) % 8][0]) + (OCT[i][1] + OCT[(i + 1) % 8][1]), lit: OCT[i][1] + OCT[(i + 1) % 8][1] > OCT[i][0] + OCT[(i + 1) % 8][0] })).sort((a, b) => a.m - b.m);
    const cols = OCT.map((_, i) => i).sort((a, b) => (OCT[a][0] + OCT[a][1]) - (OCT[b][0] + OCT[b][1]));
    return <>
      <ellipse cx={5} cy={3} rx={24} ry={11} fill={shadow} opacity={.12}/>
      {faces.filter(f => f.m > 0).map(f => <P key={f.i} p={[at(r0, f.i, 0), at(r0, f.i + 1, 0), at(r0, f.i + 1, zf), at(r0, f.i, zf)]} f={f.lit ? "#c7a57a" : "#a98a62"}/>)}
      <polygon points={pts(...OCT.map((_, i) => at(r0, i, zf)))} fill="#dcc398"/>
      <Line d={[-.18, -.06, .06, .18].map(t => seg([t, -.26, zf], [t, .26, zf])).join("")} c="#c8ab7d" w={.6}/>
      <polygon points={pts(...OCT.map((_, i) => at(rr * .96, i, zc - .5)))} fill="#5d7f72"/>
      {cols.map(i => <Line key={i} d={seg(at(rc, i, zf), at(rc, i, zc))} c={OCT[i][0] > OCT[i][1] ? "#dcd3c0" : "#faf6ec"} w={1.6}/>)}
      <Line d={seg(at(rc, 7, 8), at(rc, 0, 8), at(rc, 1, 8), at(rc, 2, 8), at(rc, 3, 8), at(rc, 4, 8)) + seg(at(rc, 7, 5.5), at(rc, 0, 5.5), at(rc, 1, 5.5), at(rc, 2, 5.5), at(rc, 3, 5.5), at(rc, 4, 5.5))} c="#faf6ec" w={.8}/>
      {faces.map(f => <P key={f.i} p={[at(rr, f.i, zc), at(rr, f.i + 1, zc), [0, 0, apex]]} f={f.lit ? roof.copper.lit : f.m > 0 ? roof.copper.shade : roof.copper.back}/>)}
      <Line d={seg(at(rr, 7, zc), at(rr, 0, zc), at(rr, 1, zc), at(rr, 2, zc), at(rr, 3, zc), at(rr, 4, zc))} c={roof.copper.edge} w={1.3}/>
      <Line d={seg([0, 0, apex], [0, 0, apex + 5])} c="#8a7446" w={.9}/><circle cy={-apex - 5.6} r={1.4} fill="#d9b25a"/>
    </>;
  }
  if (id === "sculpture") return <>
    <Round r={.3} f="#e5d9bb"/>
    <Shadow w={.2} d={.2} len={.12}/>
    <Box w={.2} d={.2} h={11} c={pale}/>
    <polygon points={rect("l", .1, -.045, .045, 4, 7)} fill="#c9a55a"/>
    <path d="M-5-11C-13-22-5-37 3-35C11-33 5-26 8-19C9.5-15 6-11 1-11Z" fill="#5d8a7c"/>
    <path d="M-3-13C-9-22-4-33 2-33C-2-29-5-21 1-14Z" fill="#8cb7a9"/>
    <circle cx={3.4} cy={-25} r={2.4} fill="#e5d9bb"/>
    <Bush x={-.27} y={.18} s={.55}/><Bush x={.22} y={.26} s={.5} flowers="#fbf6e8"/>
  </>;
  if (id === "observatory") {
    const rx = 15.2, ry = 8.5, h = 15;
    return <>
      <ellipse cx={7} cy={2} rx={21} ry={9} fill={shadow} opacity={.12}/>
      <path d={`M${-rx} 0A${rx} ${ry} 0 0 0 ${rx} 0V${-h}A${rx} ${ry} 0 0 1 ${-rx} ${-h}Z`} fill="#efe9da"/>
      <path d={`M${q(rx * .35)} ${q(ry * .937)}A${rx} ${ry} 0 0 0 ${rx} 0V${-h}A${rx} ${ry} 0 0 1 ${q(rx * .35)} ${q(-h + ry * .937)}Z`} fill="#d7cfbd"/>
      <rect x={-2.5} y={-.5} width={5} height={8} fill="#5b4a3a"/><rect x={-11.5} y={-9} width={2.6} height={3} fill="#88aaaf"/><rect x={8.6} y={-9} width={2.6} height={3} fill="#67878e"/>
      <path d={`M${-rx} ${-h}A${rx} ${q(rx * .95)} 0 0 1 ${rx} ${-h}A${rx} ${ry} 0 0 1 ${-rx} ${-h}Z`} fill="#cbd3d6"/>
      <path d={`M${q(rx * .3)} ${q(-h + ry * .95)}A${rx} ${ry} 0 0 0 ${rx} ${-h}A${rx} ${q(rx * .95)} 0 0 0 ${q(rx * .3)} ${q(-h - rx * .9)}Z`} fill="#adb8bd"/>
      <path d={`M-2.3 ${q(-h + ry - .4)}H2.3V${q(-h - rx * .82)}H-2.3Z`} fill="#3a474e"/>
      <path d={`M-1.2 ${q(-h - rx * .45)}l10.5-7.6 2 2.8-10.5 7.6Z`} fill="#6b757a"/>
      <Line d={`M${-rx} ${-h}A${rx} ${ry} 0 0 0 ${rx} ${-h}`} c="#9aa5aa" w={1}/>
    </>;
  }
  if (id === "glasshouse") {
    const w = .6, d = .38, h = 17, rise = 10, x0 = -w / 2, x1 = w / 2, y0 = -d / 2, y1 = d / 2, t = h + rise;
    const frame = "#f7f8f2";
    return <>
      <Shadow w={w} d={d} len={.1}/>
      <P p={[[x0, y0, 3], [x1, y0, 3], [x1, y0, h], [x0, y0, h]]} f="#d7ecea" o={.4}/><P p={[[x0, y0, 3], [x0, y1, 3], [x0, y1, h], [x0, y0, h]]} f="#d7ecea" o={.4}/>
      <Box w={w} d={d} h={3} c={["#c97b5e", "#a55f47", "#b86e53"]}/>
      {[[-.18, -.08, 9, 7], [0, -.1, 12, 7.5], [.17, -.04, 8, 6], [-.08, .06, 6, 5], [.12, .08, 6, 4.5]].map(([x, y, z, r], i) => { const [cx, cy] = iso(x, y, z); return <g key={i}><circle cx={cx} cy={cy} r={r} fill={leafTones[i % 3][1]}/><circle cx={q(cx - r * .35)} cy={q(cy - r * .35)} r={q(r * .5)} fill={leafTones[i % 3][2]}/></g>; })}
      <Dots at={[iso(-.12, .02, 10), iso(.1, 0, 12), iso(.02, .04, 7)]} c={["#e58f9d", "#d8665a", "#f0c64a"]} r={1.4}/>
      <P p={[[x0, y1, 3], [x1, y1, 3], [x1, y1, h], [x0, y1, h]]} f="#cfe7e4" o={.5}/>
      <P p={[[x1, y0, 3], [x1, y1, 3], [x1, y1, h], [x1, y0, h]]} f="#b3d5d1" o={.55}/>
      <P p={[[x1, y0, h], [x1, y1, h], [x1, 0, t]]} f="#b3d5d1" o={.55}/>
      <P p={[[x0 - .02, y1 + .02, h], [x1 + .02, y1 + .02, h], [x1 + .02, 0, t], [x0 - .02, 0, t]]} f="#dcefec" o={.6}/>
      <Line d={Array.from({ length: 7 }, (_, i) => seg([x0 + i * w / 6, y1, 3], [x0 + i * w / 6, y1, h], [x0 + i * w / 6, 0, t])).join("") + [-.095, .095].map(y => seg([x1, y, 3], [x1, y, h])).join("")
        + seg([x0, y1, h], [x1, y1, h], [x1, y0, h]) + seg([x0, y1, 10], [x1, y1, 10], [x1, y0, 10]) + seg([x0 - .02, 0, t], [x1 + .02, 0, t]) + seg([x1, y0, h], [x1, 0, t], [x1, y1, h])} c={frame} w={.9}/>
    </>;
  }
  // slávnostná brána: kamenný oblúk s girlandou
  const arc = (y: number, r: number, lift: number): V[] => HALF.map(([c, n]) => [c * r, y, 22 + lift * n] as V);
  const outerF = arc(.045, .245, 13), innerF = arc(.045, .155, 8.5), outerB = arc(-.045, .245, 13), innerB = arc(-.045, .155, 8.5);
  return <>
    <P p={[[-.11, -.46], [.11, -.46], [.11, .46], [-.11, .46]]} f="#e4d7b7"/>
    <Line d={[-.3, -.15, 0, .15, .3].map(t => seg([-.11, t], [.11, t])).join("")} c="#d0c09a" w={.5}/>
    <Box x={-.2} w={.09} d={.09} h={22} c={pale}/><Box x={.2} w={.09} d={.09} h={22} c={pale}/>
    <polygon points={pts(...innerF, ...[...innerB].reverse())} fill="#bcae92"/>
    <polygon points={pts(...outerB, ...[...outerF].reverse())} fill="#f1eadb"/>
    <polygon points={pts(...outerF, ...[...innerF].reverse())} fill={pale[0]}/>
    <Line d={seg(...arc(.05, .2, 10.8))} c="#5f8c4f" w={3.2}/>
    <Dots at={HALF.slice(1, 8).map(([c, n]) => iso(c * .2, .05, 22 + 10.8 * n))} c={["#e79ab0", "#f0c64a", "#fbf6e8", "#d8665a"]} r={1.5}/>
    <Dots at={[iso(-.2, .05, 14), iso(-.2, .05, 8), iso(.2, .05, 14), iso(.2, .05, 8)]} c={["#5f8c4f"]} r={2}/>
    <Dots at={[iso(-.2, .05, 11.5), iso(.2, .05, 11.5), iso(-.2, .05, 5)]} c={["#e79ab0", "#f0c64a"]} r={1.2}/>
    <Bush x={-.27} y={.14} s={.55} flowers="#e58f9d"/><Bush x={.29} y={.12} s={.55} flowers="#f0c64a"/>
  </>;
}

// Kúsky sa kreslia z primitívnych props, takže memo ušetrí prepočet celej mapy pri každom ťuknutí.
export const TownPiece = memo(function TownPiece({ id, branch = null, finished = false, variant = 0 }: { id: ItemId; branch?: Branch | null; finished?: boolean; variant?: number }) {
  switch (id) {
    case "house": return <House variant={variant}/>;
    case "school": return <School/>;
    case "library": return <Library/>;
    case "culture": return <Culture/>;
    case "clinic": return <Clinic/>;
    case "market": return <Market/>;
    case "workshop": return <Workshop/>;
    case "park": return <Park/>;
    case "garden": return <Garden/>;
    case "town-hall": return <TownHall/>;
    case "plaza": return <Plaza/>;
    case "station": return <Station branch={branch} finished={finished}/>;
    default: return <Decoration id={id}/>;
  }
});
// Samostatný kúsok na vlastnom podstavci (katalóg, zbierka, dialógy).
export default function RepublicArt({ id, branch = null, finished = false, variant = 0 }: { id: ItemId; branch?: Branch | null; finished?: boolean; variant?: number }) {
  const top = id === "town-hall" ? -104 : -76;
  return <svg viewBox={`-50 ${top} 100 ${34 - top}`} className="republic-art" aria-hidden="true">
    <P p={[[.5, -.5, 0], [.5, .5, 0], [.5, .5, -5], [.5, -.5, -5]]} f="#8c6c49"/>
    <P p={[[-.5, .5, 0], [.5, .5, 0], [.5, .5, -5], [-.5, .5, -5]]} f="#a57f56"/>
    <P p={[[-.5, -.5], [.5, -.5], [.5, .5], [-.5, .5]]} f="#b3c98a"/>
    <Line d={seg([-.5, .5], [.5, .5], [.5, -.5])} c="#d3e1b0" w={.8}/>
    <TownPiece id={id} branch={branch} finished={finished} variant={variant}/>
  </svg>;
}
