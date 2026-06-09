#!/usr/bin/env bash
# Lance SeNote en local pour tester (sans code PIN, sans backend)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/frontend"

if [ ! -d node_modules ]; then
  echo "→ Installation des dépendances…"
  npm install --legacy-peer-deps
fi

echo ""
echo "  SeNote — mode développement local"
echo "  ─────────────────────────────────"
echo "  URL : http://localhost:3000"
echo "  (pas de code PIN en local)"
echo ""

# REACT_APP_BETA_PIN vide = pas de porte d'accès (voir AccessGate.jsx)
# Écrase .env.local pour le dev local
REACT_APP_BETA_PIN= \
REACT_APP_USE_BACKEND=false \
REACT_APP_JOKKO_SYNC_URL=${REACT_APP_JOKKO_SYNC_URL:-http://localhost:8787} \
CI=false \
npm start
