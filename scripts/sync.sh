#!/usr/bin/env bash
# chat-history sync: export transcripts, commit, push. Used by the daemon and manually.
set -uo pipefail

REPO="$HOME/chat-history"
export HOME="${HOME:-/data/data/com.termux/files/home}"

cd "$REPO" || exit 1

node "$REPO/scripts/export.js" >/dev/null 2>&1 || { echo "export failed"; exit 1; }

if ! git diff --quiet HEAD 2>/dev/null; then
  git add -A
  git commit -q -m "sync: $(date -u +%Y-%m-%dT%H:%M:%SZ)" || exit 0
  git push -q origin HEAD 2>&1 | grep -v "Everything up-to-date" || true
  echo "pushed: $(date -u +%H:%M:%S)"
else
  echo "no changes"
fi
