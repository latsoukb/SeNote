# Déployer SeNote en ligne

## Tester en local (sur votre Mac)

```bash
chmod +x scripts/dev.sh
./scripts/dev.sh
```

Ouvre **http://localhost:3000** — pas de code PIN, notes sauvegardées dans le navigateur.

---

## Repo privé ? Lisez ça d'abord

GitHub affiche *« Upgrade or make this repository public »* parce que **GitHub Pages gratuit ne marche pas sur un repo privé**.

| Option | Coût | Repo privé | URL permanente |
|--------|------|------------|----------------|
| **Rendre le repo public** | Gratuit | Non (code visible) | `latsoukb.github.io/SeNote` |
| **GitHub Pro** | ~4 €/mois | Oui | `latsoukb.github.io/SeNote` |
| **Vercel** (recommandé si privé) | Gratuit | Oui | `senote-xxx.vercel.app` |
| **Wi-Fi local** | Gratuit | Oui | `http://192.168.x.x:3000` |

> Même si le repo est public, l'app reste protégée par le **code PIN** (`REACT_APP_BETA_PIN`). Seul le code source est visible, pas les notes de vos utilisateurs.

---

## Option A — GitHub Pages (repo PUBLIC)

URL : **https://latsoukb.github.io/SeNote/**

### 1. Rendre le repo public

[Settings → General → Danger Zone → Change visibility → Public](https://github.com/latsoukb/SeNote/settings)

### 2. Activer Pages

[Settings → Pages](https://github.com/latsoukb/SeNote/settings/pages) → Source : **GitHub Actions**

### 3. Code PIN (optionnel)

**Settings → Secrets → Actions** → secret `REACT_APP_BETA_PIN` = `1234`

### 4. Pousser

```bash
git push origin main
```

Déploiement auto en ~2 min.

---

## Option B — Vercel (repo PRIVÉ, gratuit)

```bash
npx vercel login          # une seule fois
./scripts/deploy.sh 1234
```

Le script **build en local** puis upload (évite le « Building… » bloqué).

À la fin, copiez l'URL affichée (ex. `https://se-note.vercel.app`) et envoyez à votre ami :
- **URL** de l'app
- **Code** `1234`

Sur iPad : Safari → URL → entrer le code → Partager → **Sur l'écran d'accueil**.

> Si le terminal affiche encore « Building… » d'un ancien déploiement : `Ctrl+C`, puis relancez `./scripts/deploy.sh 1234`.

---

## Option C — Même Wi-Fi (30 sec)

```bash
./scripts/share.sh 1234
```

Envoyez l'IP affichée + le code. Pas d'URL permanente.

---

## Mode stylet (déjà activé)

- **Stylet** → écrit · **Doigt** → défile · **Paume** → ignorée

Réglage : Paramètres → « Stylet uniquement pour écrire ».
