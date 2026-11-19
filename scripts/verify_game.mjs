import fs from 'node:fs';
import assert from 'node:assert/strict';

const wasmBytes = fs.readFileSync(new URL('../web/lion_herd.wasm', import.meta.url));
const { instance } = await WebAssembly.instantiate(wasmBytes, {});
const ex = instance.exports;

const WIDTH = 880;
const HEIGHT = 520;

const fbOffset = ex.init_game(2026);
assert.equal(fbOffset, 131072, 'Expected framebuffer byte offset 131072');
assert.equal(ex.get_fb_byte_offset(), 131072);
assert.equal(ex.get_tick(), 0);
assert.equal(ex.get_stamina(), 100);

const u8 = new Uint8Array(ex.memory.buffer, fbOffset, WIDTH * HEIGHT * 4);
const distinctColors = new Set();
for (let i = 0; i < u8.length; i += 32) {
  assert.equal(u8[i + 3], 255, 'Every pixel alpha must be 255');
  distinctColors.add((u8[i] << 16) | (u8[i + 1] << 8) | u8[i + 2]);
}
assert(distinctColors.size > 1200, `Expected rich HD 2.5D sculpted diorama (>1200 distinct RGB colors), got ${distinctColors.size}`);

// Benchmark 60 frames of HD 960x560 gameplay + Lion Roar + Boids physics
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
const elapsedMs = performance.now() - t0;
const msPerFrame = elapsedMs / 60;

assert.equal(roarSfxSeen, true, 'Lion Roar must emit SFX event 1');
assert.equal(ex.get_tick(), 60);
const snaps = ex.get_snap_count();
assert(snaps >= 15, `Expected >=15 Time-Travel snapshots, got ${snaps}`);

// Rewind 10 snapshots (~40 ticks back -> tick 20!)
ex.rewind_to_snapshot(10);
assert.equal(ex.get_tick(), tickAt20, 'Time-Travel rewind must restore exact historical tick');
assert.equal(ex.get_stamina(), staminaAt20, 'Time-Travel rewind must restore exact historical stamina');

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
