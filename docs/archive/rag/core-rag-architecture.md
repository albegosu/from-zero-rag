# Technical Architecture

::: tip
For a shorter overview and diagrams, start at the [Architecture landing](./index).
:::

hypar is a single Nuxt 3 application. The frontend (Vue 3) and the backend (Nitro/h3 server routes) run in the same process on port 3000. There is no separate API server.

---

## System Overview

```
┌──────────────────────────────────────────────────────┐
│                  Nuxt 3  (port 3000)                 │
│                                                      │
│  Vue 3 pages + components                            │
│  ├── /               RAG chat (streaming)            │
│  ├── /documents      Document management             │
│  ├── /upload         Async file upload               │
│  ├── /setup          First-run wizard + provider config                    │
│  ├── /auth/*         Sign in / sign up (better-auth)                       │
│  └── /admin/*        Stats, settings, users, usage                         │
│                                                      │
│  Nitro server (h3)                                   │
│  └── server/api/                                     │
│      ├── chat.post.ts   streaming chat (AI SDK)      │
│      ├── documents/     CRUD + async file upload     │
│      ├── search/        vector search + RAG debug    │
│      └── admin/         stats, usage, users, settings                      │
│                                                      │
│  server/workflows/                                   │
│  └── ingest-document.ts  durable ingest (Workflow SDK)│
│                                                      │
│  server/utils/                                       │
│  ├── prisma.ts          Prisma singleton             │
│  ├── embedding.ts       AI SDK embed/embedMany       │
│  ├── chunking.ts        text splitting               │
│  ├── ollama.ts          URL normalisation helper     │
│  ├── documents.service.ts                            │
│  ├── search.service.ts                               │
│  └── agent.service.ts   AI SDK tools + streamText   │
└──────────────────────────────────────────────────────┘
          │                          │
          ▼                          ▼
  PostgreSQL + pgvector      Embedding / LLM providers
  (vector(768) columns)      Google Gemini / OpenAI / Ollama
```

---

## RAG Pipeline

### Ingestion (async, durable)

```
Upload (text / PDF / MD)
  → Text extraction (pdf-parse for PDFs)
  → createDocumentShell() — Prisma document row created, returns immediately
  → Workflow SDK job starts: ingestDocument(documentId, content)
       Step 1: Chunking — tiktoken (cl100k_base), ~400 tokens per chunk, 60-token overlap
       Step 2: Embeddings — 768-dim via AI SDK embedMany()
                            priority: Google Gemini → OpenAI → Ollama
                            LRU cache (256 entries) prevents re-computation
       Step 3: Persist — transactional DELETE old chunks + INSERT new rows (pgvector)
  → Client polls GET /api/documents/:id/ingest-status?runId=... until terminal status
```

Upload returns `{ documentId, runId, status: 'processing' }` immediately.
Reprocess works the same way: deletes old chunks, starts a new workflow run.

### Retrieval + Generation (streaming)

```
User message
  → /api/chat — agentStreamText()
  → AI SDK streamText() with searchKnowledgeBase tool definition
  → Model decides: call tool or reply directly
       If tool called:
         → rag(query) — optional HyDE expansion, then hybrid vector + BM25 + MMR
         → Returns context + sources to model
       → Model streams answer token-by-token
  → UIMessageStream sent to browser (@ai-sdk/vue Chat class)
  → Sources and retrieved chunks shown in chat UI
```

### Agent Tool Definition

`buildKbTools()` in `server/utils/agent.service.ts` defines one tool:

```typescript
searchKnowledgeBase: tool({
  description: "Search the user's uploaded documents and personal memory...",
  inputSchema: z.object({ query: z.string().min(1) }),
  execute: async ({ query }) => rag(query, limit, userId),
})
```

The model calls this whenever the answer might depend on uploaded files or memories.
Memory commands (`/remember`, `/forget`, `/memory clear`) short-circuit before the tool call.

---

## Database schema (Prisma)

The source of truth is `prisma/schema.prisma`. At a glance:

- **`Document`** — `title`, `content`, `sourceType`, optional `userId`, `metadata`, `ingestStatus`, `ingestError`, `chunkCount`.  
- **`Chunk`** — `documentId`, `content`, `embedding vector(768)`, `index`, `tokenCount`, `startChar`, `endChar` (+ generated `textsearch` for BM25 via migrations).  
- **`Conversation`** / **`Message`** — persisted chat; assistant rows may store `sources` JSON.  
- **`Query`** — audit log: `queryText`, `responseText`, `sources`, `latencyMs`, `userId`, `conversationId`, `toolCalled`.

