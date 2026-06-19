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
REACT_APP_IT_ADMIN_PIN="${REACT_APP_IT_ADMIN_PIN:-482916}" \
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
ADMIN="${PKG}/.SeNoteDeviceAdminReceiver"
if adb shell pm list packages | grep -q "$PKG"; then
  echo "→ Retrait Device Owner / désinstallation si nécessaire…"
  adb shell dpm remove-active-admin "$ADMIN" >/dev/null 2>&1 || true
  adb uninstall "$PKG" >/dev/null 2>&1 || true
fi

./gradlew installDebug

SERIAL="$(adb devices | awk 'NR>1 && /device$/{print $1; exit}')"
echo "→ Activation verrou définitif (Device Owner)…"
if "$ROOT/scripts/provision-tablet.sh" "${SERIAL}"; then
  echo "→ Device Owner activé."
else
  echo "⚠️  Device Owner non activé — configurez l'émulateur SANS compte Google, puis :"
  echo "    ./scripts/provision-tablet.sh ${SERIAL}"
fi

echo "→ Lancement SeNote…"
adb shell am start -n "$PKG/.MainActivity" >/dev/null 2>&1 || adb shell monkey -p "$PKG" -c android.intent.category.LAUNCHER 1 >/dev/null

echo ""
echo "  ✅ SeNote installé + verrou activé"
echo "  ───────────────────────────────────────"
echo "  Élèves : Paramètres → Wi‑Fi, verrouillage écran, mises à jour"
echo "  IT (toi) : 7× logo SeNote → mot de passe → activer/désactiver le verrou"
echo "  Mot de passe IT par défaut : 482916"
echo ""
