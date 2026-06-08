# Déploiement privé SeNote (bêta testeurs)

Guide pour partager SeNote avec un ami (tablette + stylet) sans rendre le code public.

## 1. Rendre le dépôt GitHub privé

[github.com/latsoukb/SeNote/settings](https://github.com/latsoukb/SeNote/settings) → **Danger Zone** → **Change visibility** → **Private**.

## 2. Déployer l'application (accès par code PIN)

### Frontend — Vercel (gratuit)

1. [vercel.com](https://vercel.com) → Import `latsoukb/SeNote`
2. **Root Directory** : `frontend`
3. **Build Command** : `npm run build`
4. **Output** : `build`
5. Variables d'environnement :

| Variable | Exemple | Rôle |
|----------|---------|------|
| `REACT_APP_BETA_PIN` | `482916` | Code à donner à votre ami |
| `REACT_APP_API_URL` | `https://senote-api.onrender.com` | URL du backend |

6. Deploy → URL du type `https://senote-xxx.vercel.app`

### Backend — Render (gratuit)

1. [render.com](https://render.com) → New **Web Service**
2. Repo `SeNote`, root `backend`
3. **Start command** : `uvicorn server:app --host 0.0.0.0 --port $PORT`
4. Variable `CORS_ORIGINS` = URL Vercel (ex. `https://senote-xxx.vercel.app`)

## 3. Partager avec votre ami

Envoyez-lui en message privé :

1. L'URL de l'app (ex. `https://senote-xxx.vercel.app`)
2. Le code PIN (`REACT_APP_BETA_PIN`)
3. Instructions iPad :
   - Ouvrir dans **Safari**
   - Partager → **Sur l'écran d'accueil** (app plein écran)
   - Utiliser le **stylet** pour écrire, le **doigt** pour faire défiler la page

## 4. Mode stylet (GoodNotes)

Dans **Paramètres** → **Stylet uniquement pour écrire** (activé par défaut) :

- **Stylet** → écrit, gomme, surligneur
- **Doigt** → défile la page (ou déplace quand zoomé)
- **Paume** → ignorée (zone de contact large)

## 5. Test local sur le réseau (sans déployer)

```bash
# Terminal 1 — backend
cd backend && source .venv/bin/activate && uvicorn server:app --host 0.0.0.0 --port 8000

# Terminal 2 — frontend accessible sur le réseau local
cd frontend && REACT_APP_BETA_PIN=1234 npm start
# Sur la tablette : http://IP_DU_MAC:3000
```
