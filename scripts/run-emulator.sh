#!/usr/bin/env bash
# Build SeNote mode kiosk (APK debug) et installe sur l'émulateur Android Studio.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND="$ROOT/frontend"
ANDROID="$FRONTEND/android"

# SDK Android (Android Studio par défaut sur Mac)
if [ -z "${ANDROID_HOME:-}" ] && [ -d "$HOME/Library/Android/sdk" ]; then
  export ANDROID_HOME="$HOME/Library/Android/sdk"
fi
export PATH="${ANDROID_HOME:+$ANDROID_HOME/platform-tools:}${ANDROID_HOME:+$ANDROID_HOME/emulator:}$PATH"

if ! command -v adb >/dev/null 2>&1; then
  echo "❌ adb introuvable. Ouvrez Android Studio → SDK Manager → Platform-Tools."
  exit 1
fi

DEVICES="$(adb devices | awk 'NR>1 && /device$/{print $1}')"
if [ -z "$DEVICES" ]; then
  echo "❌ Aucun émulateur / appareil connecté."
  echo "   Android Studio → Device Manager → lancer un émulateur, puis relancez ce script."
  exit 1
fi

echo "→ Appareil(s) : $(echo "$DEVICES" | tr '\n' ' ')"

cd "$FRONTEND"
if [ ! -d node_modules ]; then
  echo "→ npm install…"
  npm install --legacy-peer-deps
fi

# Charge .env local si présent (Google Drive, Jokko sync…)
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
elif [ -f .env.local ]; then
  set -a
  # shellcheck disable=SC1091
  source .env.local
  set +a
fi

echo "→ Build web (mode kiosk tablette)…"
REACT_APP_KIOSK_MODE=true \
REACT_APP_USE_BACKEND=false \
REACT_APP_BETA_PIN= \
PUBLIC_URL= \
CI=false \
npm run build

echo "→ Capacitor sync…"
npx cap sync android

PROPS="$ANDROID/local.properties"
if [ ! -f "$PROPS" ] && [ -n "${ANDROID_HOME:-}" ]; then
  echo "sdk.dir=$ANDROID_HOME" > "$PROPS"
  echo "→ local.properties créé"
fi

echo "→ Gradle installDebug…"
cd "$ANDROID"
chmod +x gradlew

PKG=com.senote.tablet
if adb shell pm list packages | grep -q "$PKG"; then
  echo "→ Désinstallation de l'ancienne version (signature différente possible)…"
  adb uninstall "$PKG" >/dev/null 2>&1 || true
fi

./gradlew installDebug

echo "→ Lancement SeNote sur l'émulateur…"
adb shell am start -n "$PKG/.MainActivity" >/dev/null 2>&1 || adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 >/dev/null

echo ""
echo "  ✅ SeNote kiosk installé sur l'émulateur"
echo "  ───────────────────────────────────────"
echo "  Mode kiosk = APK natif + verrou Android :"
echo "    · pas de code PIN bêta"
echo "    · bibliothèque vide au premier lancement"
echo "    · sidebar pages fermée dans un cahier"
echo "    · stockage natif (Preferences)"
echo "    · verrou Lock Task (impossible de quitter SeNote)"
echo "    · barres système adaptées au thème clair/sombre"
echo ""
echo "  Pour réinstaller après des changements : ./scripts/run-emulator.sh"
echo ""
