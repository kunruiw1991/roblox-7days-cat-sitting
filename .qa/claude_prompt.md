# Claude Reproducibility Audit Prompt — **Opus 5.5 (`extra`)**

**Target Auditor Model**: Anthropic **Claude Opus 5.5** (`--model claude-opus-5-5`, reasoning/effort: **`extra`**)
**Reference Video**: `https://youtu.be/VSQXM4IS8VE` — *"WE IGNORED the CAT RULES IN 7 DAYS CAT-SITTING in roblox!"* (*RABBITTURTLE Blox*)
**Visual Evidence Bundled in Repo**:
- `.qa/comparison_grid.png` (8 side-by-side beats: Original Video LEFT vs. Our 3D Build RIGHT)
- `.qa/reference/thumb_maxres.jpg` and `.qa/reference/sb0_00.jpg`–`sb0_04.jpg`
- `screenshot.jpg`

## Audit Scope (Opus 5.5 Extra Deep Review)
1. **3D Visual Fidelity vs. Original Video (1–10)**: Compare `.qa/comparison_grid.png` & `.qa/reference/*` against `js/world.js`. Inspect retro green/white checkered kitchen, mint cabinets, white fridge door, microwave, red cat bowl, laundry twin washers + litter box, living room sofa + cyan TV + red curtains + Shadow Window Stalker, nighttime front yard + green mailbox, master bedroom blue bed, and Tuxedo Top-Hat Cat + Rabbit/Turtle buddies.
2. **Streamlined Wordless UI & Safety Compliance (1–10)**: Verify instant-play on load, floating top/bottom pills, centered dimmed-backdrop destructive reset modal (`Cancel` default), phone chores & litter box scoop modal, and zero horizontal overflow across viewports.
3. **3D Memory Safety & Gameplay State Integrity (1–10)**: Verify GPU disposal (`world.dispose()`), all 7 Nights progression, all 6 iconic fail endings (`Cold as Ice`, `Blackhole`, `Evicted`, `Uh oh Stinky`, `Ancy`, `Fired`), and touch/WASD controls.
4. **Actionable Findings**: Classify concrete issues as **P0 / P1 / P2** with exact `file:line` references.
