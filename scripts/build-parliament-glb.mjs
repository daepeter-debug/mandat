// 3D rokovacia sála pre „Parlament v 3D a na stole“ (components/parliament-ar.tsx): public/models/parlament.glb
// Spustenie po každej zmene dát: node scripts/build-parliament-glb.mjs  (kontrola aktuálnosti: verify-data.mjs)
// Sála: šesť stupňovitých radov so štyrmi uličkami, zaoblené lavice, 150 kresiel s operadlom vo farbách strán,
// koberec, predsednícky stôl, teplé obloženie, presklená Bratislava a tabuľa pod oknami; bez štátnych symbolov.
// Dva varianty obsadenia (glTF KHR_materials_variants): „prieskumy“ = scenár Modelu Mandát, „volby-2023“ = výsledok volieb.
// Animácia „obsadenie“: kreslá sa zľava doprava postupne objavia (hrá ju web raz po otvorení).
// Rozmery a miesta kresiel sú v lib/parliament-model.ts (rovnaké pre štítky na webe). Súbor je glTF 2.0 (GLB).
// 2. 10. 2026: smer C „Večerná sála“, orech/tkanina/kameň + normály, statický kontakt vo farbách vrcholov,
// zrazené čalúnenie a lavice, podrúčky, mikrofóny, schodíky, svetelná škára, logá v oboch variantoch.
// Regeneruje aj lokálny HDR. Logá: lib/party-logos.json; historická koalícia 2023 má textový štítok.
// Oficiálne overenie: node scripts/verify-parliament-glb.mjs. Model musí ostať pod 1 500 000 B.
// 2. 10. 2026 doplnenie: mäkšie rádiusy čalúnenia, lesk orecha a hlbší statický kontakt pre detail kamery.
// 2. 10. 2026 (Claude): režim Hlasovania. Variant „hlasovanie“ (kreslá cez materiály prechodu, prefarbí ich web podľa
// hlasu) a nad každým kreslom svetelný stĺpik vo farbe hlasu: 15 skupín po 10 kreslách, farby z malého atlasu, ktorý
// web prekreslí pre každé hlasovanie; animácia „obsadenie“ ich v čase 4 – 5,5 s vysunie zo sedadiel vlnou zľava doprava.
import fs from "node:fs";
import sharp from "sharp";
import { parliamentTextures, writeParliamentEnvironment } from './parliament-textures.mjs';
import { CHAMBER, ROW_DEPTH, chamberSeats, parliamentSeats, allParliamentVariants, parliamentTimeline, parliamentEdges, rowRadius, tierTop } from "../lib/parliament-model.ts";

const OUT = "public/models/parlament.glb";
const { ROWS, SECTORS, AISLE } = CHAMBER;
const FLOOR = 0.004;

