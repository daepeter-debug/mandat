// 3D model snemovne pre „Parlament v 3D a na stole“ (components/parliament-ar.tsx): public/models/parlament.glb
// Spustenie po každej zmene dát: node scripts/build-parliament-glb.mjs  (kontrola aktuálnosti: verify-data.mjs)
// 150 stoličiek vo farbách strán podľa scenára Modelu Mandát (prepočet § 68), usporiadaných ako v polkruhu na webe:
// koalícia vľavo, ostatní v strede, opozícia vpravo (dnešné bloky). Stupňovité rady, v strede rečnícky pult.
// Mierka pre stôl: šírka asi 70 cm (používateľ ju v rozšírenej realite môže zmeniť). Súbor je glTF 2.0 (GLB).
import fs from "node:fs";
import { hemicycleSeats } from "../lib/parliament.ts";
import { parliamentSeats } from "../lib/parliament-model.ts";

const OUT = "public/models/parlament.glb";
const R = 0.3;                                  // polomer vonkajšieho radu v metroch
const ROWS = 6, INNER = 0.45, STEP = (1 - INNER) / (ROWS - 1);
const tierTop = k => 0.008 + k * 0.009;

// ---------- geometria ----------
const toLinear = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const rgb = hex => [0, 2, 4].map(i => toLinear(parseInt(hex.slice(1 + i, 3 + i), 16)));
function box(g, cx, cy, cz, w, h, d) {
  const x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2, z0 = cz - d / 2, z1 = cz + d / 2;
  const faces = [
    [[1, 0, 0], [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]]],
    [[-1, 0, 0], [[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]]],
    [[0, 1, 0], [[x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]]],
    [[0, -1, 0], [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]]],
    [[0, 0, 1], [[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]]],
    [[0, 0, -1], [[x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]]],
  ];
  for (const [n, quad] of faces) {
    const base = g.pos.length / 3;
    for (const v of quad) { g.pos.push(...v); g.nor.push(...n); }
    g.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
}
// Polovičné medzikružie (stupeň): hore, predná a zadná stena, dve bočné čelá. Otvorená strana smeruje k divákovi (+Z).
function halfRing(g, r0, r1, y0, y1, seg = 64) {
  const ring = (r, y) => Array.from({ length: seg + 1 }, (_, i) => { const a = Math.PI * i / seg; return [Math.cos(a) * r, y, -Math.sin(a) * r]; });
  const quadStrip = (a, b, normal) => {
    for (let i = 0; i < seg; i++) {
      const base = g.pos.length / 3;
      const vs = [a[i], a[i + 1], b[i + 1], b[i]];
      for (const v of vs) { g.pos.push(...v); g.nor.push(...normal(v)); }
      g.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  };
  const radial = s => v => { const l = Math.hypot(v[0], v[2]) || 1; return [s * v[0] / l, 0, s * v[2] / l]; };
  quadStrip(ring(r1, y1), ring(r0, y1), () => [0, 1, 0]);              // horná plocha
  quadStrip(ring(r0, y1), ring(r0, y0), radial(-1));                    // stena k stredu
  quadStrip(ring(r1, y0), ring(r1, y1), radial(1));                     // zadná stena
  for (const x of [1, -1]) {                                           // čelá na priemere
    const base = g.pos.length / 3;
    const pts = [[x * r0, y0, 0], [x * r1, y0, 0], [x * r1, y1, 0], [x * r0, y1, 0]];
    for (const v of pts) { g.pos.push(...v); g.nor.push(0, 0, 1); }
    g.idx.push(...(x > 0 ? [base, base + 1, base + 2, base, base + 2, base + 3] : [base, base + 2, base + 1, base, base + 3, base + 2]));
  }
}
function halfDisc(g, r, y0, y1, seg = 72) {
  halfRing(g, 0.0001, r, y0, y1, seg);
}

// ---------- zápis GLB ----------
function buildGlb(model) {
  const bin = [];
  let offset = 0;
  const bufferViews = [], accessors = [];
  const pushView = (typed, target) => {
    const bytes = Buffer.from(typed.buffer, typed.byteOffset, typed.byteLength);
    bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: bytes.length, target });
    bin.push(bytes); offset += bytes.length;
    const pad = (4 - (offset % 4)) % 4; if (pad) { bin.push(Buffer.alloc(pad)); offset += pad; }
    return bufferViews.length - 1;
  };
  const geometry = g => {
    const pos = new Float32Array(g.pos), nor = new Float32Array(g.nor), idx = new Uint16Array(g.idx);
    const min = [0, 1, 2].map(k => Math.min(...g.pos.filter((_, i) => i % 3 === k)));
    const max = [0, 1, 2].map(k => Math.max(...g.pos.filter((_, i) => i % 3 === k)));
    accessors.push({ bufferView: pushView(pos, 34962), componentType: 5126, count: pos.length / 3, type: "VEC3", min, max });
    const p = accessors.length - 1;
    accessors.push({ bufferView: pushView(nor, 34962), componentType: 5126, count: nor.length / 3, type: "VEC3" });
    const n = accessors.length - 1;
    accessors.push({ bufferView: pushView(idx, 34963), componentType: 5123, count: idx.length, type: "SCALAR" });
    return { POSITION: p, NORMAL: n, indices: accessors.length - 1 };
  };
  const materials = [], meshes = [], nodes = [];
  const material = (name, hex, roughness = 0.6) => { materials.push({ name, pbrMetallicRoughness: { baseColorFactor: [...rgb(hex), 1], metallicFactor: 0, roughnessFactor: roughness } }); return materials.length - 1; };
  const mesh = (name, geo, mat) => { meshes.push({ name, primitives: [{ attributes: { POSITION: geo.POSITION, NORMAL: geo.NORMAL }, indices: geo.indices, material: mat }] }); return meshes.length - 1; };

  // stolička: sedadlo + operadlo, predok smeruje na +Z (otočí sa k pultu)
  const chair = { pos: [], nor: [], idx: [] };
  box(chair, 0, 0.0035, 0, 0.019, 0.007, 0.017);
  box(chair, 0, 0.0125, -0.0065, 0.019, 0.013, 0.004);
  const chairGeo = geometry(chair);
  const partyMesh = new Map(model.ordered.map(m => [m.id, mesh(`kreslo ${m.short}`, chairGeo, material(m.short, m.color, 0.5))]));

  // podlaha, stupne, pult
  const floor = { pos: [], nor: [], idx: [] };
  halfDisc(floor, (1 + STEP / 2 + 0.07) * R, 0, 0.004);
  nodes.push({ name: "podlaha", mesh: mesh("podlaha", geometry(floor), material("podlaha", "#e8e4d8", 0.9)) });
  const stepMats = [material("stupeň svetlý", "#dcd7c9", 0.85), material("stupeň tmavší", "#d2ccbc", 0.85)];
  for (let k = 0; k < ROWS; k++) {
    const r = INNER + STEP * k, g = { pos: [], nor: [], idx: [] };
    halfRing(g, (r - STEP / 2) * R, (r + STEP / 2) * R, 0.004, tierTop(k));
    nodes.push({ name: `rad ${k + 1}`, mesh: mesh(`rad ${k + 1}`, geometry(g), stepMats[k % 2]) });
  }
  const podium = { pos: [], nor: [], idx: [] };
  box(podium, 0, 0.004 + 0.016, -0.02, 0.07, 0.032, 0.026);
  box(podium, 0, 0.004 + 0.012, 0.03, 0.036, 0.024, 0.018);
  nodes.push({ name: "rečnícky pult", mesh: mesh("pult", geometry(podium), material("pult", "#20392f", 0.45)) });

  // kreslá v poradí polkruhu na webe (zľava doprava podľa uhla)
  const points = hemicycleSeats(150, ROWS, INNER);
  const colours = model.ordered.flatMap(m => Array.from({ length: m.seats }, () => m.id));
  points.forEach((pt, i) => {
    const id = colours[i];
    if (!id) return;
    const phi = Math.atan2(-pt.x, -pt.y);                    // otočenie tak, aby predok stoličky smeroval do stredu
    nodes.push({ name: `kreslo ${i + 1}`, mesh: partyMesh.get(id), translation: [pt.x * R, tierTop(pt.row), pt.y * R], rotation: [0, Math.sin(phi / 2), 0, Math.cos(phi / 2)] });
  });

  const json = {
    asset: { version: "2.0", generator: "Mandát · scripts/build-parliament-glb.mjs", extras: { asOf: model.asOf, seats: model.seats } },
    scene: 0, scenes: [{ name: "Parlament podľa prieskumov", nodes: nodes.map((_, i) => i) }],
    nodes, meshes, materials, accessors, bufferViews, buffers: [{ byteLength: offset }],
  };
  const jsonBuf = Buffer.from(JSON.stringify(json));
  const jsonPad = Buffer.alloc((4 - (jsonBuf.length % 4)) % 4, 0x20);
  const binBuf = Buffer.concat(bin);
  const total = 12 + 8 + jsonBuf.length + jsonPad.length + 8 + binBuf.length;
  const header = Buffer.alloc(12); header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(total, 8);
  const jh = Buffer.alloc(8); jh.writeUInt32LE(jsonBuf.length + jsonPad.length, 0); jh.writeUInt32LE(0x4e4f534a, 4);
  const bh = Buffer.alloc(8); bh.writeUInt32LE(binBuf.length, 0); bh.writeUInt32LE(0x004e4942, 4);
  return Buffer.concat([header, jh, jsonBuf, jsonPad, bh, binBuf]);
}

const model = parliamentSeats();
fs.mkdirSync("public/models", { recursive: true });
const glb = buildGlb(model);
fs.writeFileSync(OUT, glb);
console.log(`${OUT}: ${Math.round(glb.length / 1024)} kB, ${model.ordered.map(m => `${m.short} ${m.seats}`).join(", ")} (k ${model.asOf})`);
