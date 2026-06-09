# Sync JokkoNote → SeNote

Les deux apps sont **séparées** mais partagent un serveur HTTP léger.

## Architecture

```
JokkoNote (prof)  ──POST──►  serveur sync  ◄──GET──  SeNote (élève)
```

Variable d'environnement (les deux apps) :

```bash
REACT_APP_JOKKO_SYNC_URL=http://localhost:8787
```

## Dev local (Mac)

```bash
# 1. Sync (repo JokkoNote)
cd ../JokkoNote && ./scripts/sync.sh

# 2. Prof
cd ../JokkoNote && ./scripts/dev.sh          # :3001

# 3. Élève
cd SeNote && ./scripts/dev.sh   # :3000 (sync URL par défaut)
```

## Production

1. Héberger `server/sync-server.mjs` du repo JokkoNote (Railway, Render, VPS)
2. JokkoNote Pages : secret `REACT_APP_JOKKO_SYNC_URL`
3. SeNote Pages : même URL dans le workflow deploy

## Types d'envoi

| Type | Prof (JokkoNote) | Élève (SeNote) |
|------|------------------|----------------|
| Message | Texte | Réception → lecture |
| PDF | Fichier PDF | Visionneuse intégrée |
| Image | JPG/PNG | Affichage plein écran |
