#!/bin/bash
# SessionStart hook for Claude Code on the web.
#
# This repo has zero third-party dependencies — tools/*.js use Node 18+
# built-ins only (fetch, fs, path). The hook's job is to verify Node is
# available so the lint scripts (node tools/lint_questions.js,
# node tools/check_transform_keywords.js) and the syntax-check loop
# (node --check) work as soon as the session starts.
#
# Idempotent. Non-interactive. Web-only.

set -euo pipefail

# Skip on local laptop sessions — Node is already set up there.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(pwd)}"

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: node not found in PATH" >&2
  echo "       tools/*.js scripts and CI lint commands require Node 18+." >&2
  exit 1
fi

NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "ERROR: Node $NODE_MAJOR is too old; tools/_firestore.js needs Node 18+ (built-in fetch)." >&2
  exit 1
fi

echo "Node $(node --version) ready. No npm install needed (zero third-party deps)."
