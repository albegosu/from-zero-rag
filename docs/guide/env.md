<DocMicroLead />

# Environment variables

The **canonical template** is `.env.example` at the repository root. After cloning:

```bash
cp .env.example .env
```

Edit `.env` for your machine; never commit real secrets.

- **Docker Compose:** Postgres and the app get defaults from `docker-compose.yml`. Compose overrides `DATABASE_URL` to the `postgres` service. See [Docker guide](./docker).
- **Local `pnpm dev`:** set `DATABASE_URL`, `OLLAMA_URL`, and `BETTER_AUTH_SECRET` (or `AUTH_SECRET`). Boot validation requires those three.
- **Local vs Compose credentials:** `.env.example` uses `postgresql://hypar:hypar_local@localhost:5432/hypar`. Compose defaults are user `hypar`, password `hypar_password`, database `hypar_db`. Match them, or set `DATABASE_URL` to whatever you actually run.

**Cross-links (optional):** `NUXT_PUBLIC_DOCS_SITE_URL` points the Nuxt app header to your published docs (defaults to the GitHub Pages URL).

---

## Required at boot

| Variable | Description |
|---|---|
| `DATABASE_URL` | Full Postgres connection string. |
| `BETTER_AUTH_SECRET` or `AUTH_SECRET` | Session secret, min 16 characters (32+ in production: `openssl rand -hex 32`). |
| `OLLAMA_URL` | Ollama base URL. Local `http://localhost:11434` or `https://ollama.com` for cloud. |

Startup fails if any of these are missing (`server/utils/env-validation.ts`).

---

## Ollama (agent collaborator)

The embryo agent talks to Ollama over the OpenAI-compatible `/v1/chat/completions` API. There is no embedding pipeline.

| Variable | Description |
|---|---|
| `OLLAMA_URL` | Base URL. Required. |
| `OLLAMA_LLM_MODEL` | Chat model (example local: `llama3.2`; Compose default pull: `llama3.1:8b`). |
| `OLLAMA_API_KEY` | Auth key for [Ollama Cloud](https://ollama.com/settings/keys). |
| `LLM_PROVIDER` | Set `ollama-cloud` when using Ollama Cloud. |
| `OLLAMA_CHAT_TIMEOUT_MS` | LLM response timeout in ms (default: `180000`). |

Settings can override the model for the next agent turn (cookie `hypar-llm-model`, sent as `{ model }` on `POST /api/embryos/:id/agent`).

---

## Database

| Variable | Description |
|---|---|
| `DATABASE_URL` | Full Postgres connection string. Required. |

**Local example** (matches `.env.example`):

```
DATABASE_URL=postgresql://hypar:hypar_local@localhost:5432/hypar
```

**Compose example** (service hostname `postgres`):

```
DATABASE_URL=postgresql://hypar:hypar_password@postgres:5432/hypar_db
```

The schema is Prisma 7 + PostgreSQL. No `pgvector` column is required for embryos (the Compose image is still `pgvector/pgvector:pg16` for historical convenience).

---

## Auth

| Variable | Description |
|---|---|
| `BETTER_AUTH_SECRET` / `AUTH_SECRET` | Session secret. |
| `BETTER_AUTH_URL` | Public origin, e.g. `http://localhost:3000`. |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Optional GitHub OAuth. Both required to show the button. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional Google OAuth. Both required to show the button. |

See [Authentication](./auth).

---

## Application

| Variable | Default | Description |
|---|---|---|
| `NUXT_PUBLIC_DOCS_SITE_URL` | GitHub Pages docs URL | Docs link in the app header. |
| `PORT` | `3000` | App port (Compose). |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | see Compose | Only used by the Postgres container. |

Anything in this file is read once at boot from the environment.
