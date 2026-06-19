#!/usr/bin/env bash
# Installe SeNote (APK release ou debug) et active le verrou définitif.
#
# Usage :
#   ./scripts/setup-tablet.sh                          # APK release GitHub (télécharge)
#   ./scripts/setup-tablet.sh SeNote-tablet.apk        # APK local
#   ./scripts/setup-tablet.sh emulator-5554 file.apk   # appareil + APK
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PKG="com.senote.tablet"
SERIAL=""
APK=""

if [ "${1:-}" = "emulator-5554" ] || [[ "${1:-}" =~ ^emulator-[0-9]+$ ]]; then
  SERIAL="$1"
  APK="${2:-}"
elif [[ "${1:-}" =~ ^emulator-[0-9]+$ ]]; then
  SERIAL="$1"
  APK="${2:-}"
elif [ -n "${1:-}" ] && [ -f "$1" ]; then
  APK="$1"
elif [ -n "${1:-}" ] && [ -f "$ROOT/$1" ]; then
  APK="$ROOT/$1"
fi

if [ -z "${ANDROID_HOME:-}" ] && [ -d "$HOME/Library/Android/sdk" ]; then
  export ANDROID_HOME="$HOME/Library/Android/sdk"
fi
export PATH="${ANDROID_HOME:+$ANDROID_HOME/platform-tools:}$PATH"

ADB=(adb)
if [ -n "$SERIAL" ]; then
  ADB=(adb -s "$SERIAL")
fi

if ! command -v adb >/dev/null 2>&1; then
  echo "❌ adb introuvable."
  exit 1
fi

if [ -z "$("${ADB[@]}" devices | awk 'NR>1 && /device$/{print $1}')" ]; then
  echo "❌ Aucun appareil connecté. Lancez l'émulateur d'abord."
  exit 1
fi

if [ -z "$APK" ]; then
  APK="/tmp/SeNote-tablet-setup.apk"
  echo "→ Téléchargement dernière release GitHub…"
  curl -fsSL -o "$APK" \
    "https://github.com/latsoukb/SeNote/releases/latest/download/SeNote-tablet.apk"
fi

if [ ! -f "$APK" ]; then
  echo "❌ APK introuvable : $APK"
  exit 1
fi

ADMIN="${PKG}/.SeNoteDeviceAdminReceiver"
echo "→ Préparation (sans compte Google sur la tablette)…"
"${ADB[@]}" shell dpm remove-active-admin "$ADMIN" >/dev/null 2>&1 || true
"${ADB[@]}" uninstall "$PKG" >/dev/null 2>&1 || true

echo "→ Installation $APK…"
"${ADB[@]}" install -r "$APK"

echo "→ Verrou définitif…"
"$ROOT/scripts/provision-tablet.sh" ${SERIAL:+"$SERIAL"}

echo "→ Lancement SeNote…"
"${ADB[@]}" shell am start -n "${PKG}/.MainActivity" >/dev/null 2>&1 || true

echo ""
echo "  ✅ Tablette prête — verrou actif par défaut"
echo "  IT : 7× logo SeNote → mot de passe 482916 → activer/désactiver"
echo "  Élèves : Paramètres → Wi‑Fi, verrouillage écran, mises à jour"
echo ""
