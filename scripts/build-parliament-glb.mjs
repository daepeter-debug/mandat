// 3D rokovacia sála pre „Parlament v 3D a na stole“ (components/parliament-ar.tsx): public/models/parlament.glb
// Spustenie po každej zmene dát: node scripts/build-parliament-glb.mjs  (kontrola aktuálnosti: verify-data.mjs)
// Sála: šesť stupňovitých radov so štyrmi uličkami, zaoblené lavice, 150 kresiel s operadlom vo farbách strán,
// koberec, predsednícky stôl s rečníckym pultom, vzadu obložená stena so štátnym znakom a vlajkami SR a EÚ.
// Dva varianty obsadenia (glTF KHR_materials_variants): „prieskumy“ = scenár Modelu Mandát, „volby-2023“ = výsledok volieb.
// Animácia „obsadenie“: kreslá sa zľava doprava postupne objavia (hrá ju web raz po otvorení).
// Rozmery a miesta kresiel sú v lib/parliament-model.ts (rovnaké pre štítky na webe). Súbor je glTF 2.0 (GLB).
import fs from "node:fs";
import { CHAMBER, ROW_DEPTH, chamberSeats, parliamentSeats, parliamentVariants, rowRadius, tierTop } from "../lib/parliament-model.ts";

const OUT = "public/models/parlament.glb";
const { ROWS, SECTORS, AISLE } = CHAMBER;
const FLOOR = 0.004;

