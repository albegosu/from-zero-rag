# hypar — Product vision

> Not a calendar. A map of how far hypar can go if the work continues with care, and of what gets learned at each step. Stages are ordered by **technical and conceptual dependency**, not by dates. You move forward when you're ready, skip when it doesn't pay off, and walk back if what you promised doesn't hold up under measurement.

The question that drives this document is not *"what do I build in May?"* but *"what version of itself can hypar grow into before it hits the next ceiling, and what do I understand by the time it gets there?"*.

---

## Starting point

Today hypar is a **multi-user** RAG application on Nuxt 3 + pgvector: per-user documents and conversations, hybrid cosine + BM25 search, MMR diversification, optional HyDE, persisted citations, and durable ingestion with retries. **What exists in-tree:** Vitest coverage of core utilities, Docker Compose profiles, `better-auth`, an `/admin` dashboard, and a **VitePress** site under `docs/` (published to GitHub Pages from `main`). **What is still missing for “product-grade” honesty:** deep request-level observability, RAGAS-style answer metrics in CI, a checked-in **`pnpm eval`** harness, strict **`admin` RBAC** on admin APIs, and optional vector-store swapping — those are the ceilings the stages below address.

Three constraints define the current ceiling and therefore shape the first stages.

The first is that **you can't see inside it**. RAG quality depends on a chain of decisions (chunking, embedding, retrieval, reranking, prompting) and today it's hard to tell which one fails on any given response. The second is that **quality is measured along a single axis**: hit-rate and MRR tell you whether the right chunk was retrieved, but say nothing about whether the generated answer was faithful to its context. The third is that **the architecture is married to pgvector** — a perfectly good decision, but one that an external user cannot reverse without rewriting half the application.

Each stage that follows dissolves one of those ceilings.

---

## Product evolution stages

### Stage 1 — Traceability: make the invisible visible

The product changes little on the outside; it changes a lot on the inside. Every request leaves a structured trail: which chunks were retrieved and at what scores, which embedder and which LLM responded, how many tokens each call consumed, what it cost, where the time was spent. Langfuse and OpenLLMetry are the obvious paths, both self-hostable.

What you learn here isn't ML, it's **operating LLM systems**: why textual logs aren't enough, what a *span* is, how a trace lets you answer in thirty seconds questions that would otherwise take hours (*"why did this user receive that citation?"*). It is the layer that separates a demo from a system.

After this stage, everything that follows can be honest: any improvement can be demonstrated with before/after numbers. Without it, improvements get justified with anecdotes.

### Stage 2 — Measurable quality: stop lying to yourself

Hit-rate and MRR are *retrieval* metrics. A response can have the right chunk in context and still hallucinate, ignore it, or answer something true but irrelevant. RAGAS popularised four metrics that cover those gaps: **faithfulness** (does the answer hold up against the context?), **answer relevance** (does it answer the question?), **context precision** (were the retrieved chunks actually useful?) and **context recall** (was a critical chunk missing?).

Implementing them in TypeScript inside hypar, rather than wrapping the Python library, turns a quality improvement into a teaching asset: each metric is a small function, evaluated with an LLM-judge, easy to explain.

The natural next step is wiring those metrics into CI: every PR runs a subset of the golden set and posts a comment with the delta vs. `main`. From here on, **regressing the RAG's quality is as visible as breaking a test**.

What you learn: how to evaluate a generative system without fooling yourself. It is probably the scarcest content online about RAG and therefore the highest-value thing to internalise.

### Stage 3 — State-of-the-art retrieval

With observability and robust evaluation in place, it now makes sense to touch the heart of the system. There are three independent improvements worth adopting, in increasing order of cost.

**Reciprocal Rank Fusion** replaces the weighted cosine + BM25 blend with a rank-based fusion that has no constants to tune — easier to explain and, in practice, more robust across domains. **Cross-encoder reranking** adds a final stage that re-scores the top-K with a model (e.g. `bge-reranker-v2-m3`) that looks at question and chunk together rather than independently; it is the step that most lifts precision on nuanced questions. **Query decomposition** handles multi-part questions (*"compare X with Y on Z"*) by breaking them into sub-queries that are retrieved and merged before generation.

Every improvement is measured against the previous baseline. The product narrative at this point shifts from *"a RAG that works"* to *"a RAG whose design decisions have numbers behind them"*.

What you learn: the actual state of the art in information retrieval applied to LLMs, the trade-offs between precision/recall/latency/cost, and — above all — the discipline of refusing a technique just because it is fashionable. The numbers decide.

