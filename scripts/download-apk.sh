#!/usr/bin/env bash
# Télécharge la dernière APK compilée par GitHub Actions (sans Android Studio)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/SeNote-tablet.apk"

if ! command -v gh &>/dev/null; then
  echo "Installez GitHub CLI : brew install gh && gh auth login"
  exit 1
fi

RUN_ID=$(gh run list --workflow=build-apk.yml --status=success --limit=1 --json databaseId --jq '.[0].databaseId')
if [ -z "$RUN_ID" ] || [ "$RUN_ID" = "null" ]; then
  echo "Aucun build APK réussi trouvé. Lancez : gh workflow run build-apk.yml"
  exit 1
fi

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

echo "Téléchargement du build $RUN_ID…"
gh run download "$RUN_ID" -n SeNote-tablet-apk -D "$TMP"
cp "$TMP/app-debug.apk" "$OUT"
echo ""
echo "✓ APK prête : $OUT"
echo ""
echo "Installez sur une tablette Android :"
echo "  • Copiez le fichier (Drive, USB, email…)"
echo "  • Ouvrez-le sur la tablette → Autoriser sources inconnues → Installer"
