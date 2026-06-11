#!/usr/bin/env bash
# Build APK Android SeNote (sans Play Store — installation directe sur tablette)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND="$ROOT/frontend"

if ! command -v java &>/dev/null; then
  echo "Java JDK 17 requis. Installez Android Studio ou: brew install --cask android-studio"
  exit 1
fi

# Capacitor Android nécessite JDK 21 (fourni avec Android Studio récent)
if [ -d "/Applications/Android Studio.app/Contents/jbr/Contents/Home" ]; then
  export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
fi

if [ -z "${ANDROID_HOME:-}" ] && [ -d "$HOME/Library/Android/sdk" ]; then
  export ANDROID_HOME="$HOME/Library/Android/sdk"
fi

if [ -z "${ANDROID_HOME:-}" ]; then
  echo "Définissez ANDROID_HOME (SDK Android)."
  exit 1
fi

export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/tools:$PATH"

cd "$FRONTEND"

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

if [ -n "${REACT_APP_GOOGLE_WEB_CLIENT_ID:-}" ]; then
  node -e "
    const fs=require('fs');
    const p='capacitor.config.json';
    const c=JSON.parse(fs.readFileSync(p,'utf8'));
    c.plugins.GoogleAuth.serverClientId=process.env.REACT_APP_GOOGLE_WEB_CLIENT_ID;
    fs.writeFileSync(p, JSON.stringify(c,null,2));
  "
fi

if [ ! -d node_modules/@capacitor/android ]; then
  echo "Installation des dépendances Capacitor…"
  npm install --legacy-peer-deps
fi

echo "Build web…"
REACT_APP_KIOSK_MODE=true CI=false npm run build

node -e "
const fs=require('fs');
const path='build/app-config.json';
if (!fs.existsSync(path)) process.exit(0);
const cfg=JSON.parse(fs.readFileSync(path,'utf8'));
const web=(process.env.REACT_APP_GOOGLE_WEB_CLIENT_ID||'').trim();
const native=(process.env.REACT_APP_GOOGLE_CLIENT_ID||'').trim();
const tokenUrl=(process.env.REACT_APP_GOOGLE_TOKEN_URL||'').trim();
if (web) cfg.googleWebClientId=web;
if (native) cfg.googleNativeClientId=native;
if (tokenUrl) cfg.googleTokenExchangeUrl=tokenUrl;
fs.writeFileSync(path, JSON.stringify(cfg,null,2)+'\n');
"

if [ ! -d android ]; then
  echo "Initialisation Android…"
  npx cap add android
fi

echo "Sync Capacitor…"
"$ROOT/scripts/generate-android-icons.sh"
npx cap sync android

echo "Compilation APK…"
cd android
./gradlew assembleDebug

APK="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK" ]; then
  cp "$APK" "$ROOT/SeNote-tablet.apk"
  echo ""
  echo "✓ APK prête : $ROOT/SeNote-tablet.apk"
  echo ""
  echo "Installer sur tablette (USB + débogage activé) :"
  echo "  adb install -r $ROOT/SeNote-tablet.apk"
else
  echo "APK introuvable"
  exit 1
fi
