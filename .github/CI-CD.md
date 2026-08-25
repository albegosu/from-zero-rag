# CI/CD

## GitHub Actions Workflows

| Workflow | File | Trigger | Purpose |
|---|---|---|---|
| **Test Backend** | `test-backend.yml` | Push/PR → `main` (paths: `server/**`, `prisma/**`, `init-scripts/**`, `tests/**`) | `pnpm install` → `prisma generate` → `prisma migrate deploy` (against `pgvector/pgvector:pg16` service) → `vue-tsc --noEmit` → `pnpm test` → `pnpm build` |
| **Test Frontend** | `test-frontend.yml` | Push/PR → `main` (paths: `pages/**`, `components/**`, `layouts/**`, `stores/**`, `assets/**`, `plugins/**`, `composables/**`, `i18n/**`, `app.vue`, `nuxt.config.ts`) | `pnpm install` → `vue-tsc --noEmit` → `pnpm test` → `pnpm build` |
| **Docker Build** | `docker-build.yml` | Push to `main`, tags `v*`, PR to `main` | Build single root `Dockerfile` image and push to GHCR (PRs build only, no push) |
| **Deploy guides to Pages** | `pages.yml` | Push to `main` (paths: `docs/**`) or manual | Build VitePress (`pnpm run docs:build`) and deploy to GitHub Pages |
| **CI (unified)** | `ci.yml` | Push/PR → `main` | Lint, audit, typecheck, coverage tests, build |
| **Deploy (self-hosted)** | `deploy-self-hosted.yml` | Manual (`workflow_dispatch`) | SSH + `docker compose -f docker-compose.prod.yml up` (requires `SSH_*` secrets) |

> The two `test-*` workflows overlap on the unified Nuxt monorepo: each runs the full Vitest suite and a Nuxt build. The split is purely about scoping triggers via path filters so unrelated changes (docs-only edits under `docs/**`, etc.) skip the app CI jobs.

---

## Local Verification

Before opening a PR, run these locally:

```bash
# Install dependencies
pnpm install

# Type check + build
pnpm typecheck
pnpm build

# Tests (embryo agent/method, session, rate-limit, env)
pnpm test

# VitePress docs (when docs/** changes)
pnpm docs:build

# Database migrations (if schema changed)
pnpm db:migrate
```

---

## Docker Build

The Dockerfile uses a multi-stage build:

1. **deps** — `pnpm install --frozen-lockfile`
2. **builder** — `pnpm build` → `.output/`
3. **runner** — Node 20 Alpine, copies `.output/` + `prisma/`

Entrypoint: `docker-entrypoint.sh` runs `prisma migrate deploy` before starting the server.

Test locally:

```bash
docker build -t hypar:test .
docker run -p 3000:3000 --env-file .env hypar:test
```

The CI workflow (`docker-build.yml`) publishes images to `ghcr.io/<owner>/<repo>/app` tagged with the branch, PR number, semver (on `v*` tags) and short SHA.

---

## Deployment

> Production deployment is **not yet automated** — the project is in beta. The previous `deploy.yml` (SSH-based) and `release.yml` (tag-based GitHub Releases) workflows were removed; reintroduce them when there is a target host / release process.

### Docker Compose (self-hosted)

```bash
docker compose --profile full up -d --build
```

See [Docker guide](../docs/DOCKER.md) for the full guide.

### Railway / Render

1. Connect the GitHub repository
2. Add a PostgreSQL database (Railway provides one)
3. Set environment variables (see [`.env.example`](../.env.example) for the full list)
4. Deploy — the entrypoint runs migrations automatically

**Required env vars for cloud:**

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`
- `OLLAMA_URL` (and `OLLAMA_API_KEY` if using Ollama Cloud)
- `OLLAMA_LLM_MODEL`
