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
   - (Optionnel, pour le site GitHub Pages) :
     ```
     https://latsoukb.github.io
     ```
6. Copiez le **Client ID** (se termine par `.apps.googleusercontent.com`)

> Pas besoin de « URI de redirection » pour ce flux (token côté navigateur).

---

## 2. Configurer SeNote

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

## 3. Connecter votre compte

1. Ouvrez http://localhost:3000
2. **Paramètres** (icône engrenage)
3. Section **Google Drive** → **Connecter Google Drive**
4. Choisissez votre compte Google → autoriser l'accès
5. Un dossier **SeNote** apparaît dans votre Drive avec `senote-workspace.json`

---

## 4. Vérifier que ça marche

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
| Bouton grisé | `REACT_APP_GOOGLE_WEB_CLIENT_ID` vide → remplir `.env` et relancer `npm start` |
| `Non connecté à Google Drive` | Reconnectez via Paramètres (token expiré) |
