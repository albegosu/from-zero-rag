<DocMicroLead />

# Getting Started

hypar runs as a **single Nuxt 3 process** — frontend and API routes in one. There is no separate backend container to manage.

## Prerequisites

- **Docker 20.10+** and **Docker Compose 2.0+** (recommended path)
- OR **Node.js 20+** and **pnpm 10+** for local development
- A PostgreSQL instance (the Docker setup includes one)
- Ollama (local or cloud) for the agent collaborator

---

## Option 1 — Docker (recommended)

```bash
git clone https://github.com/albegosu/hypar.git
cd hypar
cp .env.example .env
# Edit .env — set BETTER_AUTH_SECRET
docker compose --profile full up -d --build
open http://localhost:3000
```

The app runs `prisma migrate deploy` automatically on startup.

**Stop:**
```bash
docker compose --profile full down
```

---

## Option 2 — Local development

```bash
git clone https://github.com/albegosu/hypar.git
cd hypar
pnpm install
cp .env.example .env
# Edit .env — DATABASE_URL, OLLAMA_URL, BETTER_AUTH_SECRET
npx prisma migrate deploy
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Useful scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start dev server with HMR |
| `pnpm build` | Production build |
| `pnpm db:migrate` | Run Prisma migrations (dev) |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm typecheck` | TypeScript type check |
| `pnpm test` | Run Vitest suite |
| `pnpm docs:dev` | Serve docs locally (VitePress) |

---

## Choosing a model

For the agent collaborator, configure Ollama in `.env`:

```env
# Local Ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_LLM_MODEL=llama3.2

# Or Ollama Cloud
LLM_PROVIDER=ollama-cloud
OLLAMA_URL=https://ollama.com
OLLAMA_API_KEY=your-key
OLLAMA_LLM_MODEL=kimi-k2.7-code:cloud
```

You can also pick a model in **Settings** after sign-in (cookie override for the next agent turn).

---

## Next steps

- [Authentication →](./auth)
- [Configure Docker profiles →](./docker)
- [Deploy to production →](./production)
- [Environment variables →](./env)
