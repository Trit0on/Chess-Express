# Guide Git Workflow - Chess RPG

## Structure des Branches

```
main (production)       ← Code stable, déployé en production
  ↓
develop (développement) ← Code en cours, tests avant prod
  ↓
feature/* ou fix/*      ← Vos fonctionnalités
```

---

## Workflow Quotidien

### 1. Créer une nouvelle fonctionnalité

```bash
# Récupérer les dernières modifications
git checkout develop
git pull origin develop

# Créer une branche feature
git checkout -b feature/chess-logic
# OU pour un bug fix
git checkout -b fix/login-error

# Développer tranquille...
# Tester avec: make dev
```

### 2. Développer et tester

```bash
# Démarrer l'environnement DEV
make -f Makefile.environments dev

# Vos modifications sont hot-reloadées automatiquement !
# Frontend: http://localhost:4200
# API: http://localhost:3000
# pgAdmin: http://localhost:5050

# Voir les logs
make -f Makefile.environments logs-dev
```

### 3. Commiter vos changements

```bash
# Vérifier ce qui a changé
git status
git diff

# Ajouter et commiter
git add .
git commit -m "feat: Add chess board logic with piece movements"

# Pusher votre branche
git push origin feature/chess-logic
```

### 4. Pull Request sur GitHub

Sur GitHub.com :
1. Allez dans votre repo
2. Cliquez "Pull requests" > "New pull request"
3. Base: develop <- Compare: feature/chess-logic
4. Créez la PR
5. Attendez les tests CI/CD
6. Mergez quand c'est validé

### 5. Merger dans develop

```bash
# Une fois la PR mergée sur GitHub
git checkout develop
git pull origin develop

# Supprimer votre branche locale
git branch -d feature/chess-logic
```

---

## Déployer en Production

### IMPORTANT : Le déploiement N'EST PAS automatique par défaut

Vous avez deux options :

---

### Option A : Déploiement MANUEL (Recommandé pour commencer)

```bash
# 1. Merger develop dans main
git checkout main
git pull origin main
git merge develop

# 2. Tagger la version (optionnel mais recommandé)
git tag -a v1.0.0 -m "Release v1.0.0 - Chess board feature"

# 3. Pusher vers GitHub
git push origin main
git push origin --tags

# ATTENTION : GitHub Actions lance les TESTS uniquement, pas de déploiement auto

# 4. DÉPLOYER MANUELLEMENT sur votre serveur
# Si serveur distant (VPS, cloud, etc.) :
ssh votre-serveur
cd /path/to/Chess-RPG/App
git pull origin main
make -f Makefile.environments rebuild-prod

# OU si déploiement local :
make -f Makefile.environments rebuild-prod
```

---

### Option B : Déploiement AUTOMATIQUE (Nécessite configuration)

