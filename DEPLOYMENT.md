# Guide de Déploiement - Chess RPG

## Résumé

**PAR DÉFAUT, RIEN N'EST AUTOMATIQUE**

Quand vous poussez du code vers `main`, GitHub Actions :
- Lance les TESTS uniquement
- NE déploie PAS automatiquement

Pour déployer, vous avez 2 options :

---

## Option 1 : Déploiement Manuel (Recommandé)

### Workflow complet

```bash
# 1. Développer sur une branche feature
git checkout develop
git checkout -b feature/nouvelle-fonctionnalite
# ... codez ...
git add .
git commit -m "feat: Ma fonctionnalité"
git push origin feature/nouvelle-fonctionnalite

# 2. Pull Request sur GitHub
# Base: develop <- Compare: feature/nouvelle-fonctionnalite
# GitHub Actions lance les tests
# Si tests OK, mergez la PR

# 3. Quand develop est stable, déployer en production
git checkout main
git merge develop
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin main --tags

# GitHub Actions lance les tests sur main

# 4. DÉPLOYER MANUELLEMENT
# Si serveur distant (VPS, cloud, etc.) :
ssh votre-serveur
cd /path/to/Chess-RPG/App
git pull origin main
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build

# OU si déploiement local :
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```
```

---

## Option 2 : Déploiement Automatique (Avancé)

### Prérequis

- Un serveur de production (VPS, AWS, etc.)
- Accès SSH au serveur
- Docker installé sur le serveur

### Étape 1 : Préparer le serveur

```bash
# Sur votre serveur de production
# Installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Cloner le repo
git clone https://github.com/Trit0on/Chess-RPG.git
cd Chess-RPG/App

# Créer .env.production
cp .env.production.example .env.production
nano .env.production
# Configurez avec des credentials FORTS
```

### Étape 2 : Configurer GitHub Secrets

Sur GitHub.com :
1. Allez dans votre repo
2. Settings > Secrets and variables > Actions > New repository secret

Ajoutez :

| Nom | Valeur | Description |
|-----|--------|-------------|
| `DEPLOY_HOST` | `123.45.67.89` | IP ou domaine de votre serveur |
| `DEPLOY_USER` | `ubuntu` | Nom d'utilisateur SSH |
| `DEPLOY_SSH_KEY` | `-----BEGIN OPENSSH PRIVATE KEY-----...` | Votre clé privée SSH complète |
| `DEPLOY_PATH` | `/home/ubuntu/Chess-RPG/App` | Chemin absolu du projet |

### Étape 3 : Modifier le workflow CI/CD

Éditez `.github/workflows/ci-cd.yml` :

Remplacez la section "Deploy to PROD (main branch)" par :

```yaml
- name: Deploy to PROD (main branch)
  if: github.ref == 'refs/heads/main'
  run: |
    # Configurer SSH
    mkdir -p ~/.ssh
    echo "${{ secrets.DEPLOY_SSH_KEY }}" > ~/.ssh/deploy_key
    chmod 600 ~/.ssh/deploy_key
    
    # Déployer
    ssh -i ~/.ssh/deploy_key -o StrictHostKeyChecking=no \
      ${{ secrets.DEPLOY_USER }}@${{ secrets.DEPLOY_HOST }} << 'EOF'
      cd ${{ secrets.DEPLOY_PATH }}
      git pull origin main
      docker compose -f docker-compose.prod.yml down
      docker compose -f docker-compose.prod.yml up -d --build
    EOF
    
    echo "Déploiement terminé !"
```

### Étape 4 : Tester

```bash
# Faire un changement
git checkout develop
echo "test" >> test.txt
git add test.txt
git commit -m "test: Déploiement automatique"
git push origin develop

# Merger dans main
git checkout main
git merge develop
git push origin main

# GitHub Actions va :
# 1. Lancer les tests
# 2. Se connecter à votre serveur en SSH
# 3. Pull le code
# 4. Reconstruire les containers Docker
```

---

## Vérification du Déploiement

### Logs GitHub Actions

1. Allez sur GitHub.com
2. Votre repo > Actions
3. Cliquez sur le dernier workflow
4. Consultez les logs

### Sur le serveur

```bash
# Se connecter
ssh votre-serveur

# Vérifier les containers
docker ps

# Voir les logs
cd /path/to/Chess-RPG/App
docker compose -f docker-compose.prod.yml logs -f
```

---

## Rollback (Retour en arrière)

Si un déploiement pose problème :

```bash
# Option 1 : Revenir à un commit précédent
git checkout main
git reset --hard <commit-hash-precedent>
git push origin main --force

# Option 2 : Revenir à un tag
git checkout v1.0.0
git push origin main --force

# Sur le serveur, re-déployer
ssh votre-serveur
cd /path/to/Chess-RPG/App
git pull origin main
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```

---

## Troubleshooting

### GitHub Actions échoue à se connecter en SSH

```bash
# Vérifier que la clé SSH est correcte
cat ~/.ssh/id_rsa  # Copiez TOUT, y compris BEGIN/END
# Collez dans GitHub Secret DEPLOY_SSH_KEY

# Vérifier que le serveur accepte la clé
ssh -i ~/.ssh/id_rsa user@serveur
```

### Le déploiement se termine mais rien ne change

```bash
# Sur le serveur, vérifier
docker ps  # Les containers tournent ?
docker logs chess-rpg-api-prod  # Y a-t-il des erreurs ?

# Reconstruire manuellement
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d --build
```

### Base de données ne démarre pas

```bash
# Vérifier les permissions
ls -la /var/lib/docker/volumes/

# Recréer les volumes
docker compose -f docker-compose.prod.yml down -v
docker compose -f docker-compose.prod.yml up -d
```

---

## Sécurité

### Checklist

- [ ] Mots de passe forts dans `.env.production`
- [ ] `.env.production` jamais commité (vérifier `.gitignore`)
- [ ] Clés SSH protégées (chmod 600)
- [ ] Secrets GitHub configurés
- [ ] Firewall activé sur le serveur (autoriser ports 22, 80, 443)
- [ ] Pas de pgAdmin en production
- [ ] Certificat SSL configuré (HTTPS)

### Commandes serveur

```bash
# Firewall (UFW sur Ubuntu)
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable

# SSL avec Let's Encrypt (optionnel)
sudo apt install certbot
sudo certbot --nginx -d votre-domaine.com
```

---

## Monitoring

### Logs en temps réel

```bash
# Sur le serveur
docker compose -f docker-compose.prod.yml logs -f

# Logs d'un service spécifique
docker logs -f chess-rpg-api-prod
```

### Healthchecks

```bash
# API
curl http://votre-serveur.com/api/ping

# Base de données
curl http://votre-serveur.com/api/dbtest
```

---

## Ressources

- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Docker Compose Production](https://docs.docker.com/compose/production/)
- [SSH Key Setup](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
