# Axiom Lion Herd v3.0 GPU HD — True 3D Sculpted Savanna Shepherd (`17.87 KB` Wasm)

**Live Playable Demo:** [https://aminadav-ai.github.io/axiom-lion-herd/](https://aminadav-ai.github.io/axiom-lion-herd/)  
**Powered by:** [Project Axiom (`axiom-lang` v0.2)](https://github.com/aminadav-ai/axiom-lang)

**Axiom Lion Herd v3.0 GPU HD** is a 100% clean-room 3D savanna shepherd game written **100% in the [Axiom](https://github.com/aminadav-ai/axiom-lang) programming language** (`src/lion_herd.ax`) using `Axiom.Strata` 8 MiB linear memory + the `-[Mem, Gpu]->` WebGL2 hardware capability — compiled **directly to standalone W3C WebAssembly bytecode (`18,300` bytes / `17.87 KB` uncompressed, `7.24 KB` gzipped)** with **zero `rustc` and zero external assets**.

---

## Measured Engineering Metrics (`v3.0 GPU HD`)

| Metric | Value |
| :--- | :--- |
| **Boids Flock AI + 3D Sculpted Meshes + Texture Synthesis** | 100% `Axiom` (`src/lion_herd.ax`, 54 verified graph nodes) |
| **Compiled `.wasm` Binary Size** | **18,300 bytes (`17.87 KB`)** |
| **Gzipped HTTP Transfer Size** | **7,411 bytes (`7.24 KB`)** |
| **Axiom Security Passport Capabilities** | `[CAP] Gpu`, `[CAP] Mem` (embedded in `axiom.passport` Wasm custom section) |
| **Procedural `256×256` Grass, Fleece, Mane & Timber Textures** | **8 seamless bump-mapped textures** (`28,987` RGB gradations, `227` heightmap relief levels) |
| **True 3D Polygonal Scene (`10,284` Triangles)** | 3D savanna plateau, granite cliffs, 4 sculpted acacia trees, lantern-lit split-rail cedar corral, **14 smooth ellipsoid Merino sheep**, and **sculpted 3D maned lion** with expanding 3D golden roar shockwave (`1.16 ms` CPU step, `60+ FPS` HD WebGL2) |
| **Time-Travel Ring Buffer** | **240 live 3D snapshots** stored directly in `Axiom.Strata` linear memory |

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