### Stage 4 — Robustness against hostile input

The moment hypar is exposed to real users (even a public demo), the threat model changes. The OWASP LLM Top 10 exists as a checklist; applying it to hypar is a coherent stage, not a generic security sprint.

The three defences with the best effort/impact ratio: **clear delimitation between system instructions and retrieved content** (chunks arrive wrapped in markers the model is trained to treat as data, not instructions); **PII redaction at ingest** (configurable, with a clear example); and **per-document ACLs** — an `ownerId` field on `Document` and a filter on every query, so the system stops assuming a single universe of information.

What you learn: how to reason about security in LLM systems, where input is never trusted and output may be interpreted as intent by downstream systems. It's a sensitivity that transfers to any AI product you'll build in the future.

### Stage 5 — Pluggable: stop being a monolith

The project (originally *from-zero-rag*, now **hypar**) has accidentally become very pgvector-centric. A library worth the name defines interfaces and turns the current implementation into one of several.

The central interface is `VectorStore`: four methods (`upsert`, `query`, `delete`, `count`) behind which pgvector, Qdrant, Weaviate, Pinecone, or an in-memory mock for tests can live. The pgvector implementation is refactored to satisfy it; the second implementation (Qdrant is the pragmatic choice — single binary, gRPC, easy to bring up) proves the abstraction isn't a fiction. Then the same evals run against both backends and the numbers get published — that contrast is the asset.

By symmetry, three more interfaces follow naturally: `Embedder` (already partially abstracted), `Reranker` (introduced in stage 3) and `DocumentParser` (text, markdown, PDF today; HTML, DOCX, Git repos tomorrow).

What you learn: serious software architecture — stable interfaces, dependency injection, plugin systems. It's the difference between writing applications and writing libraries.

### Stage 6 — Beyond plain text

Up to this point, the entire corpus is text. The reality is that important documents contain tables, images, code, and structure. The next stage opens the scope.

**Tables in PDFs** — extracted with a dedicated parser and represented as structured text with headers, not flattened into a paragraph. **Images** — multimodal embeddings (CLIP-like) or, more simply, captioning with a VLM at ingest time and embedding the caption. **Source code** — syntactic chunking (functions, classes) instead of token-based, with metadata about language and file.

A more advanced variant is **routing**: when the question has the shape of a structured filter (*"invoices for client Acme in Q2"*), a classifier sends it to SQL instead of semantic search. Hybrid text-to-SQL + RAG, with the final answer unifying both. This turns hypar into something qualitatively different from a manual-Q&A RAG: into an assistant that knows when *not* to use embeddings.

What you learn: that representation matters more than the model. A good parser and good routing are worth more, in many real domains, than any reranker.

### Stage 7 — Conversation with real memory

Today there is `/remember` and `/forget`. It works as a demo, not as production memory. Serious memory distinguishes between **user-fact memory** (preferences, personal context, valid until the user updates them), **conversation memory** (incremental summary when history exceeds a threshold), and **episodic memory** (what the system learned in past interactions and should recall the next time).

The parallel piece is the **agentic loop**: instead of a single tool-call to `searchKnowledgeBase`, the model plans several steps — search, reformulate, search again, synthesise, cite — following ReAct or plan-execute patterns. hypar already uses the AI SDK, which supports this; the difference is in exposing it as an observable flow, with an explicit step limit and a per-turn cost budget.

What you learn: the spectrum between deterministic chains and free agents, and when each is appropriate — more freedom almost always costs more latency, more tokens, and more rare errors, so the question is how much determinism you're willing to trade for capability.

### Stage 8 — Structured knowledge (optional, ambitious)

Some domains (legal, medical, technical) live better as a **graph** than as a bag of chunks. Extracting entities and relationships at ingest time, materialising them in a graph layer (Neo4j or, more simply, relational tables in the same Postgres), and combining vector retrieval with graph traversal — that's what Microsoft popularised as *GraphRAG*.

It's an ambitious stage because extraction has a real cost and quality depends heavily on the chosen entity schema. But it opens questions a flat RAG cannot answer well: *"what case law does this ruling cite?"*, *"which function calls this one and from where?"*. If hypar reaches this stage, it becomes something very few projects in the TypeScript ecosystem are building.

What you learn: knowledge representation, applied NER, when a structure is worth the cost vs. when it's overengineering.

### Stage 9 — Self-hosted and cheap

Most tutorials assume the user calls a paid provider. The final stage of the technical axis is to demonstrate that hypar can run entirely locally, with sufficient quality, on consumer hardware.

