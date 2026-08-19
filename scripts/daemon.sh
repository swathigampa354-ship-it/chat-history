#!/usr/bin/env bash
# chat-history daemon: every N seconds, export transcripts and push to GitHub.
set -uo pipefail
export HOME="${HOME:-/data/data/com.termux/files/home}"
export PREFIX="${PREFIX:-/data/data/com.termux/files/usr}"
export PATH="$PREFIX/bin:$PREFIX/usr/gnu/bin:$HOME/.local/bin:/usr/bin:/bin"
export REPO="$HOME/chat-history"
INTERVAL="${CHAT_HISTORY_INTERVAL:-20}"
LOG="$HOME/.chat-sync/daemon.log"

cd "$REPO" || exit 1

echo "[$(date +%F\ %T)] daemon started (interval=${INTERVAL}s)" >>"$LOG"

while true; do
  "$REPO/scripts/sync.sh" >>"$LOG" 2>&1
  sleep "$INTERVAL"
done