See migrations under `prisma/migrations/` for HNSW and full-text indexes.

---

## Embedding Providers

Priority order (first configured wins):

| Provider | Env var | Model | Notes |
|---|---|---|---|
| Google Gemini | `GOOGLE_API_KEY` | `gemini-embedding-001` | Free tier: 10M tokens/min |
| OpenAI | `OPENAI_API_KEY` | `text-embedding-3-small` | Paid |
| Ollama | `OLLAMA_URL` + `OLLAMA_MODEL` | `nomic-embed-text` | Local or cloud (OpenAI-compat) |

All providers output 768-dim vectors via the AI SDK (`embed` / `embedMany`). `EMBEDDING_DIMENSIONS` must match the pgvector column.

Ollama is accessed via `@ai-sdk/openai` pointed at `OLLAMA_URL/v1` — no separate Ollama npm client.

---

## API Endpoints

### Chat
```
POST /api/chat            body: { messages, userId?, limit? }
                          Returns: UIMessageStream (token-by-token)
```

### Documents
```
GET    /api/documents
POST   /api/documents               body: { title, content, sourceType }
POST   /api/documents/upload        multipart/form-data, max 10MB
                                    returns: { documentId, runId, status: 'processing' }
GET    /api/documents/:id
DELETE /api/documents/:id
POST   /api/documents/:id/reprocess returns: { runId, status: 'processing' }
GET    /api/documents/:id/ingest-status?runId=...
                                    returns: { runId, status, chunkCount }
```

### Search
```
POST /api/search          body: { query, limit?, userId? }
POST /api/search/rag      body: { query, limit?, userId? }
POST /api/search/inspect  body: { query }
```

### Admin
```
GET  /api/admin/stats
GET  /api/admin/usage
GET  /api/admin/users
PATCH /api/admin/users/:id     body: { role: 'admin' | 'user' }
GET  /api/admin/settings         query: ?category=...
POST /api/admin/settings         body: { key, value, category }
```

Auth uses `requireAdmin`: session with **`role === 'admin'`**, **or** `Authorization: Bearer <ADMIN_API_KEY>` / `x-admin-key` when `ADMIN_API_KEY` is set. See [API reference](/api/reference) and `server/utils/admin-auth.ts`.

---

## Memory System

`MEMORY_SCOPE` controls how chat memories are scoped:

| Value | Behavior |
|---|---|
| `local_per_user` | memories are scoped to `userId`, isolated per user |
| `global` | all users share the same memory pool |
| `disabled` | memory commands and proactive saving are off |

Memories are stored as `Document` rows with `metadata.kind = 'chat_memory'`.

---

## Workflow SDK

Document ingestion uses the [Vercel Workflow SDK](https://github.com/vercel/workflow-js) for durability:

- Each step (chunk / embed / persist) is retried independently on failure
- State is written to `WORKFLOW_LOCAL_DATA_DIR` (file-based, no external queue needed)
- `server/plugins/workflow-init.ts` creates the directory on server startup
- Upload and reprocess both return a `runId` immediately; poll `ingest-status` for completion

---

## Performance

- **Embedding LRU cache** (256 entries) — avoids re-computing identical texts
- **HNSW index** — sub-linear approximate nearest-neighbor search at scale
- **Prisma `globalThis` singleton** — prevents connection pool exhaustion during HMR in dev
- **Streaming responses** — `streamText().toUIMessageStreamResponse()` pipes tokens as they arrive

---

## Security Notes

- File uploads are validated for MIME type and capped at 10MB in `server/api/documents/upload.post.ts`
- All route inputs are validated with zod schemas (`readValidatedBody`)
- Secrets are read via `useRuntimeConfig()` — never from `process.env` directly in route handlers
- Admin `/api/admin/*` routes use `requireAdmin` — admin role and/or `ADMIN_API_KEY` when configured (see `server/utils/admin-auth.ts`)
- Global `Setting` secrets are AES-256-GCM encrypted at rest (`server/utils/settings.service.ts`)
- No CORS configuration needed (same-origin)

---

*Last updated: 2026-05-12*
