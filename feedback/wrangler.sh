#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKER_DIR="$(realpath -e -- "$SCRIPT_DIR/../mcp-server/worker")"
WRANGLER="$WORKER_DIR/node_modules/.bin/wrangler"

[ -x "$WRANGLER" ] || {
  echo "FATAL: pinned Wrangler is not installed; run:" >&2
  echo "  npm --prefix \"$WORKER_DIR\" ci --ignore-scripts --no-audit --no-fund" >&2
  exit 1
}

cd "$SCRIPT_DIR"
exec "$WRANGLER" "$@"
