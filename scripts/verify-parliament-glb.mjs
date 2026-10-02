// Oficiálny Khronos validator + naše invarianty značiek kresiel a limit mobilného modelu.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import validator from 'gltf-validator';
import { allParliamentVariants } from '../lib/parliament-model.ts';
const bytes = fs.readFileSync('public/models/parlament.glb');
const json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
const report = await validator.validateBytes(new Uint8Array(bytes), { maxIssues: 1000 });
fs.mkdirSync('.impeccable/review', { recursive: true });
fs.writeFileSync('.impeccable/review/gltf-validation.json', JSON.stringify(report, null, 2));
assert.equal(report.issues.numErrors, 0, JSON.stringify(report.issues.messages));
assert.ok(bytes.length <= 1_500_000, 'GLB nad 1,5 MB');
const chairs = json.nodes.filter(n => /^kreslo \d+$/.test(n.name));
assert.equal(chairs.length, 150);
const variants = allParliamentVariants();
for (const [v, variant] of variants.entries()) for (const [i, chair] of chairs.entries()) {
  const primitives = json.meshes[chair.mesh].primitives;
  for (const [p, prefix] of [[0, 'strana:'], [2, 'logo:']]) {
    const map = primitives[p].extensions.KHR_materials_variants.mappings.find(m => m.variants.includes(v));
    assert.equal(json.materials[map.material].name, prefix + variant.seatParty[i]);
  }
}
assert.deepEqual(json.extensions.KHR_materials_variants.variants.map(v => v.name), [...variants.map(v => v.id), 'prechod']);
for (const [i, chair] of chairs.entries()) for (const [p, prefix] of [[0, 'prechod:'], [2, 'prechod-logo:']]) {
  const mapping = json.meshes[chair.mesh].primitives[p].extensions.KHR_materials_variants.mappings.find(m => m.variants.includes(variants.length));
  assert.equal(json.materials[mapping.material].name, prefix + i, 'Independent transition material for each physical seat');
}
assert.ok(json.materials.some(m => m.name === 'väčšina:svetlo'));
assert.equal(json.animations[0].name, 'obsadenie');
assert.equal(json.animations[0].channels.length, 150);
console.log(`Parlament GLB: ${bytes.length} B, 150 kresiel, farby/logá v oboch variantoch; ${report.issues.numErrors} chýb, ${report.issues.numWarnings} varovaní.`);
const codes = [...new Set(report.issues.messages.map(m => m.code))];
console.log('Diagnostika:', codes.join(', ') || 'žiadna');