// ---------- geometria ----------
const toLinear = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const rgb = hex => [0, 2, 4].map(i => toLinear(parseInt(hex.slice(1 + i, 3 + i), 16)));
const geo = () => ({ pos: [], nor: [], idx: [] });
const quad = (g, vs, n) => {
  const a = vs[1].map((v, i) => v - vs[0][i]), c = vs[2].map((v, i) => v - vs[0][i]);
  const cross = [a[1] * c[2] - a[2] * c[1], a[2] * c[0] - a[0] * c[2], a[0] * c[1] - a[1] * c[0]];
  // Oblúky idú zľava doprava (klesajúci uhol); winding musí sledovať normálu, nie smer uhla.
  if (cross.reduce((sum, v, i) => sum + v * n[i], 0) < 0) vs = [...vs].reverse();
  const b = g.pos.length / 3; for (const v of vs) { g.pos.push(...v); g.nor.push(...n); } g.idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
};
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
  const steps = Math.max(2, Math.ceil(Math.min(seg, 32) * Math.abs(a1 - a0) / Math.PI));
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
/** Zaoblený kváder: 4 × 4 vrcholy na stenu, spoločná geometria všetkých kresiel. */
function cushion(g, cx, cy, cz, w, h, d, radius, tilt = 0) {
  const half = [w / 2, h / 2, d / 2], inner = half.map(v => v - radius), c = Math.cos(tilt), s = Math.sin(tilt);
  const rot = ([x, y, z]) => [x, y * c - z * s, y * s + z * c];
  for (let axis = 0; axis < 3; axis++) for (const sign of [-1, 1]) {
    const u = (axis + 1) % 3, v = (axis + 2) % 3, grid = [];
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
      const p = [0, 0, 0]; p[axis] = sign * half[axis];
      p[u] = [-half[u], -inner[u], inner[u], half[u]][i]; p[v] = [-half[v], -inner[v], inner[v], half[v]][j];
      const q = p.map((a, k) => Math.max(-inner[k], Math.min(inner[k], a))), n = p.map((a, k) => a - q[k]), length = Math.hypot(...n);
      const normal = n.map(a => a / length), point = rot(q.map((a, k) => a + normal[k] * radius));
      grid.push(g.pos.length / 3); g.pos.push(point[0] + cx, point[1] + cy, point[2] + cz); g.nor.push(...rot(normal));
    }
    for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) {
      const a = grid[j * 4 + i], b = grid[j * 4 + i + 1], c = grid[(j + 1) * 4 + i + 1], d = grid[(j + 1) * 4 + i];
      g.idx.push(...(sign > 0 ? [a, b, c, a, c, d] : [a, c, b, a, d, c]));
    }
  }
}
// ---------- GLB ----------
async function buildGlb() {
  const variants = allParliamentVariants(), [model, v2023] = variants;
  const partyIds = [...new Set(variants.flatMap(v => v.ordered.map(m => m.id)))];
  const textureBytes = await parliamentTextures(partyIds);
  const bin = [], bufferViews = [], accessors = [], materials = [], meshes = [], nodes = [];
  const images = [], textures = [], textureIds = new Map();
  let offset = 0;
  const pushView = (typed, target) => {
    const bytes = Buffer.from(typed.buffer, typed.byteOffset, typed.byteLength);
    bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: bytes.length, ...(target ? { target } : {}) });
    bin.push(bytes); offset += bytes.length;
    const pad = (4 - (offset % 4)) % 4; if (pad) { bin.push(Buffer.alloc(pad)); offset += pad; }
    return bufferViews.length - 1;
  };
  for (const [name, bytes] of Object.entries(textureBytes)) {
    images.push({ name, bufferView: pushView(bytes), mimeType: bytes[0] === 255 ? 'image/jpeg' : 'image/png' });
    textures.push({ source: images.length - 1, sampler: name.startsWith('logo:') ? 1 : 0 }); textureIds.set(name, textures.length - 1);
  }
  const accessor = (typed, type, extra = {}) => { accessors.push({ bufferView: pushView(typed, extra.target), componentType: typed instanceof Uint8Array ? 5121 : typed instanceof Uint16Array ? 5123 : typed instanceof Uint32Array ? 5125 : 5126, count: typed.length / ({ SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[type]), type, ...(extra.normalized ? { normalized: true } : {}), ...(extra.min ? { min: extra.min, max: extra.max } : {}) }); return accessors.length - 1; };
  const geometry = (g, textured = false, normalMapped = false) => {
    const minmax = k => [Math.min(...g.pos.filter((_, i) => i % 3 === k)), Math.max(...g.pos.filter((_, i) => i % 3 === k))];
    const mm = [0, 1, 2].map(minmax);
    const idx = g.pos.length / 3 > 65535 ? new Uint32Array(g.idx) : new Uint16Array(g.idx);
    const uv = g.uv ?? [], colors = [];
    for (let i = 0; i < g.pos.length; i += 3) {
      const n = g.nor.slice(i, i + 3), p = g.pos.slice(i, i + 3), axis = n.map(Math.abs).indexOf(Math.max(...n.map(Math.abs)));
      if (textured && !g.uv) uv.push(p[axis === 0 ? 2 : 0] / .055, p[axis === 1 ? 2 : 1] / .055);
      // Jemný statický kontakt: spodné a bočné plochy tmavšie; bez animovaného tieňa na 150 svetlách.
      const ao = g.uv ? 1 : n[1] < -.5 ? .55 : n[1] > .5 ? 1 : .76;
      colors.push(Math.round(ao * 255), Math.round(ao * 255), Math.round(ao * 255), 255);
    }
    let tangentAccessor;
    if (normalMapped) {
      const t = new Float32Array(g.pos.length), b = new Float32Array(g.pos.length), tangents = [];
      for (let i = 0; i < g.idx.length; i += 3) {
        const [a, c, d] = g.idx.slice(i, i + 3), edge1 = [0, 1, 2].map(k => g.pos[c * 3 + k] - g.pos[a * 3 + k]), edge2 = [0, 1, 2].map(k => g.pos[d * 3 + k] - g.pos[a * 3 + k]);
        const u1 = uv[c * 2] - uv[a * 2], v1 = uv[c * 2 + 1] - uv[a * 2 + 1], u2 = uv[d * 2] - uv[a * 2], v2 = uv[d * 2 + 1] - uv[a * 2 + 1], det = u1 * v2 - u2 * v1;
        if (Math.abs(det) < 1e-12) continue;
        for (const index of [a, c, d]) for (let k = 0; k < 3; k++) { t[index * 3 + k] += (edge1[k] * v2 - edge2[k] * v1) / det; b[index * 3 + k] += (edge2[k] * u1 - edge1[k] * u2) / det; }
      }
      for (let i = 0; i < g.pos.length; i += 3) {
        const n = g.nor.slice(i, i + 3), dot = n.reduce((sum, a, k) => sum + a * t[i + k], 0), tangent = n.map((a, k) => t[i + k] - a * dot);
        if (Math.hypot(...tangent) < 1e-10) { const ref = Math.abs(n[1]) < .9 ? [0, 1, 0] : [1, 0, 0]; tangent.splice(0, 3, n[1] * ref[2] - n[2] * ref[1], n[2] * ref[0] - n[0] * ref[2], n[0] * ref[1] - n[1] * ref[0]); }
        const len = Math.hypot(...tangent); const tx = tangent.map(a => a / len);
        const cross = [n[1] * tx[2] - n[2] * tx[1], n[2] * tx[0] - n[0] * tx[2], n[0] * tx[1] - n[1] * tx[0]];
        tangents.push(...tx, cross.reduce((sum, a, k) => sum + a * b[i + k], 0) < 0 ? -1 : 1);
      }
      tangentAccessor = accessor(new Float32Array(tangents), 'VEC4', { target: 34962 });
    }
    return {
      POSITION: accessor(new Float32Array(g.pos), "VEC3", { target: 34962, min: mm.map(m => m[0]), max: mm.map(m => m[1]) }),
      NORMAL: accessor(new Float32Array(g.nor), "VEC3", { target: 34962 }),
      ...(textured ? { TEXCOORD_0: accessor(new Float32Array(uv), 'VEC2', { target: 34962 }) } : {}),
      ...(normalMapped ? { TANGENT: tangentAccessor } : {}),
      COLOR_0: accessor(new Uint8Array(colors), 'VEC4', { target: 34962, normalized: true }),
      indices: accessor(idx, "SCALAR", { target: 34963 }),
    };
  };
  const material = (name, hex, { rough = 0.6, metal = 0, emissive, texture } = {}) => {
    materials.push({ name, pbrMetallicRoughness: { baseColorFactor: [...rgb(hex), 1], metallicFactor: metal, roughnessFactor: rough, ...(texture ? { baseColorTexture: { index: textureIds.get(texture) } } : {}) }, ...(textureIds.has(`${texture}Normal`) ? { normalTexture: { index: textureIds.get(`${texture}Normal`), scale: .35 } } : {}), ...(emissive ? { emissiveFactor: rgb(emissive) } : {}), ...(texture === 'wood' ? { extensions: { KHR_materials_clearcoat: { clearcoatFactor: .32, clearcoatRoughnessFactor: .3 } } } : texture === 'fabric' ? { extensions: { KHR_materials_sheen: { sheenColorFactor: [.12,.105,.09], sheenRoughnessFactor: .8 } } } : {}) });
    return materials.length - 1;
  };
  const prim = (g, mat) => ({ attributes: { POSITION: g.POSITION, NORMAL: g.NORMAL, ...(g.TEXCOORD_0 !== undefined ? { TEXCOORD_0: g.TEXCOORD_0 } : {}), ...(g.TANGENT !== undefined ? { TANGENT: g.TANGENT } : {}), COLOR_0: g.COLOR_0 }, indices: g.indices, material: mat });
  const node = (name, primitives, extra = {}) => { meshes.push({ name, primitives }); nodes.push({ name, mesh: meshes.length - 1, ...extra }); return nodes.length - 1; };
  const solid = (name, build, mat) => { const g = geo(); build(g); return node(name, [prim(geometry(g, !!materials[mat].pbrMetallicRoughness.baseColorTexture, !!materials[mat].normalTexture), mat)]); };

  // Materiály sály
  const M = {
    floor: material("podlaha", "#716451", { rough: 0.38, texture: 'wood' }), carpet: material("koberec", "#343b3b", { rough: 1, texture: 'fabric' }),
    tier: material("stupne", "#454b49", { rough: 0.95, texture: 'fabric' }), riser: material("čelá stupňov", "#6d4c35", { rough: 0.65, texture: 'wood' }),
    deskTop: material("lavice", "#946d4e", { rough: 0.28, texture: 'wood' }), deskFront: material("čelo lavíc", "#63452f", { rough: 0.48, texture: 'wood' }),
    chairBase: material("podnož kresla", "#3a3f44", { rough: 0.4, metal: 0.5 }), wall: material("stena", "#393c38", { rough: 0.9, texture: 'stone' }),
    slat: material("obklad", "#987657", { rough: 0.34, texture: 'wood' }), dais: material("pódium", "#63442e", { rough: 0.32, texture: 'wood' }),
    dark: material("predsedníctvo", "#2b2f33", { rough: 0.45 }), metal: material("žrď", "#cfc8b6", { rough: 0.3, metal: 0.85 }),
    light: material('teplá svetelná škára', '#f7d7a7', { emissive: '#d2a66f', rough: .8 }),
    trim: material('mosadzné lemovanie', '#b6a074', { rough: .45, metal: .65 }),
  };

  // Podlaha (polkruh + predná časť pre predsedníctvo) a koberec v strede
  const outer = rowRadius(ROWS - 1) + ROW_DEPTH / 2 + 0.03, front = 0.13;
  solid("podlaha", g => { ring(g, 0.0001, outer, 0, FLOOR, Math.PI, 0, { seg: 72 }); box(g, 0, FLOOR / 2, front / 2, outer * 2, FLOOR, front); }, M.floor);
  const inner = rowRadius(0) - ROW_DEPTH / 2 - 0.004;
  solid("koberec", g => { ring(g, 0.0001, inner, FLOOR, FLOOR + 0.0008, Math.PI, 0, { seg: 64, sides: false }); box(g, 0, FLOOR + 0.0004, 0.045, inner * 2, 0.0008, 0.09); }, M.carpet);
  solid('lem koberca', g => ring(g, inner - .0012, inner, FLOOR, FLOOR + .0009, Math.PI, 0, { sides: false, seg: 64 }), M.trim);
  // Quiet floor inlay, lit only when a user's own selection reaches 76 seats.
  const majorityLight = material('väčšina:svetlo', '#565347', { rough: .6 });
  solid('svetelná cesta k väčšine', g => {
    ring(g, inner - .0042, inner - .0024, FLOOR, FLOOR + .001, Math.PI, 0, { sides: false, seg: 64 });
    box(g, 0, FLOOR + .0005, -.022, .0018, .001, .10);
  }, majorityLight);

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
  solid('zrazené hrany lavíc', g => { for (let k = 0; k < ROWS; k++) for (let s = 0; s < SECTORS; s++) { const [a0, a1] = sectorSpan(k, s); ring(g, deskR(k) - .0041, deskR(k) + .0041, deskTopY(k), deskTopY(k) + .0005, a0, a1, { seg: 48 }); } }, M.deskTop);
  solid('mikrofóny poslancov', g => { for (const seat of chamberSeats) { const r = deskR(seat.row); cylinder(g, Math.cos(seat.angle) * r, deskTopY(seat.row), -Math.sin(seat.angle) * r, .0003, .004, 6); } }, M.chairBase);
  solid('schodíky v uličkách', g => { for (let k = 1; k < ROWS; k++) for (let s = 0; s < SECTORS - 1; s++) { const a = sectorSpan(k, s)[1] - AISLE / rowRadius(k) / 2; ring(g, rowRadius(k) - ROW_DEPTH / 2, rowRadius(k), FLOOR, tierTop(k) - .00575, a + .012, a - .012, { seg: 2 }); } }, M.tier);

  // Warm wainscot, glazing and gallery. Panorama is illustrative, not a real room reconstruction.
  const wallR = outer + .003, wallH = .218, wallA0 = Math.PI * .95, wallA1 = Math.PI * .05;
  const woodTop = .12, windowBottom = .127, windowTop = .207;
  solid('stena', g => ring(g, wallR, wallR + .005, FLOOR, woodTop, wallA0, wallA1, { seg: 32 }), M.deskFront);
  solid('svetelná škára', g => ring(g, wallR - .001, wallR + .003, woodTop - .002, woodTop, wallA0, wallA1, { seg: 32 }), M.light);
  solid('okenný parapet', g => ring(g, wallR - .004, wallR + .006, woodTop, windowBottom, wallA0, wallA1, { seg: 32 }), M.deskTop);
  solid('horný rám okien', g => ring(g, wallR, wallR + .008, windowTop, wallH, wallA0, wallA1, { seg: 32 }), M.deskFront);
  solid('mosadz galérie', g => ring(g, wallR - .005, wallR - .003, woodTop + .004, woodTop + .0055, wallA0, wallA1, { seg: 32 }), M.trim);
  solid('pilastre okien', g => {
    for (let i = 0; i <= 10; i++) {
      const a = wallA0 + (wallA1 - wallA0) * i / 10;
      box(g, Math.cos(a) * wallR, (windowTop + windowBottom) / 2, -Math.sin(a) * wallR, .0036, windowTop - windowBottom, .006, { yaw: Math.PI / 2 - a });
    }
  }, M.deskFront);
  solid('svietidlá pri oknách', g => {
    for (let i = 1; i < 10; i += 2) {
      const a = wallA0 + (wallA1 - wallA0) * i / 10;
      box(g, Math.cos(a) * (wallR - .004), .17, -Math.sin(a) * (wallR - .004), .0018, .026, .001, { yaw: Math.PI / 2 - a });
    }
  }, M.light);
  // A curved, inward-facing UV ribbon. UV left→right follows physical chair order.
  const ribbon = (r, lo, hi, a0, a1, seg = 32, canvas = false) => {
    const g = geo(); g.uv = [];
    for (let i = 0; i < seg; i++) {
      const a = a0 + (a1 - a0) * i / seg, b = a0 + (a1 - a0) * (i + 1) / seg, mid = (a + b) / 2;
      quad(g, [arcPt(r, a, lo), arcPt(r, b, lo), arcPt(r, b, hi), arcPt(r, a, hi)], [-Math.cos(mid), 0, Math.sin(mid)]);
      // CanvasTexture uses flipped Y unlike imported glTF bitmap textures.
      g.uv.push(i / seg, canvas ? 0 : 1, (i + 1) / seg, canvas ? 0 : 1, (i + 1) / seg, canvas ? 1 : 0, i / seg, canvas ? 1 : 0);
    }
    return g;
  };
  // External local JPEG loads ONLY with this 3D model. Keep it independently cacheable.
  images.push({ name: 'Bratislava za oknami — ilustrácia', uri: 'bratislava-evening.jpg' });
  textures.push({ source: images.length - 1, sampler: 1 });
  materials.push({ name: 'okná:Bratislava', pbrMetallicRoughness: { baseColorFactor: [1,1,1,1], metallicFactor: 0, roughnessFactor: 1, baseColorTexture: { index: textures.length - 1 } }, extensions: { KHR_materials_unlit: {} } });
  node('panoráma v oknách', [prim(geometry(ribbon(wallR + .0005, windowBottom, windowTop, wallA0, wallA1), true), materials.length - 1)]);
  // Ribbon display inset in the wooden wall, below the glazing and above the rear chairs.
  solid('rám integrovanej tabule', g => ring(g, wallR - .002, wallR, .096, .117, wallA0, wallA1, { seg: 32, top: false }), M.chairBase);
  const boardPlaceholder = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#101a18' } }).png().toBuffer();
  images.push({ name: 'tabula:podklad', bufferView: pushView(new Uint8Array(boardPlaceholder)), mimeType: 'image/png' });
  textures.push({ source: images.length - 1, sampler: 1 });
  const boardMat = material('tabula:hlasovanie', '#ffffff', { rough: 1 });
  materials[boardMat].pbrMetallicRoughness.baseColorTexture = { index: textures.length - 1 };
  // Unlit makes canvas typography independent of the room exposure. Texture arrives through public API.
  materials[boardMat].extensions = { KHR_materials_unlit: {} };
  node('integrovaná hlasovacia tabuľa', [prim(geometry(ribbon(wallR - .0025, .098, .115, wallA0, wallA1, 32, true), true), boardMat)]);
  // Predsedníctvo vpredu: pódium, dlhý stôl k poslancom, tri kreslá; rečnícky pult na koberci pred ním
  solid("pódium", g => box(g, 0, FLOOR + 0.008, 0.088, 0.17, 0.016, 0.05), M.dais);
  solid("predsednícky stôl", g => { box(g, 0, FLOOR + 0.016 + 0.009, 0.074, 0.13, 0.018, 0.012); }, M.deskTop);
  solid("kreslá predsedníctva", g => { for (const x of [-0.03, 0, 0.03]) { box(g, x, FLOOR + 0.016 + 0.0065, 0.09, 0.016, 0.005, 0.014); box(g, x, FLOOR + 0.016 + 0.016, 0.0975, 0.016, 0.016, 0.004, { tilt: -0.18 }); } }, M.dark);
  solid("rečnícky pult", g => { box(g, 0, FLOOR + 0.011, 0.036, 0.024, 0.022, 0.016); box(g, 0, FLOOR + 0.023, 0.034, 0.028, 0.003, 0.02, { tilt: 0.25 }); }, M.dais);
  // One-sided interior backdrop: visible from a seat, culled in the usual view from outside.
  // An illustrative front wall, not a claim about the real NR SR chamber.
  const frontPlate = (g, cx, cy, z, w, h) => quad(g, [[cx - w / 2, cy - h / 2, z], [cx - w / 2, cy + h / 2, z], [cx + w / 2, cy + h / 2, z], [cx + w / 2, cy - h / 2, z]], [0, 0, -1]);
  solid('vnútorná stena predsedníctva', g => frontPlate(g, 0, .085, .128, outer * 2, .162), M.wall);
  solid('vnútorné obloženie predsedníctva', g => {
    for (let i = -28; i <= 28; i++) frontPlate(g, i * .012, .07, .1278, .003, .128);
  }, M.slat);
  solid('vnútorná svetelná škára', g => frontPlate(g, 0, .139, .1275, outer * 2 - .025, .0018), M.light);
  solid("mikrofón", g => cylinder(g, 0, FLOOR + 0.024, 0.028, 0.0006, 0.012, 8), M.chairBase);
  // Kreslá: čalúnenie vo farbe strany (dva varianty) a tmavá podnož; predok k predsedníctvu
  const upholstery = geo();
  cushion(upholstery, 0, 0.0075, 0.001, 0.0145, 0.0045, 0.0135, .0017);
  cushion(upholstery, 0, 0.017, -0.0062, 0.0145, 0.0145, 0.0038, .0016, -.2);
  const base = geo();
  box(base, 0, 0.003, 0.001, 0.0035, 0.006, 0.0035);
  box(base, 0, 0.0007, 0.001, 0.0095, 0.0014, 0.0095);
  for (const x of [-.0076, .0076]) { cushion(base, x, .0115, 0, .0015, .0018, .01, .0005); box(base, x, .007, -.002, .001, .008, .001); }
  const upG = geometry(upholstery, true, true), baseG = geometry(base);
  const colorOf = id => variants.flatMap(v => v.ordered).find(m => m.id === id).color;
  const partyMat = new Map(partyIds.map(id => [id, material(`strana:${id}`, colorOf(id), { rough: 0.72, texture: 'fabric' })]));
  const logoMat = new Map(partyIds.map(id => [id, material(`logo:${id}`, '#ffffff', { rough: .85, texture: `logo:${id}` })]));
  const badge = geo(); plate(badge, 0, .002, .00205, .0095, .00475);
  for (let i = 0; i < badge.pos.length; i += 3) {
    const y = badge.pos[i + 1], z = badge.pos[i + 2];
    badge.pos[i + 1] = .017 + y * Math.cos(-.2) - z * Math.sin(-.2); badge.pos[i + 2] = -.0062 + y * Math.sin(-.2) + z * Math.cos(-.2);
    badge.nor[i + 1] = -Math.sin(-.2); badge.nor[i + 2] = Math.cos(-.2);
  }
  badge.uv = [0, 1, 1, 1, 1, 0, 0, 0];
  const badgeG = geometry(badge, true);
  const chairNodes = chamberSeats.map(seat => {
    const mModel = partyMat.get(model.seatParty[seat.index]);
    const lModel = logoMat.get(model.seatParty[seat.index]);
    const mapMaterials = mats => {
      const grouped = new Map();
      variants.forEach((v, i) => {
        const mat = mats.get(v.seatParty[seat.index]);
        if (!grouped.has(mat)) grouped.set(mat, []);
        grouped.get(mat).push(i);
      });
      return [...grouped].map(([material, variants]) => ({ material, variants }));
    };
    const mappings = mapMaterials(partyMat), logoMappings = mapMaterials(logoMat);
    // Internal third variant: independent seat materials allow a genuine colour/logo sweep.
    // Textures and geometry are shared; the two factual allocations are left unchanged.
    const sweepMat = material(`prechod:${seat.index}`, colorOf(model.seatParty[seat.index]), { rough: .72, texture: 'fabric' });
    const sweepLogo = material(`prechod-logo:${seat.index}`, '#ffffff', { rough: .85, texture: `logo:${model.seatParty[seat.index]}` });
    // Rovnaké materiály kresla používa aj variant „hlasovanie“ (farbu hlasu a logo klubu nastaví web).
    mappings.push({ material: sweepMat, variants: [variants.length, variants.length + 1] });
    logoMappings.push({ material: sweepLogo, variants: [variants.length, variants.length + 1] });
    return node(`kreslo ${seat.index + 1}`, [{ ...prim(upG, mModel), extensions: { KHR_materials_variants: { mappings } } }, prim(baseG, M.chairBase), { ...prim(badgeG, lModel), extensions: { KHR_materials_variants: { mappings: logoMappings } } }],
      { translation: [seat.x, seat.y, seat.z], rotation: [0, Math.sin(seat.yaw / 2), 0, Math.cos(seat.yaw / 2)] });
  });

  // Hlasovanie: svetelné stĺpiky nad kreslami. Atlas 32 × 32 (blok 2 × 2 na kreslo, index kresla po riadkoch po 16)
  // nesie farbu aj priehľadnosť (neprítomný = priehľadný blok); mimo variantu „hlasovanie“ je stĺpik skrytý.
  const VOTE = variants.length + 1, GROUP = 10, BEAM_R = .0022, BEAM_H = .03, SINK = .036;
  const atlas = await sharp({ create: { width: 32, height: 32, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } }).png().toBuffer();
  images.push({ name: "hlasovanie:atlas", bufferView: pushView(new Uint8Array(atlas)), mimeType: "image/png" });
  textures.push({ source: images.length - 1, sampler: 2 });
  materials.push({ name: "hlasovanie:stlpiky", alphaMode: "MASK", alphaCutoff: .5, doubleSided: true, pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], baseColorTexture: { index: textures.length - 1 }, metallicFactor: 0, roughnessFactor: .55 }, emissiveTexture: { index: textures.length - 1 }, emissiveFactor: [.8, .8, .8] });
  const beamMat = materials.length - 1;
  materials.push({ name: "hlasovanie:skryte", alphaMode: "MASK", alphaCutoff: .5, pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 0], metallicFactor: 0, roughnessFactor: 1 } });
  const hiddenMat = materials.length - 1;
  const beamNodes = [];
  for (let g0 = 0; g0 < chamberSeats.length; g0 += GROUP) {
    // Stĺpik = dve prekrížené svietiace plôšky (obojstranný materiál), bez normál: svieti vlastnou farbou a je ľahký.
    const pos = [], uv = [], idx = [];
    for (const seat of chamberSeats.slice(g0, g0 + GROUP)) {
      // Stred sedadla (kreslo je natočené o yaw), stĺpik od sedadla nahor.
      const cx = seat.x + Math.sin(seat.yaw) * .001, cz = seat.z + Math.cos(seat.yaw) * .001, y0 = seat.y + .01, y1 = y0 + BEAM_H;
      const u = ((seat.index % 16) * 2 + 1) / 32, v = (Math.floor(seat.index / 16) * 2 + 1) / 32;
      for (const a of [seat.yaw, seat.yaw + Math.PI / 2]) {
        const dx = Math.cos(a) * BEAM_R, dz = -Math.sin(a) * BEAM_R, base = pos.length / 3;
        pos.push(cx - dx, y0, cz - dz, cx + dx, y0, cz + dz, cx + dx, y1, cz + dz, cx - dx, y1, cz - dz); uv.push(u, v, u, v, u, v, u, v);
        idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
      }
    }
    const axis = k => pos.filter((_, i) => i % 3 === k);
    const P = accessor(new Float32Array(pos), "VEC3", { target: 34962, min: [0, 1, 2].map(k => Math.min(...axis(k))), max: [0, 1, 2].map(k => Math.max(...axis(k))) });
    const T = accessor(new Float32Array(uv), "VEC2", { target: 34962 }), I = accessor(new Uint16Array(idx), "SCALAR", { target: 34963 });
    meshes.push({ name: `hlasovanie ${g0 / GROUP + 1}`, primitives: [{ attributes: { POSITION: P, TEXCOORD_0: T }, indices: I, material: hiddenMat, extensions: { KHR_materials_variants: { mappings: [{ material: beamMat, variants: [VOTE] }] } } }] });
    nodes.push({ name: `stĺpiky ${g0 / GROUP + 1}`, mesh: meshes.length - 1 });
    beamNodes.push(nodes.length - 1);
  }

  // Animácia obsadenia: kreslo vyrastie (mierne prekmitne) v poradí zľava doprava; potom drží do konca klipu.
  const STEP = 0.012, POP = 0.3, END = 12;
  const out = accessor(new Float32Array([0, 0, 0, 0, 0, 0, .58, .58, .58, .9, .9, .9, 1.035, 1.035, 1.035, 1, 1, 1, 1, 1, 1]), "VEC3");
  const samplers = [], channels = [];
  chairNodes.forEach((n, i) => {
    const t = 0.15 + i * STEP, times = new Float32Array([0, t, t + POP * .2, t + POP * .4, t + POP * .7, t + POP, END]);
    const input = accessor(times, "SCALAR", { min: [0], max: [END] });
    samplers.push({ input, output: out, interpolation: "LINEAR" });
    channels.push({ sampler: samplers.length - 1, target: { node: n, path: "scale" } });
  });
  // Stĺpiky hlasovania: do 4 s ukryté v sedadlách, potom sa skupiny zľava doprava vysunú (s miernym prekmitom).
  // Web v režime Hlasovania pustí klip od 3,9 s; inde sú stĺpiky skryté materiálom, ich pohyb nevidno.
  const beamOut = accessor(new Float32Array([0, -SINK, 0, 0, -SINK, 0, 0, .003, 0, 0, 0, 0, 0, 0, 0]), "VEC3");
  beamNodes.forEach((n, g) => {
    const t = 4 + g * .08, input = accessor(new Float32Array([0, t, t + .2, t + .32, END]), "SCALAR", { min: [0], max: [END] });
    samplers.push({ input, output: beamOut, interpolation: "LINEAR" });
    channels.push({ sampler: samplers.length - 1, target: { node: n, path: "translation" } });
  });

  const seats = parliamentSeats();
  const json = {
    asset: { version: "2.0", generator: "Mandát · scripts/build-parliament-glb.mjs", extras: { asOf: seats.asOf, updated: seats.updated, seats: seats.seats, seats2023: Object.fromEntries(v2023.ordered.map(m => [m.id, m.seats])), timeline: parliamentTimeline().map(p => ({ id: p.variant.id, date: p.point.date, agencies: p.agencies, missing: p.missing, seats: Object.fromEntries(p.variant.ordered.map(m => [m.id, m.seats])) })), exclusions: parliamentEdges().map(p => ({ id: p.variant.id, excluded: p.party.id, seats: Object.fromEntries(p.variant.ordered.map(m => [m.id, m.seats])) })) } },
    extensionsUsed: ["KHR_materials_variants", "KHR_materials_clearcoat", "KHR_materials_sheen", "KHR_materials_unlit"],
    extensions: { KHR_materials_variants: { variants: [...variants.map(v => ({ name: v.id })), { name: 'prechod' }, { name: 'hlasovanie' }] } },
    scene: 0, scenes: [{ name: "Rokovacia sála", nodes: nodes.map((_, i) => i) }],
    nodes, meshes, materials, images, textures, samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }, { magFilter: 9729, minFilter: 9987, wrapS: 33071, wrapT: 33071 }, { magFilter: 9728, minFilter: 9728, wrapS: 33071, wrapT: 33071 }], accessors, bufferViews, buffers: [{ byteLength: offset }],
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
const { glb, seats, v2023 } = await buildGlb();
if (glb.length > 1_500_000) throw new Error(`Model má ${glb.length} bajtov, limit je 1,5 MB.`);
fs.writeFileSync(OUT, glb);
writeParliamentEnvironment();
console.log(`${OUT}: ${Math.round(glb.length / 1024)} kB, ${seats.ordered.map(m => `${m.short} ${m.seats}`).join(", ")} (k ${seats.asOf}, aktualizované ${seats.updated}); voľby 2023: ${v2023.ordered.map(m => `${m.short} ${m.seats}`).join(", ")}`);
