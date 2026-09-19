"use client";

import { seasonOf, type Flag, type SeasonName } from "@/lib/december-game";

/*
  Mandátovce ako drevená stolová hra: izometrická dioráma, ktorá reaguje na rozhodnutia aj na ročné obdobie.
  Smer určil Codexov vizuálny koncept (miniatúrne zimné mestečko: škola, radnica s vežou, poliklinika, rieka
  s dreveným mostom, teplé okná). Všetko je kreslené základnými tvarmi v jednej projekcii, aby scéna ostala
  čitateľná aj na 340 px širokom displeji. Príznaky (flags) pridávajú prvky — zmenu má byť vidieť, nie čítať.
*/
const S = 28, CX = 315, CY = 30;
type Pt = [number, number, number?];
const sx = (x: number, y: number) => CX + (x - y) * 0.866 * S;
const sy = (x: number, y: number, z = 0) => CY + (x + y) * 0.5 * S - z * S;
const px = ([x, y, z = 0]: Pt) => `${sx(x, y).toFixed(1)},${sy(x, y, z).toFixed(1)}`;
const poly = (...pts: Pt[]) => pts.map(px).join(" ");
const shade = (hex: string, k: number) => "#" + [1, 3, 5].map(i => Math.max(0, Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * k))).toString(16).padStart(2, "0")).join("");

type Palette = { ground: string; groundEdge: string; plaza: string; foliage: string; foliageAlt: string; water: string; lit: boolean; snow?: boolean; leaves?: boolean; blossoms?: boolean };
const palettes: Record<SeasonName, Palette> = {
  winter: { ground: "#f3f3ee", groundEdge: "#e3e5df", plaza: "#e6e1d6", foliage: "#3d6a4b", foliageAlt: "#53805a", water: "#7fa3c6", lit: true, snow: true },
  spring: { ground: "#b3d191", groundEdge: "#9dbf7c", plaza: "#ddd3c1", foliage: "#67a86c", foliageAlt: "#86bb77", water: "#6f9fc9", lit: false, blossoms: true },
  summer: { ground: "#9cc074", groundEdge: "#86ac61", plaza: "#dcd1bd", foliage: "#3f8a4f", foliageAlt: "#5d9c57", water: "#5f96c2", lit: false },
  autumn: { ground: "#cfae66", groundEdge: "#b99753", plaza: "#ddd2be", foliage: "#c9742f", foliageAlt: "#dda23a", water: "#7396b6", lit: true, leaves: true },
};
const INK = "#1f3554", TERRA = "#c4573a", IVORY = "#f3e9d6", WOOD = "#c9a26d", WOOD_DARK = "#a57c48", STONE = "#cfc7b8", ROAD = "#8f8b82", SLATE = "#5f7185", GREEN_ROOF = "#4b8a70", GOLD = "#f0b429", RED = "#d8443a";

