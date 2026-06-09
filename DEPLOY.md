# Déployer SeNote en ligne

## GitHub Pages — repo public (recommandé)

URL : **https://latsoukb.github.io/SeNote/**

### Étapes (une seule fois)

1. **Activer Pages**  
   [github.com/latsoukb/SeNote/settings/pages](https://github.com/latsoukb/SeNote/settings/pages)  
   → **Build and deployment** → Source : **GitHub Actions**

2. **Code PIN (optionnel)**  
   [Settings → Secrets → Actions](https://github.com/latsoukb/SeNote/settings/secrets/actions)  
   → **New repository secret**  
   - Name : `REACT_APP_BETA_PIN`  
   - Value : `1234` (ou votre code)

3. **Premier déploiement**  
   ```bash
   git push origin main
   ```
   Ou manuellement : [Actions](https://github.com/latsoukb/SeNote/actions) → **Deploy GitHub Pages** → **Run workflow**

4. **Vérifier**  
   Après ~2 min : [Settings → Pages](https://github.com/latsoukb/SeNote/settings/pages) affiche l'URL verte.  
   Ouvrez **https://latsoukb.github.io/SeNote/** et entrez le code PIN.

Chaque `git push` sur `main` redéploie automatiquement.

### iPad / iPhone

Safari → URL → code PIN → Partager → **Sur l'écran d'accueil**.

---

## Tester en local (sur votre Mac)

```bash
chmod +x scripts/dev.sh
./scripts/dev.sh
```

Ouvre **http://localhost:3000** — pas de code PIN, notes sauvegardées dans le navigateur.

---

## Option B — Vercel (repo privé)

```bash
npx vercel login          # une seule fois
./scripts/deploy.sh 1234
```

Le script build en local puis upload. URL du type `https://se-note.vercel.app`.

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
