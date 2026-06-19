# Tablettes SeNote — verrouillage définitif

## Élèves → **Paramètres** (roue dentée)

| Section | Rôle |
|---------|------|
| Connexion Wi‑Fi | Se connecter au réseau |
| Verrouillage de la tablette | Son propre PIN anti-vol |
| Mise à jour SeNote | Mettre à jour l'app (installation automatique) |

## Techniciens → **7× logo « SeNote. »** → mot de passe IT

Mot de passe par défaut (développement / émulateur) : **`482916`**
(surcharge possible via `REACT_APP_IT_ADMIN_PIN` au build).

| Action | Usage |
|--------|--------|
| **Activer le verrou** | Tablette bloquée dans SeNote (comportement normal) |
| **Désactiver le verrou** | Maintenance IT (installer/désinstaller une APK, etc.) |

Les élèves **ne connaissent pas** ce mot de passe.

## Déploiement (verrou actif par défaut)

**Une seule commande** (émulateur ou tablette USB, sans compte Google) :

```bash
./scripts/setup-tablet.sh SeNote-tablet.apk
```

Ou développement :

```bash
./scripts/run-emulator.sh
```

(`run-emulator.sh` installe + active Device Owner + lance SeNote.)

## Verrouillage Device Owner

- Pas de sortie SeNote, pas de TikTok / Play Store
- Mises à jour SeNote : installées **automatiquement** (sans fenêtre Android)
- Si échec : mode maintenance IT puis réessayer

## Dépannage

| Problème | Solution |
|----------|----------|
| Mise à jour bloquée / pas de fenêtre | v1.37+ installe en silencieux ; sinon mode maintenance IT |
| Blocked by work policy | 7× logo → IT → Désactiver le verrou (maintenance) |
| Impossible de désinstaller | Désactiver le verrou IT d'abord |
| SeNote pas bloqué après install | Lancer `./scripts/setup-tablet.sh` ou `./scripts/provision-tablet.sh` |
| `Not allowed to set device owner` | Réinitialiser usine, pas de compte Google |
