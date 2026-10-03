import assert from 'node:assert/strict';
import { backdropCamera, backdropAttributes } from '../lib/parliament-backdrop.ts';
const base = { radius: 1.2, phi: 58 * Math.PI / 180, target: { x: 0, y: .1, z: -.1 } };
const camera = { ...base, theta: 0, fov: 30 };
assert.deepEqual(backdropCamera(camera, base), { pan: 0, tilt: 0, zoom: 1 });
assert.deepEqual(backdropAttributes('0deg 58deg 1.2m', '0m 0.1m -0.1m', 30, base), { pan: 0, tilt: 0, zoom: 1 });
assert.deepEqual(backdropAttributes(`0rad ${base.phi}rad 1.2m`, '0m 0.1m -0.1m', 30, base), { pan: 0, tilt: 0, zoom: 1 });
assert.deepEqual(backdropAttributes('auto', 'auto', 30, base), { pan: 0, tilt: 0, zoom: 1 });
assert.ok(backdropCamera({ ...camera, radius: .6 }, base).zoom > 1, 'City moves with zoom, at a more distant depth than the chamber');
assert.ok(backdropCamera({ ...camera, radius: 2 }, base).zoom < 1);
assert.ok(backdropCamera({ ...camera, target: { ...camera.target, x: .2 } }, base).pan > 0, 'Panning the target also moves the city');
assert.ok(backdropCamera({ ...camera, target: { ...camera.target, y: .2 } }, base).tilt > 0);
assert.equal(backdropCamera({ ...camera, theta: .5 }, base).pan, -backdropCamera({ ...camera, theta: -.5 }, base).pan);
for (const radius of [.01, .2, 1, 5, 100]) for (const theta of [-20, -Math.PI, 0, Math.PI, 20]) {
  const value = backdropCamera({ ...camera, radius, theta }, base);
  assert.ok(Object.values(value).every(Number.isFinite));
  assert.deepEqual(value, backdropCamera({ ...camera, radius, theta }, base));
}
assert.deepEqual(backdropCamera({ ...camera, radius: NaN }, base), { pan: 0, tilt: 0, zoom: 1 });
console.log('City parallax: reset, zoom, target translation, rotation, extremes and determinism verified.');
