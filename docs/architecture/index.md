# Architecture

Hypar is a **single Nuxt 3 application**: Vue 3 on the client, **Nitro** (`h3`) server routes on the same port, **Prisma 7** + **PostgreSQL** for persistence, and the **Vercel AI SDK** for agent interactions via Ollama.

There is no separate API repo and no CORS split — the UI calls relative `/api/*` routes.

---

## High-level diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Vue 3)                        │
│  pages/*  components/*  Pinia stores                       │
└──────────────────────────┬────────────────────────────────┘
                           │ same origin
┌──────────────────────────▼────────────────────────────────┐
│                  Nitro server (Nuxt)                      │
│  server/api/embryos/*  — CRUD + agent endpoint            │
│  server/utils/*        — prisma, session, logger          │
└───────────────┬───────────────────────┬───────────────────┘
                │                       │
                ▼                       ▼
          PostgreSQL 16           Ollama (local or cloud)
                                  via OpenAI-compatible API
```

---

## Domain: Embryo

The data model centers on the **Embryo** — a unit of knowledge with a lifecycle.

| Model | Purpose |
| --- | --- |
| **Embryo** | The idea. Has a `seed` (text), `state` (lifecycle), timestamps. |
| **EmbryoEvent** | Audit log: every state change, tension, agent question is an event. |
| **Tension** | An open question attached to an embryo. Can be raised by user or agent. |
| **Connection** | A typed link between two embryos (supports, contradicts, extends, merges_into). |
| **AgentNote** | Agent output stored per embryo (questions, suggestions). |

States: `LATENT → GERMINATING → GROWING → MATURE → FOSSIL`

No delete. Fossilization preserves the idea, the reason it died, and its full event history.

---

## Agent integration

The agent endpoint (`/api/embryos/[id]/agent`) calls Ollama via the OpenAI-compatible `/v1/chat/completions` API using `@ai-sdk/openai` with `compatibility: 'compatible'`.

The agent's role is constrained: ask one challenging question per invocation. No summaries, no validation, no preamble.

---

## Layer responsibilities

| Layer | Path | Responsibility |
| --- | --- | --- |
| UI | `pages/`, `components/` | Embryo garden, detail page, auth, admin stubs. |
| API | `server/api/embryos/**` | CRUD, state transitions, fossilization, agent. |
| Store | `stores/embryos.ts` | Pinia store with computed views (`byState`, `alive`). |
| Data | `prisma/schema.prisma` | Embryo domain + better-auth models. |

---

## Deployment

- **Development:** `pnpm dev` + local PostgreSQL + Ollama (local or cloud)
- **Docker:** `docker compose --profile full` runs app + Postgres + Ollama
- **Production:** see [Production deployment](/guide/production)

---

## Next

- [Embryo concept →](/concepts/embryo)
- [Getting started →](/guide/getting-started)
- [Contributing →](/contributing)