// ---------- geometria ----------
const toLinear = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const rgb = hex => [0, 2, 4].map(i => toLinear(parseInt(hex.slice(1 + i, 3 + i), 16)));
const geo = () => ({ pos: [], nor: [], idx: [] });
const quad = (g, vs, n) => { const b = g.pos.length / 3; for (const v of vs) { g.pos.push(...v); g.nor.push(...n); } g.idx.push(b, b + 1, b + 2, b, b + 2, b + 3); };
/** Kváder so stredom (cx, cy, cz); voliteľne naklonený okolo osi X (tilt) a otočený okolo Y (yaw). */
function box(g, cx, cy, cz, w, h, d, { tilt = 0, yaw = 0 } = {}) {
  const ct = Math.cos(tilt), st = Math.sin(tilt), cy_ = Math.cos(yaw), sy = Math.sin(yaw);
  const tf = ([x, y, z]) => { const y1 = y * ct - z * st, z1 = y * st + z * ct; return [x * cy_ + z1 * sy, y1, -x * sy + z1 * cy_]; };
  const add = (a, b) => a.map((v, i) => v + b[i]);
  const c = [cx, cy, cz], x0 = -w / 2, x1 = w / 2, y0 = -h / 2, y1 = h / 2, z0 = -d / 2, z1 = d / 2;
  const faces = [
    [[1, 0, 0], [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]]], [[-1, 0, 0], [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]]],
    [[0, 1, 0], [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]]], [[0, -1, 0], [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]]],
    [[0, 0, 1], [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]]], [[0, 0, -1], [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]]],
  ];
  for (const [n, vs] of faces) quad(g, vs.map(v => add(tf(v), c)), tf(n));
}
const arcPt = (r, a, y) => [Math.cos(a) * r, y, -Math.sin(a) * r];
/** Časť medzikružia od uhla a0 po a1: horná plocha (top) a/alebo bočné steny (sides) s čelami. */
function ring(g, r0, r1, y0, y1, a0, a1, { top = true, sides = true, seg = 24 } = {}) {
  const steps = Math.max(2, Math.ceil(seg * Math.abs(a1 - a0) / Math.PI));
  const at = i => a0 + (a1 - a0) * i / steps;
  for (let i = 0; i < steps; i++) {
    const a = at(i), b = at(i + 1);
    if (top) quad(g, [arcPt(r1, a, y1), arcPt(r1, b, y1), arcPt(r0, b, y1), arcPt(r0, a, y1)], [0, 1, 0]);
    if (sides) {
      const m = (a + b) / 2, out = [Math.cos(m), 0, -Math.sin(m)], inn = out.map(v => -v);
      quad(g, [arcPt(r0, a, y1), arcPt(r0, b, y1), arcPt(r0, b, y0), arcPt(r0, a, y0)], inn);
      quad(g, [arcPt(r1, a, y0), arcPt(r1, b, y0), arcPt(r1, b, y1), arcPt(r1, a, y1)], out);
    }
  }
  if (sides) for (const [a, s] of [[a0, 1], [a1, -1]]) {
    const n = [-Math.sin(a) * s, 0, -Math.cos(a) * s];
    quad(g, s > 0 ? [arcPt(r0, a, y0), arcPt(r1, a, y0), arcPt(r1, a, y1), arcPt(r0, a, y1)] : [arcPt(r1, a, y0), arcPt(r0, a, y0), arcPt(r0, a, y1), arcPt(r1, a, y1)], n);
  }
}
/** Valec (tyč) so stredom podstavy v (x, y, z). */
function cylinder(g, x, y, z, r, h, seg = 12) {
  for (let i = 0; i < seg; i++) {
    const a = 2 * Math.PI * i / seg, b = 2 * Math.PI * (i + 1) / seg, m = (a + b) / 2;
    quad(g, [[x + Math.cos(a) * r, y, z + Math.sin(a) * r], [x + Math.cos(b) * r, y, z + Math.sin(b) * r], [x + Math.cos(b) * r, y + h, z + Math.sin(b) * r], [x + Math.cos(a) * r, y + h, z + Math.sin(a) * r]].reverse(), [Math.cos(m), 0, Math.sin(m)]);
  }
}
/** Plochý obdĺžnik v rovine XY (kolmý na Z), predná strana k +Z. */
const plate = (g, cx, cy, z, w, h) => quad(g, [[cx - w / 2, cy - h / 2, z], [cx + w / 2, cy - h / 2, z], [cx + w / 2, cy + h / 2, z], [cx - w / 2, cy + h / 2, z]], [0, 0, 1]);
/** Plochý polkruh v rovine XY: stred (cx, cy), polomer r, oblúk dole (štít) alebo hore (vrch). */
function halfDiscXY(g, cx, cy, z, r, up, seg = 16) {
  for (let i = 0; i < seg; i++) {
    const a = Math.PI * i / seg, b = Math.PI * (i + 1) / seg, s = up ? 1 : -1;
    const b0 = g.pos.length / 3;
    for (const v of [[cx, cy, z], [cx + Math.cos(a) * r, cy + s * Math.sin(a) * r, z], [cx + Math.cos(b) * r, cy + s * Math.sin(b) * r, z]]) { g.pos.push(...v); g.nor.push(0, 0, 1); }
    g.idx.push(...(up ? [b0, b0 + 1, b0 + 2] : [b0, b0 + 2, b0 + 1]));
  }
}

