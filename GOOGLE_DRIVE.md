# Google Drive — tester sur Mac

Sync optionnelle vers votre Drive personnel (gratuit, 15 Go). Les cahiers restent toujours sauvegardés en local ; Drive = copie de secours dans le cloud.

---

## 1. Google Cloud (10 min, une seule fois)

1. Ouvrez [console.cloud.google.com](https://console.cloud.google.com)
2. Créez un projet **SeNote** (ou réutilisez un projet existant)
3. **APIs & Services → Library** → cherchez **Google Drive API** → **Activer**
4. **APIs & Services → OAuth consent screen**
   - Type : **External** (ou Internal si compte Google Workspace)
   - Nom de l'app : `SeNote`
   - Email de support : le vôtre
   - Scopes : ajoutez `.../auth/drive.file` (accès aux fichiers créés par l'app)
   - Utilisateurs test : ajoutez **votre adresse Gmail** (obligatoire tant que l'app n'est pas publiée)
5. **APIs & Services → Credentials → Create credentials → OAuth client ID**
   - Type : **Application Web**
   - Nom : `SeNote Web (dev Mac)`
   - **Origines JavaScript autorisées** :
     ```
     http://localhost:3000
     ```
   - **Obligatoire pour le site en ligne** :
     ```
     https://latsoukb.github.io
     ```
   - **URI de redirection autorisées** (obligatoire) :
     ```
     https://latsoukb.github.io/SeNote/
     http://localhost:3000/
     ```
6. Copiez le **Client ID** (se termine par `.apps.googleusercontent.com`)

Le flux utilise **OAuth code + PKCE** (pas de popup `gsi/transform`). L’URI de redirection doit correspondre **exactement** à celle utilisée par l’app.

Le **client_secret** ne doit jamais être dans l’app : déployez le mini-serveur `oauth-proxy/` sur Render (voir [oauth-proxy/README.md](./oauth-proxy/README.md)), puis ajoutez le secret GitHub `REACT_APP_GOOGLE_TOKEN_URL` (URL du proxy + `/google/token`).

---

## 2. Activer Google Drive sur le site / l'APK

Éditez `frontend/public/app-config.json` :

```json
{
  "googleWebClientId": "VOTRE_CLIENT_ID_WEB.apps.googleusercontent.com",
  "googleNativeClientId": "VOTRE_CLIENT_ID_ANDROID.apps.googleusercontent.com"
}
```

Puis `git push` sur `main`. Le Client ID OAuth est **public** (pas un mot de passe).

**Ou** ajoutez le secret GitHub `REACT_APP_GOOGLE_WEB_CLIENT_ID` (Settings → Secrets → Actions) : il sera injecté au déploiement sans modifier le dépôt.

```bash
gh secret set REACT_APP_GOOGLE_WEB_CLIENT_ID --body "VOTRE_CLIENT_ID_WEB.apps.googleusercontent.com"
```

---

## 3. Configurer SeNote (local)

Éditez `frontend/.env` :

```bash
REACT_APP_GOOGLE_WEB_CLIENT_ID=VOTRE_CLIENT_ID_WEB.apps.googleusercontent.com
```

Redémarrez le serveur de dev :

```bash
cd frontend
npm start
```

---

## 4. Connecter votre compte

1. Ouvrez http://localhost:3000
2. **Paramètres** (icône engrenage)
3. Section **Google Drive** → **Connecter Google Drive**
4. Choisissez votre compte Google → autoriser l'accès
5. Un dossier **SeNote** apparaît dans votre Drive avec `senote-workspace.json`

---

## 5. Vérifier que ça marche

- Créez un cahier, écrivez quelques traits
- Cliquez **Sync maintenant** dans les paramètres
- Sur [drive.google.com](https://drive.google.com) → dossier **SeNote** → fichier `senote-workspace.json`
- Ouvrez SeNote dans un autre navigateur (ou videz le localStorage) → reconnectez Drive → vos cahiers reviennent

---

## APK Android (tablette)

Pour la tablette, il faut en plus un client OAuth **Android** (`REACT_APP_GOOGLE_CLIENT_ID`). Voir [ANDROID.md](./ANDROID.md) section Google Cloud.

| Variable | Usage |
|----------|--------|
| `REACT_APP_GOOGLE_WEB_CLIENT_ID` | Mac / navigateur |
| `REACT_APP_GOOGLE_CLIENT_ID` | APK Android |

---

## Dépannage

| Erreur | Solution |
|--------|----------|
| `redirect_uri_mismatch` | Vérifiez `http://localhost:3000` dans les origines JavaScript |
| `access_denied` | Ajoutez votre Gmail dans « Utilisateurs test » de l'écran de consentement |
| Connexion indisponible | Renseigner `googleWebClientId` dans `frontend/public/app-config.json` puis redéployer |
| Popup bloquée | Autoriser les popups pour le site |
| Accès refusé | Ajouter le compte Google dans « Utilisateurs test » (Google Cloud) |
| Popup ne s’ouvre pas | Fermez les paramètres et réessayez ; autorisez les popups pour le site |
| `origin_mismatch` | Ajoutez `https://latsoukb.github.io` dans les origines JavaScript OAuth |
| `Non connecté à Google Drive` | Reconnectez via Paramètres (token expiré) |
