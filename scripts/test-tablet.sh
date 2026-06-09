#!/usr/bin/env bash
# Tester SeNote en mode tablette (navigateur ou APK)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MODE="${1:-web}"

case "$MODE" in
  web)
    echo "═══ Test navigateur (mode tablette, stockage local) ═══"
    echo "Ouvre http://localhost:3000 sur ton Mac ou tablette (même Wi-Fi)"
    echo ""
    cd "$ROOT"
    exec ./scripts/dev.sh
    ;;
  apk)
    echo "═══ Build + installation APK ═══"
    "$ROOT/scripts/build-apk.sh"
    if command -v adb &>/dev/null; then
      DEVICES=$(adb devices | grep -w device | wc -l | tr -d ' ')
      if [ "$DEVICES" -gt 0 ]; then
        echo "Installation sur tablette connectée…"
        adb install -r "$ROOT/SeNote-tablet.apk"
        echo "✓ SeNote installé — ouvre l'app sur la tablette"
      else
        echo ""
        echo "Aucune tablette USB détectée."
        echo "Copiez $ROOT/SeNote-tablet.apk sur la tablette et installez-le manuellement."
      fi
    else
      echo ""
      echo "APK prête : $ROOT/SeNote-tablet.apk"
      echo "Copiez ce fichier sur la tablette et installez-le."
    fi
    ;;
  *)
    echo "Usage: ./scripts/test-tablet.sh [web|apk]"
    echo "  web  — test immédiat dans le navigateur (défaut)"
    echo "  apk  — compile et installe l'APK Android"
    exit 1
    ;;
esac
