# Tablettes SeNote — verrouillage définitif

## Élèves → **Paramètres** (roue dentée)

| Section | Rôle |
|---------|------|
| Connexion Wi‑Fi | Se connecter au réseau |
| Verrouillage de la tablette | Son propre PIN anti-vol |
| Mise à jour SeNote | Mettre à jour l'app (installation automatique) |

## Techniciens → **7× logo « SeNote. »** → Administration IT

Mot de passe usine par défaut : défini au build (`REACT_APP_IT_ADMIN_PIN`, GitHub Secret).
Développement / émulateur : `482916` sauf surcharge dans `frontend/.env`.

| Action | Usage |
|--------|--------|
| **Activer mode maintenance** | Contourne « Blocked by work policy », permet d'installer/désinstaller une APK |
| **Reverrouiller** | Réactive le verrou kiosk |
| **Réglages Android** | Accès complet aux paramètres système |
| **Modifier mot de passe IT** | Change le code sur cette tablette |

Les élèves **ne connaissent pas** ce mot de passe.

## Déploiement

```bash
adb install -r SeNote-tablet.apk
./scripts/provision-tablet.sh
```

## Verrouillage Device Owner

- Pas de sortie SeNote, pas de TikTok / Play Store
- Mises à jour SeNote : installées **automatiquement** (sans fenêtre Android)
- Si échec : mode maintenance IT puis réessayer

## Dépannage

| Problème | Solution |
|----------|----------|
| Mise à jour bloquée / pas de fenêtre | v1.37+ installe en silencieux ; sinon mode maintenance IT |
| Blocked by work policy | 7× logo → IT → Activer maintenance |
| Impossible de désinstaller | Mode maintenance IT d'abord |
| `Not allowed to set device owner` | Réinitialiser usine, pas de compte Google |
