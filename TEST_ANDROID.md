# Tester SeNote en APK Android

## Option A — Émulateur Android Studio (recommandé sur Mac)

### 1. Installer Android Studio

1. Téléchargez [Android Studio](https://developer.android.com/studio)
2. À la première ouverture : installez le **SDK Android** (API 35)
3. Ajoutez dans `~/.zshrc` :

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$PATH"
```

Puis `source ~/.zshrc`

### 2. Créer un émulateur tablette

Android Studio → **Tools** → **Device Manager** → **Create device**

- Catégorie : **Tablet**
- Modèle : **Pixel Tablet** (ou équivalent)
- Image système : **API 35** (Android 15)
- Nom : `SeNote_Tablet`

### 3. Configurer l'app (une fois)

```bash
cp frontend/.env.example frontend/.env
```

Remplissez au minimum (déjà configuré pour le site) :

```bash
REACT_APP_KIOSK_MODE=true
REACT_APP_GOOGLE_WEB_CLIENT_ID=votre_client_web.apps.googleusercontent.com
REACT_APP_GOOGLE_TOKEN_URL=https://senote.onrender.com/google/token
REACT_APP_JOKKO_SYNC_URL=https://jokko-sync.onrender.com
```

Pour Google Drive **dans l'APK**, créez aussi un client OAuth **Android** dans Google Cloud (package `com.senote.tablet`, SHA-1 debug — voir [ANDROID.md](./ANDROID.md)).

### 4. Build + test automatique

```bash
chmod +x scripts/emulator-test.sh scripts/build-apk.sh
./scripts/emulator-test.sh SeNote_Tablet
```

L'APK est aussi copiée à la racine : `SeNote-tablet.apk`

### Commandes utiles

```bash
# Build seul
./scripts/build-apk.sh

# Liste des émulateurs
emulator -list-avds

# Démarrer un émulateur manuellement
emulator -avd SeNote_Tablet &

# Installer sur émulateur / tablette USB
adb install -r SeNote-tablet.apk

# Voir les logs SeNote
adb logcat | grep -i senote
```

---

## Option B — APK depuis GitHub (sans Android Studio local)

1. GitHub → **Actions** → **Build APK Android** → **Run workflow**
2. Quand c'est vert, ouvrez le run → section **Artifacts** → téléchargez `SeNote-tablet-apk`
3. Installez sur une tablette réelle (fichier APK) ou utilisez Android Studio uniquement pour l'émulateur

---

## Option C — Tablette physique (USB)

1. Tablette → **Options développeur** → **Débogage USB** activé
2. Branchez en USB
3. ```bash
   ./scripts/build-apk.sh
   adb install -r SeNote-tablet.apk
   ```

---

## Alternative rapide (sans APK)

Le site https://latsoukb.github.io/SeNote/ fonctionne déjà sur tablette Android dans Chrome. L'APK apporte le stockage natif, le plein écran et Google Drive natif.
