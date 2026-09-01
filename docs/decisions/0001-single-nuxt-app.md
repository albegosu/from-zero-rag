---
status: accepted
date: 2026-08-01
---

# ADR 0001: Single Nuxt application

- **Status:** accepted
- **Date:** 2026-08-01

## Context

Hypar previously explored a multi-app layout (separate NestJS API, UI, playground). The durable outcome after unification and the post-RAG pivot is one process serving UI and API.

## Decision

Hypar is a **single Nuxt 3 application**: Vue 3 on the client, Nitro (`h3`) routes on the same origin/port, Prisma 7 + PostgreSQL for persistence. There is no separate API repo and no CORS split — the UI calls relative `/api/*` routes.

## Consequences

- One `pnpm dev`, one Dockerfile story, fewer moving parts for lab iteration.
- Server logic lives under `server/api/` and `server/utils/`.
- Historical migration intent (pre-pivot RAG monorepo) is preserved in [monorepo-unification](./monorepo-unification) (historical) — not a map of today's tree.

## Sources

- [Architecture](/architecture) — “single Nuxt 3 application”
- [Getting started](/guide/getting-started) — single Nuxt 3 process
- [History](/history) — infrastructure carried forward after the pivot
- [monorepo-unification](./monorepo-unification) — historical plan
