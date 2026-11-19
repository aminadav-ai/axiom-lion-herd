# Axiom Lion Herd — 2.5D Isometric Browser Game in 100% Axiom

**Live Playable Demo:** [https://aminadav-ai.github.io/axiom-lion-herd/](https://aminadav-ai.github.io/axiom-lion-herd/)  
**Powered by:** [Project Axiom (`axiom-lang` v0.2)](https://github.com/aminadav-ai/axiom-lang)

**Axiom Lion Herd** is a complete 2.5D isometric shepherd game written **100% in the [Axiom](https://github.com/aminadav-ai/axiom-lang) programming language** (`src/lion_herd.ax`) — spanning all three Axiom layers (`Axiom.Telos`, `Axiom.Flux`, and `Axiom.Strata`) and compiled **directly to raw W3C WebAssembly bytecode (`10.88 KB` uncompressed / `4.66 KB` gzipped)** with **zero `rustc`, zero `wasm-bindgen`, and zero third-party game engines**.

---

## Measured Engineering Metrics

| Metric | Value |
| :--- | :--- |
| **Game Logic + 2.5D Software Renderer + Physics** | 100% `Axiom` (`src/lion_herd.ax`, 32 semantic graph nodes) |
| **Compiled `.wasm` Binary Size** | **11,136 bytes (`10.88 KB`)** |
| **Gzipped HTTP Transfer Size** | **4,767 bytes (`4.66 KB`)** |
| **Z3 Mathematical Proof Obligations Proved** | **90 / 90 proved** (`0` unverified divisions, `0` arena escapes) |
| **Direct `Strata -> .wasm` Bytecode Emission** | **~108 ms** from cached graph (`3.4 s` cold with full Z3 SMT proofs), **zero `rustc`** |
| **Software 2.5D Frame Rate (`640x400` RGBA)** | **~136–145 FPS** (`~6.9 ms/frame` in V8 on a dual-core 2.0 GHz laptop CPU) |
| **Time-Travel Ring Buffer** | **240 live snapshots** stored directly in `Axiom.Strata` linear memory |

---

## What Runs Inside `src/lion_herd.ax`?

1. **`Axiom.Telos` (Z3-Verified Contracts):**
   - `clamp_arena`, `clamp_corral_x`, `clamp_corral_y`, `iso_screen_x`, `iso_screen_y`, `sheep_slot_addr`, `snapshot_slot_addr`, and `compute_herd_score` carry formal `req`/`ens` contracts proved by Microsoft Z3.
   - Z3 mathematically proves that no sheep or lion coordinate ever leaves the `0..1024` world diamond, no isometric projection overflows `640x400` screen bounds, and no division can ever divide by zero.
2. **`Axiom.Flux` (Pure Boids Flock Intelligence):**
   - 14 autonomous sheep execute classic Craig Reynolds **Boids** steering (separation, alignment, cohesion) combined with dynamic predator-flee vectors from the player's Lion and golden **Lion Roar** shockwaves.
3. **`Axiom.Strata` (Deterministic Linear Memory & 2.5D Isometric Pixel Engine):**
   - Analytical inverse-isometric meadow & extruded 3D floating earth cliff walls (`O(1)` per pixel, zero raymarch loops).
   - Painter's-algorithm depth sorting (`wx + wy`) across all 15 entities + wooden corral fence posts.
   - Soft darkened elliptical ground shadows + Lambertian/specular 3D sphere shading + vertical `z`-axis trot bounce.
   - Instant **Time-Travel Scrubbing** via a 240-slot packed state ring buffer in linear memory (`rewind_to_snapshot`).

---

## Build & Verify Locally

```bash
# 1. Verify all 90 Z3 obligations and emit standalone WebAssembly directly via Axiom.Strata
axiom compile-wasm src/lion_herd.ax -o web/lion_herd.wasm

# 2. Run headless V8 verification & frame-time benchmark
node scripts/verify_game.mjs

# 3. Serve locally
python3 -m http.server 8080 -d web
```

---

## License

Copyright (c) 2026 Yehuda Aminadav. Licensed under **Business Source License 1.1 (`BUSL-1.1`)** — free for personal, educational, academic, and non-commercial use. See [LICENSE](./LICENSE) and [CONTRIBUTING.md](./CONTRIBUTING.md).
