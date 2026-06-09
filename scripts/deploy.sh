#!/usr/bin/env bash
# Redéploie SeNote sur Vercel (build local → upload rapide)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PIN="${1:-1234}"

cd "$ROOT/frontend"

if [ ! -d node_modules ]; then
  echo "→ Installation des dépendances…"
  npm install --legacy-peer-deps
fi

echo "→ Build local (1-2 min)…"
REACT_APP_BETA_PIN="$PIN" \
PUBLIC_URL="" \
REACT_APP_USE_BACKEND=false \
CI=false \
npm run build

cp vercel.json build/vercel.json

cd "$ROOT"
echo "→ Upload Vercel (quelques secondes)…"
echo "   Code PIN bêta : $PIN"
echo ""

npx vercel deploy frontend/build --prod --yes

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Envoyez à votre ami :"
echo "  • URL : celle affichée ci-dessus (ou https://se-note.vercel.app)"
echo "  • Code : $PIN"
echo "  iPad : Safari → URL → code → Sur l'écran d'accueil"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
