# Local Development Setup

This guide explains how to run the full RasenBuerosport stack locally (Frontend + Backend + Database).

---

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| **Node.js** | >= 24.0.0 | [nodejs.org](https://nodejs.org/) |
| **gcloud CLI** | latest | [cloud.google.com/sdk](https://cloud.google.com/sdk/docs/install) |
| **Cloud SQL Auth Proxy** | latest | [cloud.google.com/sql/docs/postgres/connect-auth-proxy](https://cloud.google.com/sql/docs/postgres/connect-auth-proxy) |

Make sure you are authenticated with GCP:

```bash
gcloud auth login
gcloud auth application-default login
gcloud config set project rasenbuerosport-leipzig-9d54f
```

---

## Architecture Overview

```
Browser (localhost:5173)
   └── Striker (SvelteKit Frontend)
          ├── Firebase Auth (Google Sign-In)
          ├── Firebase Storage (Avatars, Screenshots)
          └── Playmaker API (localhost:3001)
                 └── Cloud SQL PostgreSQL (via Auth Proxy, localhost:5433)
```

---

## 1. Start the Cloud SQL Auth Proxy

The proxy creates a secure tunnel to the Cloud SQL PostgreSQL instance. We use port **5433** to avoid conflicts with any local PostgreSQL installation on 5432.

```bash
cloud-sql-proxy rasenbuerosport-leipzig-9d54f:europe-west3:rasenbuerosport-db --port=5433
```

Keep this terminal open. You should see:

```
Listening on 127.0.0.1:5433
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
| `DATABASE_URL` | `postgresql://postgres:PASSWORD@127.0.0.1:5433/rasenbuerosport` | Cloud SQL via proxy (port 5433!) |
| `FIREBASE_PROJECT_ID` | `rasenbuerosport-leipzig-9d54f` | Firebase project ID |
| `CORS_ORIGIN` | `http://localhost:5173` | Frontend origin for CORS |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | For AI features (predictions, reports) |

> **Note:** `DATABASE_URL` uses port **5433** (proxy port), not 5432. Ask a team member for the database password.

> **Note:** For Firebase Admin SDK authentication locally, `gcloud auth application-default login` is sufficient. No service account key file needed.

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

## Quick Start (All Three Terminals)

Open three terminal windows/tabs:

```bash
# Terminal 1 — Cloud SQL Proxy
cloud-sql-proxy rasenbuerosport-leipzig-9d54f:europe-west3:rasenbuerosport-db --port=5433

# Terminal 2 — Backend API
cd rasenbuerosport-leipzig-api
npm run dev

# Terminal 3 — Frontend
cd rasenbuerosport-leipzig-app
npm run dev
```

Then open **http://localhost:5173** in your browser.

---

## Database Migrations

If you need to set up a fresh database or run migrations:

```bash
# Make sure the Cloud SQL Proxy is running on port 5433
cd rasenbuerosport-leipzig-api

# Run the init schema
psql "postgresql://postgres:PASSWORD@127.0.0.1:5433/rasenbuerosport" -f migrations/001_init.sql

# Import seed data (profiles)
psql "postgresql://postgres:PASSWORD@127.0.0.1:5433/rasenbuerosport" -f migrations/002_import_data.sql

# Import all 633 teams from scraped data
DATABASE_URL="postgresql://postgres:PASSWORD@127.0.0.1:5433/rasenbuerosport" node scripts/import-teams.js
```

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

### Cloud SQL Proxy: "address already in use"

Port 5432 is likely used by a local PostgreSQL. Use port 5433 instead (as shown above) and make sure `DATABASE_URL` in your backend `.env` also uses port 5433.

### CORS errors in browser

Make sure `CORS_ORIGIN` in the backend `.env` matches your frontend URL exactly:

```
CORS_ORIGIN=http://localhost:5173
```

### Firebase Auth: "auth/unauthorized-domain"

Firebase Auth only allows sign-in from authorized domains. Add `localhost` to the authorized domains list in [Firebase Console → Authentication → Settings → Authorized domains](https://console.firebase.google.com/project/rasenbuerosport-leipzig-9d54f/authentication/settings).

### "permission-denied" on Cloud SQL

Make sure you have run `gcloud auth application-default login` and have the **Cloud SQL Client** role on the GCP project.
