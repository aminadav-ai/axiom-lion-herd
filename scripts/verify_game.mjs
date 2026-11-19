import fs from 'node:fs';
import assert from 'node:assert/strict';

const wasmBytes = fs.readFileSync(new URL('../web/lion_herd.wasm', import.meta.url));
const { instance } = await WebAssembly.instantiate(wasmBytes, {});
const ex = instance.exports;

const fbOffset = ex.init_game(2026);
assert.equal(fbOffset, 131072, 'Expected framebuffer byte offset 131072');
assert.equal(ex.get_fb_byte_offset(), 131072);
assert.equal(ex.get_tick(), 0);
assert.equal(ex.get_stamina(), 100);

const u8 = new Uint8Array(ex.memory.buffer, fbOffset, 640 * 400 * 4);
let distinctColors = new Set();
for (let i = 0; i < u8.length; i += 64) {
  assert.equal(u8[i + 3], 255, 'Every pixel alpha must be 255');
  distinctColors.add((u8[i] << 16) | (u8[i + 1] << 8) | u8[i + 2]);
}
assert(distinctColors.size > 40, `Expected rich 2.5D shaded scene (>40 distinct sampled RGB colors), got ${distinctColors.size}`);

// Benchmark 120 frames of gameplay + Lion Roar + Boids physics + 640x400 2.5D rasterization
const t0 = performance.now();
let tickAt40 = -1;
let staminaAt40 = -1;
for (let f = 1; f <= 120; f++) {
  const roar = f === 20 ? 1 : 0;
  ex.step_game(1, -1, roar, 0, 0, 0);
  if (f === 40) {
    tickAt40 = ex.get_tick();
    staminaAt40 = ex.get_stamina();
  }
}
const elapsedMs = performance.now() - t0;
const msPerFrame = elapsedMs / 120;

assert.equal(ex.get_tick(), 120);
const snaps = ex.get_snap_count();
assert(snaps >= 30, `Expected >=30 Time-Travel snapshots, got ${snaps}`);

// Rewind 20 snapshots (~80 ticks back -> tick 40!)
ex.rewind_to_snapshot(20);
assert.equal(ex.get_tick(), tickAt40, 'Time-Travel rewind must restore exact historical tick');
assert.equal(ex.get_stamina(), staminaAt40, 'Time-Travel rewind must restore exact historical stamina');

console.log(JSON.stringify({
  status: 'PASS',
  wasmBytes: wasmBytes.length,
  wasmKB: +(wasmBytes.length / 1024).toFixed(2),
  distinctSampledColors: distinctColors.size,
  snapshotsRecorded: snaps,
  rewoundToTick: ex.get_tick(),
  avgFrameMs: +msPerFrame.toFixed(2),
  theoreticalMaxFps: Math.round(1000 / msPerFrame),
}, null, 2));
