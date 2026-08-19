#!/usr/bin/env bash
# chat-history daemon: every N seconds, export transcripts and push to GitHub.
set -uo pipefail
export HOME="${HOME:-/data/data/com.termux/files/home}"
export PATH="$HOME/.local/bin:$PREFIX/usr/bin:/usr/bin:/bin"
REPO="$HOME/chat-history"
INTERVAL="${CHAT_HISTORY_INTERVAL:-20}"
LOG="$HOME/.chat-sync/daemon.log"

cd "$REPO" || exit 1

echo "[$(date +%F\ %T)] daemon started (interval=${INTERVAL}s)" >>"$LOG"

while true; do
  # only sync when opencode is not mid-write is handled by readOnly DB; just run export
  if bash "$REPO/scripts/sync.sh" >>"$LOG" 2>&1; then
    : # already logged by sync.sh
  fi
  sleep "$INTERVAL"
done