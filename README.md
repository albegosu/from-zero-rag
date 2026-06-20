# hypar

> **hypar** — production-ready RAG, built to learn from.

A learning-focused, full-stack **Retrieval-Augmented Generation (RAG)** app built as a single Nuxt 3 project. Upload documents, chat with an agent over your own knowledge base, and tune every layer of the pipeline at runtime from the admin settings.

> Designed to be **read like a tutorial**: every step (chunking, embedding, hybrid search, MMR, agentic tool-calling) is a small, named file you can open in your editor and follow end-to-end.

![Banner](https://github.com/user-attachments/assets/a2125d39-9f24-498c-b84e-b19ca6fbe45d)
<br>
[![Docker Build](https://github.com/albegosu/hypar/actions/workflows/docker-build.yml/badge.svg)](https://github.com/albegosu/hypar/actions/workflows/docker-build.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Nuxt](https://img.shields.io/badge/Nuxt-3-green)](https://nuxt.com/)
[![pgvector](https://img.shields.io/badge/pgvector-0.5-purple)](https://github.com/pgvector/pgvector)
[![Live demo](https://img.shields.io/badge/Live_demo-hypar.up.railway.app-black)](https://hypar.up.railway.app/)

**▶ Try it live: [hypar.up.railway.app](https://hypar.up.railway.app/)** · 📖 [Docs](https://albegosu.github.io/hypar/) · 🚀 [Deploy your own](#deploy-your-own)

---

## Why hypar?

Most RAG tutorials are toy scripts; most production RAG repos are black boxes. **hypar is both readable and real** — and it's what makes it worth your time:

- **Every stage is one small, named file you can open and follow** — chunking, embedding, hybrid search, MMR, HyDE, agentic tool-calling. No framework magic to reverse-engineer.
- **Tune the whole pipeline at runtime, no redeploy** — chunk size, top-K, hybrid α, MMR λ, HyDE on/off, search mode (`auto` / `search` / `direct`), system prompt — all live from `/admin/settings`.
- **One Nuxt 3 app, front-to-back** — same process for UI and API: no CORS, no separate backend, no microservice sprawl. Clone, set one API key, run.
- **Agentic, not just retrieval** — the LLM decides *whether* to search your knowledge base for each message, so small-talk doesn't waste an embedding round-trip.
- **Production-shaped** — multi-user auth, per-user document scoping, durable ingestion with retries, rate limits, citations, and an audit trail of what was retrieved.

If you want to *understand* RAG by reading and tweaking a working system — not just `pip install` a library — this is built for you.

---

## What is RAG?

**Retrieval-Augmented Generation (RAG)** gives an LLM access to your own documents at answer time, so it can ground its replies in facts it never saw during training. The flow is always the same three stages:

1. **Ingest** — split each document into small **chunks**, turn each chunk into a numeric **embedding**, store it in a vector database.
2. **Retrieve** — when the user asks something, embed the query, find the most similar chunks in the vector store (optionally combined with keyword search — *hybrid search*), and optionally re-rank them for diversity (**MMR**).
3. **Generate** — pass the retrieved chunks to the LLM as context and ask it to answer with citations.

This repo wires all three stages with knobs you can change live (chunk size, top-K, hybrid α, MMR λ, HyDE on/off, search mode `auto` / `search` / `direct`). The same app also acts as an **agent**: the LLM decides *whether* to call `searchKnowledgeBase` for a given message instead of always running RAG, so small-talk doesn't waste an embedding round-trip.

### Glossary

| Term | Meaning |
|---|---|
| **Chunk** | A bounded piece of a document (≈400 tokens). The unit of retrieval. |
| **Embedding** | A fixed-length vector (here 768 dims) that represents a chunk's meaning. |
| **pgvector** | PostgreSQL extension that stores vectors and computes cosine distance. |
| **BM25** | Classical keyword-relevance score; complements semantic search on names, codes, literals. |
| **Hybrid search** | Weighted blend of vector similarity and BM25, controlled by α ∈ [0, 1]. |
| **HyDE** | *Hypothetical Document Embeddings*: have the LLM draft a fake answer first, then embed *that* as the query. Often improves recall. |
| **MMR** | *Maximal Marginal Relevance*: re-rank to balance relevance vs. diversity, controlled by λ. |
| **top-K** | How many chunks survive to be shown to the LLM. |
| **Tool call** | The LLM decides to invoke a function (here `searchKnowledgeBase`) instead of replying directly. |
| **Agent / search mode** | `auto` = LLM decides; `search` = force retrieval; `direct` = skip retrieval. |

---

## Features

### RAG Chat & Search
- **Semantic Search** — vector similarity search with pgvector
- **RAG Mode** — context-aware AI responses with source citations
- **Conversational AI** — multi-turn dialogue with per-user memory
- **Agentic Chat** — AI SDK tool-calling routes queries to KB or replies directly; token-by-token streaming
- **Memory Commands** — `/remember`, `/forget`, `/memory clear`

### Document Management
- **Multi-format** — Text, Markdown, PDF upload (MIME-validated, 10 MB limit)
- **Token-aware Chunking** — ~400 tokens per chunk, 60-token overlap (`js-tiktoken` cl100k_base)
- **Multi-provider Embeddings** — Google Gemini (free) > OpenAI > Ollama
- **Async ingestion** — durable workflow + transactional persistence + retries on embed failures
- **Visible status** — every document has `pending`/`processing`/`ready`/`failed` + `chunkCount`
- **Reprocessing** — update embeddings on demand

### Retrieval quality
- **Hybrid search** — pgvector cosine similarity combined with PostgreSQL BM25 (`ts_rank_cd`); names, codes, and literals embeddings often miss still surface via keywords
- **HyDE (optional)** — hypothetical-document embedding: the LLM drafts a short answer, that text is embedded as the query, improving recall on factual Q&A (extra LLM call when enabled)
- **MMR re-ranking** — over-fetch K×3 then diversify with Maximal Marginal Relevance
- **Score threshold** — drop matches below 0.2 cosine similarity
- **Source citations** — `[1]`, `[2]` aligned with returned passages, persisted on every assistant message
- **Per-user scope** — chat memories and uploaded documents are tied to the signed-in user; retrieval uses that user’s corpus

### Persistence & history
- **Conversations + Messages tables** — chat history survives reloads, browser closes, devices
- **Audit trail** — every query logs which chunks were retrieved (`Query.sources`, `Query.toolCalled`)

### Multi-user & auth
- **Per-user documents & conversations** — every doc, chat, and memory is scoped to its owner
- **Admin dashboard** — `/admin/*` (stats, settings, users, usage) uses the `admin` route middleware (**signed-in session**). The first user created via `/setup` is promoted to `admin`; others can be promoted in `/admin/users`. **`/api/admin/*`** requires **`role === 'admin'`** or `ADMIN_API_KEY` (`requireAdmin` in `server/utils/admin-auth.ts`).

### Runtime configuration (`/admin/settings`)
- **Live tuning** — change chunking, search, hybrid α, RAG temperature, system prompt, agent max steps without restarting
- **Setup wizard** (`/setup`) — guided first-run config that writes the same DB-backed settings

### Safety & ops
- **Rate-limit middleware** — chat 30/min, upload 10/min per (IP+userId)
- **Admin auth** — `better-auth` session and/or `ADMIN_API_KEY` for `/api/admin/*` (see above)
- **Strict input validation** — Zod schemas + 64KB/part chat message cap
- **Tests** — `pnpm test` (vitest) covers chunking, text utils, agent commands, search

---

## Architecture

Everything runs as a **single Nuxt 3 app** on port 3000. The frontend and backend share the same process — no CORS, no separate API server.

```
┌──────────────────────────────────────────┐
│            Nuxt 3  (port 3000)           │
│                                          │
│  pages/          server/api/             │
│  ├── /           ├── chat.post.ts        │
│  ├── /documents  ├── documents/          │
│  ├── /upload     ├── search/             │
│  ├── /admin/*    ├── conversations/      │
│  ├── /auth/*     ├── setup/              │
│  └── /setup      └── admin/              │
│                                          │
│  server/utils/                           │
│  ├── prisma.ts (pgvector)                │
│  ├── embedding.ts (AI SDK providers)     │
│  ├── chunking.ts                         │
│  ├── documents.service.ts                │
│  ├── search.service.ts                   │
│  └── agent.service.ts (AI SDK tools)     │
│                                          │
│  server/workflows/                       │
│  └── ingest-document.ts (Workflow SDK)   │
└──────────────────────────────────────────┘
         │                    │
         ▼                    ▼
  PostgreSQL + pgvector    Ollama / Cloud LLM
```

### RAG Pipeline

```
INGESTION (async, durable, transactional)
  Upload → Workflow SDK job:
    parseChunks (≈400 tokens, 60 overlap)
    → embedChunks (3 retries, exp. backoff)
    → persistChunks (one transaction, cascades on failure)
    → markStatus (Document.ingestStatus = ready | failed)
  Returns runId immediately; poll /api/documents/:id/ingest-status

RETRIEVAL
  Query → embed → pgvector cosine ANN (HNSW) → fetch K×3
        → drop < minScore (0.2)
        → MMR diversify (λ=0.7)
        → top K

GENERATION (streaming)
  AI SDK tool call: searchKnowledgeBase →
    chunks accumulated in a per-request bucket →
    streamText with citation instructions →
    onFinish: persist Message + Query.sources for audit
```

### Recommended models

The default (`OLLAMA_LLM_MODEL=tinyllama`) keeps the stack runnable on a laptop
but **does not reliably tool-call** — the agent will often answer without ever
querying the knowledge base. For a useful experience switch to a model that
supports tool calling:

```bash
# In .env
OLLAMA_LLM_MODEL=qwen2.5:7b-instruct  # or llama3.1:8b
```

Embeddings (`nomic-embed-text`, 768 dims) work well as-is.

### Admin endpoints

`/api/admin/*` (`stats`, `usage`, `users`, `settings`) require **`role === 'admin'`**
(session) or a matching **`ADMIN_API_KEY`** header (see `.env.example`). The first
account from `/setup` is automatically promoted to `admin`; additional users can
be promoted in `/admin/users`.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Nuxt 3 (Vue 3 + Nitro/h3) |
| UI | Nuxt UI v3 + Tailwind CSS v4 |
| State | Pinia |
| ORM | Prisma 7 + `@prisma/adapter-pg` |
| Database | PostgreSQL 16 + pgvector |
| Embeddings | Google Gemini / OpenAI / Ollama |
| LLM | Ollama (local or cloud) — via OpenAI-compat endpoint |
| LLM / Chat SDK | Vercel AI SDK (`ai`, `@ai-sdk/vue`, `@ai-sdk/google`, `@ai-sdk/openai`) |
| Ingestion | Vercel Workflow SDK (`workflow`) — durable, per-step retries |
| Auth | `better-auth` (email + password, sessions, roles) |
| Runtime | Node.js 20 |

---

## Quick Start

### Prerequisites

- **Docker 20.10+** and **Docker Compose 2.0+**
- OR **Node.js 20+** and **pnpm 10+** for local dev
- A PostgreSQL instance with pgvector (the Docker setup includes one)
- At least one API key: [Google AI Studio](https://aistudio.google.com/app/apikey) (free, recommended) or OpenAI

---

### Option 1: Docker (recommended)

```bash
# 1. Clone
git clone https://github.com/albegosu/hypar.git
cd hypar

# 2. Configure
cp .env.example .env
# Edit .env — set GOOGLE_API_KEY (recommended) or OPENAI_API_KEY at minimum
# For Ollama Cloud: set OLLAMA_API_KEY + OLLAMA_URL (local Ollama needs no key)
# Optional: uncomment COMPOSE_PROFILES=full in .env so `docker compose up -d --build`
# starts app + postgres + ollama without passing --profile each time.

# 3. Start (app + postgres + ollama)
docker compose --profile full up -d --build

# 4. Open
open http://localhost:3000
```

**Profiles:**

| Profile | Services |
|---|---|
| `full` | app + postgres + ollama |
| `api` | postgres + ollama only (no app) |
| `all` | same as `full` |

**Stop:**
```bash
docker compose --profile full down
```

---

### Option 2: Local Development

```bash
# 1. Clone & install
git clone https://github.com/albegosu/hypar.git
cd hypar
pnpm install

# 2. Configure
cp .env.example .env
# Edit .env — set DATABASE_URL (see comments in .env.example) and at least GOOGLE_API_KEY

# 3. Run database migrations
pnpm db:migrate

# 4. Start dev server
pnpm dev
```

Open http://localhost:3000.

**Useful scripts:**

| Script | Description |
|---|---|
| `pnpm dev` | Start dev server with HMR |
| `pnpm build` | Production build |
| `pnpm start` | Run production build |
| `pnpm db:migrate` | Run Prisma migrations (dev) |
| `pnpm db:deploy` | Run migrations (production) |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm test` | Vitest (chunking, text utils, agent commands, search) |
| `pnpm typecheck` | `vue-tsc --noEmit` |
| `pnpm reingest` | Re-chunk & re-embed every document (after a chunking change) |
| `pnpm docs:dev` | VitePress dev server for `docs/` |
| `pnpm docs:build` | Static build → `docs/.vitepress/dist` (used by GitHub Pages) |
| `pnpm docs:preview` | Preview the built docs site locally |

---

### Environment variables

Copy [`.env.example`](.env.example) to `.env` and follow the comments inside. It is the **single tracked template** for Docker and local dev. Common additions for `pnpm dev` against Docker Postgres:

```env
DATABASE_URL=postgresql://rag:rag_password@localhost:5432/rag_db
OLLAMA_URL=http://localhost:11434
WORKFLOW_LOCAL_DATA_DIR=./data/workflow
```

With **Docker**, the compose file injects `DATABASE_URL` into the app container; you mainly need an embedding key (`GOOGLE_API_KEY` or `OPENAI_API_KEY`) or Ollama configured. The app runs `prisma migrate deploy` on container startup — no manual migration step for the full stack in Docker.

---

## Deploy your own

A live instance runs at **[hypar.up.railway.app](https://hypar.up.railway.app/)**. To host your own:

| Platform | How |
|---|---|
| **Render** | One-click via the included [`render.yaml`](render.yaml) Blueprint — provisions a Postgres (with `pgvector`) + the web service from the `Dockerfile`. Click **New → Blueprint**, point it at your fork, then set `GOOGLE_API_KEY`. |
| **Railway** | New project → Deploy from repo. Add a PostgreSQL plugin, enable the `vector` extension, set `DATABASE_URL` + `GOOGLE_API_KEY`. The image runs `prisma migrate deploy` on boot. |
| **Docker anywhere** | `docker compose -f docker-compose.prod.yml up -d` on any VM; put it behind the included [`Caddyfile`](Caddyfile) for automatic HTTPS. |

Minimum required env: `DATABASE_URL` (Postgres + pgvector) and one embedding key — `GOOGLE_API_KEY` (free tier, recommended) or `OPENAI_API_KEY`. See [`.env.example`](.env.example) for the full list.

---

## API Reference

All endpoints are under `/api/` (same origin, no CORS needed).

### Documents

```http
GET    /api/documents                         # list documents
POST   /api/documents                         # create from text/markdown
POST   /api/documents/upload                  # upload PDF/TXT/MD (multipart, max 10MB)
                                              # returns { documentId, runId, status: 'processing' }
GET    /api/documents/:id                     # get document + chunks
DELETE /api/documents/:id                     # delete document
POST   /api/documents/:id/reprocess           # re-embed (async) — returns { runId, status: 'processing' }
GET    /api/documents/:id/ingest-status?runId # poll workflow run status
```

### Chat (streaming)

```http
POST /api/chat           # streaming agentic chat (AI SDK UIMessageStream)
                         # body: { messages, userId?, limit? }
```

### Search

```http
POST /api/search         # semantic vector search
POST /api/search/rag     # RAG query (search only, no LLM)
POST /api/search/inspect # embedding debug + latency info
```

### Admin (signed-in session or `ADMIN_API_KEY`)

```http
GET  /api/admin/stats     # document/chunk/query counts
GET  /api/admin/usage     # recent query log + latency stats
GET  /api/admin/users     # list users, manage roles
GET  /api/admin/settings  # read runtime settings (by category)
POST /api/admin/settings  # update a runtime setting
```

---

## Project Structure

```
hypar/
├── nuxt.config.ts          # modules, runtimeConfig
├── app.vue / app.config.ts
├── prisma/
│   ├── schema.prisma       # User, Document, Chunk, Query, Setting, Conversation, Message
│   └── migrations/
├── assets/css/main.css     # Tailwind v4 + theme tokens
├── pages/
│   ├── index.vue           # RAG chat
│   ├── upload.vue
│   ├── setup.vue           # first-run wizard
│   ├── documents/          # list + detail
│   ├── auth/               # signin / signup
│   └── admin/              # stats, settings, users, usage
├── components/
│   ├── AppHeader.vue
│   ├── BottomNav.vue
│   ├── WelcomeModal.vue
│   ├── rag/                # IngestProgress, PipelineStepRow, RagPipelineTrace
│   ├── setup/              # wizard form + fields
│   └── micro/              # micrographic decoration
├── layouts/
│   └── default.vue
├── stores/
│   └── documents.ts
├── composables/            # useAuth, useConfigRepository, useSearchParams, …
├── utils/setup/            # wizard catalog + step definitions
└── server/
    ├── api/                # h3 route handlers
    │   ├── chat.post.ts
    │   ├── conversations/
    │   ├── documents/
    │   ├── search/
    │   ├── config/         # search-params endpoint for the UI trace
    │   ├── setup/
    │   ├── auth/           # better-auth handler
    │   └── admin/
    ├── workflows/
    │   └── ingest-document.ts   # durable ingest (Workflow SDK)
    ├── lib/auth.ts              # better-auth config
    ├── middleware/              # rate limit, setup guard
    ├── utils/                   # services + singletons
    │   ├── embedding.ts         # AI SDK embed/embedMany
    │   ├── chunking.ts
    │   ├── search.service.ts    # hybrid + MMR + HyDE
    │   ├── agent.service.ts     # streamText + searchKnowledgeBase tool
    │   ├── settings.service.ts  # runtime-tunable settings
    │   ├── conversations.service.ts
    │   └── documents.service.ts
    └── plugins/
```

---

## Further reading

- [CONTRIBUTING.md](CONTRIBUTING.md) — branch naming, commits, dev workflow
- [Roadmap](https://albegosu.github.io/hypar/roadmap) — what's shipped, in progress, and next (three tracks + v1.0 criteria)
- [Product vision](https://albegosu.github.io/hypar/product/vision) — calendar-free, dependency-ordered narrative of how far hypar can grow
- [.github/CI-CD.md](.github/CI-CD.md) — CI pipeline + Docker build
- **Published docs (GitHub Pages)** — full VitePress site at [https://albegosu.github.io/hypar/](https://albegosu.github.io/hypar/) (Guide, Features, API, Architecture, Roadmap, ADRs/RFCs). Build with `pnpm docs:build`; deploy on push to `main` when `docs/**` changes (see `.github/workflows/pages.yml`).

---

## License

MIT — see [LICENSE](LICENSE).

---

**Powered by [Resizes](https://resiz.es) to learn RAG architecture from scratch.**
