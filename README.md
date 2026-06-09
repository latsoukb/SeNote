# SeNote

Application de prise de notes manuscrites (style cahier numérique) pour tablettes et navigateur.

## Démarrage rapide (Mac)

```bash
chmod +x scripts/dev.sh
./scripts/dev.sh
```

Ouvre **http://localhost:3000** — notes sauvegardées dans le navigateur.

Guide de test complet : [TEST.md](./TEST.md)

## Tablette Android (APK — sans Play Store)

Pour une tablette dédiée à la prise de notes (projet éducatif Sénégal) :

- Stockage **mémoire interne** de la tablette
- Sync **Google Drive** gratuite (optionnelle)
- Installation directe de l'APK

**Guide : [ANDROID.md](./ANDROID.md)**

```bash
./scripts/build-apk.sh
adb install -r SeNote-tablet.apk
```

## Google Drive (test sur Mac)

1. Configurer OAuth Web : [GOOGLE_DRIVE.md](./GOOGLE_DRIVE.md)
2. Renseigner `REACT_APP_GOOGLE_WEB_CLIENT_ID` dans `frontend/.env`
3. Paramètres → **Connecter Google Drive**

## Déploiement en ligne

**GitHub Pages** : https://latsoukb.github.io/SeNote/ — voir [DEPLOY.md](./DEPLOY.md)

## Tester sur tablette (même Wi-Fi)

```bash
./scripts/share.sh
```

Ouvrez l'adresse affichée (ex. `http://192.168.1.x:3000`) sur la tablette.

## Fonctionnalités

- Modèles de page : Vierge, Ligné, Quadrillé, Pointillé, **Seyès**, **Musique**
- Écriture au stylet avec prise en charge de la pression
- **Mode GoodNotes** : stylet pour écrire, doigt pour faire défiler
- Zoom, règles et équerre en cm réels
- Export PDF