Pour activer le déploiement automatique, voir la section [CI/CD Automatique](#cicd-automatique-optionnel) en bas de ce document.

---

## Commandes Utiles

### Environnement DEV
```bash
make -f Makefile.environments dev          # Démarrer DEV
make -f Makefile.environments stop-dev     # Arrêter DEV
make -f Makefile.environments logs-dev     # Voir logs DEV
make -f Makefile.environments rebuild-dev  # Reconstruire images DEV
```

### Environnement PROD (local)
```bash
# Créer .env.production d'abord !
cp .env.production.example .env.production
# Éditer .env.production avec vos vrais credentials

make -f Makefile.environments prod         # Démarrer PROD
make -f Makefile.environments stop-prod    # Arrêter PROD
make -f Makefile.environments logs-prod    # Voir logs PROD
make -f Makefile.environments rebuild-prod # Reconstruire images PROD
```

### Status
```bash
make -f Makefile.environments status       # Voir tous les containers
docker ps                                  # Containers actifs
docker images                              # Images disponibles
```

---

## Scenarios Courants

### J'ai des conflits Git
```bash
# 1. Récupérer les dernières modifications
git checkout develop
git pull origin develop

# 2. Rebaser votre branche
git checkout feature/ma-feature
git rebase develop

# 3. Résoudre les conflits dans VS Code
# 4. Continuer le rebase
git add .
git rebase --continue

# 5. Force push (car l'historique a changé)
git push origin feature/ma-feature --force-with-lease
```

### Je veux tester la PROD localement
```bash
# 1. Arrêter DEV
make -f Makefile.environments stop-dev

# 2. Créer .env.production
cp .env.production.example .env.production
# Modifier les credentials !

# 3. Lancer PROD
make -f Makefile.environments prod

# 4. Accéder à http://localhost (port 80)
```

### Docker prend trop de place
```bash
# Nettoyer tout
make -f Makefile.environments clean-all

# Nettoyer les images inutilisées
docker system prune -a --volumes
```

---

## Conventions de Commit

Utilisez des messages clairs :

```bash
feat: Ajouter la logique de déplacement des pièces
fix: Corriger le bug de validation email
docs: Mettre à jour le README
style: Formatter le code avec Prettier
refactor: Restructurer le service utilisateur
test: Ajouter tests pour chess.service
chore: Mettre à jour les dépendances
```

---

## Checklist Avant de Pusher

- [ ] Le code compile sans erreur
- [ ] Les tests passent localement
- [ ] Le code est formaté
- [ ] Le commit message est clair
- [ ] Pas de `console.log()` oubliés
- [ ] Pas de credentials en dur dans le code
- [ ] Le `.env` n'est PAS commité

---

## Aide Rapide

### Annuler le dernier commit (pas encore pushé)
```bash
git reset --soft HEAD~1  # Garde les modifications
git reset --hard HEAD~1  # ATTENTION: SUPPRIME les modifications
```

### Voir l'historique
```bash
git log --oneline --graph --all
```

### Stasher des modifications
```bash
git stash              # Mettre de côté
git stash pop          # Récupérer
git stash list         # Voir la liste
```

---

## CI/CD Automatique (OPTIONNEL)

### IMPORTANT : Par défaut, GitHub Actions lance UNIQUEMENT les tests

Le fichier `.github/workflows/ci-cd.yml` est configuré pour :
- Lancer les tests automatiquement
- NE PAS déployer (pour éviter les déploiements accidentels)

---

### Pour activer le déploiement automatique

Seulement si vous avez un serveur de production (VPS, AWS, etc.) :

#### Etape 1 : Ajouter des secrets GitHub

Sur GitHub.com > Votre repo > Settings > Secrets and variables > Actions :

```
DEPLOY_HOST=votre-serveur.com (ou IP)
DEPLOY_USER=ubuntu (ou votre user SSH)
DEPLOY_SSH_KEY=-----BEGIN OPENSSH PRIVATE KEY-----
              ... votre clé privée SSH ...
              -----END OPENSSH PRIVATE KEY-----
DEPLOY_PATH=/home/ubuntu/Chess-RPG/App
```

#### Etape 2 : Modifier `.github/workflows/ci-cd.yml`

Remplacer la section "Deploy to PROD" :

```yaml
- name: Deploy to PROD (main branch)
  if: github.ref == 'refs/heads/main'
  run: |
    # Configurer SSH
    mkdir -p ~/.ssh
    echo "${{ secrets.DEPLOY_SSH_KEY }}" > ~/.ssh/deploy_key
    chmod 600 ~/.ssh/deploy_key
    
    # Se connecter et déployer
    ssh -i ~/.ssh/deploy_key -o StrictHostKeyChecking=no \
      ${{ secrets.DEPLOY_USER }}@${{ secrets.DEPLOY_HOST }} << 'EOF'
      cd ${{ secrets.DEPLOY_PATH }}
      git pull origin main
      make -f Makefile.environments rebuild-prod
    EOF
```

#### Etape 3 : Préparer votre serveur

Sur votre serveur de production :

```bash
# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Cloner le repo
git clone https://github.com/Trit0on/Chess-RPG.git
cd Chess-RPG/App

# Configurer l'environnement
cp .env.production.example .env.production
# IMPORTANT: Éditer .env.production avec de VRAIS credentials sécurisés
nano .env.production
```

---

### Alternative : Docker Hub / GitHub Container Registry

Si vous voulez juste publier vos images Docker :

```yaml
# Dans .github/workflows/ci-cd.yml
- name: Build and push Docker images
  if: github.ref == 'refs/heads/main'
  run: |
    echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
    
    # Build et tag
    docker build -t trit0on/chess-rpg-api:latest ./Server
    docker build -t trit0on/chess-rpg-web:latest ./Client
    
    # Push
    docker push trit0on/chess-rpg-api:latest
    docker push trit0on/chess-rpg-web:latest
```

Secrets à ajouter :
- `DOCKER_USERNAME` : votre nom d'utilisateur Docker Hub
- `DOCKER_PASSWORD` : votre mot de passe ou token Docker Hub

---

## Ressources

- [Documentation Git](https://git-scm.com/doc)
- [GitHub Actions](https://docs.github.com/actions)
- [Docker Compose](https://docs.docker.com/compose/)
