#!/usr/bin/env bash
# Convertit des PDF A4 en PNG haute résolution pour les modèles de page SeNote.
# Usage : ./scripts/rasterize-templates.sh chemin/vers/fichier.pdf nom-sortie
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/frontend/public/templates"
TMP="${TMPDIR:-/tmp}/senote-templates"
mkdir -p "$DEST" "$TMP"

if [ $# -lt 2 ]; then
  echo "Usage: $0 <fichier.pdf> <nom>   # ex. Papier_quadrille-12.pdf grid"
  exit 1
fi

SRC="$1"
NAME="$2"
qlmanage -t -s 4678 -o "$TMP" "$SRC" >/dev/null 2>&1
PNG="$TMP/$(basename "$SRC").png"
sips -z 4678 3306 "$PNG" --out "$DEST/$NAME.png" >/dev/null
sips -z 400 283 "$DEST/$NAME.png" --out "$DEST/$NAME-thumb.png" >/dev/null
echo "→ $DEST/$NAME.png"
