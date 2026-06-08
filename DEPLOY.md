# Partager SeNote avec un ami (simple)

Pas besoin de Vercel, Render ni backend pour tester sur tablette.

---

## Méthode 1 — La plus rapide (30 sec, même Wi-Fi)

Votre Mac et la tablette sur le **même Wi-Fi** :

```bash
chmod +x scripts/share.sh
./scripts/share.sh 1234
```

Envoyez à votre ami :
- **URL** : `http://VOTRE_IP:3000` (affichée dans le terminal)
- **Code** : `1234`

Sur iPad : Safari → URL → code → Partager → **Sur l'écran d'accueil**.

> Les notes sont sauvegardées dans le navigateur de la tablette (pas besoin de serveur).

---

## Méthode 2 — URL en ligne (5 min, Wi-Fi pas nécessaire)

Une seule commande, pas de backend :

```bash
cd frontend
npm install --legacy-peer-deps
REACT_APP_BETA_PIN=1234 npx vercel --prod
```

La 1ère fois : connexion GitHub en 1 clic dans le navigateur.  
Vercel affiche une URL du type `https://senote-xxx.vercel.app` → envoyez URL + code `1234`.

---

## Mode stylet (déjà activé)

- **Stylet** → écrit
- **Doigt** → fait défiler la page
- **Paume** → ignorée

Réglage : Paramètres → « Stylet uniquement pour écrire ».

---

## GitHub privé (optionnel)

[Settings du repo](https://github.com/latsoukb/SeNote/settings) → **Private** si vous ne voulez pas que le code soit public.
