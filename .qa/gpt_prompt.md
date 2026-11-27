# Codex / OpenAI Reproducibility Audit Prompt — **GPT Astra (`medium`)**

**Target Auditor Model**: OpenAI **GPT Astra** (`--model gpt-astra`, reasoning effort: **`medium`**)
**Reference Video**: `https://youtu.be/VSQXM4IS8VE` — *"WE IGNORED the CAT RULES IN 7 DAYS CAT-SITTING in roblox!"* (*RABBITTURTLE Blox*)
**Visual Evidence Bundled in Repo**:
- `.qa/comparison_grid.png` (8 side-by-side beats: Original Video LEFT vs. Our 3D Build RIGHT)
- `.qa/reference/thumb_maxres.jpg` and `.qa/reference/sb0_00.jpg`–`sb0_04.jpg`
- `screenshot.jpg`

## Audit Scope (GPT Astra Medium Review)
1. **7-Night & Rule-Break Reproducibility (1–10)**: Audit `js/data.js` and `js/state.js` for all 7 nights, litter box scoop game, smartphone rules/camera snap, and all 6 iconic fail endings (`Cold as Ice`, `Blackhole`, `Evicted`, `Uh oh Stinky`, `Ancy`, `Fired`) plus Night 7 victory.
2. **Three.js 3D Architecture & Resource Cleanup (1–10)**: Audit `js/world.js` for GPU resource disposal (`geometries`, `materials`, `textures`, `renderer`), raycasting hitboxes, camera transitions, and shadow stalker visibility rules.
3. **Responsive UI & E2E Robustness (1–10)**: Audit `index.html`, `css/style.css`, `js/main.js`, and `tests/e2e_verify.py` for touch/desktop pointer bugs, modal escape handling, and accessibility.
4. **Actionable Findings**: Report concrete **P0 / P1 / P2** issues with exact file & line numbers.
