# Chess RPG — Server

Serveur Express minimal pour l'API.

Installation et lancement :

```zsh
cd "/Users/dylan/Documents/Chess RPG/App/Server"
npm install
# développement (avec reload automatique)
npm run dev
# ou production
npm start
```

Endpoints utiles :
- GET /api/ping — vérifie que le serveur répond
- GET /api/hello — message de démonstration

Notes :
- Configure un fichier `.env` si tu veux changer le PORT (ex: PORT=4000)
