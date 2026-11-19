# Contributing to Axiom Lion Herd

`axiom-lion-herd` is maintained with **100% single-owner intellectual property** under **BUSL-1.1** (free for personal, academic, and non-commercial use; Commercial Licenses available from the Project Owner).

- **Bug Reports & Gameplay Ideas (Issues)** are warmly welcome!
- **External Code Pull Requests:** Unsolicited code PRs are not merged without a signed **Contributor License Agreement (CLA)** granting full commercial relicensing rights to the Project Owner.

## Local Verification

```bash
axiom compile-wasm src/lion_herd.ax -o web/lion_herd.wasm
node scripts/verify_game.mjs
```
