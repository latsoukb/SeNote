# Tester SeNote maintenant

## Option 1 — Navigateur (30 secondes, sur ton Mac)

```bash
chmod +x scripts/test-tablet.sh
./scripts/test-tablet.sh web
```

Ouvre **http://localhost:3000**

- Pas de code PIN (mode tablette)
- Écris au stylet ou à la souris
- Les cahiers sont sauvegardés dans le navigateur

**Sur tablette (même Wi-Fi) :**

```bash
./scripts/share.sh
```

Ouvre l’adresse affichée (ex. `http://192.168.1.x:3000`) sur la tablette.

---

## Option 2 — APK Android (vraie app tablette)

### Télécharger l’APK (build automatique GitHub)

1. Va sur [Actions → Build APK Android](https://github.com/latsoukb/SeNote/actions/workflows/build-apk.yml)
2. Clique **Run workflow** (ou attends le build après un push)
3. Quand c’est vert → clique le run → section **Artifacts** → télécharge **SeNote-tablet-apk**

### Installer sur la tablette

**USB :**
```bash
adb install -r ~/Downloads/app-debug.apk
```

**Sans USB :** copie le fichier `.apk` sur la tablette → ouvre-le → autorise « sources inconnues » → installer.

### Compiler en local (si Android Studio installé)

```bash
./scripts/test-tablet.sh apk
```

---

## Option 3 — Site en ligne (déjà déployé)

**https://latsoukb.github.io/SeNote/**

> Stockage navigateur uniquement — l’APK est mieux pour une tablette dédiée.

---

## Checklist test stylet

- [ ] Créer un cahier
- [ ] Écrire au stylet / doigt
- [ ] Zoom (pincer ou boutons + / −)
- [ ] Défiler entre les pages (1 doigt, zoom à 100 %)
- [ ] Règle 30 cm dans la barre d’outils
- [ ] Export PDF
- [ ] Fermer et rouvrir → les notes sont toujours là

---

## Google Drive (optionnel, après config)

Voir [ANDROID.md](./ANDROID.md) section Google Cloud, puis dans l’app : **Paramètres → Connecter Google Drive**.
