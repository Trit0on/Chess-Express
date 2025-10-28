# Commandes Docker - Chess RPG

Guide de référence des commandes Docker à utiliser au quotidien.

---

## Développement (docker-compose.yml)

### Démarrer l'environnement

```bash
# Démarrer tous les services en arrière-plan
docker compose up -d

# Démarrer avec logs visibles
docker compose up

# Démarrer un service spécifique
docker compose up -d db
docker compose up -d api
```

### Arrêter l'environnement

```bash
# Arrêter tous les services
docker compose down

# Arrêter et supprimer les volumes (ATTENTION: supprime la base de données)
docker compose down -v
```

### Voir les logs

```bash
# Tous les services
docker compose logs -f

# Un service spécifique
docker compose logs -f api
docker compose logs -f db
docker compose logs -f web

# Dernières 50 lignes
docker compose logs --tail=50 api
```

### Reconstruire les images

```bash
# Reconstruire toutes les images
docker compose build

# Reconstruire sans cache (images fraîches)
docker compose build --no-cache

# Reconstruire et redémarrer
docker compose up -d --build
```

### Redémarrer les services

```bash
# Redémarrer tous les services
docker compose restart

# Redémarrer un service spécifique
docker compose restart api
docker compose restart db
```

### Voir l'état des services

```bash
# Voir les containers actifs
docker compose ps

# Voir tous les containers (actifs et arrêtés)
docker compose ps -a
```

---

## Production (docker-compose.prod.yml)

### Démarrer l'environnement de production

```bash
# Démarrer en arrière-plan
docker compose -f docker-compose.prod.yml up -d

# Démarrer avec logs visibles
docker compose -f docker-compose.prod.yml up
```

### Arrêter l'environnement de production

```bash
# Arrêter
docker compose -f docker-compose.prod.yml down

# Arrêter et supprimer les volumes
docker compose -f docker-compose.prod.yml down -v
```

### Voir les logs de production

```bash
# Tous les services
docker compose -f docker-compose.prod.yml logs -f

# Un service spécifique
docker compose -f docker-compose.prod.yml logs -f api
```

### Reconstruire les images de production

```bash
# Reconstruire sans cache
docker compose -f docker-compose.prod.yml build --no-cache

# Reconstruire et redémarrer
docker compose -f docker-compose.prod.yml up -d --build
```

### Redémarrer les services de production

```bash
# Redémarrer tous
docker compose -f docker-compose.prod.yml restart

# Redémarrer un service
docker compose -f docker-compose.prod.yml restart api
```

---

## Commandes utiles

### Exécuter des commandes dans un container

```bash
# Ouvrir un shell dans le container API
docker compose exec api sh

# Ouvrir un shell dans le container DB
docker compose exec db sh

# Exécuter une commande sans ouvrir de shell
docker compose exec api npm install
docker compose exec api npx prisma migrate dev
```

### Base de données

```bash
# Se connecter à PostgreSQL
docker compose exec db psql -U postgres -d appdb

# Créer une migration Prisma
docker compose exec api npx prisma migrate dev --name nom_migration

# Appliquer les migrations
docker compose exec api npx prisma migrate deploy

# Ouvrir Prisma Studio
docker compose exec api npx prisma studio

# Voir le statut des migrations
docker compose exec api npx prisma migrate status
```

### Nettoyage

```bash
# Supprimer les containers arrêtés
docker container prune

# Supprimer les images non utilisées
docker image prune

# Supprimer les volumes non utilisés
docker volume prune

# Supprimer tout (containers, images, volumes, networks)
docker system prune -a --volumes

# Voir l'espace utilisé par Docker
docker system df
```

### Inspection

```bash
# Voir les containers en cours
docker ps

# Voir tous les containers
docker ps -a

# Voir les images
docker images

# Voir les volumes
docker volume ls

# Voir les networks
docker network ls

# Inspecter un container
docker inspect chess-rpg-api

# Voir les logs d'un container spécifique
docker logs -f chess-rpg-api
```

---

## Workflow complet

### Démarrage quotidien

```bash
# 1. Démarrer l'environnement
docker compose up -d

# 2. Vérifier que tout tourne
docker compose ps

# 3. Voir les logs si besoin
docker compose logs -f
```

### Après modification du code

```bash
# Le code est automatiquement rechargé (hot-reload)
# Pas besoin de redémarrer

# Si ça ne fonctionne pas, redémarrer le service
docker compose restart api
```

### Après modification de Dockerfile

```bash
# 1. Arrêter les services
docker compose down

# 2. Reconstruire les images
docker compose build --no-cache

# 3. Redémarrer
docker compose up -d
```

### Après modification de docker-compose.yml

```bash
# Redémarrer avec la nouvelle configuration
docker compose up -d
```

### Créer une nouvelle migration de base de données

```bash
# 1. Modifier Server/prisma/schema.prisma

# 2. Créer la migration
docker compose exec api npx prisma migrate dev --name add_new_table

# 3. La migration est appliquée automatiquement
```

### Nettoyer complètement

```bash
# 1. Arrêter et supprimer tout
docker compose down -v

# 2. Nettoyer les images
docker system prune -a

# 3. Redémarrer proprement
docker compose up -d
```

---

## Tester la production localement

```bash
# 1. Créer le fichier d'environnement
cp .env.production.example .env.production
nano .env.production

# 2. Arrêter le dev
docker compose down

# 3. Lancer la prod
docker compose -f docker-compose.prod.yml up -d

# 4. Vérifier
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f

# 5. Tester sur http://localhost (port 80)

# 6. Revenir au dev
docker compose -f docker-compose.prod.yml down
docker compose up -d
```

---

## Troubleshooting

### Port déjà utilisé

```bash
# Trouver quel processus utilise le port 3000
lsof -i :3000

# Tuer le processus
kill -9 <PID>

# Ou changer le port dans .env
```

### Container qui ne démarre pas

```bash
# Voir les logs du container
docker compose logs api

# Voir les logs en temps réel
docker compose logs -f api

# Redémarrer le container
docker compose restart api
```

### Base de données corrompue

```bash
# Recréer complètement la base
docker compose down -v
docker compose up -d

# Les migrations se ré-appliquent automatiquement
```

### Images Docker trop lourdes

```bash
# Voir l'espace utilisé
docker system df

# Nettoyer les images non utilisées
docker image prune -a

# Nettoyer tout
docker system prune -a --volumes
```

---

## Commandes à retenir

```bash
# DÉVELOPPEMENT
docker compose up -d                    # Démarrer
docker compose down                     # Arrêter
docker compose logs -f                  # Voir logs
docker compose ps                       # Voir l'état
docker compose restart api              # Redémarrer un service
docker compose exec api sh              # Ouvrir un shell

# PRODUCTION
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml logs -f

# NETTOYAGE
docker compose down -v                  # Tout supprimer (avec volumes)
docker system prune -a                  # Nettoyer images/containers
```

---

## URLs de l'application

### Développement
- Frontend: http://localhost:4200
- API: http://localhost:3000
- API Ping: http://localhost:3000/api/ping
- API DB Test: http://localhost:3000/api/dbtest
- pgAdmin: http://localhost:5050 (admin@admin.com / admin)

### Production (local)
- Application: http://localhost (port 80)
- API: http://localhost:3000
