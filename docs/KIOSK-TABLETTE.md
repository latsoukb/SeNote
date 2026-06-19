# Tablettes SeNote — verrouillage définitif

SeNote utilise **deux niveaux** de protection. Seul le second est irréversible pour l'élève.

| Niveau | Contournable ? | Description |
|--------|----------------|-------------|
| Lock Task seul | Oui (Retour + Multitâche) | Installé par défaut sur l'APK |
| **Device Owner** | **Non** | Provisionnement requis (`provision-tablet.sh`) |

## Déploiement tablette

### 1. Préparer la tablette

1. **Réinitialisation usine**
2. Configuration **sans compte Google** (« Passer », « Configurer hors ligne »)
3. **Débogage USB** activé
4. Brancher au Mac

### 2. Installer SeNote

```bash
adb install -r SeNote-tablet.apk
```

[Releases GitHub](https://github.com/latsoukb/SeNote/releases)

### 3. Activer le verrouillage définitif

```bash
chmod +x scripts/provision-tablet.sh
./scripts/provision-tablet.sh
```

### 4. L'élève configure sa tablette dans **Paramètres** (roue dentée)

| Section | Rôle |
|---------|------|
| **Connexion Wi‑Fi** | Se connecter au réseau (maison, village…) |
| **Verrouillage de la tablette** | Choisir son propre PIN / mot de passe anti-vol |
| **Mise à jour SeNote** | Mettre à jour l'app quand une version est disponible |

Pas de code admin — tout est dans Paramètres.

## Ce que bloque le Device Owner (pour l'élève)

- Installation d'applications (TikTok, jeux, etc.)
- Play Store masqué
- Désinstallation de SeNote
- Réinitialisation usine bloquée
- Sortie de SeNote (Accueil, multitâche)
- Redémarrage → SeNote se relance seule

L'élève **peut** toujours : Wi‑Fi, verrouillage écran, mises à jour SeNote, thème, Google Drive, cahiers.

## Émulateur (test)

```bash
./scripts/run-emulator.sh
./scripts/provision-tablet.sh emulator-5554
```

Puis dans l'app : **Paramètres** → tester Wi‑Fi, verrouillage, mise à jour.

## Dépannage

| Problème | Solution |
|----------|----------|
| `Not allowed to set device owner` | Réinitialiser usine, pas de compte Google |
| Élève sort de SeNote | Relancer `provision-tablet.sh` |
| Conflit de package (mise à jour) | `adb uninstall com.senote.tablet` puis réinstaller l'APK release |
| Maintenance (Mac) | `adb shell dpm remove-active-admin com.senote.tablet/.SeNoteDeviceAdminReceiver` |
