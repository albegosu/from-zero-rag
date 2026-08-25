# Project Structure

## Root

```
Dockerfile                   Multi-stage image: builder (pnpm build) → runner (node)
docker-compose.yml           Development stack: app + postgres + ollama
docker-compose.prod.yml      Production stack: adds Caddy as reverse proxy
docker-entrypoint.sh         Container startup script (prisma migrate deploy + start)
Caddyfile                    Caddy configuration (TLS, reverse proxy to port 3000)
nuxt.config.ts               Nuxt config: modules, runtimeConfig, i18n, workflow
app.config.ts                Nuxt UI config (@nuxt/ui theme tokens)
app.vue                      SPA root component
tsconfig.json                TypeScript config (path aliases: ~/, @/)
vitest.config.ts             Unit test configuration
prisma.config.ts             Prisma 7 CLI config (schema path, datasource)
```

---

## Frontend

### pages/
```
index.vue                    Main chat page (RAG agent + conversations + recent documents)
upload.vue                   Document upload (pasted text or PDF/txt/md file)
setup.vue                    First-run wizard (provider config, first admin user)
documents/index.vue          Document list with search
documents/[id].vue           Document detail: chunks, re-chunking, deletion
auth/signin.vue              better-auth sign-in
auth/signup.vue              better-auth sign-up
admin/index.vue              Admin dashboard (stats)
admin/settings.vue           Runtime settings editor
admin/users.vue              User list + role management
admin/usage.vue              Query / usage report
```

### layouts/
```
default.vue                  Main layout: AppHeader + main + BottomNav
```

### components/
```
AppHeader.vue                Sticky header: logo, nav, theme toggle
BottomNav.vue                Fixed bottom navigation (mobile)
WelcomeModal.vue             First-visit / welcome modal
setup/                       Setup wizard shell + fields + step content
rag/                         Ingest progress, pipeline trace, RAG UI helpers
micro/                       Decorative micrographics (shared with VitePress theme)
```

### composables/
```
useAuth.ts                   Session + user id + admin flag (better-auth client)
useTerminalPrefs.ts          Theme preferences (light/dark, persisted in localStorage)
useConfigRepository.ts       Runtime config / wizard-related client helpers
useSearchParams.ts           URL/search helpers
useIngestProgress.ts         Document ingest polling UI
useLlmModels.ts              LLM model picker helpers
```

### stores/ (Pinia)
```
documents.ts                 User document list, fetch, loading state
```

### plugins/
```
i18n.ts                      Initialises vue-i18n with en/es locales
```

### assets/
```
css/main.css                 Terminal theme CSS variables (colours, glass, scanline, etc.)
```

### i18n/
```
locales/en.json              English translations
locales/es.json              Spanish translations
```

### utils/setup/
```
wizard-steps.ts              Setup wizard step catalog (providers, keys, first user)
```
(The old **`utils/learning/`** + **`pages/learn/*`** quest lived in a prior monorepo layout; see [Learning quest](/features/learning-quest).)

---

## Server (Nitro / Nuxt)

### server/api/
```
chat.post.ts                 Main chat endpoint
                             → validates body, resolves conversation, runs agent or memory command
                             → responds with UIMessageStream (streaming SSE)

documents/index.get.ts       GET    /api/documents         list user documents
documents/index.post.ts      POST   /api/documents         create document from text
documents/upload.post.ts     POST   /api/documents/upload  file upload (multipart)
documents/[id].get.ts        GET    /api/documents/:id     detail + chunks
documents/[id].delete.ts     DELETE /api/documents/:id     delete document and its chunks
documents/[id]/reprocess.post.ts   POST reprocess          re-ingest existing document
documents/[id]/ingest-status.get.ts GET ingest-status      workflow ingestion status

conversations/index.get.ts   GET    /api/conversations          list user conversations
conversations/index.post.ts  POST   /api/conversations          create new conversation
conversations/[id].get.ts    GET    /api/conversations/:id      messages in a conversation
conversations/[id].delete.ts DELETE /api/conversations/:id      delete conversation

search/index.post.ts         POST /api/search          hybrid vector + BM25 search
search/inspect.post.ts       POST /api/search/inspect  search with latency metrics (debug)
search/rag.post.ts           POST /api/search/rag      search + formatted context (no LLM)

admin/stats.get.ts           GET  /api/admin/stats
admin/usage.get.ts           GET  /api/admin/usage
admin/users.get.ts           GET  /api/admin/users
admin/users/[id].patch.ts    PATCH /api/admin/users/:id  (role changes)
admin/settings.get.ts        GET  /api/admin/settings
admin/settings.post.ts       POST /api/admin/settings

auth/[...].ts                better-auth HTTP handler (catch-all)

setup/complete.post.ts       Marks setup complete
setup/wizard-state.get.ts    GET wizard draft state
setup/wizard-state.post.ts   POST wizard draft state
setup/apply-wizard.post.ts   Apply wizard payload to settings

config/search-params.get.ts  Search tuning params for UI trace
config/llm-models.get.ts     LLM model catalog for pickers

health.get.ts                GET  /api/health          Docker container healthcheck
```

