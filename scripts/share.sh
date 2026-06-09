#!/usr/bin/env bash
# Partage SeNote en 30 secondes — même Wi-Fi, pas de compte cloud.
# Usage : ./scripts/share.sh [code_pin]
set -e
PIN="${1:-1234}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || hostname -I 2>/dev/null | awk '{print $1}' || echo '?')"

echo ""
echo "  SeNote — partage rapide"
echo "  ───────────────────────"
echo "  URL   : http://${IP}:3000"
echo "  Code  : ${PIN}"
echo ""
echo "  Envoyez ces 2 infos à votre ami (iPad Safari)."
echo "  Stylet = écrire · Doigt = faire défiler"
echo ""

cd "$ROOT/frontend"
export REACT_APP_BETA_PIN="$PIN"
export REACT_APP_USE_BACKEND=false
export HOST=0.0.0.0
export CI=false
npm start
