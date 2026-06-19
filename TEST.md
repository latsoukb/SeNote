# Tester SeNote maintenant

## Option 1 — Navigateur (30 secondes, sur ton Mac)

```bash
chmod +x scripts/dev.sh
./scripts/dev.sh
```

Ouvre **http://localhost:3000**

- Écris au stylet ou à la souris
- Les cahiers sont sauvegardés dans le navigateur

**Sur tablette (même Wi-Fi) :**

```bash
./scripts/share.sh
```

Ouvre l'adresse affichée (ex. `http://192.168.1.x:3000`) sur la tablette dans Chrome.

---

## Option 2 — Site en ligne (iPad / iPhone / tablette Android)

**https://latsoukb.github.io/SeNote/**

1. Ouvre ce lien dans **Chrome** ou **Safari** sur la tablette
2. Mode stylet activé par défaut (stylet écrit, doigt défile)
3. Pas de code PIN si `REACT_APP_BETA_PIN` n'est pas configuré sur GitHub
4. Après chaque `git push` sur `main`, le site se met à jour en ~2 min

---

## Checklist test stylet

- [ ] Créer un cahier
- [ ] Écrire au stylet / doigt
- [ ] Zoom (pincer ou boutons + / −)
- [ ] Défiler entre les pages (1 doigt, zoom à 100 %)
- [ ] Règle 30 cm dans la barre d'outils
- [ ] Export PDF
- [ ] Fermer et rouvrir → les notes sont toujours là

---

## Option 3 — Émulateur Android Studio (APK kiosk)

SeNote sur tablette combine **trois niveaux** :

| Niveau | Rôle |
|--------|------|
| **App kiosk** (`isKioskApp()`) | Pas de PIN bêta, bibliothèque vide, sidebar fermée |
| **Lock Task** | SeNote épinglée (contournable sans Device Owner) |
| **Device Owner** | Verrouillage **définitif** — voir [docs/KIOSK-TABLETTE.md](./docs/KIOSK-TABLETTE.md) |

### Verrouillage définitif (tablettes élèves)

```bash
# Après réinitialisation usine + install APK, sans compte Google :
chmod +x scripts/provision-tablet.sh
./scripts/provision-tablet.sh
```

Puis sur la tablette : **Paramètres** → Wi‑Fi, verrouillage écran, mises à jour.

Comportements Device Owner :
- installation d'apps bloquée (TikTok, Play Store masqué)
- sortie SeNote impossible sans code admin
- redémarrage → SeNote se relance
- Wi‑Fi et sécurité accessibles uniquement via code admin

### Prérequis

1. Android Studio installé
2. Un émulateur lancé (Device Manager → **Pixel Tablet** recommandé)
3. Vérifier : `adb devices` affiche `emulator-5554 device`

### Installer et lancer (1 commande)

```bash
chmod +x scripts/run-emulator.sh
./scripts/run-emulator.sh
```

Le script : build web en mode kiosk → `cap sync` → `installDebug` → ouvre SeNote.

Si erreur **INSTALL_FAILED_UPDATE_INCOMPATIBLE** : le script désinstalle l’ancienne version automatiquement.

### Google Drive sur émulateur

Copier `frontend/.env.example` → `frontend/.env` avec vos IDs Google (voir [GOOGLE_DRIVE.md](./GOOGLE_DRIVE.md)), puis relancer `./scripts/run-emulator.sh`.

### Checklist kiosk émulateur

- [ ] Pas d’écran « Accès bêta privé » au démarrage
- [ ] Accueil vide (pas de cahiers démo)
- [ ] Créer un cahier → sidebar pages reste fermée
- [ ] **Verrou kiosk** : impossible de quitter via Accueil / multitâche
- [ ] **Mode clair** : barres haut et bas blanches (pas noires)
- [ ] Interrupteurs (sync auto, etc.) **verts** quand activés (style iOS)
- [ ] Paramètres → Google Drive → connexion OAuth
- [ ] Réception JokkoNote (si `REACT_APP_JOKKO_SYNC_URL` configuré)

### Alternative : APK release GitHub

Télécharger **SeNote-tablet.apk** depuis [Releases](https://github.com/latsoukb/SeNote/releases), glisser-déposer sur l’émulateur, ou :

```bash
adb install -r SeNote-tablet.apk
```

---

## Google Drive (optionnel, tester sur Mac)

1. Suivre [GOOGLE_DRIVE.md](./GOOGLE_DRIVE.md) (Google Cloud + `REACT_APP_GOOGLE_WEB_CLIENT_ID` dans `frontend/.env`)
2. Relancer `npm start`
3. Dans l'app : **Paramètres → Connecter Google Drive**
