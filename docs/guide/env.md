<DocMicroLead />

# Environment variables

The **canonical template** is `.env.example` at the repository root. After cloning:

```bash
cp .env.example .env
```

Edit `.env` for your machine; never commit real secrets.

- **Docker Compose:** defaults for Postgres and the app are set in `docker-compose.yml`. See [Docker guide](./docker) for container-specific usage.
- **Local `pnpm dev`:** set `DATABASE_URL`, `OLLAMA_URL` (often `http://localhost:11434`), and `WORKFLOW_LOCAL_DATA_DIR` as described in `.env.example`.
- **Onboarding / first run:** open **`/setup`** in the app. The wizard (DB-backed + provider steps) configures keys and creates the first admin; it does **not** write `.env` for you — keep using root **`.env.example`** as the template and sync values manually if needed.

**Cross-links (optional):** `NUXT_PUBLIC_DOCS_SITE_URL` points the Nuxt app header to your published docs (defaults to the GitHub Pages URL). For the VitePress build, `VITEPRESS_DEMO_URL` sets the hosted chat URL used in the nav and social icon; the default lives in `docs/.vitepress/demo-app-url.ts` and should match the **Try demo** hero link in `docs/index.md`. In GitHub Actions you can set repository variable `VITEPRESS_DEMO_URL` (see `.github/workflows/pages.yml`).

---

## Provider selection

Two variables control which AI providers are active. If omitted, the runtime falls back to detecting the first present API key.

| Variable | Values | Description |
|---|---|---|
| `EMBEDDING_PROVIDER` | `gemini` `openai` `voyage` `ollama-local` | Explicit embedding provider. Overrides key-presence detection. |
| `LLM_PROVIDER` | `anthropic` `openai` `mistral` `ollama-cloud` `ollama-local` | Explicit chat/LLM provider. Overrides key-presence detection. |

---

## Embedding providers

| Variable | Provider | Description |
|---|---|---|
| `GOOGLE_API_KEY` | Gemini | API key from [Google AI Studio](https://aistudio.google.com/app/apikey). Uses `gemini-embedding-001` by default. |
| `OPENAI_API_KEY` | OpenAI | API key from [OpenAI](https://platform.openai.com/api-keys). Shared with OpenAI LLM if both are configured. |
| `VOYAGE_API_KEY` | Voyage AI | API key from [Voyage AI](https://dashboard.voyageai.com/api-keys). Uses `voyage-3` by default. |
| `OLLAMA_URL` | Ollama | Base URL, e.g. `http://localhost:11434`. Used for both embedding and LLM. |
| `OLLAMA_MODEL` | Ollama | Embedding model name (default: `nomic-embed-text`). |
| `EMBEDDING_MODEL` | all | Override the model for the active embedding provider. |
| `EMBEDDING_DIMENSIONS` | all | Vector size — must match the `pgvector` column (default: `768`). |

**Fallback order** (when `EMBEDDING_PROVIDER` is not set): Gemini → OpenAI → Voyage → Ollama.

---

## LLM / chat providers

| Variable | Provider | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Anthropic | API key from [Anthropic console](https://console.anthropic.com/settings/keys). |
| `ANTHROPIC_MODEL` | Anthropic | Model name (default: `claude-sonnet-4-6`). |
| `OPENAI_API_KEY` | OpenAI | Shared with embedding if both are configured. |
| `OPENAI_LLM_MODEL` | OpenAI | Chat model name (default: `gpt-4.1-mini`). |
| `MISTRAL_API_KEY` | Mistral | API key from [Mistral console](https://console.mistral.ai/api-keys/). |
| `MISTRAL_MODEL` | Mistral | Model name (default: `mistral-medium-latest`). |
| `OLLAMA_API_KEY` | Ollama Cloud | Auth key for [Ollama Cloud](https://ollama.com/settings/keys). |
| `OLLAMA_LLM_MODEL` | Ollama | Chat model (default: `tinyllama` local / `kimi-k2.5:cloud` cloud). |
| `OLLAMA_CHAT_TIMEOUT_MS` | Ollama | LLM response timeout in ms (default: `180000`). |
| `OLLAMA_PLANNER_TIMEOUT_MS` | Ollama | Planner/tool step timeout in ms (default: `60000`). |

**Fallback order** (when `LLM_PROVIDER` is not set): Anthropic → Mistral → OpenAI → Ollama.

---

## Database

| Variable | Description |
|---|---|
| `DATABASE_URL` | Full Postgres connection string. Required. |

**Self-hosted pgvector example:**
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/rag_db
```

**Supabase Vector example (direct):**
```
DATABASE_URL=postgresql://postgres:password@db.<project-ref>.supabase.co:5432/postgres
```

**Supabase Vector example (transaction pooler — recommended for serverless):**
```
DATABASE_URL=postgresql://postgres.<project-ref>:password@aws-0-<region>.pooler.supabase.com:6543/postgres
```

The setup wizard (step 2) can help you pick a **Postgres** connection style; still copy the final string into `.env` yourself.

---

## Application

| Variable | Default | Description |
|---|---|---|
| `MEMORY_SCOPE` | `local_per_user` | `local_per_user` / `global` / `disabled` |
| `MEMORY_PROACTIVE` | `true` | Auto-save user facts to memory |
| `ADMIN_API_KEY` | — | Optional key to protect admin endpoints |
| `WORKFLOW_LOCAL_DATA_DIR` | `./data/workflow` | Durable workflow state directory |

For runtime-configurable values stored in the database (model, chunking, search, RAG tunables) see [Settings](./settings). Anything in this file is read once at boot from the environment.
