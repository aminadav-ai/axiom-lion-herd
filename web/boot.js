const WIDTH = 880;
const HEIGHT = 520;

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
const btnSound = document.getElementById('btn-sound');
const btnRoar = document.getElementById('btn-roar');
const btnReset = document.getElementById('btn-reset');
const btnResume = document.getElementById('btn-resume');

const keys = new Set();
let roarQueued = 0;
let ptrActive = 0;
let ptrSx = 440;
let ptrSy = 260;
let scrubbing = false;
let soundEnabled = true;
let audioCtx = null;

function ensureAudio() {
  if (!soundEnabled) return null;
  if (!audioCtx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (Ctor) audioCtx = new Ctor();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playLionSfx(ev) {
  if (!ev || !soundEnabled) return;
  const ac = ensureAudio();
  if (!ac) return;
  const now = ac.currentTime;

  if (ev === 1) {
    // Deep Savanna Lion Roar (sawtooth chest growl + filtered noise breath)
    const osc = ac.createOscillator();
    const sub = ac.createOscillator();
    const filt = ac.createBiquadFilter();
    const gain = ac.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(145, now);
    osc.frequency.exponentialRampToValueAtTime(68, now + 0.36);

    sub.type = 'triangle';
    sub.frequency.setValueAtTime(72, now);
    sub.frequency.exponentialRampToValueAtTime(42, now + 0.38);

    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(680, now);
    filt.frequency.exponentialRampToValueAtTime(220, now + 0.38);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(filt);
    sub.connect(filt);
    filt.connect(gain).connect(ac.destination);
    osc.start(now);
    sub.start(now);
    osc.stop(now + 0.42);
    sub.stop(now + 0.42);
  } else if (ev === 2) {
    // Cheerful Sheep "Baa-aa!" Vibrato Bleat + Golden Shepherd Bell!
    const osc = ac.createOscillator();
    const vib = ac.createOscillator();
    const vibGain = ac.createGain();
    const gain = ac.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.linearRampToValueAtTime(315, now + 0.22);

    vib.frequency.setValueAtTime(26, now);
    vibGain.gain.setValueAtTime(18, now);
    vib.connect(vibGain).connect(osc.frequency);

    const filt = ac.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.setValueAtTime(950, now);
    filt.Q.setValueAtTime(2.5, now);

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(filt).connect(gain).connect(ac.destination);

    // Bright brass shepherd collar bell ping
    const bell = ac.createOscillator();
    const bellGain = ac.createGain();
    bell.type = 'sine';
    bell.frequency.setValueAtTime(1318.5, now + 0.04);
    bellGain.gain.setValueAtTime(0.11, now + 0.04);
    bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    bell.connect(bellGain).connect(ac.destination);

    vib.start(now);
    osc.start(now);
    bell.start(now + 0.04);
    vib.stop(now + 0.25);
    osc.stop(now + 0.25);
    bell.stop(now + 0.3);
  } else if (ev === 3) {
    // Victory Fanfare!
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      const t = now + i * 0.08;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.16, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(g).connect(ac.destination);
      osc.start(t);
      osc.stop(t + 0.36);
    });
  }
}

function syncSliderVars() {
  const minVal = Number(rewindSlider.min || 0);
  const maxVal = Math.max(minVal + 1, Number(rewindSlider.max || 1));
  rewindSlider.style.setProperty('--attr-min', String(minVal));
  rewindSlider.style.setProperty('--attr-max', String(maxVal));
  rewindSlider.style.setProperty('--control-value', String(rewindSlider.value));
}

function normalizeKeyTokens(e) {
  const tokens = [];
  if (e.code) tokens.push(e.code);
  if (e.key) {
    if (e.key.startsWith('Arrow')) tokens.push(e.key);
    if (e.key === ' ') tokens.push('Space');
  }
  return tokens;
}

window.addEventListener('keydown', (e) => {
  const toks = normalizeKeyTokens(e);
  if (document.activeElement !== rewindSlider && toks.some((t) => ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(t))) {
    e.preventDefault();
  }
  ensureAudio();
  if (toks.includes('Space')) {
    roarQueued = 1;
  }
  toks.forEach((t) => keys.add(t));
}, { capture: true });

window.addEventListener('keyup', (e) => {
  normalizeKeyTokens(e).forEach((t) => keys.delete(t));
}, { capture: true });

window.addEventListener('blur', () => {
  keys.clear();
  ptrActive = 0;
});

function updatePointerCoords(e) {
  const rect = canvas.getBoundingClientRect();
  ptrSx = Math.round(((e.clientX - rect.left) / rect.width) * WIDTH);
  ptrSy = Math.round(((e.clientY - rect.top) / rect.height) * HEIGHT);
}

canvas.addEventListener('pointerdown', (e) => {
  ensureAudio();
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

  btnSound.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    btnSound.setAttribute('aria-pressed', String(soundEnabled));
    btnSound.textContent = soundEnabled ? 'Sound: ON' : 'Sound: OFF';
    if (soundEnabled) ensureAudio();
  });

  btnRoar.addEventListener('click', () => {
    ensureAudio();
    if (scrubbing) exitScrubMode();
    roarQueued = 1;
  });

  btnReset.addEventListener('click', () => {
    ensureAudio();
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
      const right = keys.has('ArrowRight') || keys.has('Numpad6') || keys.has('KeyD') ? 1 : 0;
      const left = keys.has('ArrowLeft') || keys.has('Numpad4') || keys.has('KeyA') ? 1 : 0;
      const down = keys.has('ArrowDown') || keys.has('Numpad2') || keys.has('KeyS') ? 1 : 0;
      const up = keys.has('ArrowUp') || keys.has('Numpad8') || keys.has('KeyW') ? 1 : 0;
      const dx = right - left;
      const dy = down - up;
      ex.step_game(dx, dy, roarQueued, ptrActive, ptrSx, ptrSy);
      roarQueued = 0;
      const sfx = ex.pop_sfx();
      if (sfx > 0) playLionSfx(sfx);
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
