# Sync JokkoNote → SeNote

```
JokkoNote (prof)  ──POST──►  serveur sync  ◄──GET──  SeNote (élève)
```

Variable d'environnement (les deux apps) :

```bash
REACT_APP_JOKKO_SYNC_URL=https://jokko-sync.onrender.com
```

## Fiabilité — ce qui est gratuit et ce qui ne l'est pas

| Configuration | Coût | Fiabilité | Limite |
|---------------|------|-----------|--------|
| **Render seul** (actuel sans Supabase) | 0 € | ~70 % | Données effacées à chaque redéploiement ; serveur qui « dort » |
| **Render + Supabase** (recommandé) | **0 €** | **~98 %** | 500 Mo DB gratuits ; messages conservés pour toujours |
| Render payant + Supabase | ~7 €/mois | ~99,9 % | Serveur toujours réveillé, zéro cold start |

**100 % garanti sans aucun service cloud : impossible** — il faut au minimum un endroit qui garde les messages quand le serveur redémarre.

### Mise en place Supabase (gratuit, ~10 min)

1. Compte sur [supabase.com](https://supabase.com) → **New project** (gratuit)
2. **SQL Editor** → coller le fichier `JokkoNote/server/supabase-schema.sql` → Run
3. **Settings → API** → copier :
   - **Project URL** (`https://xxx.supabase.co`)
   - **service_role** (clé secrète — jamais dans SeNote/JokkoNote)
4. Sur **Render** → service `jokko-sync` → Environment :
   - `SUPABASE_URL` = Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role
5. Redéployer → vérifier :

```bash
curl https://jokko-sync.onrender.com/health
# {"ok":true,"storage":"supabase"}
```

Script d'aide (repo JokkoNote) :

```bash
./scripts/setup-supabase.sh https://xxx.supabase.co VOTRE_SERVICE_ROLE_KEY
```

## Dev local

```bash
cd ../JokkoNote && ./scripts/sync.sh   # :8787, stockage fichiers local
cd ../JokkoNote && ./scripts/dev.sh    # prof :3001
cd SeNote && ./scripts/dev.sh          # élève :3000
```

## Comportement côté élève (SeNote)

- Sync automatique toutes les **15 s** + au retour sur l'onglet
- **3 tentatives** en cas d'échec réseau
- Inbox **légère** (sans image/PDF) puis chargement du détail à l'ouverture
- Notifications **partout** dans l'app (cahier, bibliothèque…)

## Types d'envoi

| Type | Prof | Élève |
|------|------|-------|
| Message | Texte | Lecture + notif |
| PDF | Fichier | Visionneuse + import cahier |
| Image | JPG/PNG | Affichage + import cahier |

---

## Plan startup — phase gratuite (recommandé)

### Stack 0 €

| Composant | Rôle | Coût |
|-----------|------|------|
| **GitHub Pages** | SeNote + JokkoNote | 0 € |
| **Render** (free) | Serveur sync | 0 € |
| **Supabase** (free) | Stockage messages permanent | 0 € |

### Méthode optimale (dans l'ordre)

1. **Activer Supabase** sur le serveur sync (sinon perte de données à chaque déploiement Render).
2. **Garder l'inbox léger** (déjà en place) — les images/PDF ne transitent qu'à l'ouverture du message.
3. **Limiter la taille des pièces jointes** — photos compressées, PDF &lt; 5 Mo (un PDF de 20 Mo peut saturer la base gratuite en quelques envois).
4. **Préférer le texte** pour les consignes courantes ; réserver image/PDF aux documents importants.
5. **Ne pas laisser 100 onglets SeNote ouverts en permanence** — la sync tourne toutes les 15 s par onglet actif.

### Capacité max réaliste (gratuit, bien configuré)

| Métrique | Confortable | Maximum absolu |
|----------|-------------|----------------|
| **Élèves inscrits** (total) | **300** | ~500 |
| **Élèves connectés en même temps** | **30** | ~80 |
| **Professeurs** | **20** | ~50 |
| **Messages / mois** (texte + quelques images) | **1 000** | ~3 000 |
| **Stockage messages** (Supabase 500 Mo) | **&lt; 100 Mo** | ~400 Mo |

Au-delà de ces chiffres : ralentissements, cold start Render plus fréquent, risque de saturation de la base.

### Quand passer à l'abonnement payant

Déclencheurs concrets pour facturer vos clients et upgrader l'infra :

| Signal | Action startup | Coût infra estimé |
|--------|----------------|-------------------|
| &gt; 300 élèves inscrits | Supabase Pro + Render Starter | ~30 €/mois |
| Beaucoup de PDF/images | Fichiers dans Supabase Storage (pas en base64) | inclus Pro |
| Besoin de réception instantanée (&lt; 2 s) | WebSockets ou push + serveur toujours réveillé | ~50 €/mois |
| Plusieurs établissements | Multi-tenant + monitoring | ~80–150 €/mois |

**Modèle suggéré** : offrir la messagerie dans un abonnement école (ex. 5–15 €/classe/mois). Dès **10 classes payantes**, l'infra payante est rentabilisée.

### Vérification rapide

```bash
curl https://jokko-sync.onrender.com/health
# {"ok":true,"storage":"supabase"}  ← obligatoire en prod
```
