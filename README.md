# Axiom Lion Herd HD — 880×520 Sculpted 2.5D Browser Game in 100% Axiom

**Live Playable Demo:** [https://aminadav-ai.github.io/axiom-lion-herd/](https://aminadav-ai.github.io/axiom-lion-herd/)  
**Powered by:** [Project Axiom (`axiom-lang` v0.2)](https://github.com/aminadav-ai/axiom-lang)

**Axiom Lion Herd HD** is a high-definition 2.5D isometric shepherd game written **100% in the [Axiom](https://github.com/aminadav-ai/axiom-lang) programming language** (`src/lion_herd.ax`) — spanning `Axiom.Telos`, `Axiom.Flux`, and `Axiom.Strata`, and compiled **directly to standalone W3C WebAssembly bytecode (`15.03 KB` uncompressed / `6.31 KB` gzipped)** with **zero `rustc` and zero third-party engines**.

---

## Measured Engineering Metrics (`v2.0 HD`)

| Metric | Value |
| :--- | :--- |
| **Game Logic + Sculpted 2.5D Renderer + Physics** | 100% `Axiom` (`src/lion_herd.ax`, 41 semantic graph nodes) |
| **Compiled `.wasm` Binary Size** | **15,387 bytes (`15.03 KB`)** |
| **Gzipped HTTP Transfer Size** | **6,465 bytes (`6.31 KB`)** |
| **HD Framebuffer Resolution** | **`880 × 520` RGBA** (anti-aliased `isqrt` 3D normal shading + baked static diorama cache) |
| **Software 2.5D Frame Rate** | **~86 FPS** (`~11.6 ms/frame` in V8 on a dual-core 2.0 GHz laptop CPU) |
| **Sculpted Creature Detail** | 6-puff woolly sheep with 4 trotting legs, floppy ears & eyes; multi-ring maned lion with 4 paws, whipping tail & amber eyes |
| **Time-Travel Ring Buffer** | **240 live snapshots** stored directly in `Axiom.Strata` linear memory |

---

## Build & Verify Locally

```bash
axiom compile-wasm src/lion_herd.ax -o web/lion_herd.wasm
node scripts/verify_game.mjs
python3 -m http.server 8080 -d web
```

---

## License

Copyright (c) 2026 Yehuda Aminadav. Licensed under **Business Source License 1.1 (`BUSL-1.1`)** — free for personal, educational, academic, and non-commercial use. See [LICENSE](./LICENSE) and [CONTRIBUTING.md](./CONTRIBUTING.md).
