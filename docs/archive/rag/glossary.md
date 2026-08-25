<DocMicroLead />

# Glossary

Key terms used throughout hypar and in RAG systems generally.

| Term | Meaning |
|---|---|
| **Chunk** | A bounded piece of a document (~400 tokens). The unit of retrieval. See [RAG Pipeline](/features/rag-pipeline). |
| **Embedding** | A fixed-length vector (768 dimensions in hypar) that represents a chunk's semantic meaning. Produced by an embedding model. |
| **pgvector** | PostgreSQL extension that stores vectors and computes cosine distance. hypar's default vector store. |
| **BM25** | Classical keyword-relevance score; complements semantic search on names, codes, and literals that embeddings often miss. |
| **Hybrid search** | Weighted blend of vector similarity and BM25, controlled by the parameter `alpha` in [0, 1]. See [Hybrid Search & HyDE](/features/search). |
| **HyDE** | *Hypothetical Document Embeddings*: the LLM drafts a short hypothetical answer first, then embeds *that* text as the query vector. Often improves recall on factual Q&A. |
| **MMR** | *Maximal Marginal Relevance*: re-ranks retrieved chunks to balance relevance vs. diversity, controlled by `lambda`. |
| **top-K** | How many chunks survive filtering and are shown to the LLM as context. |
| **Tool call** | The LLM decides to invoke a function (here `searchKnowledgeBase`) instead of replying directly. Powered by the Vercel AI SDK. |
| **Agent / search mode** | `auto` = LLM decides whether to search; `search` = always retrieve from KB; `direct` = skip retrieval entirely. Configurable in [Settings](/guide/settings). |
| **HNSW** | *Hierarchical Navigable Small World*: the index type used on the embedding column for fast approximate nearest-neighbour search. |
| **Cosine similarity** | Similarity metric between two vectors. 1.0 = identical direction, 0.0 = orthogonal. hypar uses a score floor of 0.2. |
| **Ingestion** | The process of parsing a document into chunks, embedding each chunk, and storing them in the database. Runs as a durable background workflow. |
| **Workspace** | An isolated scope for documents and settings, shared among members with different roles. See [Workspaces](/guide/workspaces). |
