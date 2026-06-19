# Tablettes SeNote — verrouillage définitif

SeNote utilise **deux niveaux** de protection. Seul le second est irréversible.

| Niveau | Contournable ? | Description |
|--------|----------------|-------------|
| Lock Task seul | Oui (Retour + Multitâche) | Installé par défaut sur l'APK |
| **Device Owner** | **Non** | Provisionnement admin requis |

## Déploiement tablette (recommandé)

### 1. Préparer la tablette

1. **Réinitialisation usine** (obligatoire)
2. Configuration initiale **sans compte Google** (« Passer », « Configurer hors ligne »)
3. Activer **Options développeur → Débogage USB**
4. Brancher en USB au Mac

### 2. Installer SeNote

```bash
adb install -r SeNote-tablet.apk
```

Ou depuis GitHub : [Releases](https://github.com/latsoukb/SeNote/releases)

### 3. Activer le verrouillage définitif

```bash
chmod +x scripts/provision-tablet.sh
./scripts/provision-tablet.sh
```

Si plusieurs appareils : `./scripts/provision-tablet.sh SERIAL`

### 4. Configurer sur la tablette

1. **7 appuis** sur le logo « SeNote. » en haut à gauche
2. **Créer le code admin** (6 chiffres minimum — à noter, ne pas donner aux élèves)
3. **Connexion Wi‑Fi** (menu admin → Connexion Wi‑Fi)
4. **Verrouillage écran** (menu admin → PIN tablette anti-vol)

## Ce que bloque le Device Owner

- Installation d'applications (TikTok, jeux, etc.)
- Play Store masqué
- Désinstallation de SeNote
- Réinitialisation usine (bloquée)
- Sortie de SeNote sans code admin
- Redémarrage → SeNote se relance seule

## Wi‑Fi

Les élèves se connectent **eux-mêmes**, sans code admin :

1. **Paramètres** (roue dentée) → **Connexion Wi‑Fi**
2. **Rechercher les réseaux** → choisir le Wi‑Fi → mot de passe
3. Si le Wi‑Fi est désactivé : **Activer le Wi‑Fi** (petit panneau Android), puis revenir à SeNote

Tout se passe **dans SeNote** — pas d'accès aux réglages Android complets (pas de Play Store, pas d'installation d'apps).

Le **code admin** sert uniquement à la maintenance (mises à jour, verrouillage écran tablette, etc.).

## Sécurité anti-vol (PIN tablette)

Le **verrouillage écran Android** (PIN / mot de passe au démarrage) est distinct du code admin SeNote :

| Code | Rôle |
|------|------|
| **PIN Android** | Protège la tablette au démarrage (vol) |
| **Code admin SeNote** | Wi‑Fi, maintenance, mises à jour |

Configurez le PIN Android via **Administration tablette → Verrouillage écran**.

## Maintenance

Accès : **7× logo SeNote** → code admin

- Mises à jour SeNote
- Connexion Wi‑Fi
- Désactiver / réactiver le verrou (intervention technique)

## Émulateur (test)

L'émulateur **avec compte Google** refuse souvent Device Owner. Créez un AVD **sans Play Store** ou réinitialisez l'émulateur sans compte :

```bash
./scripts/run-emulator.sh
./scripts/provision-tablet.sh emulator-5554
```

## Dépannage

| Problème | Solution |
|----------|----------|
| `Not allowed to set device owner` | Réinitialiser usine, ne pas ajouter de compte Google |
| Élève sort de SeNote | Device Owner non provisionné — relancer `provision-tablet.sh` |
| Pas de Wi‑Fi | Menu admin → Connexion Wi‑Fi |
| Tablette volée sans PIN | Configurer verrouillage écran Android via menu admin |