type BoxProps = { x0: number; x1: number; y0: number; y1: number; h: number; wall: string; roof: string; rh?: number; win?: [number, number]; door?: boolean; label?: string; chimney?: boolean; cross?: boolean; pyramid?: boolean; p: Palette; children?: React.ReactNode };
// Budova: dve viditeľné steny, sedlová (alebo ihlanová) strecha, okná, dvere, nápis. Sneh v zime, okná svietia v zime a na jeseň.
function Box({ x0, x1, y0, y1, h, wall, roof, rh = .9, win = [0, 0], door, label, chimney, cross, pyramid, p, children }: BoxProps) {
  const ym = (y0 + y1) / 2, xm = (x0 + x1) / 2, o = .22;
  const lit = p.lit, glass = lit ? "#ffd68a" : "#cfe3ee";
  const zb = h * .38, zt = Math.min(h - .35, zb + .7);
  const windows: React.ReactNode[] = [];
  for (let i = 0; i < win[0]; i++) { const x = x0 + (x1 - x0) * (i + 1) / (win[0] + 1), w = .26; if (door && Math.abs(x - xm) < .45) continue; windows.push(<g key={`l${i}`}>{lit && <polygon points={poly([x - w - .1, y1, zb - .1], [x + w + .1, y1, zb - .1], [x + w + .1, y1, zt + .1], [x - w - .1, y1, zt + .1])} fill="#ffd68a" opacity=".3"/>}<polygon points={poly([x - w, y1, zb], [x + w, y1, zb], [x + w, y1, zt], [x - w, y1, zt])} fill={glass} stroke={INK} strokeOpacity=".35" strokeWidth=".8"/></g>); }
  for (let i = 0; i < win[1]; i++) { const y = y0 + (y1 - y0) * (i + 1) / (win[1] + 1), w = .24; windows.push(<g key={`r${i}`}>{lit && <polygon points={poly([x1, y - w - .1, zb - .1], [x1, y + w + .1, zb - .1], [x1, y + w + .1, zt + .1], [x1, y - w - .1, zt + .1])} fill="#ffd68a" opacity=".3"/>}<polygon points={poly([x1, y - w, zb], [x1, y + w, zb], [x1, y + w, zt], [x1, y - w, zt])} fill={shade(glass, .9)} stroke={INK} strokeOpacity=".35" strokeWidth=".8"/></g>); }
  const labelMatrix = `matrix(${(0.866 * S).toFixed(3)} ${(0.5 * S).toFixed(3)} 0 ${S} ${(CX - y1 * 0.866 * S).toFixed(2)} ${(CY + y1 * 0.5 * S).toFixed(2)})`;
  return <g>
    <polygon points={poly([x0, y1], [x1, y1], [x1, y1, h], [x0, y1, h])} fill={wall} stroke={INK} strokeOpacity=".22" strokeWidth=".8"/>
    <polygon points={poly([x1, y0], [x1, y1], [x1, y1, h], [x1, y0, h])} fill={shade(wall, .8)} stroke={INK} strokeOpacity=".22" strokeWidth=".8"/>
    {windows}
    {door && <polygon points={poly([xm - .28, y1, 0], [xm + .28, y1, 0], [xm + .28, y1, .95], [xm - .28, y1, .95])} fill={INK} opacity=".82"/>}
    {cross && <g><polygon points={poly([x1 - 1.1, y1, zt - .05], [x1 - .3, y1, zt - .05], [x1 - .3, y1, zt + .75], [x1 - 1.1, y1, zt + .75])} fill="#fff" stroke={INK} strokeOpacity=".2"/><polygon points={poly([x1 - .78, y1, zt + .05], [x1 - .62, y1, zt + .05], [x1 - .62, y1, zt + .65], [x1 - .78, y1, zt + .65])} fill={RED}/><polygon points={poly([x1 - 1.0, y1, zt + .27], [x1 - .4, y1, zt + .27], [x1 - .4, y1, zt + .43], [x1 - 1.0, y1, zt + .43])} fill={RED}/></g>}
    {label && <text transform={labelMatrix} x={x0 + .32} y={-(h - .22)} fontSize=".36" fontWeight="700" letterSpacing=".03" fill={INK} style={{ fontFamily: "inherit" }}>{label}</text>}
    {pyramid ? <>
      <polygon points={poly([x0, y0, h], [x1, y0, h], [xm, ym, h + rh])} fill={shade(roof, .72)}/>
      <polygon points={poly([x0, y0, h], [x0, y1, h], [xm, ym, h + rh])} fill={shade(roof, .82)}/>
      <polygon points={poly([x1, y0, h], [x1, y1, h], [xm, ym, h + rh])} fill={shade(roof, .9)}/>
      <polygon points={poly([x0, y1, h], [x1, y1, h], [xm, ym, h + rh])} fill={roof}/>
      {p.snow && <polygon points={poly([x0 + .12, y1 - .02, h + .08], [x1 - .12, y1 - .02, h + .08], [xm, ym, h + rh - .12])} fill="#fff" opacity=".9"/>}
      <polygon points={poly([xm - .05, ym - .05, h + rh], [xm + .05, ym + .05, h + rh], [xm, ym, h + rh + .45])} fill={GOLD}/>
    </> : <>
      <polygon points={poly([x1, y0, h], [x1, y1, h], [x1, ym, h + rh])} fill={shade(wall, .8)} stroke={INK} strokeOpacity=".22" strokeWidth=".8"/>
      <polygon points={poly([x0 - o, y0 - o, h - .08], [x1 + o, y0 - o, h - .08], [x1 + o, ym, h + rh], [x0 - o, ym, h + rh])} fill={shade(roof, .78)}/>
      <polygon points={poly([x0 - o, y1 + o, h - .08], [x1 + o, y1 + o, h - .08], [x1 + o, ym, h + rh], [x0 - o, ym, h + rh])} fill={roof}/>
      <g stroke="#000" strokeOpacity=".08">{[.25, .5, .75].map(k => <polyline key={k} points={poly([x0 - o, y1 + o - (y1 + o - ym) * k, h - .08 + (rh + .08) * k], [x1 + o, y1 + o - (y1 + o - ym) * k, h - .08 + (rh + .08) * k])} fill="none"/>)}</g>
      {p.snow && <><polygon points={poly([x0 - o, y1 + o - (y1 + o - ym) * .42, h - .08 + (rh + .08) * .42], [x1 + o, y1 + o - (y1 + o - ym) * .42, h - .08 + (rh + .08) * .42], [x1 + o, ym, h + rh], [x0 - o, ym, h + rh])} fill="#fff" opacity=".93"/><polygon points={poly([x0 - o, y0 - o + (ym - y0 + o) * .5, h - .08 + (rh + .08) * .5], [x1 + o, y0 - o + (ym - y0 + o) * .5, h - .08 + (rh + .08) * .5], [x1 + o, ym, h + rh], [x0 - o, ym, h + rh])} fill="#fff" opacity=".8"/></>}
      <polyline points={poly([x0 - o, ym, h + rh], [x1 + o, ym, h + rh])} stroke={shade(roof, .6)} strokeWidth="1.4" fill="none" strokeLinecap="round"/>
      {chimney && <g><polygon points={poly([x1 - .95, ym - .3, h + rh * .35], [x1 - .6, ym - .3, h + rh * .35], [x1 - .6, ym - .3, h + rh + .35], [x1 - .95, ym - .3, h + rh + .35])} fill={shade(TERRA, .7)}/><polygon points={poly([x1 - .6, ym - .65, h + rh * .35], [x1 - .6, ym - .3, h + rh * .35], [x1 - .6, ym - .3, h + rh + .35], [x1 - .6, ym - .65, h + rh + .35])} fill={shade(TERRA, .55)}/><polygon points={poly([x1 - .95, ym - .65, h + rh + .35], [x1 - .6, ym - .65, h + rh + .35], [x1 - .6, ym - .3, h + rh + .35], [x1 - .95, ym - .3, h + rh + .35])} fill={shade(TERRA, .85)}/></g>}
    </>}
    {children}
  </g>;
}
function Fir({ x, y, size, p, decorated }: { x: number; y: number; size: number; p: Palette; decorated?: boolean }) {
  const bx = sx(x, y), by = sy(x, y);
  return <g>
    <ellipse cx={bx} cy={by + 2} rx={size * .34} ry={size * .12} fill={INK} opacity=".12"/>
    <rect x={bx - size * .05} y={by - size * .16} width={size * .1} height={size * .18} fill={WOOD_DARK}/>
    {[0, 1, 2].map(i => { const w = size * .38 * (1 - i * .22), top = by - size * (.55 + i * .3), bot = top + size * .48; return <polygon key={i} points={`${bx - w},${bot} ${bx},${top} ${bx + w},${bot}`} fill={i % 2 ? "#33634a" : "#2a5640"}/>; })}
    {p.snow && [0, 1, 2].map(i => { const w = size * .38 * (1 - i * .22) * .55, top = by - size * (.55 + i * .3), bot = top + size * .2; return <polygon key={i} points={`${bx - w},${bot} ${bx},${top} ${bx + w},${bot}`} fill="#fff" opacity=".92"/>; })}
    {decorated && <>{[[-.14, .25], [.12, .33], [-.2, .5], [.18, .55], [0, .12], [-.08, .72], [.1, .8]].map(([dx, dy], i) => <circle key={i} cx={bx + dx * size} cy={by - size * (1.2 - dy)} r={size * .045} fill={[GOLD, RED, "#fff"][i % 3]}/>)}<polygon points={`${bx},${by - size * 1.28} ${bx + size * .05},${by - size * 1.16} ${bx + size * .16},${by - size * 1.15} ${bx + size * .07},${by - size * 1.08} ${bx + size * .1},${by - size * .97} ${bx},${by - size * 1.03} ${bx - size * .1},${by - size * .97} ${bx - size * .07},${by - size * 1.08} ${bx - size * .16},${by - size * 1.15} ${bx - size * .05},${by - size * 1.16}`} fill={GOLD}/></>}
  </g>;
}
function Tree({ x, y, size, p, alt }: { x: number; y: number; size: number; p: Palette; alt?: boolean }) {
  const bx = sx(x, y), by = sy(x, y), r = size * .34, cy = by - size * .72, fill = alt ? p.foliageAlt : p.foliage;
  return <g>
    <ellipse cx={bx} cy={by + 2} rx={size * .3} ry={size * .1} fill={INK} opacity=".12"/>
    <rect x={bx - size * .045} y={by - size * .5} width={size * .09} height={size * .52} fill={WOOD_DARK}/>
    {p.snow
      ? <g stroke={WOOD_DARK} strokeWidth={size * .05} strokeLinecap="round"><line x1={bx} y1={by - size * .48} x2={bx - r * .9} y2={cy - r * .2}/><line x1={bx} y1={by - size * .48} x2={bx + r * .9} y2={cy - r * .1}/><line x1={bx} y1={by - size * .48} x2={bx} y2={cy - r * .9}/><line x1={bx - r * .45} y1={cy + r * .2} x2={bx - r * .8} y2={cy - r * .5}/></g>
      : <><circle cx={bx} cy={cy} r={r} fill={fill}/><circle cx={bx - r * .5} cy={cy + r * .3} r={r * .72} fill={shade(fill, .92)}/><circle cx={bx + r * .5} cy={cy + r * .3} r={r * .72} fill={shade(fill, 1.06)}/>
        {p.blossoms && [[-.4, -.3], [.3, -.5], [.55, .2], [-.6, .3], [0, .1]].map(([dx, dy], i) => <circle key={i} cx={bx + dx * r} cy={cy + dy * r} r={size * .045} fill="#f5c3d2"/>)}</>}
  </g>;
}
function Lamp({ x, y, on, led, h = 1.35 }: { x: number; y: number; on: boolean; led: boolean; h?: number }) {
  const bx = sx(x, y), by = sy(x, y), top = sy(x, y, h);
  return <g>
    {on && <circle cx={bx} cy={top} r={led ? 15 : 10} fill={led ? "#fff5cf" : "#ffd68a"} opacity={led ? .5 : .38}/>}
    <line x1={bx} y1={by} x2={bx} y2={top} stroke={INK} strokeWidth="1.6"/>
    <rect x={bx - 3.5} y={top - 4} width="7" height="6" rx="1.5" fill={on ? (led ? "#fff8dc" : "#ffd68a") : "#dfe6ea"} stroke={INK} strokeWidth="1"/>
  </g>;
}
const Ground = ({ pts, fill, opacity, stroke }: { pts: Pt[]; fill: string; opacity?: number | string; stroke?: string }) => <polygon points={poly(...pts)} fill={fill} opacity={opacity} stroke={stroke} strokeWidth=".8"/>;

