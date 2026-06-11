# Tester SeNote en APK — sans Android Studio

Android Studio refuse parfois de s'installer (macOS récent, manque d'espace, permissions). **Vous n'en avez pas besoin** pour tester SeNote.

---

## Option 1 — Tablette ou téléphone Android (recommandé)

C'est la cible réelle du projet (tablette au Sénégal).

### Télécharger l'APK

```bash
chmod +x scripts/download-apk.sh
./scripts/download-apk.sh
```

Fichier obtenu : **`SeNote-tablet.apk`** à la racine du projet.

**Ou** manuellement : [GitHub Actions → Build APK Android](https://github.com/latsoukb/SeNote/actions/workflows/build-apk.yml) → dernier run vert → **Artifacts** → `SeNote-tablet-apk`.

### Installer sur la tablette

1. Envoyez `SeNote-tablet.apk` sur la tablette (Google Drive, clé USB, email, AirDrop vers un téléphone Android, etc.)
2. Sur la tablette : ouvrez le fichier **SeNote-tablet.apk**
3. Si demandé : **Paramètres** → autoriser l'installation depuis cette source
4. **Installer** → ouvrir **SeNote**

### Mises à jour

Re-téléchargez l'APK et réinstallez par-dessus. Les cahiers locaux sont conservés.

---

## Option 2 — Site web sur tablette Android (déjà prêt)

Sans APK, le site fonctionne dans Chrome :

**https://latsoukb.github.io/SeNote/**

- Écriture au stylet
- Google Drive (déjà configuré)
- Menu Chrome → **Installer l'application** pour un raccourci plein écran

L'APK ajoute surtout : stockage natif plus fiable, icône app, mode tablette dédié.

---

## Option 3 — Émulateur léger sur Mac (si pas de tablette)

Si Android Studio bloque, essayez dans cet ordre :

### A. BlueStacks (plus simple qu'Android Studio)

1. [bluestacks.com](https://www.bluestacks.com) → installer BlueStacks pour Mac
2. Téléchargez `SeNote-tablet.apk` (script ci-dessus)
3. Glissez l'APK dans la fenêtre BlueStacks → installer → lancer SeNote

### B. SDK en ligne de commande (sans l'IDE Android Studio)

Uniquement les outils Google, pas l'application Android Studio :

```bash
# Outils adb (installer APK si tablette branchée en USB)
brew install --cask android-platform-tools

# Vérifier tablette connectée
adb devices
adb install -r SeNote-tablet.apk
```

Pour un émulateur sans Android Studio, téléchargez les [Command line tools](https://developer.android.com/studio#command-line-tools-only) (section « Command line tools only », pas le gros installateur Android Studio).

---

## Option 4 — Tester l'APK dans le navigateur (cloud)

Services qui exécutent une APK dans le navigateur (compte gratuit limité) :

- [Appetize.io](https://appetize.io) — uploadez `SeNote-tablet.apk`, testez en ligne
- Utile pour un aperçu rapide ; le stylet ne sera pas réaliste

---

## Pourquoi Android Studio échoue souvent

| Cause | Piste |
|-------|--------|
| macOS très récent (ex. 26.x) | Attendre une mise à jour Android Studio, ou utiliser BlueStacks / tablette réelle |
| Espace disque | Libérer ≥ 15 Go |
| Téléchargement corrompu | Re-télécharger depuis le site officiel |
| Mac Apple Silicon | Prendre la version **Apple Chip**, pas Intel |

---

## Compiler l'APK vous-même (sans Android Studio local)

Déjà automatisé sur GitHub à chaque push :

```bash
gh workflow run build-apk.yml
# Attendre ~4 min, puis :
./scripts/download-apk.sh
```

Pas besoin de Java, Gradle ou SDK sur votre Mac.

---

## Google Drive dans l'APK

Le site web utilise déjà Drive. Pour l'APK native, il faut en plus un client OAuth **Android** dans Google Cloud (SHA-1 + package `com.senote.tablet`) — voir [ANDROID.md](./ANDROID.md). En attendant, tout le reste de l'app fonctionne hors ligne sur la tablette.
