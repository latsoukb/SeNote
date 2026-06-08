# Déployer SeNote en ligne

## Méthode recommandée — GitHub Pages (gratuit, permanent)

URL fixe : **https://latsoukb.github.io/SeNote/**

### 1. Activer GitHub Pages (une seule fois)

1. Repo [latsoukb/SeNote](https://github.com/latsoukb/SeNote) → **Settings** → **Pages**
2. **Build and deployment** → Source : **GitHub Actions**
3. *(Optionnel)* **Settings** → **Secrets and variables** → **Actions** → New secret :
   - Name : `REACT_APP_BETA_PIN`
   - Value : `1234` (ou votre code)

### 2. Déployer

Chaque `git push` sur `main` déclenche le déploiement automatiquement.

Ou manuellement : **Actions** → **Deploy GitHub Pages** → **Run workflow**.

Le site est en ligne après ~2 min. Envoyez à votre ami :
- **URL** : https://latsoukb.github.io/SeNote/
- **Code** : celui défini dans le secret `REACT_APP_BETA_PIN`

Sur iPad : Safari → URL → code → Partager → **Sur l'écran d'accueil**.

> Les notes sont sauvegardées dans le navigateur (pas de backend requis).

---

## Méthode locale — Même Wi-Fi (30 sec)

```bash
chmod +x scripts/share.sh
./scripts/share.sh 1234
```

Envoyez l'IP affichée (`http://192.168.x.x:3000`) + le code.

---

## Alternative — Vercel

```bash
./scripts/deploy.sh 1234
```

---

## Mode stylet (déjà activé)

- **Stylet** → écrit
- **Doigt** → fait défiler la page
- **Paume** → ignorée

Réglage : Paramètres → « Stylet uniquement pour écrire ».
