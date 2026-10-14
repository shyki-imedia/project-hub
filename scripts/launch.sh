#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ "$(uname -s)" == "Darwin" ]]; then
  export PATH="/opt/homebrew/bin:/usr/local/bin:${HOME}/.local/share/pnpm:${PATH:-}"
fi

export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [[ -s "$NVM_DIR/nvm.sh" ]]; then
  # shellcheck source=/dev/null
  . "$NVM_DIR/nvm.sh"
fi

notify_missing_pnpm() {
  if [[ "$(uname -s)" == "Darwin" ]]; then
    osascript -e 'display alert "Project Hub" message "pnpm не найден. Установи Node/pnpm и попробуй снова."' 2>/dev/null || true
  else
    notify-send "Project Hub" "pnpm не найден. Установи Node/pnpm и попробуй снова." 2>/dev/null || true
  fi
}

if ! command -v pnpm >/dev/null 2>&1; then
  notify_missing_pnpm
  exit 1
fi

if [[ ! -f dist-electron/main.js || ! -f dist/index.html ]]; then
  pnpm build
fi

if [[ "$(uname -s)" == "Darwin" ]]; then
  exec pnpm exec electron .
else
  exec pnpm exec electron . --no-sandbox
fi
