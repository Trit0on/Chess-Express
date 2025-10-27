# Chess RPG - Full Stack Application

**Chess RPG** - Un jeu d'échecs RPG moderne construit avec Angular, Node.js/Express, Prisma et PostgreSQL.

## Table des matières

- [Architecture](#architecture)
- [Prérequis](#prérequis)
- [Installation rapide](#installation-rapide)
- [Structure du projet](#structure-du-projet)
- [Commandes utiles](#commandes-utiles)
- [Développement](#développement)
- [Base de données](#base-de-données)
- [Troubleshooting](#troubleshooting)
- [Production](#production)

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Angular Web   │────▶│   Node.js API   │────▶│   PostgreSQL    │
│   (Port 4200)   │     │   (Port 3000)   │     │   (Port 5432)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                          │
                                                          ▼
                                                  ┌─────────────────┐
                                                  │    pgAdmin 4    │
                                                  │   (Port 5050)   │
                                                  └─────────────────┘
```

### Stack technique

- **Frontend**: Angular 17+ avec TypeScript
- **Backend**: Node.js + Express + Prisma ORM
- **Database**: PostgreSQL 16
- **DevTools**: pgAdmin 4 pour l'administration de la base
- **Containerisation**: Docker + Docker Compose
- **Migrations**: Prisma Migrate

---

## Prérequis

- [Docker](https://www.docker.com/get-started) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)
- (Optionnel) [Node.js 20+](https://nodejs.org/) pour le développement local

---

## Installation rapide

### 1. Cloner le projet

```bash
git clone https://github.com/Trit0on/Chess-RPG.git
cd Chess-RPG/App
```

### 2. Configurer l'environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer si besoin (optionnel pour dev local)
nano .env
```

### 3. Lancer l'application

```bash
# Démarrer tous les services
docker compose up -d

# Voir les logs
docker compose logs -f
```

### 4. Accéder à l'application

- **Application Web**: http://localhost:4200
- **API**: http://localhost:3000
- **pgAdmin**: http://localhost:5050
  - Email: `admin@admin.com`
  - Mot de passe: `admin`

---

## Structure du projet

```
App/
├── docker-compose.yml          # Orchestration des services
├── .env                        # Variables d'environnement (gitignored)
├── .env.example               # Template de configuration
├── servers.json               # Configuration pgAdmin
│
├── Client/                    # Application Angular
│   ├── dockerfile.client      # Image Docker du frontend
│   ├── nginx.conf            # Configuration Nginx
│   ├── src/                  # Code source Angular
│   └── package.json
│
└── Server/                    # API Node.js
    ├── dockerfile.server      # Image Docker du backend
    ├── docker-entrypoint.sh  # Script de démarrage (migrations auto)
    ├── index.js              # Point d'entrée de l'API
    ├── package.json
    └── prisma/
        ├── schema.prisma     # Schéma de la base de données
        └── migrations/       # Historique des migrations
```

---

## 🛠️ Commandes utiles

### Docker Compose

```bash
# Démarrer tous les services
docker compose up -d

# Démarrer avec rebuild
docker compose up -d --build

# Arrêter tous les services
docker compose down

# Arrêter et supprimer les volumes (supprime les données)
docker compose down -v

# Voir les logs
docker compose logs -f

# Voir les logs d'un service spécifique
docker compose logs -f api
docker compose logs -f db
docker compose logs -f web

# Redémarrer un service
docker compose restart api

# Voir l'état des services
docker compose ps
```

### Base de données & Prisma

```bash
# Créer une nouvelle migration
docker compose exec api npx prisma migrate dev --name nom_de_la_migration

# Appliquer les migrations (déjà fait automatiquement au démarrage)
docker compose exec api npx prisma migrate deploy

# Ouvrir Prisma Studio (interface graphique)
docker compose exec api npx prisma studio

# Regénérer le client Prisma
docker compose exec api npx prisma generate

# Voir le statut des migrations
docker compose exec api npx prisma migrate status

# Reset de la base (supprime toutes les données)
docker compose exec api npx prisma migrate reset
```

### API - Tests rapides

```bash
# Health check
curl http://localhost:3000/api/ping

# Test de connexion DB
curl http://localhost:3000/api/dbtest

# Exemple de requête (à adapter selon vos routes)
curl http://localhost:3000/api/users
```

---

## Développement

### Développement local (sans Docker)

Si vous préférez développer hors Docker :

#### Backend

```bash
cd Server
npm install
cp .env.example .env

# Modifier DATABASE_URL pour pointer vers localhost
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/appdb"

# Lancer les migrations
npm run prisma:migrate:dev

# Démarrer en mode watch
npm run dev
```

#### Frontend

```bash
cd Client
npm install
npm start
```

### Hot Reload

Les volumes Docker sont configurés pour le hot reload :

- **API**: Modifications dans `Server/` → redémarrage automatique avec nodemon
- **Web**: Modifications dans `Client/` → rechargement automatique Angular

### Ajouter une nouvelle table

1. Modifier `Server/prisma/schema.prisma`
2. Créer la migration :

```bash
docker compose exec api npx prisma migrate dev --name add_table_name
```

3. Le client Prisma est regénéré automatiquement

### Exemple : Ajouter un model Game

```prisma
// Dans Server/prisma/schema.prisma
model Game {
  id        Int      @id @default(autoincrement())
  players   String[]
  status    String   // "pending", "active", "finished"
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

```bash
docker compose exec api npx prisma migrate dev --name add_game_model
```

---

## Base de données

### Accès direct via psql

```bash
# Depuis le container
docker compose exec db psql -U postgres -d appdb

# Depuis votre machine (si psql installé)
psql "postgresql://postgres:postgres@localhost:5432/appdb"
```

### Commandes SQL utiles

```sql
-- Lister les tables
\dt

-- Voir la structure d'une table
\d users

-- Compter les utilisateurs
SELECT COUNT(*) FROM "User";

-- Quitter
\q
```

### pgAdmin

1. Ouvrir http://localhost:5050
2. Login: `admin@admin.com` / `admin`
3. Le serveur "Local PostgreSQL" devrait être pré-configuré
4. Si besoin d'ajouter manuellement :
   - Host: `db`
   - Port: `5432`
   - Database: `appdb`
   - Username: `postgres`
   - Password: `postgres`

---

## Troubleshooting

### Les services ne démarrent pas

```bash
# Vérifier les logs
docker compose logs

# Rebuilder complètement
docker compose down -v
docker compose up -d --build
```

### Erreur "port already in use"

```bash
# Vérifier quel processus utilise le port
lsof -i :3000
lsof -i :4200
lsof -i :5432

# Tuer le processus ou changer le port dans .env
```

### Prisma : "Can't reach database server"

```bash
# Vérifier que la DB est healthy
docker compose ps

# Voir les logs de la DB
docker compose logs db

# Tester la connexion
docker compose exec db psql -U postgres -d appdb -c "SELECT 1;"
```

### Migrations ne s'appliquent pas

```bash
# Voir le statut
docker compose exec api npx prisma migrate status

# Forcer l'application
docker compose exec api npx prisma migrate deploy

# En dernier recours, reset (perte de données)
docker compose exec api npx prisma migrate reset
```

### API ne répond pas

```bash
# Vérifier que le service tourne
docker compose ps api

# Voir les logs
docker compose logs api

# Redémarrer
docker compose restart api

# Tester le healthcheck
curl http://localhost:3000/api/ping
```

### Client Angular erreurs de compilation

```bash
# Nettoyer node_modules
docker compose down
docker volume rm app_node_modules
docker compose up -d --build web
```

---

## Production

### Build optimisé

Pour la production, créez un `docker-compose.prod.yml` :

```yaml
services:
  api:
    environment:
      NODE_ENV: production
    # Pas de volumes de dev
    command: node index.js

  web:
    build:
      target: production
    # Servir via nginx
```

### Variables d'environnement

Créez un `.env.production` :

```bash
POSTGRES_PASSWORD=<mot_de_passe_fort>
PGADMIN_DEFAULT_PASSWORD=<mot_de_passe_fort>
NODE_ENV=production
```

### Sécurité

- **Ne jamais** commit `.env`
- Utiliser des mots de passe forts
- Désactiver pgAdmin en prod ou le protéger
- Utiliser HTTPS (reverse proxy nginx/traefik)
- Limiter les CORS dans l'API

---

## Ressources

- [Documentation Prisma](https://www.prisma.io/docs)
- [Angular](https://angular.io/docs)
- [Express.js](https://expressjs.com/)
- [PostgreSQL](https://www.postgresql.org/docs/)
- [Docker Compose](https://docs.docker.com/compose/)

---

## Licence

Ce projet est sous licence MIT.

---

## Contributeurs

- Dylan Chatelain - [@Trit0on](https://github.com/Trit0on)

---

**Bon développement !**
