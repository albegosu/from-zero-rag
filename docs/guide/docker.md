<DocMicroLead />

# Docker Guide

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Nuxt 3 App    │────▶│  PostgreSQL 16   │     │     Ollama      │
│  (app, :3000)   │     │  + pgvector      │     │  (optional,     │
│  UI + API       │     │  (postgres,:5432)│     │   :11434)       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

Everything in one container — no separate frontend/backend split.

---

## Quick start

```bash
# 1. Configure
cp .env.example .env
# Edit .env — set GOOGLE_API_KEY (recommended) or OPENAI_API_KEY at minimum

# 2. Start (app + database + local Ollama)
docker compose --profile full up -d --build

# 3. Open
open http://localhost:3000
```

The app runs `prisma migrate deploy` automatically on startup — no manual migration step needed.

---

## Profiles

| Profile | Services started |
|---|---|
| `full` | app + postgres + ollama |
| `api` | postgres + ollama (no app) |
| `all` | same as `full` |

```bash
# Start everything
docker compose --profile full up -d --build

# Stop
docker compose --profile full down

# Stop and delete volumes (erases all data)
docker compose --profile full down -v
```

---

## Access

| Service | URL |
|---|---|
| App (UI + API) | http://localhost:3000 |
| PostgreSQL | localhost:5432 |
| Ollama (if running) | http://localhost:11434 |

---

## Environment variables

For the full variable reference, see [Environment variables](/guide/env). Below are the Docker-specific essentials.

### Minimum required

| Variable | Default | Description |
|---|---|---|
| `PORT` | 3000 | App port |
| `DATABASE_URL` | — | Full Postgres connection string (pgvector or Supabase) |

### PostgreSQL container (docker-compose only)

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_USER` | hypar | DB user |
| `POSTGRES_PASSWORD` | hypar_password | DB password |
| `POSTGRES_DB` | hypar_db | DB name |
| `POSTGRES_PORT` | 5432 | Postgres port |

### Provider selection

| Variable | Default | Description |
|---|---|---|
| `EMBEDDING_PROVIDER` | auto-detect | `gemini` / `openai` / `voyage` / `ollama-local` |
| `LLM_PROVIDER` | auto-detect | `anthropic` / `openai` / `mistral` / `ollama-cloud` / `ollama-local` |

---

## Useful commands

```bash
# Logs
docker compose logs -f app
docker compose logs -f postgres
docker compose logs -f ollama

# Shell access
docker compose exec app sh
docker compose exec postgres psql -U hypar -d hypar_db

# Rebuild after code changes
docker compose --profile full up -d --build

# Run a migration manually
docker compose exec app pnpm db:deploy

# Pull an Ollama model manually
docker compose exec ollama ollama pull llama3.1:8b
```

---

## Data volumes

| Volume | Contents |
|---|---|
| `postgres_data` | PostgreSQL data files |
| `ollama_data` | Downloaded Ollama models |
| `workflow_data` | Durable workflow state (ingestion) |

---

## First run

On first start, the Ollama container downloads the configured models. This can take several minutes depending on connection speed:

```bash
docker compose logs -f ollama
```

You will see `nomic-embed-text` and `llama3.1:8b` being pulled. The app is ready to use once both are downloaded.

---

## Health check

The app exposes `GET /api/health`:

```bash
curl http://localhost:3000/api/health
# {"status":"ok","checks":{"db":true,"embedding":true},"ts":"..."}
```

Docker Compose uses this endpoint to determine when the app container is healthy.

---

## Troubleshooting

**App cannot reach database:**
```bash
docker compose exec postgres pg_isready -U hypar
docker compose logs postgres
```

**Port already in use:**
Change `PORT` or `POSTGRES_PORT` in `.env`.

**Rebuild from scratch:**
```bash
docker compose --profile full down -v
docker system prune -a
docker compose --profile full up -d --build
```

**Backup database:**
```bash
docker compose exec postgres pg_dump -U hypar hypar_db > backup_$(date +%Y%m%d).sql
```

---

## Going to production?

The development `docker-compose.yml` exposes all ports and is not hardened for production. See the [Production deployment](/guide/production) guide — it uses `docker-compose.prod.yml` with Caddy for automatic TLS and keeps the database off the public network.

**Production tips:**
- Change all default passwords in `.env` before deploying
- Use a managed PostgreSQL service (Railway, Supabase, Neon) instead of the Docker container
- Add a reverse proxy (Caddy included, or nginx) for HTTPS
