// Oficiálny Khronos validator + naše invarianty značiek kresiel a limit mobilného modelu.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import validator from 'gltf-validator';
import { allParliamentVariants, chamberSeats } from '../lib/parliament-model.ts';
const bytes = fs.readFileSync('public/models/parlament.glb');
const json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
const report = await validator.validateBytes(new Uint8Array(bytes), { maxIssues: 1000, externalResourceFunction: async uri => { throw new Error(`Model nemá mať externé zdroje (${uri}); mesto je obloha scény`); } });
fs.mkdirSync('.impeccable/review', { recursive: true });
fs.writeFileSync('.impeccable/review/gltf-validation.json', JSON.stringify(report, null, 2));
assert.equal(report.issues.numErrors, 0, JSON.stringify(report.issues.messages));
assert.ok(bytes.length <= 8_000_000, 'GLB nad poistkou 8 MB (limit 1,5 MB zrušený 3. 10. 2026)');
const chairs = json.nodes.filter(n => /^kreslo \d+$/.test(n.name));
assert.equal(chairs.length, 150);
chairs.forEach((chair, i) => assert.deepEqual(chair.translation, [chamberSeats[i].x, chamberSeats[i].y, chamberSeats[i].z], 'Existing shared seat coordinates stay exact'));
assert.ok(!json.nodes.some(n => n.name === 'panoráma v oknách'), 'Mesto nie je plocha v modeli, ale obloha scény');
assert.ok(json.nodes.some(n => n.name === 'integrovaná hlasovacia tabuľa'));
// Jedna scéna: miestnosť s oknami (sklo, strop, sokel) a mesto za nimi ako obloha scény v nekonečnej diaľke.
for (const name of ['stena', 'pilastre okien', 'rámy okien', 'svietidlá pri oknách', 'sklo okien', 'strop', 'stropné svetlá', 'sokel budovy', 'svetelný oblúk podlahy', 'tabuľa predsedníctva', 'dvere predsedníctva', 'galéria', 'zábradlie galérie', 'obloženie bočných stien']) assert.ok(json.nodes.some(n => n.name === name), `Miestnosť: ${name}`);
// Tabuľa nad predsedníctvom zdieľa textúru s pásom na zadnej stene (jeden canvas, dve plochy).
assert.equal(json.materials[json.meshes[json.nodes.find(n => n.name === 'tabuľa predsedníctva').mesh].primitives[0].material].name, 'tabula:hlasovanie');
assert.ok(json.materials.some(m => m.name === 'sklo okien' && m.alphaMode === 'BLEND'), 'Sklo okien je priehľadné');
const sky = fs.statSync('public/models/bratislava-sky.jpg');
assert.ok(sky.size > 100_000 && sky.size < 3_000_000, 'Obloha scény (ekvirektangulárna) existuje');
assert.ok(json.materials.some(m => m.name === 'parketa' && m.extensions?.KHR_materials_clearcoat), 'Parketová podlaha s lakom');
assert.ok(json.materials.some(m => m.name === 'tabula:hlasovanie' && m.extensions.KHR_materials_unlit));
assert.ok(!json.nodes.some(n => /vlajka|štít|dvojkríž|trojvršie|hviezdy EÚ/.test(n.name)), 'Illustrative architecture contains no state symbols');
const variants = allParliamentVariants();
for (const [v, variant] of variants.entries()) for (const [i, chair] of chairs.entries()) {
  const primitives = json.meshes[chair.mesh].primitives;
  for (const [p, prefix] of [[0, 'strana:'], [2, 'logo:']]) {
    const map = primitives[p].extensions.KHR_materials_variants.mappings.find(m => m.variants.includes(v));
    assert.equal(json.materials[map.material].name, prefix + variant.seatParty[i]);
  }
}
assert.deepEqual(json.extensions.KHR_materials_variants.variants.map(v => v.name), [...variants.map(v => v.id), 'prechod', 'hlasovanie']);
for (const [i, chair] of chairs.entries()) for (const [p, prefix] of [[0, 'prechod:'], [2, 'prechod-logo:']]) {
  const mapping = json.meshes[chair.mesh].primitives[p].extensions.KHR_materials_variants.mappings.find(m => m.variants.includes(variants.length));
  assert.equal(json.materials[mapping.material].name, prefix + i, 'Independent transition material for each physical seat');
}
assert.ok(json.materials.some(m => m.name === 'väčšina:svetlo'));
assert.equal(json.animations[0].name, 'obsadenie');
assert.equal(json.animations[0].channels.length, 165, '150 kresiel + 15 skupín stĺpikov hlasovania');
// Hlasovanie: kreslá cez materiály prechodu, stĺpiky (15 × 10) skryté mimo variantu, farby z atlasu.
const vote = variants.length + 1, beams = json.nodes.filter(n => /^stĺpiky \d+$/.test(n.name));
assert.equal(beams.length, 15);
for (const [i, chair] of chairs.entries()) assert.equal(json.materials[json.meshes[chair.mesh].primitives[0].extensions.KHR_materials_variants.mappings.find(m => m.variants.includes(vote)).material].name, 'prechod:' + i, 'Kreslo v hlasovaní');
for (const b of beams) { const p = json.meshes[b.mesh].primitives[0]; assert.equal(json.materials[p.material].name, 'hlasovanie:skryte'); assert.equal(json.materials[p.extensions.KHR_materials_variants.mappings.find(m => m.variants.includes(vote)).material].name, 'hlasovanie:stlpiky'); }
console.log(`Parlament GLB: ${bytes.length} B, 150 kresiel, farby/logá v oboch variantoch; ${report.issues.numErrors} chýb, ${report.issues.numWarnings} varovaní.`);
const codes = [...new Set(report.issues.messages.map(m => m.code))];
console.log('Diagnostika:', codes.join(', ') || 'žiadna');
