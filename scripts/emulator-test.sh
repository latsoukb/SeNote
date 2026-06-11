#!/usr/bin/env bash
# Build APK + lancer sur émulateur Android (Android Studio requis)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [ -z "${ANDROID_HOME:-}" ] && [ -d "$HOME/Library/Android/sdk" ]; then
  export ANDROID_HOME="$HOME/Library/Android/sdk"
fi

if [ -z "${ANDROID_HOME:-}" ]; then
  echo "ANDROID_HOME introuvable."
  echo "Installez Android Studio : https://developer.android.com/studio"
  echo "Puis ajoutez dans ~/.zshrc :"
  echo '  export ANDROID_HOME="$HOME/Library/Android/sdk"'
  echo '  export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"'
  exit 1
fi

export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"

AVD_NAME="${1:-}"

echo "═══ 1/4 Build APK ═══"
"$ROOT/scripts/build-apk.sh"

echo ""
echo "═══ 2/4 Émulateur ═══"
RUNNING=$(adb devices | grep -E 'emulator-[0-9]+' | wc -l | tr -d ' ')

if [ "$RUNNING" = "0" ]; then
  if [ -z "$AVD_NAME" ]; then
    echo "AVD disponibles :"
    emulator -list-avds || true
    echo ""
    echo "Créez un émulateur tablette dans Android Studio :"
    echo "  Tools → Device Manager → Create device → Tablet (ex. Pixel Tablet) → API 35"
    echo ""
    echo "Puis relancez : ./scripts/emulator-test.sh NOM_AVD"
    exit 1
  fi
  echo "Démarrage de l'émulateur « $AVD_NAME »…"
  emulator -avd "$AVD_NAME" -no-snapshot-load &
  echo "Attente du boot (peut prendre 1–2 min)…"
  adb wait-for-device
  while [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" != "1" ]; do
    sleep 2
  done
else
  echo "Émulateur déjà actif."
fi

echo ""
echo "═══ 3/4 Installation ═══"
adb install -r "$ROOT/SeNote-tablet.apk"

echo ""
echo "═══ 4/4 Lancement ═══"
adb shell am start -n com.senote.tablet/.MainActivity
echo ""
echo "✓ SeNote ouvert sur l'émulateur"