This includes **quantised embeddings** served via Ollama, **a small LLM with stable tool-calling** (Qwen, Llama 3.x, the Phi family as it matures), and, optionally, **lightweight fine-tuning of the embedder on your own corpus** — a technique that multiplies quality in specialised domains without changing provider.

What you learn: that the cloud is a convenience, not a necessity, and that understanding the stack down to the model is what separates engineers who build on top of LLMs from engineers who merely consume them.

### Stage 10 — A live product, not a repo

At this stage hypar stops being code and starts being a service people use.

Three pieces define it: a **public demo** ingesting a distinctive corpus (the Spanish constitution and key legal codes; or all of Cervantes with semantic search across Golden Age Spanish; or the Nuxt documentation, for an obvious developer audience) — the chosen corpus defines the narrative. A **public benchmark dashboard** where anyone can see hit-rate, MRR, faithfulness, and cost per query updated with every release. And a **scaffolding CLI** (`pnpm create hypar-app`) that takes a stance: how much of the state of the art should the default template ship with.

What you learn: what separates a technical project from a product. The answer is usually that the first lives on GitHub and the second lives in people's heads.

---

## Three axes that grow in parallel

Up to here the document has talked about the **product** axis, but a serious open-source project grows in three directions at once. The technical progression above is accompanied, without any one dominating the others, by:

**Community axis.** An external user opens the repo and understands it. That requires issue and PR templates, `good first issue` labels with well-scoped tickets, a lightweight RFC process (a one-page document per significant change, under `docs/rfcs/`), Changesets for automated release notes, and eventually CODEOWNERS and a code of conduct. The honest success metric for this axis is not stars — it's **closed PRs from people who aren't you**. The first one of those is worth more than the first hundred stars.

**Learning axis (yours).** Each product stage leaves a sediment of understanding that only sets if you write it down. Capture it in the **VitePress** site under `docs/` (and, if reintroduced, an interactive `/learn`-style layer). The heuristic is that a chapter written about what you just implemented teaches you more than the implementation itself — because explaining surfaces the parts you didn't actually understand. When English and Spanish advance together, you also turn a perceived limitation (smaller Spanish-speaking audience) into a real differentiator (most RAG content lives only in English).

**Portfolio axis.** This isn't vanity — it's honesty about why you're putting in the time. Each stage produces a shareable artefact: a five-minute screencast, a blog post, a published benchmark number, a meetup talk. The difference between *having* hypar on the CV and *demonstrating* hypar in an interview is decided by the count of those artefacts.

The three axes reinforce each other. A new technique (product) becomes a chapter (learning), which an external contributor can improve (community), generating a PR you add as evidence of a living project (portfolio). When all three feed each other, the project moves faster than the time invested. When you only work one axis (only product, say) for too long, the rest rots and motivation falls off.

---

## How to choose what to do next

Without a calendar, a heuristic is needed. The one that works best on projects like this: **work on what dissolves the lowest current ceiling, not on what's most interesting**.

Today the lowest ceiling is traceability: without seeing inside, the next stages are guesswork. Once dissolved, the next ceiling is evaluation beyond retrieval; then the advanced techniques you can finally justify with numbers; then the robustness that lets you show the demo to a stranger; and so on. The next stage, almost always, is **the one blocking every other stage from being done with judgement**.

Two questions apply before starting any new stage. *Have I measured the current state of the problem I want to solve?* — if not, the improvement will be invisible; go back to the measurement stage. *Can I explain it to someone in one page?* — if not, more understanding is needed before more code; a tutorial chapter is almost always the answer.

And there's a useful exit test when a stage seems done: **could an external user, without your help, discover that this capability exists, turn it on, and tell someone else what it does?** If the answer is no — because it's undocumented, has no examples, has no sensible defaults — the stage isn't done, no matter how well the code works.

---

## The destination, in one sentence

If every stage is completed: hypar becomes *the reference RAG implementation in TypeScript* — observable, evaluable, secure, pluggable, multi-modal, conversational, optionally self-hosted, with a public demo on a distinctive corpus and a EN/ES tutorial that doesn't exist anywhere else.

If only part of it is completed: each intermediate stage is already a project worth being proud of. The stages are not mandatory steps to a summit, they are **stable plateaus**: stopping at any of them leaves a coherent product and a complete understanding of that layer.

That is what a product roadmap without a calendar buys you: the freedom to climb as far as interest and energy allow, knowing at every moment where you are and why the next step makes sense.

---

*Last edited: 2026-05-08 — Author: Alberto González — Living document; updated when a stage changes order or a new one appears.*
