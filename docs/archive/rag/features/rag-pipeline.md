# RAG pipeline

hypar implements **retrieval-augmented generation** as one Nuxt 3 app: Vue pages, Nitro `/api/*` routes, Prisma + pgvector, and the Vercel AI SDK for embeddings, tool-calling, and streaming chat.

This page describes the **end-to-end flow** from documents to answers. For hybrid retrieval details, see [Hybrid search & HyDE](./search). For chat memory commands, see [Memory & commands](./memory).

---

## 1. Ingestion (documents → chunks → vectors)

### Entry points

| Action | API | What happens |
| --- | --- | --- |
| Create from text | `POST /api/documents` | Body: `title`, `content`, `sourceType` (`text` \| `markdown`), optional `userId`, `metadata`. Starts async ingest. |
| Upload file | `POST /api/documents/upload` | Multipart PDF / TXT / MD (MIME-validated, size-capped). Text extracted, then same pipeline. |
| Re-embed | `POST /api/documents/:id/reprocess` | Deletes existing chunks for the document and runs ingest again. |

Successful creation returns identifiers so the UI can **poll** ingest status (see [API reference](/api/reference#documents)).

### Chunking

`server/utils/chunking.ts` splits plain text with **tiktoken** (`cl100k_base`):

- Default **~400 tokens** per chunk  
- **60-token overlap** between consecutive chunks  
- Each chunk records `startChar` / `endChar` / `tokenCount` for citations and debugging  

### Durable workflow

`server/workflows/ingest-document.ts` uses the **Workflow SDK** (`'use workflow'` / `'use step'`):

1. **`parseChunks`** — token-aware split (retryable step).  
2. **`embedChunksWithRetry`** — batch embeddings via `generateEmbeddings` (exponential backoff, up to 3 attempts).  
3. **`persistChunks`** — transactional delete of old chunks + insert new rows with `vector(768)` embeddings.  
4. **`markStatus`** — sets `Document.ingestStatus` to `ready` or `failed` and updates `chunkCount` / `ingestError`.

State is stored under `WORKFLOW_LOCAL_DATA_DIR` (see [Environment variables](/guide/env)).

### Embeddings provider

`server/utils/embedding.ts` resolves the active provider using `EMBEDDING_PROVIDER` for explicit selection, or falls back to the first detected API key:

| `EMBEDDING_PROVIDER` | Key required | Default model |
|---|---|---|
| `gemini` | `GOOGLE_API_KEY` | `gemini-embedding-001` |
| `openai` | `OPENAI_API_KEY` | `text-embedding-3-small` |
| `voyage` | `VOYAGE_API_KEY` | `voyage-3` (OpenAI-compatible endpoint) |
| `ollama-local` | `OLLAMA_URL` | `OLLAMA_MODEL` (default: `nomic-embed-text`) |

**Fallback order** (when `EMBEDDING_PROVIDER` is unset): Gemini → OpenAI → Voyage → Ollama.

Override the model for any provider with `EMBEDDING_MODEL`. Vector dimension must match the DB column (`768` by default, controlled by `EMBEDDING_DIMENSIONS`).

---

## 2. Retrieval in chat (agent + tool)

### LLM provider

`server/utils/agent.service.ts` resolves the active chat model via `getLlmModel()`, using `LLM_PROVIDER` for explicit selection or the first detected API key:

| `LLM_PROVIDER` | Key required | Default model |
|---|---|---|
| `anthropic` | `ANTHROPIC_API_KEY` | `ANTHROPIC_MODEL` (default: `claude-sonnet-4-6`) |
| `openai` | `OPENAI_API_KEY` | `OPENAI_LLM_MODEL` (default: `gpt-4.1-mini`) |
| `mistral` | `MISTRAL_API_KEY` | `MISTRAL_MODEL` (default: `mistral-medium-latest`) |
| `ollama-cloud` | `OLLAMA_API_KEY` + `OLLAMA_URL` | `OLLAMA_LLM_MODEL` |
| `ollama-local` | `OLLAMA_URL` | `OLLAMA_LLM_MODEL` (default: `tinyllama`) |

**Fallback order** (when `LLM_PROVIDER` is unset): Anthropic → Mistral → OpenAI → Ollama.

### `POST /api/chat`

The handler validates a bounded list of **UIMessages** (AI SDK shape), resolves `userId` / `conversationId`, and either:

- Handles a **memory command** (`/remember`, `/forget`, `/memory clear`, `/help`) without calling the LLM tool path, or  
- Runs **`agentStreamText`** — `streamText` with a single tool, `searchKnowledgeBase`.

The tool’s `execute` function calls **`rag()`** in `server/utils/search.service.ts`, which:

1. Optionally runs **HyDE** (hypothetical answer → embed that text instead of the raw query) when a language model is passed in.  
2. Runs **hybrid search** (dense vector + BM25) with **MMR** diversification and a **minimum score** floor.  
3. Returns ranked passages; the model streams an answer and cites `[1]`, `[2]`, …

Retrieved chunks for the turn are collected in a **bucket** so the server can persist **`Message.sources`** after the stream finishes.

### Conversations & persistence

- **`Conversation`** / **`Message`** models store multi-turn history and assistant **`sources`** (JSON) for reload and audit.  
- **`Query`** logs text, optional `toolCalled`, latency, and serialized sources for analytics.

---

## 3. Design choices (short)

| Topic | Choice |
| --- | --- |
| Same-origin API | No CORS; cookies and relative `/api` from the Nuxt app. |
| Streaming | UIMessage stream for low time-to-first-token. |
| Citations | Numeric labels aligned with the order of passages returned to the model. |
| Ingest errors | Document moves to `failed` with `ingestError`; chunks are not left half-updated across the transaction. |

---

---

## Next steps — wizard-runtime alignment

The onboarding wizard (steps 3–6) generates env vars for chunking, search, embeddings tuning, and RAG generation. These variables are not yet read by the runtime — they are documented here as the planned wiring work.

### Steps 5 & 6 — low effort, high value

**Search defaults** (`search.service.ts`): swap the hardcoded constants for env-backed defaults.

```ts
// planned
const DEFAULT_LIMIT   = Number(process.env.SEARCH_TOP_K)       || 5
const DEFAULT_MIN_SCORE = Number(process.env.SEARCH_THRESHOLD) || 0.2
// SEARCH_HYBRID  → pass as default hybridAlpha to rag()
// SEARCH_RERANK  → toggle MMR on/off by default
```

**RAG generation** (`agent.service.ts`): read `RAG_TEMPERATURE`, `RAG_SYSTEM_PROMPT`, `RAG_MAX_CONTEXT`, `RAG_RESPONSE_LANG` from runtime config and pass them into `streamText`.

### Step 4 — medium effort

**Chunking** (`chunking.ts`, `documents/upload.post.ts`):

| Env var | Where to wire |
|---|---|
| `CHUNK_SIZE` | Replace `DEFAULT_CHUNK_TOKENS` |
| `CHUNK_OVERLAP` | Replace `DEFAULT_OVERLAP_TOKENS` |
| `MAX_DOC_SIZE_MB` | Replace `TEN_MB` cap in upload handler |
| `ALLOWED_FORMATS` | Wired: workspace → user → global DB → env; MIME gate uses effective list |
| `CHUNK_STRATEGY` | Add `fixed` / `with-overlap` branches alongside the existing sentence-aware logic |

### Step 3 — higher effort

**Embedding service** (`embedding.ts`):

| Env var | Work needed |
|---|---|
| `EMBEDDING_BATCH_SIZE` | Slice the `texts` array into batches before calling `embedMany` |
| `EMBEDDING_CACHE_TTL` | Add TTL tracking to `LruCache` (timestamp per entry) |
| `EMBEDDING_RETRY_ATTEMPTS` | Wrap `embed` / `embedMany` calls in a retry loop with backoff |

---

## Next

- [Hybrid search & HyDE →](./search)  
- [Memory & commands →](./memory)  
- [API reference →](/api/reference)  
- [Architecture overview →](/architecture/)
