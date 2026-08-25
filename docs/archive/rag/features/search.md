# Hybrid search & HyDE

Retrieval lives in `server/utils/search.service.ts`. Public endpoints wrap the same core (`search`, `rag`, `inspect`).

---

## Hybrid dense + keyword

Every `search()` call uses a **single SQL pipeline** that combines:

1. **Vector similarity** — pgvector cosine distance (`<=>`) on chunk embeddings; score mapped to roughly \([0,1]\) as \(1 - \text{distance}\).  
2. **BM25-style keyword rank** — PostgreSQL `ts_rank_cd` on a **`textsearch`** (`tsvector`) column with `plainto_tsquery('simple', …)` on the **original user query** (not the HyDE-expanded text).

Candidates from both sides are merged with a **weighted score**:

\[
\text{score} = \alpha \cdot \text{vectorScore} + (1-\alpha) \cdot \text{bm25Score}
\]

- Default **`hybridAlpha` = 0.7** → 70% vector, 30% keyword.  
- **Why:** embeddings miss exact codes, SKUs, and rare tokens; full-text catches them when the query contains those literals.

Only documents with **`ingestStatus = 'ready'`** participate.

---

## MMR and score floor

After hybrid scoring:

- Results below **`minScore`** (default **0.2**) are dropped.  
- The query embeds **up to `limit × overFetch`** chunks (default over-fetch **3**), then **MMR** re-ranks with **`mmrLambda` = 0.7** to reduce near-duplicate passages.

Embeddings attached to candidates are stripped before returning JSON to clients.

---

## HyDE (Hypothetical Document Embeddings)

When `search()` is called with a **`hydeModel`** (a `LanguageModel` from the AI SDK):

1. The model generates a **short factual paragraph** that answers the user question (prompt in code).  
2. That text is **embedded** instead of the raw query string (fallback to the query if generation fails).  
3. Hybrid retrieval runs on that embedding.

**Trade-off:** one extra LLM call on the retrieval path; often better recall on factual Q&A.

### Where HyDE is used

- **Agentic chat** — `buildKbTools()` passes the same chat model into `rag(…, hydeModel)`, so tool-based KB search uses HyDE.  
- **`POST /api/search/inspect`** — requires auth; workspace-scoped; uses `search()` **without** `hydeModel` (raw-query embedding), useful for debugging embedding + latency only.

---

## API surface

| Endpoint | Purpose |
| --- | --- |
| `POST /api/search` | Hybrid `search()`; JSON array of chunks + scores. |
| `POST /api/search/rag` | `rag()` — adds concatenated `[n]` **context** string + **sources** list. |
| `POST /api/search/inspect` | Embedding preview, timings, and results (no HyDE). |

Bodies are validated with Zod (`query`, optional `limit`, optional `userId` where applicable). See [API reference](/api/reference#search).

---

## Memory scope interaction

When `MEMORY_SCOPE` is `local_per_user` and `userId` is set, retrieval includes:

- Documents with **`userId` = that user** (e.g. chat memories), **or**  
- Documents with **`userId` IS NULL** (global uploads).

If scope is `disabled`, rows with `metadata.kind = 'chat_memory'` are excluded from search.

---

## Next

- [RAG pipeline →](./rag-pipeline)  
- [Memory & commands →](./memory)  
- [Architecture →](/architecture/)