### server/utils/
```
agent.service.ts             RAG agent:
                             - agentStreamText(): calls streamText with searchKnowledgeBase tool
                             - runMemoryCommand(): executes /remember, /forget, /memory clear

agent-commands.ts            Slash command parser (/remember, /forget, /help, /memory clear)

search.service.ts            Search engine:
                             - search(): hybrid vector (cosine) + BM25 with MMR diversification
                             - rag(): search() + formats numbered context for the prompt
                             - inspect(): debug version with latency metrics
                             - logRagQuery(): persists each retrieval to the **`Query`** audit table

documents.service.ts         Document business logic:
                             - createDocument() / deleteDocument()
                             - startIngestion(): launches async ingestion workflow
                             - createChatMemory() / deleteChatMemories(): user memories

conversations.service.ts     Conversation and message management in DB:
                             - ensureConversation(): creates or retrieves active conversation
                             - appendUserMessage() / appendAssistantMessage()
                             - refreshConversationTitleFromUserPrompt()

chunking.ts                  splitIntoChunks(): splits text into chunks with configurable overlap
embedding.ts                 generateEmbedding() / generateEmbeddings(): calls Ollama or provider
ollama.ts                    normalizeOllamaNativeHost(): normalises Ollama URLs
prisma.ts                    Prisma client singleton
text.ts                      Text utilities: truncate(), stripNul() (removes null bytes from PDFs)
errors.ts                    Helpers: notFound(), badRequest(), internalError()
admin-auth.ts                `requireAuthOrAdminApiKey`: signed-in session OR `ADMIN_API_KEY` header
```

### server/plugins/
Nitro plugins: run at server startup before handling requests.
```
prisma.ts                    Connects Prisma on startup and disconnects on shutdown
workflow-init.ts             Creates WORKFLOW_LOCAL_DATA_DIR; attempts to load steps.mjs
register-workflow-steps.ts   Docker production fix: registers the 4 workflow steps directly
                             in the bundle (without relying on the generated steps.mjs)
```

### server/workflows/
```
ingest-document.ts           Async document ingestion workflow:
                             - ingestDocument()       'use workflow' → orchestrates the 4 steps
                             - parseChunks()          'use step' → splitIntoChunks()
                             - embedChunksWithRetry() 'use step' → generateEmbeddings() with retry
                             - persistChunks()        'use step' → DELETE + INSERT into Chunk table
                             - markStatus()           'use step' → updates ingestStatus on Document
```

### server/middleware/
```
rate-limit.ts                Per-IP (+ optional user) rate limits (chat, upload, …)
auth-session.ts              Attaches `event.context.auth` for better-auth
setup-guard.ts               Redirects to `/setup` until app is configured (when enabled)
00-client-ip.ts              Client IP helper for rate limiting / logging
```

---

## Database (Prisma + pgvector)

### prisma/schema.prisma
```
User / Session / Account / Verification   better-auth tables
Document      Uploaded document: title, content, type, userId, ingestStatus, chunkCount
Chunk         Document fragment: content, embedding (768-dim vector), textsearch (tsvector)
Conversation  Chat conversation: userId, title, timestamps
Message       Message within a conversation: role, content, parts (JSON), sources (JSON)
Query         Audit of each retrieval / chat completion: latency, sources, toolCalled, …
Setting       Runtime-tunable key/value pairs (admin settings + wizard)
```

### prisma/migrations/
```
20250424160000_init                  Initial tables + pgvector
20250424180000_embedding_dim_768     Vector dimension: 768
20260425120000_query_createdat_index Index on Query.createdAt
20260429100000_memory_userid         userId on memory-related documents
20260503120000_robustify_mvp         Conversations + Messages + Query audit fields
20260504000000_hybrid_search         tsvector + GIN for BM25 hybrid search
20260505000000_add_settings          Settings table for runtime config
20260512000000_add_auth              better-auth tables
20260512100000_userid_not_null       Stricter ownership on Document / Conversation
```

### init-scripts/
```
01-init.sql                  CREATE EXTENSION vector — runs before Prisma migrations
                             (Postgres init needs the extension before Prisma starts)
```

---

## Nuxt Modules

### modules/
```
copy-workflow-bundles.ts     Post-build: copies .nuxt/workflow/ → .output/server/workflow/
                             Required because the workflow runtime needs the bundles in production
```

---

## Tests

### tests/
```
chunking.spec.ts             Chunking algorithm tests (sizes, overlap, edge cases)
agent.spec.ts                Agent tests (parseMemoryCommand, message filtering)
search.spec.ts               Search engine tests (MMR, scoring, filters)
text.spec.ts                 Text utility tests (truncate, stripNul)
```

---

## CI/CD

### .github/workflows/
```
test-backend.yml             Server paths — prisma, tests, build
test-frontend.yml            UI paths — pages, components, build
docker-build.yml             Docker image → GHCR
pages.yml                    VitePress docs → GitHub Pages (docs/**)
```

> Older workflows (`deploy.yml`, `release.yml`, `test-learning.yml`, `ci.yml`) may appear in historical notes; see root `.github/CI-CD.md` for the live matrix.

---

## Operations

### scripts/
```
reingest-all.ts              Re-processes all existing documents
                             (useful after chunking or schema changes)
```

### Planned: eval harness
```
(eval-rag.ts + evals/golden.jsonl are roadmap items — not committed yet)
```

---

## Deployment

### Docker
```
.dockerignore                Excludes node_modules, .git, .nuxt, data/, etc. from build context
docker-entrypoint.sh         On startup: prisma migrate deploy → node server/index.mjs
```

### Environment variables (.env / docker-compose)
```
DATABASE_URL                 PostgreSQL connection string
OLLAMA_URL                   Ollama URL (embeddings + LLM)
OLLAMA_MODEL                 Embedding model (default: nomic-embed-text)
OLLAMA_LLM_MODEL             Chat model (default: llama3.1:8b)
EMBEDDING_DIMENSIONS         Vector dimensions (default: 768)
MEMORY_SCOPE                 local_per_user | global | disabled
ADMIN_API_KEY                Key for /api/admin/* endpoints
GOOGLE_API_KEY / OPENAI_API_KEY  Alternative embedding/LLM providers
```
