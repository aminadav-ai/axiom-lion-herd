import fs from 'node:fs';
import assert from 'node:assert/strict';

const wasmBytes = fs.readFileSync(new URL('../web/lion_herd.wasm', import.meta.url));
const mod = await WebAssembly.compile(wasmBytes);

// 1. Verify Axiom Security Passport records `[CAP] Gpu` and `[CAP] Mem`
const passportSec = WebAssembly.Module.customSections(mod, 'axiom.passport');
assert.equal(passportSec.length, 1);
const passport = JSON.parse(new TextDecoder().decode(passportSec[0]));
const caps = passport.capabilities.map((c) => c.effect);
assert(caps.includes('Gpu') && caps.includes('Mem'), `Expected Gpu & Mem capabilities, got ${JSON.stringify(caps)}`);

const inst = await WebAssembly.instantiate(mod, {});
const ex = inst.exports;

// 2. Verify 3D Savanna Plateau + 14 Sculpted 3D Sheep + 3D Lion + 8x 256x256 Bump Textures!
const texOff = ex.init_game(2026);
assert.equal(texOff, 262144);
assert.equal(ex.get_tick(), 0);
assert.equal(ex.get_stamina(), 100);

const staticVerts = ex.get_static_vert_count();
const dynVerts = ex.get_dyn_vert_count();
assert(staticVerts > 2400 && staticVerts % 3 === 0, `Expected >2400 static 3D savanna/corral/tree vertices, got ${staticVerts}`);
assert(dynVerts > 14000 && dynVerts % 3 === 0, `Expected >14000 sculpted 3D sheep & lion vertices, got ${dynVerts}`);

const texU8 = new Uint8Array(ex.memory.buffer, texOff, 8 * 256 * 256 * 4);
const distinctRgb = new Set();
const distinctHeights = new Set();
for (let i = 0; i < texU8.length; i += 8) {
  distinctRgb.add((texU8[i] << 16) | (texU8[i + 1] << 8) | texU8[i + 2]);
  distinctHeights.add(texU8[i + 3]);
}
assert(distinctRgb.size > 5000, `Expected >5000 organic grass/fleece/mane/timber RGB gradations, got ${distinctRgb.size}`);
assert(distinctHeights.size > 140, `Expected >140 fleece/mane/grass bump heightmap levels, got ${distinctHeights.size}`);

// 3. Verify signed negative i32 inputs (`Left` dx=-1 and `Up` dy=-1) move in true opposite directions!
const mem32 = new Int32Array(ex.memory.buffer);
ex.init_game(2026);
const startLx = mem32[1], startLy = mem32[2];
ex.step_game(-1, 0, 0, 0, 0, 0); // Left
assert(mem32[1] < startLx && mem32[2] > startLy, 'Left arrow (-1, 0) must move screen-left (-wx, +wy)');
ex.init_game(2026);
ex.step_game(0, -1, 0, 0, 0, 0); // Up
assert(mem32[1] < startLx && mem32[2] < startLy, 'Up arrow (0, -1) must move screen-up (-wx, -wy)');
ex.init_game(2026);

// 4. Benchmark 60 frames of 3D flock Boids + 3D Lion Roar shockwave + Time-Travel
const t0 = performance.now();
let tickAt20 = -1;
let staminaAt20 = -1;
let roarSfxSeen = false;
for (let f = 1; f <= 60; f++) {
  const roar = f === 10 ? 1 : 0;
  ex.step_game(1, -1, roar, 0, 0, 0);
  if (ex.pop_sfx() === 1) roarSfxSeen = true;
  if (f === 20) {
    tickAt20 = ex.get_tick();
    staminaAt20 = ex.get_stamina();
  }
}
const msPerFrame = (performance.now() - t0) / 60;

assert.equal(roarSfxSeen, true, 'Lion Roar must emit SFX event 1');
assert.equal(ex.get_tick(), 60);
const snaps = ex.get_snap_count();
assert(snaps >= 15, `Expected >=15 Time-Travel snapshots, got ${snaps}`);

ex.rewind_to_snapshot(10);
assert.equal(ex.get_tick(), tickAt20, 'Time-Travel rewind must restore exact historical tick');
assert.equal(ex.get_stamina(), staminaAt20, 'Time-Travel rewind must restore exact historical stamina');

console.log(JSON.stringify({
  status: 'PASS',
  wasmBytes: wasmBytes.length,
  wasmKB: +(wasmBytes.length / 1024).toFixed(2),
  staticSavannaTriangles: staticVerts / 3,
  dynamicFlockTriangles: ex.get_dyn_vert_count() / 3,
  distinctTextureColors: distinctRgb.size,
  distinctHeightmapLevels: distinctHeights.size,
  avgCpuStepMs: +msPerFrame.toFixed(3),
}));
