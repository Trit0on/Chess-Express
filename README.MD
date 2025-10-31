# Chess‑Express 

```bash
git clone <repo>
cd Chess-RPG
```

---

# Lancer le container docker pour la BDD (d'office port 5432)
```bash
docker compose up -d db
```

## Variables d’environnement (Server/.env)

Crée le fichier **`Server/.env`** (au même niveau que `index.js`) (Reprendre le .env.example)


Astuce pour générer une chaîne hex aléatoire pour les tokens :
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Installer les dépendances backend

```bash
cd Server
npm install
```

---

## Prisma: initialiser la base

Vérifie Prisma puis applique les migrations :

```bash
npx prisma -v
npx prisma migrate dev --name add-refresh-session
# interface de prisma
npx prisma studio
```

---

## Lancer l’API

Depuis le dossier **Server** :

```bash
npm run dev     # ou: node index.js
```