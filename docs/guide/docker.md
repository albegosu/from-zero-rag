<DocMicroLead />

# Docker Guide

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Nuxt 3 App    │────▶│  PostgreSQL 16   │     │     Ollama      │
│  (app, :3000)   │     │  (postgres,:5432)│     │  (optional,     │
│  UI + API       │     │                  │     │   :11434)       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

Everything in one container — no separate frontend/backend split. Ollama is the agent collaborator, not an embedding service.

---

## Quick start

```bash
# 1. Configure
cp .env.example .env
# Edit .env — set BETTER_AUTH_SECRET (openssl rand -hex 32)

# 2. Start (app + database + local Ollama)
docker compose --profile full up -d --build

# 3. Open
open http://localhost:3000
```

The app runs `prisma migrate deploy` automatically on startup — no manual migration step needed.

Compose sets `DATABASE_URL` and `OLLAMA_URL=http://ollama:11434` on the app service. You do not need `GOOGLE_API_KEY`.

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
| `BETTER_AUTH_SECRET` | insecure Compose fallback in **dev** compose only | Session secret — set a real value |

### PostgreSQL container (docker-compose only)

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_USER` | hypar | DB user |
| `POSTGRES_PASSWORD` | hypar_password | DB password |
| `POSTGRES_DB` | hypar_db | DB name |
| `POSTGRES_PORT` | 5432 | Postgres port |

### Agent

| Variable | Default | Description |
|---|---|---|
| `OLLAMA_URL` | `http://ollama:11434` in Compose | Agent endpoint |
| `OLLAMA_LLM_MODEL` | `llama3.1:8b` (pulled on first start) | Chat model |
| `LLM_PROVIDER` | — | Set `ollama-cloud` for Ollama Cloud |

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

---

## First run

On first start, the Ollama container downloads `OLLAMA_LLM_MODEL` (default `llama3.1:8b`). This can take several minutes:

```bash
docker compose logs -f ollama
```

The app is ready once Postgres is healthy and the app has migrated. The agent needs the model pull to finish before collaborator turns succeed.

---

## Health check

The app exposes `GET /api/health`:

```bash
curl http://localhost:3000/api/health
# {"status":"ok","checks":{"db":true},"ts":"..."}
```

`status` is `ok` when Postgres answers `SELECT 1`, otherwise `degraded`. Docker Compose uses this endpoint to mark the app container healthy.

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
