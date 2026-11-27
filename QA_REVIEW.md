# Reproducibility & Quality Audit — 7 Days Cat-Sitting 3D (Roblox Remake)

- **Reference Video**: https://youtu.be/VSQXM4IS8VE (*WE IGNORED the CAT RULES IN 7 DAYS CAT-SITTING in roblox!*, RABBITTURTLE Blox)
- **Live Playable Build**: https://kunruiw1991.github.io/roblox-7days-cat-sitting/
- **Visual Side-by-Side Comparison Grid**: `.qa/comparison_grid.png`
- **Original Storyboards**: `.qa/reference/thumb_maxres.jpg`, `.qa/reference/sb0_00.jpg`–`sb0_04.jpg`
- **Verification**:
  - `node --test --experimental-test-coverage tests/unit.test.js`: 4/4 passed (99.50% line coverage, 100% functions)
  - `python3 tests/e2e_verify.py`: 0 console/page errors, 0 overflow across Desktop/iPad/Mobile

## Mandated External Auditors
1. **Claude Opus 5.5 (`extra`)** — `@claude` (`.qa/claude_prompt.md`)
2. **OpenAI GPT Astra (`medium`)** — `@codex review` (`.qa/gpt_prompt.md`)
