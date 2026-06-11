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

## Google Drive (optionnel, tester sur Mac)

1. Suivre [GOOGLE_DRIVE.md](./GOOGLE_DRIVE.md) (Google Cloud + `REACT_APP_GOOGLE_WEB_CLIENT_ID` dans `frontend/.env`)
2. Relancer `npm start`
3. Dans l'app : **Paramètres → Connecter Google Drive**
