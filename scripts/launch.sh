#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  # shellcheck source=/dev/null
  . "$NVM_DIR/nvm.sh"
fi

if ! command -v pnpm >/dev/null 2>&1; then
  notify-send "Project Hub" "pnpm не найден. Установи Node/pnpm и попробуй снова." 2>/dev/null || true
  exit 1
fi

if [[ ! -f dist-electron/main.js || ! -f dist/index.html ]]; then
  pnpm build
fi

exec pnpm exec electron . --no-sandbox
