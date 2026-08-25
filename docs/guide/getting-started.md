<DocMicroLead />

# Getting Started

hypar runs as a **single Nuxt 3 process** — frontend, API routes and background workers all in one. There is no separate backend container to manage.

**Environment template:** at the repository root run `cp .env.example .env` — that file is the single tracked template for Docker and local dev, and matches what the root `README.md` and `CONTRIBUTING.md` describe (there is no committed `.env.docker`; keep a private `.env` out of version control).

## Prerequisites

- **Docker 20.10+** and **Docker Compose 2.0+** (recommended path)
- OR **Node.js 20+** and **pnpm 10+** for local development
- At least one API key for embeddings: [Google AI Studio](https://aistudio.google.com/app/apikey) is free and recommended

---

## Option 1 — Docker (recommended)

```bash
# 1. Clone
git clone https://github.com/albegosu/hypar.git
cd hypar

# 2. Configure
cp .env.example .env
# Edit .env — set GOOGLE_API_KEY at minimum

# 3. Start (app + postgres + ollama)
docker compose --profile full up -d --build

# 4. Open
open http://localhost:3000
```

The app runs `prisma migrate deploy` automatically on startup — no manual migration step needed.

**Stop:**
```bash
docker compose --profile full down
```

---

## Option 2 — Local development

```bash
# 1. Clone & install
git clone https://github.com/albegosu/hypar.git
cd hypar
pnpm install

# 2. Configure
cp .env.example .env
# Edit .env — set DATABASE_URL and GOOGLE_API_KEY

# 3. Run database migrations
pnpm db:migrate

# 4. Start dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Useful scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start dev server with HMR |
| `pnpm build` | Production build |
| `pnpm start` | Run production build |
| `pnpm db:migrate` | Run Prisma migrations (dev) |
| `pnpm db:deploy` | Run migrations (production) |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm typecheck` | TypeScript type check |
| `pnpm test` | Run Vitest suite |
| `pnpm exec vitepress dev docs` | Serve these docs locally (VitePress) |

---

## Choosing a chat model

The default (`OLLAMA_LLM_MODEL=llama3.1:8b`) supports tool calling reliably — the agent will search the knowledge base when relevant and cite sources.

Smaller models such as `tinyllama` do **not** support tool calling and will ignore the knowledge base entirely.

```env
# .env
OLLAMA_LLM_MODEL=llama3.1:8b        # good balance — runs on 8 GB VRAM
# OLLAMA_LLM_MODEL=qwen2.5:7b-instruct  # fast alternative
```

Embeddings (`nomic-embed-text`, 768 dims) work well as-is regardless of the LLM choice.

If you prefer cloud providers, set `GOOGLE_API_KEY` or `OPENAI_API_KEY` — they take priority over Ollama for both embeddings and generation.

---

## Next steps

- [Authentication →](./auth) — sign-in, first-run setup, sessions
- [Configure Docker profiles →](./docker)
- [Deploy to production with automatic TLS →](./production)
- [Environment variables →](./env)