export type TownProps = { month: number; flags: Flag[]; className?: string; label?: string; decorative?: boolean };
export default function DecemberTown({ month, flags, className, label, decorative }: TownProps) {
  const season = seasonOf(month);
  const p = palettes[season];
  const has = (f: Flag) => flags.includes(f);
  const lit = p.lit, led = has("led");
  const bridge = has("bridge-fixed") ? "fixed" : has("bridge-temp") ? "temp" : "plain";
  const clock = ((month + 1) % 12) * 30;
  const description = label ?? `Mestečko Mandátovce, ${season === "winter" ? "zima" : season === "spring" ? "jar" : season === "summer" ? "leto" : "jeseň"}.`;
  const clockAt: [number, number] = [sx(10.2, 2.45), sy(10.2, 2.45, 4.25)];
  const gymRoof = has("gym-roof") ? SLATE : TERRA;

  return <svg viewBox="0 0 800 520" className={className} role={decorative ? undefined : "img"} aria-hidden={decorative ? true : undefined} aria-label={decorative ? undefined : description} focusable="false">
    <defs>
      <linearGradient id="dt-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={p.water}/><stop offset="1" stopColor={shade(p.water, .85)}/></linearGradient>
      <radialGradient id="dt-glow" cx=".5" cy=".55" r=".6"><stop offset="0" stopColor="#fff" stopOpacity=".55"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></radialGradient>
    </defs>
    <ellipse cx="400" cy="300" rx="420" ry="250" fill="url(#dt-glow)"/>
    {/* drevená doska */}
    <ellipse cx={sx(9.5, 6)} cy={sy(9.5, 6, -.7) + 16} rx="380" ry="36" fill={INK} opacity=".14"/>
    <Ground pts={[[-.2, 12.2, 0], [19.2, 12.2, 0], [19.2, 12.2, -.7], [-.2, 12.2, -.7]]} fill={WOOD}/>
    <Ground pts={[[19.2, -.2, 0], [19.2, 12.2, 0], [19.2, 12.2, -.7], [19.2, -.2, -.7]]} fill={WOOD_DARK}/>
    <Ground pts={[[-.2, -.2], [19.2, -.2], [19.2, 12.2], [-.2, 12.2]]} fill={p.ground}/>
    <Ground pts={[[-.2, 11.9], [19.2, 11.9], [19.2, 12.2], [-.2, 12.2]]} fill={p.groundEdge}/>
    {/* námestie, cesta, chodník, cyklotrasa */}
    <Ground pts={[[7.2, 5.2], [13.4, 5.2], [13.4, 9.5], [7.2, 9.5]]} fill={p.plaza}/>
    <g stroke={INK} strokeOpacity=".08">{[6, 6.8, 7.6, 8.4].map(y => <polyline key={y} points={poly([7.2, y], [13.4, y])} fill="none"/>)}{[8.4, 9.6, 10.8, 12].map(x => <polyline key={x} points={poly([x, 5.2], [x, 9.5])} fill="none"/>)}</g>
    <Ground pts={[[-.2, 4.2], [19.2, 4.2], [19.2, 5.2], [-.2, 5.2]]} fill={ROAD}/>
    <polyline points={poly([-.2, 4.7], [19.2, 4.7])} stroke="#f2ecd8" strokeWidth="1.4" strokeDasharray="9 8" opacity=".8" fill="none"/>
    {p.snow && <><Ground pts={[[-.2, 4.2], [19.2, 4.2], [19.2, 4.35], [-.2, 4.35]]} fill="#fff" opacity=".8"/><Ground pts={[[-.2, 5.05], [19.2, 5.05], [19.2, 5.2], [-.2, 5.2]]} fill="#fff" opacity=".8"/></>}
    {has("path") && <Ground pts={[[.9, 3.7], [5.8, 3.7], [5.8, 4.2], [.9, 4.2]]} fill={STONE}/>}
    {has("bike-path") && <g><Ground pts={[[-.2, 11.3], [19.2, 11.3], [19.2, 11.62], [-.2, 11.62]]} fill="#b9694a" opacity=".9"/><g stroke={INK} strokeWidth="1.6" fill="none"><circle cx={sx(15.2, 11.45)} cy={sy(15.2, 11.45, .18)} r="4.5"/><circle cx={sx(15.9, 11.45)} cy={sy(15.9, 11.45, .18)} r="4.5"/><path d={`M${sx(15.2, 11.45)} ${sy(15.2, 11.45, .18)} L ${sx(15.5, 11.45)} ${sy(15.5, 11.45, .55)} L ${sx(15.9, 11.45)} ${sy(15.9, 11.45, .18)} M${sx(15.5, 11.45)} ${sy(15.5, 11.45, .55)} L ${sx(15.75, 11.45)} ${sy(15.75, 11.45, .58)}`}/></g></g>}
    {/* rieka */}
    <Ground pts={[[-.2, 9.85], [19.2, 9.85], [19.2, 11.05], [-.2, 11.05]]} fill="url(#dt-water)"/>
    <g stroke="#fff" strokeOpacity=".55" strokeWidth="1.5" strokeLinecap="round" fill="none">{[[1, 10.2], [4.5, 10.7], [7, 10.3], [14, 10.6], [17.5, 10.2], [12.5, 10.85]].map(([x, y]) => <polyline key={`${x}${y}`} points={poly([x, y], [x + 1.1, y])}/>)}</g>
    {p.snow && <><Ground pts={[[-.2, 9.85], [19.2, 9.85], [19.2, 10.05], [-.2, 10.05]]} fill="#fff" opacity=".85"/><Ground pts={[[-.2, 10.88], [19.2, 10.88], [19.2, 11.05], [-.2, 11.05]]} fill="#fff" opacity=".85"/></>}
    {has("flood-wall") && <g>{[[6, 9.3], [11.1, 14.6]].map(([a, b]) => <g key={a}><Ground pts={[[a, 9.6, 0], [b, 9.6, 0], [b, 9.6, .3], [a, 9.6, .3]]} fill={STONE} stroke={INK}/><Ground pts={[[a, 9.6, .3], [b, 9.6, .3], [b, 9.85, .3], [a, 9.85, .3]]} fill={shade(STONE, 1.08)}/></g>)}<Ground pts={[[6, 11.05, 0], [14.6, 11.05, 0], [14.6, 11.05, .3], [6, 11.05, .3]]} fill={STONE} stroke={INK}/><Ground pts={[[6, 11.05, .3], [14.6, 11.05, .3], [14.6, 11.3, .3], [6, 11.3, .3]]} fill={shade(STONE, 1.08)}/></g>}
    {has("flooded") && <Ground pts={[[5.2, 8.2], [15.4, 8.2], [15.4, 9.85], [5.2, 9.85]]} fill={p.water} opacity=".5"/>}
    {/* zadný rad: stromy, škola s telocvičňou, radnica s vežou, poliklinika */}
    <Fir x={.3} y={.5} size={36} p={p}/><Fir x={7.2} y={.4} size={30} p={p}/><Fir x={13.0} y={.3} size={30} p={p}/><Fir x={18.7} y={.5} size={38} p={p}/>
    <Box x0={.8} x1={5.8} y0={.8} y1={3.6} h={2.1} wall={IVORY} roof={TERRA} rh={1} win={[4, 1]} door label="ŠKOLA" chimney p={p}/>
    {p.snow && <g fill={has("boiler") ? "#fff" : "#9aa3ad"} opacity={has("boiler") ? .85 : .7}><circle cx={sx(5.05, 2.05)} cy={sy(5.05, 2.05, 3.7)} r={has("boiler") ? 3 : 5}/><circle cx={sx(5.05, 2.05) + 6} cy={sy(5.05, 2.05, 4.1)} r={has("boiler") ? 2.5 : 7}/><circle cx={sx(5.05, 2.05) + 14} cy={sy(5.05, 2.05, 4.6)} r={has("boiler") ? 2 : 9}/></g>}
    <Box x0={5.8} x1={7.6} y0={1.7} y1={3.6} h={1.3} wall={IVORY} roof={gymRoof} rh={.45} win={[1, 0]} p={p}>
      {has("gym-tarp") && <polygon points={poly([6.1, 3.75, 1.27], [7.3, 3.75, 1.27], [7.3, 2.95, 1.6], [6.1, 2.95, 1.6])} fill="#2f6fc2" opacity=".92"/>}
    </Box>
    <Box x0={9.7} x1={10.7} y0={1.45} y1={2.45} h={5.1} wall="#f7f0e1" roof={GREEN_ROOF} rh={1.5} pyramid p={p}/>
    <Box x0={8.2} x1={12.2} y0={.6} y1={3.4} h={2.4} wall="#f7f0e1" roof={TERRA} rh={1.1} win={[3, 1]} door label="RADNICA" p={p}/>
    <g><circle cx={clockAt[0]} cy={clockAt[1]} r="7" fill="#fff" stroke={INK} strokeWidth="1.4"/><line x1={clockAt[0]} y1={clockAt[1]} x2={clockAt[0] + 4.6 * Math.sin(clock * Math.PI / 180)} y2={clockAt[1] - 4.6 * Math.cos(clock * Math.PI / 180)} stroke={INK} strokeWidth="1.4" strokeLinecap="round"/><line x1={clockAt[0]} y1={clockAt[1]} x2={clockAt[0]} y2={clockAt[1] - 5.5} stroke={INK} strokeWidth=".9" strokeLinecap="round"/></g>
    <Box x0={12.8} x1={17.4} y0={.8} y1={3.4} h={1.9} wall="#fbfaf5" roof="#b9513b" rh={.9} win={[3, 1]} door label="POLIKLINIKA" cross p={p}/>
    {has("clinic-wing") && <g className="dt-appear"><Box x0={17.4} x1={18.8} y0={1.5} y1={3.4} h={1.5} wall="#fbfaf5" roof="#b9513b" rh={.6} win={[1, 0]} p={p}/></g>}
    {/* pri ceste */}
    {has("trees") && <g className="dt-appear"><Tree x={1} y={5.75} size={20} p={p} alt/><Tree x={2.2} y={5.75} size={20} p={p}/><Tree x={3.4} y={5.75} size={20} p={p} alt/></g>}
    <Lamp x={3} y={5.45} on={lit || led} led={led}/><Lamp x={6.9} y={5.45} on={lit || led} led={led}/><Lamp x={12.6} y={5.45} on={lit || led} led={led}/><Lamp x={16.6} y={5.45} on={lit || led} led={led}/>
    {has("bus") && <g className="dt-appear"><Box x0={13.8} x1={16} y0={4.35} y1={5.05} h={.95} wall={GOLD} roof={shade(GOLD, .85)} rh={.02} win={[3, 1]} p={{ ...p, lit: false }}/><circle cx={sx(14.25, 5.05)} cy={sy(14.25, 5.05) - 2} r="4" fill={INK}/><circle cx={sx(15.55, 5.05)} cy={sy(15.55, 5.05) - 2} r="4" fill={INK}/></g>}
    {has("ambulance") && <g className="dt-appear"><Box x0={17.2} x1={18.6} y0={4.35} y1={5} h={.8} wall="#ffffff" roof="#e9ecef" rh={.02} win={[1, 1]} p={{ ...p, lit: false }}><polygon points={poly([17.2, 5, .28], [18.6, 5, .28], [18.6, 5, .42], [17.2, 5, .42])} fill={RED}/><rect x={sx(17.9, 4.67) - 3} y={sy(17.9, 4.67, .82) - 5} width="6" height="4" rx="1" fill="#2f6fc2"/></Box><circle cx={sx(17.55, 5)} cy={sy(17.55, 5) - 2} r="3.5" fill={INK}/><circle cx={sx(18.3, 5)} cy={sy(18.3, 5) - 2} r="3.5" fill={INK}/></g>}
    {/* ihrisko a predné domy */}
    {has("playground") && <g className="dt-appear"><Ground pts={[[5.5, 5.7], [7.0, 5.7], [7.0, 7.2], [5.5, 7.2]]} fill="#e8d7a9"/><g stroke={INK} strokeWidth="1.8" strokeLinecap="round" fill="none"><polyline points={poly([5.7, 6.6, 0], [5.8, 6.4, 1.1], [5.9, 6.2, 0])}/><polyline points={poly([6.5, 6.6, 0], [6.6, 6.4, 1.1], [6.7, 6.2, 0])}/><polyline points={poly([5.8, 6.4, 1.1], [6.6, 6.4, 1.1])}/><polyline points={poly([6.05, 6.4, 1.1], [6.05, 6.4, .45])}/><polyline points={poly([6.35, 6.4, 1.1], [6.35, 6.4, .45])}/></g><polygon points={poly([5.98, 6.4, .45], [6.42, 6.4, .45], [6.42, 6.4, .38], [5.98, 6.4, .38])} fill={TERRA}/><g stroke={INK} strokeWidth="1.8" fill="none" strokeLinecap="round"><polyline points={poly([6.4, 6.95, 0], [6.4, 6.95, .8], [6.7, 6.95, .8])}/></g><polyline points={poly([6.55, 6.95, .8], [7.0, 6.35, 0])} stroke={GOLD} strokeWidth="4" strokeLinecap="round" fill="none"/></g>}
    <Box x0={1} x1={3} y0={6.2} y1={7.8} h={1.3} wall="#dfe7ea" roof={TERRA} rh={.8} win={[1, 0]} door p={p}/>
    <Box x0={3.8} x1={5.8} y0={6.4} y1={8} h={1.4} wall="#e9d9a8" roof="#a8433a" rh={.85} win={[1, 1]} door chimney p={p}/>
    <Box x0={13.5} x1={15.5} y0={6.2} y1={7.8} h={1.3} wall="#f1e6cf" roof={TERRA} rh={.8} win={[1, 0]} door p={p}/>
    <Box x0={16.2} x1={18.2} y0={6.6} y1={8.2} h={1.5} wall="#e5dcc8" roof="#a8433a" rh={.9} win={[1, 1]} door p={p}/>
    {/* námestie: fontána, trhy, stromček */}
    {has("fountain") && <g className="dt-appear"><ellipse cx={sx(10.3, 6.7)} cy={sy(10.3, 6.7)} rx="19" ry="9" fill={p.water} stroke={STONE} strokeWidth="3.5"/><rect x={sx(10.3, 6.7) - 3} y={sy(10.3, 6.7, .9)} width="6" height={sy(10.3, 6.7) - sy(10.3, 6.7, .9)} fill={STONE}/><path d={`M${sx(10.3, 6.7)} ${sy(10.3, 6.7, .9)} q -12 -8 -15 8 M${sx(10.3, 6.7)} ${sy(10.3, 6.7, .9)} q 12 -8 15 8`} stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity=".85"/></g>}
    {has("market") && <g className="dt-appear">{[7.7, 8.9, 10.1].map((x, i) => <Box key={x} x0={x} x1={x + .9} y0={7.6} y1={8.3} h={.55} wall={WOOD} roof={i % 2 ? RED : "#f6efdf"} rh={.4} p={{ ...p, snow: false, lit: false }}><polygon points={poly([x + .08, 8.3, .12], [x + .82, 8.3, .12], [x + .82, 8.3, .4], [x + .08, 8.3, .4])} fill="#ffd68a"/></Box>)}<path d={`M${sx(7.6, 7.3)} ${sy(7.6, 7.3, 1.5)} Q ${sx(9.3, 7.3)} ${sy(9.3, 7.3, 1.05)} ${sx(11.1, 7.3)} ${sy(11.1, 7.3, 1.5)}`} stroke="#3f4a5a" strokeWidth="1" fill="none"/>{[0, .2, .4, .6, .8, 1].map((t, i) => { const x = 7.6 + t * 3.5, z = 1.5 - Math.sin(t * Math.PI) * .45; return <circle key={i} cx={sx(x, 7.3)} cy={sy(x, 7.3, z)} r="2.4" fill={[GOLD, RED, "#7cc4a4"][i % 3]}/>; })}<line x1={sx(7.6, 7.3)} y1={sy(7.6, 7.3)} x2={sx(7.6, 7.3)} y2={sy(7.6, 7.3, 1.5)} stroke={INK} strokeWidth="1.4"/><line x1={sx(11.1, 7.3)} y1={sy(11.1, 7.3)} x2={sx(11.1, 7.3)} y2={sy(11.1, 7.3, 1.5)} stroke={INK} strokeWidth="1.4"/></g>}
    {has("tree") && <g className="dt-appear"><Fir x={12.3} y={7.9} size={56} p={p} decorated/></g>}
    {has("pool") && <g className="dt-appear"><Ground pts={[[13.6, 8.4], [15.6, 8.4], [15.6, 9.5], [13.6, 9.5]]} fill={STONE}/><Ground pts={[[13.75, 8.55], [15.45, 8.55], [15.45, 9.35], [13.75, 9.35]]} fill={p.water}/><g stroke="#fff" strokeOpacity=".8" strokeWidth="1"><polyline points={poly([13.75, 8.85], [15.45, 8.85])} fill="none"/><polyline points={poly([13.75, 9.1], [15.45, 9.1])} fill="none"/></g></g>}
    {/* stromy a lavička pri rieke */}
    <Fir x={.6} y={5.9} size={34} p={p}/><Fir x={18.7} y={6.4} size={34} p={p}/>
    <Tree x={7} y={9.1} size={30} p={p}/><Tree x={13} y={9.2} size={30} p={p} alt/><Fir x={3.2} y={9.4} size={30} p={p}/><Fir x={16.8} y={9.4} size={30} p={p}/><Fir x={18.6} y={9.0} size={26} p={p}/><Fir x={1.6} y={9.2} size={24} p={p}/>
    <g fill={WOOD_DARK}><polygon points={poly([4.9, 9.35, .35], [5.8, 9.35, .35], [5.8, 9.35, .45], [4.9, 9.35, .45])}/><line x1={sx(5, 9.35)} y1={sy(5, 9.35)} x2={sx(5, 9.35)} y2={sy(5, 9.35, .35)} stroke={WOOD_DARK} strokeWidth="1.5"/><line x1={sx(5.7, 9.35)} y1={sy(5.7, 9.35)} x2={sx(5.7, 9.35)} y2={sy(5.7, 9.35, .35)} stroke={WOOD_DARK} strokeWidth="1.5"/></g>
    {/* most */}
    {bridge === "fixed"
      ? <g><Ground pts={[[9.3, 9.6, .15], [11, 9.6, .15], [11, 11.3, .15], [9.3, 11.3, .15]]} fill={STONE} stroke={INK}/><Ground pts={[[9.3, 11.3, .15], [11, 11.3, .15], [11, 11.3, -.1], [9.3, 11.3, -.1]]} fill={shade(STONE, .75)}/>
        {[[9.3, 9.5], [10.8, 11]].map(([a, b]) => <g key={a}><Ground pts={[[a, 9.6, .15], [b, 9.6, .15], [b, 9.6, .5], [a, 9.6, .5]]} fill={shade(STONE, .9)}/><Ground pts={[[b, 9.6, .15], [b, 11.3, .15], [b, 11.3, .5], [b, 9.6, .5]]} fill={shade(STONE, .78)}/><Ground pts={[[a, 9.6, .5], [b, 9.6, .5], [b, 11.3, .5], [a, 11.3, .5]]} fill={shade(STONE, 1.06)}/></g>)}
        <Lamp x={9.4} y={9.55} on={lit || led} led={led} h={1.1}/><Lamp x={10.9} y={11.35} on={lit || led} led={led} h={1.1}/></g>
      : <g><Ground pts={[[9.4, 9.65, .12], [10.9, 9.65, .12], [10.9, 11.25, .12], [9.4, 11.25, .12]]} fill={WOOD}/><g stroke={WOOD_DARK} strokeWidth=".9">{[9.85, 10.05, 10.25, 10.45, 10.65, 10.85, 11.05].map(y => <polyline key={y} points={poly([9.4, y, .12], [10.9, y, .12])} fill="none"/>)}</g>
        {bridge === "temp" && <><Ground pts={[[9.55, 10.35, .13], [10.75, 10.35, .13], [10.75, 10.6, .13], [9.55, 10.6, .13]]} fill={INK} opacity=".45"/>{[9.5, 11.35].map(y => <g key={y}><Ground pts={[[9.5, y, .2], [10.8, y, .2], [10.8, y, .5], [9.5, y, .5]]} fill={RED}/><Ground pts={[[9.75, y, .2], [10.05, y, .2], [10.05, y, .5], [9.75, y, .5]]} fill="#fff"/><Ground pts={[[10.3, y, .2], [10.55, y, .2], [10.55, y, .5], [10.3, y, .5]]} fill="#fff"/></g>)}<g><line x1={sx(11.1, 9.45)} y1={sy(11.1, 9.45)} x2={sx(11.1, 9.45)} y2={sy(11.1, 9.45, .95)} stroke={INK} strokeWidth="1.5"/><polygon points={`${sx(11.1, 9.45)},${sy(11.1, 9.45, 1.55)} ${sx(11.1, 9.45) + 10},${sy(11.1, 9.45, .95)} ${sx(11.1, 9.45) - 10},${sy(11.1, 9.45, .95)}`} fill={GOLD} stroke={INK} strokeWidth="1.2"/></g></>}
        <g stroke={WOOD_DARK} strokeWidth="1.4" strokeLinecap="round" fill="none">{[9.4, 10.9].map(x => <g key={x}><polyline points={poly([x, 9.65, .58], [x, 11.25, .58])}/>{[9.7, 10.1, 10.5, 10.9, 11.2].map(y => <polyline key={y} points={poly([x, y, .12], [x, y, .58])}/>)}</g>)}</g>
        {p.snow && bridge !== "temp" && <Ground pts={[[9.45, 9.7, .16], [10.85, 9.7, .16], [10.85, 11.2, .16], [9.45, 11.2, .16]]} fill="#fff" opacity=".75"/>}</g>}
    <Lamp x={8.9} y={9.5} on={lit || led} led={led}/><Lamp x={11.45} y={9.5} on={lit || led} led={led}/>
    <Fir x={.5} y={11.7} size={26} p={p}/><Fir x={18.7} y={11.7} size={28} p={p}/><Fir x={10.2} y={11.8} size={22} p={p}/><Fir x={3.6} y={11.75} size={22} p={p}/><Tree x={6.2} y={11.75} size={24} p={p} alt/><Tree x={14.8} y={11.75} size={24} p={p}/>
    {/* počasie */}
    {p.snow && [[60, 60], [130, 120], [220, 40], [300, 150], [380, 70], [470, 130], [560, 50], [640, 160], [720, 90], [760, 200], [110, 250], [330, 230], [590, 240], [700, 300], [40, 330], [420, 20], [500, 320], [200, 330]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 2.8 : 1.9} fill="#fff" opacity=".9" stroke={INK} strokeOpacity=".08"/>)}
    {p.leaves && [[2, 5.6], [5, 5.7], [8, 9.7], [12.5, 9.8], [15.5, 5.6], [18.5, 5.8], [1.5, 9.3], [16, 9.6], [3.5, 11.8], [17.5, 11.8]].map(([x, y], i) => <ellipse key={i} cx={sx(x, y)} cy={sy(x, y)} rx="3.6" ry="2" fill={i % 2 ? "#c9742f" : "#dda23a"} transform={`rotate(${i * 37} ${sx(x, y)} ${sy(x, y)})`}/>)}
  </svg>;
}
