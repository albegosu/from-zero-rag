# History

Hypar started as something different.

## v0.4 — RAG reference implementation (2025–2026)

The original Hypar was a production-ready Retrieval-Augmented Generation application built with Nuxt 3, pgvector, and the Vercel AI SDK. The goal was to build a RAG system readable enough to learn from — every stage of the pipeline documented, every parameter tunable at runtime.

It was a serious implementation: hybrid search (vector + BM25), HyDE, MMR reranking, durable ingestion with Workflow SDK, multi-user auth with better-auth, source citations, an admin dashboard, and a 10-stage roadmap toward a live product.

That work is preserved in its entirety:

- **Branch:** [`archive/rag-v1`](https://github.com/albegosu/hypar/tree/archive/rag-v1)
- **Tag:** [`v0.4-rag`](https://github.com/albegosu/hypar/releases/tag/v0.4-rag)

## The pivot (August 2026)

Working on the RAG implementation surfaced a deeper question: not *how* to build AI knowledge tools, but *what* they should feel like to use. The chat interface for RAG felt like the wrong abstraction — a retrieval system dressed as a conversation.

The question became: what does a knowledge system look like when the AI agent is a collaborator in the thinking process, not a search engine over your documents?

Hypar became the place to explore that question. The RAG implementation was archived, not deleted — it represents real engineering work and a specific answer to a specific problem. That answer was just not the question Hypar wanted to keep asking.

## What carried over

The infrastructure built for the RAG implementation — Nuxt 3, Tailwind v4, the visual system, the deployment setup — continues to serve the new project. The code changed; the foundation remained.
