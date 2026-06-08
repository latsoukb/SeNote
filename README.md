# SeNote

Application de prise de notes manuscrites (style cahier numérique).

## Lancer l'application

### Backend (API + sauvegarde)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

Les données sont stockées dans `backend/data/` (fichiers JSON par espace de travail).

### Frontend

```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

Puis ouvrez **http://localhost:3000** dans votre navigateur.

Le frontend synchronise automatiquement avec l'API sur `http://localhost:8000`. En cas d'absence du backend, le mode local (localStorage) reste actif.

> Si le terminal affiche `Compiled successfully!` et `Local: http://localhost:3000`, l'app est prête — ouvrez cette adresse dans Chrome ou Safari.

## Tester sur tablette

1. Assurez-vous que la tablette est sur le **même réseau Wi‑Fi** que votre Mac.
2. Au démarrage, le terminal affiche aussi une adresse du type `http://172.x.x.x:3000`.
3. Ouvrez cette adresse dans le navigateur de la tablette.

## Fonctionnalités

- Modèles de page : Vierge, Ligné, Quadrillé, Pointillé, **Caligraphe** (trait rouge + lignes bleues)
- Écriture au stylet avec prise en charge de la pression
- **Mode GoodNotes** : stylet pour écrire, doigt pour faire défiler, paume ignorée (Paramètres)
- Zoom pour écrire précisément (comme GoodNotes), puis dézoomer pour voir le résultat final

## Déploiement privé (bêta testeurs)

Voir [DEPLOY.md](./DEPLOY.md) — Vercel + code PIN pour partager l'app avec un ami sans exposer le code.
