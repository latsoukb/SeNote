#!/usr/bin/env bash
# Provisionne une tablette SeNote en Device Owner (verrouillage définitif).
#
# PRÉREQUIS (obligatoire) :
#   1. Tablette réinitialisée usine (factory reset)
#   2. Configuration initiale SANS compte Google (Passer / Configurer hors ligne)
#   3. SeNote APK installé
#   4. USB debugging activé
#
# Usage :
#   ./scripts/provision-tablet.sh
#   ./scripts/provision-tablet.sh emulator-5554
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PKG="com.senote.tablet"
ADMIN="${PKG}/.SeNoteDeviceAdminReceiver"
SERIAL="${1:-}"

if [ -z "${ANDROID_HOME:-}" ] && [ -d "$HOME/Library/Android/sdk" ]; then
  export ANDROID_HOME="$HOME/Library/Android/sdk"
fi
export PATH="${ANDROID_HOME:+$ANDROID_HOME/platform-tools:}$PATH"

if ! command -v adb >/dev/null 2>&1; then
  echo "❌ adb introuvable. Installez Android Platform-Tools."
  exit 1
fi

ADB=(adb)
if [ -n "$SERIAL" ]; then
  ADB=(adb -s "$SERIAL")
fi

DEVICES="$("${ADB[@]}" devices | awk 'NR>1 && /device$/{print $1}')"
if [ -z "$DEVICES" ]; then
  echo "❌ Aucun appareil connecté."
  exit 1
fi

echo "→ Appareil : ${SERIAL:-$(echo "$DEVICES" | head -1)}"
echo "→ Vérification package SeNote…"
if ! "${ADB[@]}" shell pm list packages | grep -q "$PKG"; then
  echo "❌ SeNote non installé. Installez d'abord l'APK :"
  echo "   ./scripts/run-emulator.sh   (émulateur)"
  echo "   adb install -r SeNote-tablet.apk   (tablette USB)"
  exit 1
fi

echo "→ Activation Device Owner…"
set +e
OUT="$("${ADB[@]}" shell dpm set-device-owner "$ADMIN" 2>&1)"
CODE=$?
set -e

if [ "$CODE" -ne 0 ]; then
  echo ""
  echo "❌ Échec Device Owner :"
  echo "$OUT"
  echo ""
  echo "Causes fréquentes :"
  echo "  · Compte Google déjà ajouté → réinitialiser usine et ne pas se connecter"
  echo "  · Autre admin actif → réinitialiser usine"
  echo "  · Émulateur avec compte → créer un AVD sans compte Google"
  echo ""
  echo "Alternative test (émulateur sans compte) :"
  echo "  Android Studio → Device Manager → New Device → API 34+ → pas de Play Store"
  exit 1
fi

echo "✅ Device Owner activé pour SeNote"
echo "→ Lancement SeNote…"
"${ADB[@]}" shell am start -n "${PKG}/.MainActivity" >/dev/null 2>&1 || true

echo ""
echo "  Prochaines étapes sur la tablette :"
echo "  1. Appuyer 7× sur le logo « SeNote. » → Administration tablette"
echo "  2. Créer le code admin (6 chiffres minimum)"
echo "  3. Connexion Wi‑Fi (code admin requis)"
echo "  4. Verrouillage écran PIN (anti-vol, code admin requis)"
echo ""
echo "  Verrouillage actif :"
echo "    · Installation d'apps bloquée (TikTok, Play Store masqué)"
echo "    · Sortie SeNote impossible sans code admin"
echo "    · Redémarrage → SeNote se relance automatiquement"
echo ""
