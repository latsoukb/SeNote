#!/usr/bin/env bash
# Redéploie SeNote sur Vercel (URL permanente en production)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PIN="${1:-1234}"

cd "$ROOT/frontend"

if [ ! -d node_modules ]; then
  echo "→ Installation des dépendances…"
  npm install --legacy-peer-deps
fi

echo "→ Build + déploiement Vercel (production)…"
echo "   Code PIN bêta : $PIN"
echo ""

REACT_APP_BETA_PIN="$PIN" npx vercel --prod

echo ""
echo "✓ Déploiement terminé."
echo "  Envoyez l'URL affichée ci-dessus + le code PIN à votre testeur."
