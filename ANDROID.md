# SeNote — Tablette Android dédiée (APK)

Projet : tablette éducative au Sénégal, **une seule app** pour prendre des notes au stylet.  
Pas de Play Store — installation directe de l'APK.

## Ce que fait l'app

| Fonction | Détail |
|--------|--------|
| **Stockage local** | Cahiers dans la mémoire interne de la tablette (espace privé de l'app, 64 Go disponibles) |
| **Hors ligne** | Écriture sans Internet |
| **Google Drive** | Sync auto optionnelle vers le Drive de l'utilisateur (gratuit, 15 Go/compte) |
| **Stylet** | Mode GoodNotes déjà intégré |

---

## 1. Prérequis (sur votre Mac)

1. [Android Studio](https://developer.android.com/studio) — pour le SDK Android
2. Variables d'environnement (ajoutez dans `~/.bash_profile` ou `~/.zshrc`) :

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$ANDROID_HOME/platform-tools:$PATH"
```

3. Node.js 20+

---

## 2. Google Cloud — Drive gratuit (une fois)

1. [console.cloud.google.com](https://console.cloud.google.com) → nouveau projet **SeNote**
2. **APIs & Services** → **Library** → activer **Google Drive API**
3. **OAuth consent screen** → External → remplir nom « SeNote »
4. **Credentials** → **Create credentials** → **OAuth client ID** :
   - Type : **Android**
   - Package name : `com.senote.tablet`
   - SHA-1 : obtenez-le avec :
     ```bash
     keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
     ```
   - Copiez le **Client ID** Android
5. Créez aussi un client **Web** (pour le plugin Google Auth) — copiez son Client ID

6. Dans `frontend/.env` :

```bash
REACT_APP_KIOSK_MODE=true
REACT_APP_GOOGLE_CLIENT_ID=VOTRE_CLIENT_ID_ANDROID.apps.googleusercontent.com
REACT_APP_GOOGLE_WEB_CLIENT_ID=VOTRE_CLIENT_ID_WEB.apps.googleusercontent.com
```

> **Coût : 0 €** — l'utilisateur utilise son propre Drive (15 Go gratuits).

---

## 3. Compiler l'APK

```bash
chmod +x scripts/build-apk.sh
./scripts/build-apk.sh
```

Fichier généré : **`SeNote-tablet.apk`** à la racine du projet.

---

## 4. Installer sur la tablette (sans Play Store)

### USB
1. Tablette → **Paramètres** → **Options développeur** → **Débogage USB** activé
2. Brancher en USB
3. ```bash
   adb install -r SeNote-tablet.apk
   ```

### Fichier APK
1. Copier `SeNote-tablet.apk` sur la tablette (clé USB, email, etc.)
2. Ouvrir le fichier → autoriser « sources inconnues » → installer

---

## 5. Tablette dédiée (kiosk — une seule app)

Pour une tablette qui ne sert **qu'à noter** :

### Option simple
- Installer SeNote
- Retirer les autres apps / désactiver le navigateur
- Ajouter SeNote au lanceur principal

### Option pro (mode kiosk Android)
- Utiliser un launcher kiosk (ex. **Fully Kiosk Browser** en mode app unique, ou MDM gratuit)
- Ou Android **Screen Pinning** : épingler SeNote (Paramètres → Sécurité)

### Compte Google sur la tablette
- Paramètres → Comptes → ajouter un compte Google de l'élève/enseignant
- Dans SeNote → Paramètres → **Connecter Google Drive**

---

## 6. Utilisation quotidienne

1. Ouvrir SeNote → écrire au stylet
2. Les cahiers sont **sauvegardés automatiquement** sur la tablette
3. Si Drive connecté : sync toutes les 60 s + à la mise en veille
4. Export PDF disponible dans chaque cahier (sauvegarde de secours)

---

## 7. Mise à jour de l'app

Recompiler l'APK et réinstaller :

```bash
./scripts/build-apk.sh
adb install -r SeNote-tablet.apk
```

Les cahiers locaux sont **conservés** (même espace de stockage de l'app).

---

## Dépannage

| Problème | Solution |
|----------|----------|
| Connexion Google échoue | Vérifier SHA-1 et package `com.senote.tablet` dans Google Cloud |
| `./gradlew` introuvable | Ouvrir Android Studio une fois pour installer le SDK |
| Stylet ne écrit pas | Paramètres SeNote → « Stylet uniquement pour écrire » activé |
