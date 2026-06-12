#!/usr/bin/env bash
# Génère les icônes Android depuis public/icons/icon-source.png (logo SeNote.)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/frontend/public/icons/icon-source.png"
RES="$ROOT/frontend/android/app/src/main/res"

if [ ! -f "$SRC" ]; then
  echo "Source introuvable: $SRC"
  exit 1
fi

generate() {
  local size=$1
  local dir=$2
  local name=$3
  sips -s format png -z "$size" "$size" "$SRC" --out "$RES/$dir/$name" >/dev/null
}

for spec in "48:mipmap-mdpi" "72:mipmap-hdpi" "96:mipmap-xhdpi" "144:mipmap-xxhdpi" "192:mipmap-xxxhdpi"; do
  size=${spec%%:*}
  dir=${spec##*:}
  generate "$size" "$dir" "ic_launcher.png"
  cp "$RES/$dir/ic_launcher.png" "$RES/$dir/ic_launcher_round.png"
done

for spec in "108:mipmap-mdpi" "162:mipmap-hdpi" "216:mipmap-xhdpi" "324:mipmap-xxhdpi" "432:mipmap-xxxhdpi"; do
  size=${spec%%:*}
  dir=${spec##*:}
  generate "$size" "$dir" "ic_launcher_foreground.png"
done

echo "✓ Icônes Android générées depuis icon-source.png"
