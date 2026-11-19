const WIDTH = 640;
const HEIGHT = 400;

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d', { alpha: false });
const statPenned = document.getElementById('stat-penned');
const statScore = document.getElementById('stat-score');
const statStamina = document.getElementById('stat-stamina');
const statFps = document.getElementById('stat-fps');
const wasmBadge = document.getElementById('wasm-size-badge');
const winBanner = document.getElementById('win-banner');
const winDetail = document.getElementById('win-detail');
const rewindSlider = document.getElementById('rewind-slider');
const ttStatus = document.getElementById('tt-status');
const btnRoar = document.getElementById('btn-roar');
const btnReset = document.getElementById('btn-reset');
const btnResume = document.getElementById('btn-resume');

const keys = new Set();
let roarQueued = 0;
let ptrActive = 0;
let ptrSx = 320;
let ptrSy = 220;
let scrubbing = false;

function syncSliderVars() {
  const minVal = Number(rewindSlider.min || 0);
  const maxVal = Math.max(minVal + 1, Number(rewindSlider.max || 1));
  rewindSlider.style.setProperty('--attr-min', String(minVal));
  rewindSlider.style.setProperty('--attr-max', String(maxVal));
  rewindSlider.style.setProperty('--control-value', String(rewindSlider.value));
}

window.addEventListener('keydown', (e) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
    e.preventDefault();
  }
  if (e.code === 'Space') {
    roarQueued = 1;
  }
  keys.add(e.code);
});

window.addEventListener('keyup', (e) => {
  keys.delete(e.code);
});

function updatePointerCoords(e) {
  const rect = canvas.getBoundingClientRect();
  ptrSx = Math.round(((e.clientX - rect.left) / rect.width) * WIDTH);
  ptrSy = Math.round(((e.clientY - rect.top) / rect.height) * HEIGHT);
}

canvas.addEventListener('pointerdown', (e) => {
  canvas.setPointerCapture(e.pointerId);
  ptrActive = 1;
  updatePointerCoords(e);
  if (scrubbing) {
    exitScrubMode();
  }
});

canvas.addEventListener('pointermove', (e) => {
  if (ptrActive) {
    updatePointerCoords(e);
  }
});

canvas.addEventListener('pointerup', () => {
  ptrActive = 0;
});

canvas.addEventListener('pointercancel', () => {
  ptrActive = 0;
});

function exitScrubMode() {
  scrubbing = false;
  rewindSlider.value = '0';
  rewindSlider.setAttribute('aria-valuetext', 'Live frame (0 snapshots back)');
  ttStatus.textContent = 'Live Simulation';
  btnResume.hidden = true;
  syncSliderVars();
}

async function boot() {
  const resp = await fetch('./lion_herd.wasm');
  const buf = await resp.arrayBuffer();
  wasmBadge.textContent = `Wasm: ${(buf.byteLength / 1024).toFixed(2)} KB (Zero rustc)`;

  const { instance } = await WebAssembly.instantiate(buf, {});
  const ex = instance.exports;
  const fbOffset = ex.init_game(2026);
  const pixelView = new Uint8ClampedArray(ex.memory.buffer, fbOffset, WIDTH * HEIGHT * 4);
  const imageData = new ImageData(pixelView, WIDTH, HEIGHT);

  function blitAndSyncHud() {
    ctx.putImageData(imageData, 0, 0);
    const penned = ex.get_penned();
    const score = ex.get_score();
    const stamina = ex.get_stamina();
    const winTick = ex.get_win_tick();

    statPenned.textContent = `${penned} / 14`;
    statScore.textContent = String(score);
    statStamina.textContent = `${stamina}%`;

    if (winTick > 0) {
      winBanner.hidden = false;
      winDetail.textContent = `Completed in ${(winTick / 60).toFixed(1)}s • Score ${score}`;
    } else {
      winBanner.hidden = true;
    }

    const snapCount = Math.max(1, ex.get_snap_count());
    rewindSlider.max = String(Math.max(1, snapCount - 1));
    syncSliderVars();
  }

  btnRoar.addEventListener('click', () => {
    if (scrubbing) exitScrubMode();
    roarQueued = 1;
  });

  btnReset.addEventListener('click', () => {
    exitScrubMode();
    const seed = (Date.now() & 0x7fffffff) || 424242;
    ex.init_game(seed);
    blitAndSyncHud();
  });

  rewindSlider.addEventListener('input', () => {
    const back = Number(rewindSlider.value);
    syncSliderVars();
    if (back === 0) {
      exitScrubMode();
      return;
    }
    scrubbing = true;
    btnResume.hidden = false;
    ex.rewind_to_snapshot(back);
    const rewoundTick = ex.get_tick();
    const label = `Rewound ${back} snapshots to tick #${rewoundTick}`;
    ttStatus.textContent = label;
    rewindSlider.setAttribute('aria-valuetext', label);
    blitAndSyncHud();
  });

  btnResume.addEventListener('click', () => {
    exitScrubMode();
  });

  blitAndSyncHud();

  let frames = 0;
  let fpsTimer = performance.now();

  function frame(now) {
    if (!scrubbing) {
      const dx = (keys.has('ArrowRight') || keys.has('KeyD') ? 1 : 0)
               - (keys.has('ArrowLeft') || keys.has('KeyA') ? 1 : 0);
      const dy = (keys.has('ArrowDown') || keys.has('KeyS') ? 1 : 0)
               - (keys.has('ArrowUp') || keys.has('KeyW') ? 1 : 0);
      ex.step_game(dx, dy, roarQueued, ptrActive, ptrSx, ptrSy);
      roarQueued = 0;
      blitAndSyncHud();
    }

    frames++;
    if (now - fpsTimer >= 500) {
      statFps.textContent = String(Math.round((frames * 1000) / (now - fpsTimer)));
      frames = 0;
      fpsTimer = now;
    }
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

boot();
