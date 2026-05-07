# Local Development Setup

This guide explains how to run the full RasenBuerosport stack locally (Frontend + Backend + Database).

The recommended local DB setup is a **Docker Postgres 16 seeded from a PROD snapshot** on port `5434`. The Cloud SQL Auth Proxy is only used for the one-off snapshot dump (and as a fallback for read-only debugging). This keeps your local app fully isolated from production.

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| **Node.js** | >= 24.0.0 | [nodejs.org](https://nodejs.org/) |
| **gcloud CLI** | latest | [cloud.google.com/sdk](https://cloud.google.com/sdk/docs/install) |
| **Cloud SQL Auth Proxy** | latest | [cloud.google.com/sql/docs/postgres/connect-auth-proxy](https://cloud.google.com/sql/docs/postgres/connect-auth-proxy) |
| **Docker Desktop** | latest | [docker.com](https://www.docker.com/products/docker-desktop/) |
| **psql / pg_dump** | >= 16 | `brew install libpq` (macOS) |

Authenticate with GCP and select the project:

```bash
gcloud auth login
gcloud auth application-default login
gcloud config set project rasenbuerosport-leipzig-9d54f
```

You need the **Cloud SQL Client** role on the GCP project to connect through the proxy.

---

## Architecture Overview

```
Browser (localhost:5173)
   └── Striker (SvelteKit Frontend)
          ├── Firebase Auth (Google Sign-In)
          ├── Firebase Storage (Avatars, Screenshots)
          └── Playmaker API (localhost:3001)
                 └── Local Docker Postgres 16 (localhost:5434)
                        ↑
                        └── seeded once from PROD via Cloud SQL Auth Proxy (5433)
```

---

## 1. Local Database (Docker Postgres + PROD Snapshot)

**One-time:** dump PROD into a local file, then start a Docker Postgres and restore the dump.

The full step-by-step (proxy → `pg_dump` → Docker → restore → `.env`) lives in the API repo:

➡ [`rasenbuerosport-leipzig-api/README.md` → *Local Development with a PROD Snapshot*](https://github.com/juniordev4life/rasenbuerosport-leipzig-api#local-development-with-a-prod-snapshot)

After the one-time setup you have:

- a Docker container `rbsl-pg` listening on `127.0.0.1:5434`
- DB user `postgres` / password `localdev` / database `rasenbuerosport`
- a persistent volume `rbsl-pg-data` that survives container restarts

Day-to-day commands:

```bash
docker start rbsl-pg   # resume after a reboot
docker stop rbsl-pg    # pause
```

---

## 2. Start the Backend (Playmaker)

### Clone & install

```bash
git clone git@github.com:your-org/rasenbuerosport-leipzig-api.git
cd rasenbuerosport-leipzig-api
npm install
```

### Configure environment

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Value | Description |
|----------|-------|-------------|
| `PORT` | `3001` | API server port |
| `HOST` | `0.0.0.0` | Bind address |
| `NODE_ENV` | `development` | Environment mode |
| `DATABASE_URL` | `postgresql://postgres:localdev@127.0.0.1:5434/rasenbuerosport` | Local Docker Postgres (port 5434) |
| `FIREBASE_PROJECT_ID` | `rasenbuerosport-leipzig-9d54f` | Firebase project ID |
| `CORS_ORIGIN` | `http://localhost:5173` | Frontend origin for CORS |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | For AI features (predictions, reports) |

> **Note:** Default local DB password is `localdev` (defined when you create the Docker container). It is **not** the PROD password.

> **Note:** For Firebase Admin SDK authentication locally, `gcloud auth application-default login` is sufficient. No service account key file needed.

> **Optional:** if you ever need to point the API at PROD directly (read-only debugging), keep the PROD `DATABASE_URL` commented in `.env` and start the Cloud SQL Auth Proxy on `5433` — but prefer the local snapshot for normal development.

### Start the dev server

```bash
npm run dev
```

The API runs at **http://localhost:3001**. Test it:

```bash
curl http://localhost:3001/api/v1/teams?limit=5
```

---

## 3. Start the Frontend (Striker)

### Clone & install

```bash
git clone git@github.com:your-org/rasenbuerosport-leipzig-app.git
cd rasenbuerosport-leipzig-app
npm install
```

### Configure environment

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

| Variable | Value | Description |
|----------|-------|-------------|
| `PUBLIC_FIREBASE_API_KEY` | `AIza...` | Firebase Web API Key |
| `PUBLIC_FIREBASE_AUTH_DOMAIN` | `rasenbuerosport-leipzig-9d54f.firebaseapp.com` | Firebase Auth domain |
| `PUBLIC_FIREBASE_PROJECT_ID` | `rasenbuerosport-leipzig-9d54f` | Firebase project ID |
| `PUBLIC_FIREBASE_STORAGE_BUCKET` | `rasenbuerosport-leipzig-9d54f.firebasestorage.app` | Firebase Storage bucket |
| `PUBLIC_FIREBASE_APP_ID` | `1:651313...` | Firebase App ID |
| `PUBLIC_API_URL` | `http://localhost:3001` | Backend API URL (local) |
| `PUBLIC_TOLGEE_API_KEY` | *(optional)* | Tolgee API key for i18n (only needed for translation editing) |
| `PUBLIC_TOLGEE_API_URL` | `https://app.tolgee.io` | Tolgee API URL |

> **Tip:** Get the Firebase config values from the [Firebase Console](https://console.firebase.google.com/project/rasenbuerosport-leipzig-9d54f/settings/general) under Project Settings → Your apps → Web app.

### Start the dev server

```bash
npm run dev
```

The app runs at **http://localhost:5173**.

---

## Quick Start (Two Terminals)

Once the local Docker Postgres has been seeded once, the day-to-day loop is just two terminals:

```bash
# Terminal 1 — Backend API (assumes `docker start rbsl-pg` has run)
cd rasenbuerosport-leipzig-api
docker start rbsl-pg
npm run dev

# Terminal 2 — Frontend
cd rasenbuerosport-leipzig-app
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## Database Tasks

### Refresh the local snapshot from PROD

Re-run the snapshot workflow in the API README. Short version:

```bash
# 1. Proxy to PROD (read-only)
cloud-sql-proxy rasenbuerosport-leipzig-9d54f:europe-west3:rasenbuerosport-db --port=5433

# 2. Dump (in another terminal, in the API repo)
set -a; source .env.prod; set +a   # or set DATABASE_URL inline
pg_dump "$DATABASE_URL" --no-owner --no-acl --format=plain --file=$HOME/rbsl-prod-dump.sql
sed -i.bak '/^SET transaction_timeout/d' $HOME/rbsl-prod-dump.sql   # if pg_dump >= 17

# 3. Reset local DB and restore
docker exec -e PGPASSWORD=localdev rbsl-pg psql -U postgres -c "DROP DATABASE rasenbuerosport;"
docker exec -e PGPASSWORD=localdev rbsl-pg psql -U postgres -c "CREATE DATABASE rasenbuerosport;"
PGPASSWORD=localdev psql -h 127.0.0.1 -p 5434 -U postgres -d rasenbuerosport \
  -v ON_ERROR_STOP=1 -f $HOME/rbsl-prod-dump.sql
```

### Run migrations on a fresh local DB

If you ever start from an empty Docker Postgres instead of a PROD snapshot:

```bash
cd rasenbuerosport-leipzig-api

# Schema
PGPASSWORD=localdev psql -h 127.0.0.1 -p 5434 -U postgres -d rasenbuerosport -f migrations/001_init.sql

# Initial data
PGPASSWORD=localdev psql -h 127.0.0.1 -p 5434 -U postgres -d rasenbuerosport -f migrations/002_import_data.sql

# All 633 teams from scraped data
DATABASE_URL="postgresql://postgres:localdev@127.0.0.1:5434/rasenbuerosport" node scripts/import-teams.js
```

> Migrations against PROD must go through the Cloud SQL Proxy (`127.0.0.1:5433`) and are usually run as part of a release, not from a developer machine.

---

## Available Scripts

### Frontend (Striker)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (port 5173) |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run check` | Run Biome lint + format with auto-fix |
| `npm run lint:check` | Check linting (no fix) |
| `npm run format:check` | Check formatting (no fix) |
| `npm run deploy` | Build and deploy to Firebase Hosting |

### Backend (Playmaker)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start with file watching (port 3001) |
| `npm start` | Start without watching |
| `npm test` | Run tests (Vitest) |
| `npm run test:coverage` | Run tests with coverage |
| `npm run check` | Run Biome lint + format with auto-fix |
| `npm run lint:check` | Check linting (no fix) |
| `npm run format:check` | Check formatting (no fix) |

---

## Troubleshooting

### Docker: `Cannot connect to the Docker daemon`

Docker Desktop is not running. Start the Docker Desktop app and wait until the whale icon in the menu bar is green, then retry.

### Postgres: `port is already allocated` on 5434

Another container or local Postgres is using 5434. Either stop that process or pick a different host port (e.g. `-p 5435:5432` when creating the container) and update `DATABASE_URL` accordingly.

### Restore fails on `unrecognized configuration parameter "transaction_timeout"`

Your `pg_dump` is version 17+ but the local container runs Postgres 16. Strip the line:

```bash
sed -i.bak '/^SET transaction_timeout/d' $HOME/rbsl-prod-dump.sql
```

### Cloud SQL Proxy: "address already in use"

Port 5432 is likely used by a local PostgreSQL. Use port 5433 (proxy) and 5434 (Docker) as shown above. Make sure `DATABASE_URL` matches the port you actually want to talk to.

### CORS errors in browser

Make sure `CORS_ORIGIN` in the backend `.env` matches your frontend URL exactly:

```
CORS_ORIGIN=http://localhost:5173
```

### Firebase Auth: "auth/unauthorized-domain"

Firebase Auth only allows sign-in from authorized domains. Add `localhost` to the authorized domains list in [Firebase Console → Authentication → Settings → Authorized domains](https://console.firebase.google.com/project/rasenbuerosport-leipzig-9d54f/authentication/settings).

### "permission-denied" on Cloud SQL

Make sure you have run `gcloud auth application-default login` and have the **Cloud SQL Client** role on the GCP project.
