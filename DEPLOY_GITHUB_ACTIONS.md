# Déploiement via GitHub (GHCR + SSH)

Ce repo inclut :
- Un `Dockerfile` (image Next.js production)
- Un `docker-compose.yml` (run sur serveur)
- Un workflow GitHub Actions `Deploy (GHCR + SSH)`

## 1) Pré-requis serveur

- Docker + Docker Compose plugin installés
- Un dossier (ex: `/opt/wewinbid`) contenant :
  - `docker-compose.yml`
  - un fichier `.env` avec les variables d'environnement

Exemple :
```bash
sudo mkdir -p /opt/wewinbid
sudo cp docker-compose.yml /opt/wewinbid/
sudo nano /opt/wewinbid/.env
```

## 2) Secrets GitHub Actions

Dans GitHub → Settings → Secrets and variables → Actions → **New repository secret** :

- `DEPLOY_HOST` : IP/DNS du serveur
- `DEPLOY_USER` : user SSH
- `DEPLOY_SSH_KEY` : clé privée (format OpenSSH)
- `DEPLOY_PORT` : (optionnel) port SSH
- `DEPLOY_PATH` : (optionnel) chemin, défaut `/opt/wewinbid`

Optionnel si ton serveur ne peut pas pull GHCR sans login :
- `GHCR_USER` : user/owner
- `GHCR_PAT` : token GitHub avec scope `read:packages`

## 3) Déclencher le déploiement

- Onglet **Actions** → workflow **Deploy (GHCR + SSH)** → **Run workflow**
- Laisse `ref=main` ou mets un tag/SHA

Le workflow :
1. Build l'image et la pousse sur `ghcr.io/<owner>/<repo>`
2. Se connecte au serveur via SSH
3. `docker compose pull && docker compose up -d`

## 4) Variables d'environnement runtime

Minimum :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`

Le reste dépend des features (Stripe, OpenAI, Upstash, Sentry, etc.).
