# Makefile - Commandes utiles pour Chess RPG

.PHONY: help start stop restart logs clean rebuild test db-migrate db-studio db-reset


start: ## Démarre tous les services
	docker compose up -d

stop: ## Arrête tous les services
	docker compose down

restart: ## Redémarre tous les services
	docker compose restart

logs: ## Affiche les logs de tous les services
	docker compose logs -f

logs-api: ## Affiche les logs de l'API
	docker compose logs -f api

logs-web: ## Affiche les logs du frontend
	docker compose logs -f web

logs-db: ## Affiche les logs de la base de données
	docker compose logs -f db

clean: ## Arrête et supprime tous les conteneurs, réseaux et volumes
	docker compose down -v

rebuild: ## Reconstruit et redémarre tous les services
	docker compose down
	docker compose up -d --build

fresh: clean ## Installation fraîche (supprime tout et redémarre)
	docker compose up -d --build



db-migrate: ## Crée une nouvelle migration (nom=<nom_migration>)
	docker compose exec api npx prisma migrate dev --name $(nom)

db-migrate-deploy: ## Applique les migrations
	docker compose exec api npx prisma migrate deploy

db-studio: 
	docker compose exec api npx prisma studio
ker compose exec api npx prisma migrate status

db-seed: ## Exécute le seeding (si configuré)
	docker compose exec api npm run seed

ps: ## Affiche l'état des services
	docker compose ps
