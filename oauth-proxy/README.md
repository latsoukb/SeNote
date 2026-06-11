# Proxy OAuth Google (SeNote)

Échange le code d’autorisation contre un jeton **sans exposer le client_secret** dans l’app.

## Déploiement Render (5 min)

1. [render.com](https://render.com) → **New +** → **Web Service**
2. Connectez le dépôt **SeNote**, dossier racine : laissez vide, **Root Directory** = `oauth-proxy`
3. **Build command** : (vide)
4. **Start command** : `node server.js`
5. Variables d’environnement :

| Variable | Valeur |
|----------|--------|
| `GOOGLE_CLIENT_ID` | Votre Client ID Web (`.apps.googleusercontent.com`) |
| `GOOGLE_CLIENT_SECRET` | Secret du client Web (Google Cloud → Identifiants → votre client → icône téléchargement JSON ou « Codes secrets du client ») |
| `ALLOWED_ORIGINS` | `https://latsoukb.github.io` |

6. Créez le service. Notez l’URL (ex. `https://senote-oauth.onrender.com`).

7. Secret GitHub sur le dépôt SeNote :

```bash
gh secret set REACT_APP_GOOGLE_TOKEN_URL --body "https://VOTRE-SERVICE.onrender.com/google/token"
gh workflow run deploy-pages.yml
```

## Test

```bash
curl https://VOTRE-SERVICE.onrender.com/health
# {"ok":true,"configured":true}
```
