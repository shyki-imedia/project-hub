#!/usr/bin/env bash
# Renders resources/icon.svg → resources/icon.png (1024×1024) for Electron and .app icns.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SVG="$ROOT/resources/icon.svg"
PNG="$ROOT/resources/icon.png"

if [[ ! -f "$SVG" ]]; then
  echo "Нет файла $SVG" >&2
  exit 1
fi

if [[ "$(uname -s)" == "Darwin" ]] && command -v qlmanage >/dev/null 2>&1; then
  TMP="$(mktemp -d)"
  qlmanage -t -s 1024 -o "$TMP" "$SVG" >/dev/null 2>&1
  RENDERED="$TMP/$(basename "$SVG").png"
  if [[ ! -f "$RENDERED" ]]; then
    echo "qlmanage не смог отрендерить SVG." >&2
    exit 1
  fi
  mv "$RENDERED" "$PNG"
  rm -rf "$TMP"
  echo "Создан $PNG"
  exit 0
fi

if command -v rsvg-convert >/dev/null 2>&1; then
  rsvg-convert -w 1024 -h 1024 "$SVG" -o "$PNG"
  echo "Создан $PNG"
  exit 0
fi

if command -v magick >/dev/null 2>&1; then
  magick -background none "$SVG" -resize 1024x1024 "$PNG"
  echo "Создан $PNG"
  exit 0
fi

echo "Установи qlmanage (macOS), librsvg (rsvg-convert) или ImageMagick." >&2
exit 1
