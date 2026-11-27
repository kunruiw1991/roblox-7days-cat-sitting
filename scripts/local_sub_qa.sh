#!/usr/bin/env bash
# Optional local subscription CLI runner using Claude Opus 5.5 (extra) & Codex GPT Astra (medium)
set -euo pipefail

echo "=== Running Claude Code CLI (Opus 5.5 Extra) ==="
if command -v claude >/dev/null 2>&1; then
  claude --model claude-opus-5-5 --effort extra -p "$(cat .qa/claude_prompt.md)"
else
  echo "claude CLI not installed locally; use @claude on GitHub PR instead."
fi

echo "=== Running Codex CLI (GPT Astra Medium) ==="
if command -v codex >/dev/null 2>&1; then
  codex exec --model gpt-astra -c model_reasoning_effort=medium -i .qa/comparison_grid.png "$(cat .qa/gpt_prompt.md)"
else
  echo "codex CLI not installed locally; use @codex review on GitHub PR instead."
fi