// ---------- GLB ----------
function buildGlb() {
  const variants = parliamentVariants(), [model, v2023] = variants;
  const bin = [], bufferViews = [], accessors = [], materials = [], meshes = [], nodes = [];
  let offset = 0;
  const pushView = (typed, target) => {
    const bytes = Buffer.from(typed.buffer, typed.byteOffset, typed.byteLength);
    bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: bytes.length, ...(target ? { target } : {}) });
    bin.push(bytes); offset += bytes.length;
    const pad = (4 - (offset % 4)) % 4; if (pad) { bin.push(Buffer.alloc(pad)); offset += pad; }
    return bufferViews.length - 1;
  };
  const accessor = (typed, type, extra = {}) => { accessors.push({ bufferView: pushView(typed, extra.target), componentType: typed instanceof Uint16Array ? 5123 : typed instanceof Uint32Array ? 5125 : 5126, count: typed.length / ({ SCALAR: 1, VEC3: 3 }[type]), type, ...(extra.min ? { min: extra.min, max: extra.max } : {}) }); return accessors.length - 1; };
  const geometry = g => {
    const minmax = k => [Math.min(...g.pos.filter((_, i) => i % 3 === k)), Math.max(...g.pos.filter((_, i) => i % 3 === k))];
    const mm = [0, 1, 2].map(minmax);
    const idx = g.pos.length / 3 > 65535 ? new Uint32Array(g.idx) : new Uint16Array(g.idx);
    return {
      POSITION: accessor(new Float32Array(g.pos), "VEC3", { target: 34962, min: mm.map(m => m[0]), max: mm.map(m => m[1]) }),
      NORMAL: accessor(new Float32Array(g.nor), "VEC3", { target: 34962 }),
      indices: accessor(idx, "SCALAR", { target: 34963 }),
    };
  };
  const material = (name, hex, { rough = 0.6, metal = 0, emissive } = {}) => {
    materials.push({ name, pbrMetallicRoughness: { baseColorFactor: [...rgb(hex), 1], metallicFactor: metal, roughnessFactor: rough }, ...(emissive ? { emissiveFactor: rgb(emissive) } : {}) });
    return materials.length - 1;
  };
  const prim = (g, mat) => ({ attributes: { POSITION: g.POSITION, NORMAL: g.NORMAL }, indices: g.indices, material: mat });
  const node = (name, primitives, extra = {}) => { meshes.push({ name, primitives }); nodes.push({ name, mesh: meshes.length - 1, ...extra }); return nodes.length - 1; };
  const solid = (name, build, mat) => { const g = geo(); build(g); return node(name, [prim(geometry(g), mat)]); };

  // Materiály sály
  const M = {
    floor: material("podlaha", "#ece6da", { rough: 0.85 }), carpet: material("koberec", "#2c4757", { rough: 1 }),
    tier: material("stupne", "#ddd3bf", { rough: 0.95 }), riser: material("čelá stupňov", "#9a6b42", { rough: 0.55 }),
    deskTop: material("lavice", "#c99a62", { rough: 0.42 }), deskFront: material("čelo lavíc", "#a87a4a", { rough: 0.5 }),
    chairBase: material("podnož kresla", "#3a3f44", { rough: 0.4, metal: 0.5 }), wall: material("stena", "#efe8da", { rough: 0.9 }),
    slat: material("obklad", "#b68756", { rough: 0.5 }), dais: material("pódium", "#7f5333", { rough: 0.45 }),
    dark: material("predsedníctvo", "#2b2f33", { rough: 0.45 }), metal: material("žrď", "#cfc8b6", { rough: 0.3, metal: 0.85 }),
    red: material("štít", "#d72b23", { rough: 0.5 }), white: material("biela", "#f7f5ef", { rough: 0.6 }), blue: material("modrá", "#1351a5", { rough: 0.55 }),
    euBlue: material("EÚ modrá", "#0b3a92", { rough: 0.6 }), gold: material("zlatá", "#f2c230", { rough: 0.4, metal: 0.2 }),
  };

  // Podlaha (polkruh + predná časť pre predsedníctvo) a koberec v strede
  const outer = rowRadius(ROWS - 1) + ROW_DEPTH / 2 + 0.03, front = 0.13;
  solid("podlaha", g => { ring(g, 0.0001, outer, 0, FLOOR, Math.PI, 0, { seg: 72 }); box(g, 0, FLOOR / 2, front / 2, outer * 2, FLOOR, front); }, M.floor);
  const inner = rowRadius(0) - ROW_DEPTH / 2 - 0.004;
  solid("koberec", g => { ring(g, 0.0001, inner, FLOOR, FLOOR + 0.0008, Math.PI, 0, { seg: 64, sides: false }); box(g, 0, FLOOR + 0.0004, 0.045, inner * 2, 0.0008, 0.09); }, M.carpet);

  // Stupne (každý rad o niečo vyššie), lavice pred kreslami v piatich sektoroch medzi uličkami
  const sectorSpan = (k, s) => {
    const mine = chamberSeats.filter(p => p.row === k && p.sector === s), r = rowRadius(k), half = (Math.PI - (SECTORS - 1) * AISLE / r) / chamberSeats.filter(p => p.row === k).length / 2;
    return [Math.max(...mine.map(p => p.angle)) + half, Math.min(...mine.map(p => p.angle)) - half];
  };
  solid("stupne", g => { for (let k = 0; k < ROWS; k++) ring(g, rowRadius(k) - ROW_DEPTH / 2, rowRadius(k) + ROW_DEPTH / 2, FLOOR, tierTop(k), Math.PI, 0, { sides: false, seg: 64 }); }, M.tier);
  solid("čelá stupňov", g => { for (let k = 0; k < ROWS; k++) ring(g, rowRadius(k) - ROW_DEPTH / 2, rowRadius(k) + ROW_DEPTH / 2, FLOOR, tierTop(k), Math.PI, 0, { top: false, seg: 64 }); }, M.riser);
  const deskR = k => rowRadius(k) - 0.011, deskTopY = k => tierTop(k) + 0.0125;
  solid("lavice", g => { for (let k = 0; k < ROWS; k++) for (let s = 0; s < SECTORS; s++) { const [a0, a1] = sectorSpan(k, s); ring(g, deskR(k) - 0.0045, deskR(k) + 0.0045, deskTopY(k) - 0.0015, deskTopY(k), a0, a1, { seg: 48 }); } }, M.deskTop);
  solid("čelo lavíc", g => { for (let k = 0; k < ROWS; k++) for (let s = 0; s < SECTORS; s++) { const [a0, a1] = sectorSpan(k, s); ring(g, deskR(k) - 0.0045, deskR(k) - 0.003, tierTop(k), deskTopY(k) - 0.0015, a0, a1, { seg: 48 }); } }, M.deskFront);

  // Zadná stena s lamelami, štátny znak a vlajky (stena stojí za posledným radom, otvorená k divákovi)
  const wallR = outer - 0.006, wallH = 0.165, wallA0 = Math.PI * 0.93, wallA1 = Math.PI * 0.07;
  solid("stena", g => ring(g, wallR, wallR + 0.006, FLOOR, wallH, wallA0, wallA1, { seg: 64 }), M.wall);
  solid("obklad", g => {
    const n = 54;
    for (let i = 0; i <= n; i++) {
      const a = wallA0 + (wallA1 - wallA0) * i / n;
      if (Math.abs(a - Math.PI / 2) < 0.16) continue;                  // miesto pre znak a vlajky
      box(g, Math.cos(a) * (wallR - 0.0015), FLOOR + wallH / 2, -Math.sin(a) * (wallR - 0.0015), 0.004, wallH, 0.003, { yaw: Math.PI / 2 - a });
    }
  }, M.slat);
  const ez = -(wallR - 0.004), ey = 0.124;                             // znak: červený štít, biely dvojkríž, modré trojvršie
  solid("štít", g => { plate(g, 0, ey + 0.006, ez, 0.044, 0.026); halfDiscXY(g, 0, ey - 0.007, ez, 0.022, false); }, M.red);
  solid("dvojkríž", g => {
    const z = ez + 0.0006;
    plate(g, 0, ey + 0.0015, z, 0.0055, 0.03);                          // zvislé rameno
    plate(g, 0, ey + 0.0115, z, 0.018, 0.0045);                         // horné (kratšie) priečne rameno
    plate(g, 0, ey + 0.0025, z, 0.026, 0.005);                          // dolné (dlhšie) priečne rameno
  }, M.white);
  solid("trojvršie", g => { const z = ez + 0.0012; halfDiscXY(g, 0, ey - 0.0145, z, 0.0105, true); halfDiscXY(g, -0.0125, ey - 0.0175, z, 0.0085, true); halfDiscXY(g, 0.0125, ey - 0.0175, z, 0.0085, true); }, M.blue);
  // Vlajky na žrdiach vedľa znaku: SR (biela, modrá, červená so štátnym znakom) a EÚ (modrá s 12 hviezdami v kruhu)
  const fz = ez + 0.012, fy = 0.142, fw = 0.042, fh = 0.028;
  solid("žrde", g => { cylinder(g, -0.034, FLOOR, fz, 0.0012, 0.166); cylinder(g, 0.034, FLOOR, fz, 0.0012, 0.166); }, M.metal);
  const skx = -0.034 - fw / 2 - 0.0012;
  solid("vlajka SR biela", g => plate(g, skx, fy + fh / 3, fz, fw, fh / 3), M.white);
  solid("vlajka SR modrá", g => plate(g, skx, fy, fz, fw, fh / 3), M.blue);
  solid("vlajka SR červená", g => plate(g, skx, fy - fh / 3, fz, fw, fh / 3), M.red);
  const sx = skx + fw / 2 - 0.0125, sz = fz + 0.0005;                  // malý znak na vlajke pri žrdi (vpravo, bližšie k žrdi)
  solid("znak na vlajke", g => { plate(g, sx, fy + 0.0025, sz, 0.0115, 0.008); halfDiscXY(g, sx, fy - 0.0015, sz, 0.00575, false); }, M.red);
  solid("dvojkríž na vlajke", g => { plate(g, sx, fy + 0.001, sz + 0.0003, 0.0015, 0.0095); plate(g, sx, fy + 0.0042, sz + 0.0003, 0.005, 0.0013); plate(g, sx, fy + 0.0012, sz + 0.0003, 0.007, 0.0014); }, M.white);
  solid("trojvršie na vlajke", g => { const z = sz + 0.0006; halfDiscXY(g, sx, fy - 0.0052, z, 0.0028, true); halfDiscXY(g, sx - 0.0033, fy - 0.006, z, 0.0022, true); halfDiscXY(g, sx + 0.0033, fy - 0.006, z, 0.0022, true); }, M.blue);
  const eux = 0.034 + fw / 2 + 0.0012;
  solid("vlajka EÚ", g => plate(g, eux, fy, fz, fw, fh), M.euBlue);
  solid("hviezdy EÚ", g => { for (let i = 0; i < 12; i++) { const a = 2 * Math.PI * i / 12; plate(g, eux + Math.cos(a) * 0.0095, fy + Math.sin(a) * 0.0095, fz + 0.0005, 0.0026, 0.0026); } }, M.gold);

  // Predsedníctvo vpredu: pódium, dlhý stôl k poslancom, tri kreslá; rečnícky pult na koberci pred ním
  solid("pódium", g => box(g, 0, FLOOR + 0.008, 0.088, 0.17, 0.016, 0.05), M.dais);
  solid("predsednícky stôl", g => { box(g, 0, FLOOR + 0.016 + 0.009, 0.074, 0.13, 0.018, 0.012); }, M.deskTop);
  solid("kreslá predsedníctva", g => { for (const x of [-0.03, 0, 0.03]) { box(g, x, FLOOR + 0.016 + 0.0065, 0.09, 0.016, 0.005, 0.014); box(g, x, FLOOR + 0.016 + 0.016, 0.0975, 0.016, 0.016, 0.004, { tilt: -0.18 }); } }, M.dark);
  solid("rečnícky pult", g => { box(g, 0, FLOOR + 0.011, 0.036, 0.024, 0.022, 0.016); box(g, 0, FLOOR + 0.023, 0.034, 0.028, 0.003, 0.02, { tilt: 0.25 }); }, M.dais);
  solid("mikrofón", g => cylinder(g, 0, FLOOR + 0.024, 0.028, 0.0006, 0.012, 8), M.chairBase);

  // Kreslá: čalúnenie vo farbe strany (dva varianty) a tmavá podnož; predok k predsedníctvu
  const upholstery = geo();
  box(upholstery, 0, 0.0075, 0.001, 0.0145, 0.0045, 0.0135);
  box(upholstery, 0, 0.017, -0.0062, 0.0145, 0.0145, 0.0034, { tilt: -0.2 });
  const base = geo();
  box(base, 0, 0.003, 0.001, 0.0035, 0.006, 0.0035);
  box(base, 0, 0.0007, 0.001, 0.0095, 0.0014, 0.0095);
  const upG = geometry(upholstery), baseG = geometry(base);
  const partyIds = [...new Set(variants.flatMap(v => v.ordered.map(m => m.id)))];
  const colorOf = id => variants.flatMap(v => v.ordered).find(m => m.id === id).color;
  const partyMat = new Map(partyIds.map(id => [id, material(`strana:${id}`, colorOf(id), { rough: 0.55 })]));
  const chairNodes = chamberSeats.map(seat => {
    const mModel = partyMat.get(model.seatParty[seat.index]), m2023 = partyMat.get(v2023.seatParty[seat.index]);
    const mappings = mModel === m2023 ? [{ material: mModel, variants: [0, 1] }] : [{ material: mModel, variants: [0] }, { material: m2023, variants: [1] }];
    return node(`kreslo ${seat.index + 1}`, [{ ...prim(upG, mModel), extensions: { KHR_materials_variants: { mappings } } }, prim(baseG, M.chairBase)],
      { translation: [seat.x, seat.y, seat.z], rotation: [0, Math.sin(seat.yaw / 2), 0, Math.cos(seat.yaw / 2)] });
  });

  // Animácia obsadenia: kreslo vyrastie (mierne prekmitne) v poradí zľava doprava; potom drží do konca klipu.
  const STEP = 0.012, POP = 0.3, END = 12;
  const out = accessor(new Float32Array([0, 0, 0, 0, 0, 0, 1.16, 1.16, 1.16, 1, 1, 1, 1, 1, 1]), "VEC3");
  const samplers = [], channels = [];
  chairNodes.forEach((n, i) => {
    const t = 0.15 + i * STEP, times = new Float32Array([0, t, t + POP * 0.62, t + POP, END]);
    const input = accessor(times, "SCALAR", { min: [0], max: [END] });
    samplers.push({ input, output: out, interpolation: "LINEAR" });
    channels.push({ sampler: samplers.length - 1, target: { node: n, path: "scale" } });
  });

  const seats = parliamentSeats();
  const json = {
    asset: { version: "2.0", generator: "Mandát · scripts/build-parliament-glb.mjs", extras: { asOf: seats.asOf, updated: seats.updated, seats: seats.seats, seats2023: Object.fromEntries(v2023.ordered.map(m => [m.id, m.seats])) } },
    extensionsUsed: ["KHR_materials_variants"],
    extensions: { KHR_materials_variants: { variants: variants.map(v => ({ name: v.id })) } },
    scene: 0, scenes: [{ name: "Rokovacia sála", nodes: nodes.map((_, i) => i) }],
    nodes, meshes, materials, accessors, bufferViews, buffers: [{ byteLength: offset }],
    animations: [{ name: "obsadenie", samplers, channels }],
  };
  const jsonBuf = Buffer.from(JSON.stringify(json)), jsonPad = Buffer.alloc((4 - (jsonBuf.length % 4)) % 4, 0x20), binBuf = Buffer.concat(bin);
  const total = 12 + 8 + jsonBuf.length + jsonPad.length + 8 + binBuf.length;
  const header = Buffer.alloc(12); header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(total, 8);
  const jh = Buffer.alloc(8); jh.writeUInt32LE(jsonBuf.length + jsonPad.length, 0); jh.writeUInt32LE(0x4e4f534a, 4);
  const bh = Buffer.alloc(8); bh.writeUInt32LE(binBuf.length, 0); bh.writeUInt32LE(0x004e4942, 4);
  return { glb: Buffer.concat([header, jh, jsonBuf, jsonPad, bh, binBuf]), seats, v2023 };
}

fs.mkdirSync("public/models", { recursive: true });
const { glb, seats, v2023 } = buildGlb();
fs.writeFileSync(OUT, glb);
console.log(`${OUT}: ${Math.round(glb.length / 1024)} kB, ${seats.ordered.map(m => `${m.short} ${m.seats}`).join(", ")} (k ${seats.asOf}, aktualizované ${seats.updated}); voľby 2023: ${v2023.ordered.map(m => `${m.short} ${m.seats}`).join(", ")}`);
