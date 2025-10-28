# Résumé des Fichiers de Configuration

## Environnements

### Fichiers Docker Compose

| Fichier | Usage | Commande |
|---------|-------|----------|
| `docker-compose.yml` | DÉVELOPPEMENT avec hot-reload | `docker compose up -d` |
| `docker-compose.prod.yml` | PRODUCTION sans volumes | `docker compose -f docker-compose.prod.yml up -d` |

### Fichiers d'environnement

| Fichier | Description | Statut Git |
|---------|-------------|------------|
| `.env` | Variables DEV (actuelles) | Gitignored |
| `.env.example` | Template pour `.env` | Commité |
| `.env.production` | Variables PROD (à créer) | Gitignored |
| `.env.production.example` | Template pour `.env.production` | Commité |

---

## Makefiles

---

## Documentation

| Fichier | Contenu |
|---------|---------|
| `README.md` | Documentation principale du projet |
| `WORKFLOW.md` | Guide Git + workflow dev/prod |
| `DOCKER-COMMANDS.md` | Référence des commandes Docker |
| `DEPLOYMENT.md` | Guide de déploiement complet |
| `SUMMARY.md` | Ce fichier - résumé de la configuration |

---

## Structure Git Recommandée

```
main (production)
  ├─ Tag: v1.0.0
  ├─ Tag: v1.1.0
  └─ ...

develop (développement)
  ├─ feature/chess-board
  ├─ feature/user-auth
  ├─ fix/login-bug
  └─ ...
```

### Créer la branche develop

```bash
git checkout -b develop
git push -u origin develop
```

---

## CI/CD

### GitHub Actions

**Fichier** : `.github/workflows/ci-cd.yml`

**Déclencheurs** :
- Push vers `main` : Tests + Déploiement PROD (si configuré)
- Push vers `develop` : Tests + Déploiement DEV (si configuré)
- Pull Request : Tests uniquement

**Étapes** :
1. Tests automatiques (API + DB)
2. Build des images Docker
3. Déploiement (à configurer avec vos secrets)

---

## Workflow Recommandé

### Développement quotidien

```bash
# Développer, commiter, pusher
git add .
git commit -m "feat: Ma nouvelle fonctionnalité"
git push origin feature/ma-feature

# 4. Pull Request sur GitHub
# Base: develop <- Compare: feature/ma-feature
```
```

### Déploiement en production

```bash
# 1. Merger develop dans main
git checkout main
git merge develop

# 2. Tagger la version
git tag -a v1.0.0 -m "Release v1.0.0"

# 3. Pusher
git push origin main --tags

# GitHub Actions déclenche automatiquement le déploiement (si configuré)
```

---

## Différences DEV vs PROD

| Aspect | DEV | PROD |
|--------|-----|------|
| **Volumes** | Montés (hot-reload) | Code dans l'image |
| **pgAdmin** | Disponible | Retiré (sécurité) |
| **Port Web** | 4200 | 80 |
| **Restart** | `unless-stopped` | `always` |
| **NODE_ENV** | `development` | `production` |
| **Logs** | Verbeux | Minimaux |
| **Build** | Target `development` | Target `production` |

---

## Checklist Migration

Pour migrer de l'ancienne structure vers la nouvelle :

- [ ] Créer `.env.production` depuis `.env.production.example`
- [ ] Créer la branche `develop` : `git checkout -b develop && git push -u origin develop`
- [ ] Tester DEV : `docker compose up -d`
- [ ] Tester PROD localement : `docker compose -f docker-compose.prod.yml up -d`
- [ ] Configurer les secrets GitHub (si déploiement auto)
- [ ] Créer votre première feature branch : `git checkout -b feature/test`
- [ ] Valider le CI/CD avec une Pull Request

---

## Aide Rapide

### Je suis sur quelle branche ?
```bash
git branch  # Branche actuelle marquée avec *
```

### Comment switcher entre DEV et PROD ?
```bash
docker compose down
docker compose -f docker-compose.prod.yml up -d
```

### Les images prennent trop de place ?
```bash
docker compose down -v
docker compose -f docker-compose.prod.yml down -v
docker system prune -a --volumes  # ATTENTION: Supprime tout
```

### Comment voir les différences entre dev et prod ?
```bash
diff docker-compose.dev.yml docker-compose.prod.yml
```

---
