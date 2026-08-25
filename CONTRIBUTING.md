# Contributing to hypar

Thanks for your interest in contributing. This is an AI interaction research lab — improvements, bug fixes, and experiment write-ups are welcome.

## Getting Started

### Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [pnpm 10+](https://pnpm.io/) — `npm install -g pnpm`
- [Docker + Docker Compose](https://docs.docker.com/get-docker/) (for Postgres, or run your own)
- [Ollama](https://ollama.com/) locally or an Ollama Cloud key — the agent collaborator

### Local Setup

```bash
git clone https://github.com/albegosu/hypar.git
cd hypar
pnpm install
docker compose --profile api up -d
cp .env.example .env
# Set DATABASE_URL, OLLAMA_URL, BETTER_AUTH_SECRET (see .env.example)
npx prisma migrate deploy
pnpm dev
```

Open http://localhost:3000.

## Project Structure

```
hypar/
├── pages/                 # /, /embryo/[id], /settings, /auth/*, /admin/*
├── components/
│   ├── embryo/            # collaborator, connection graph
│   └── garden/            # pending question queue
├── stores/embryos.ts
├── utils/embryo-*.ts      # method stance, stream parse, display
├── server/
│   ├── api/embryos/       # CRUD + agent SSE + fossilize
│   └── utils/             # prisma, session, ollama, agent prompt
├── prisma/                # Embryo domain + better-auth
├── docs/                  # VitePress → GitHub Pages
└── evals/                 # embryo-stance fixtures
```

## Development Workflow

1. **Fork** the repository
2. **Create a branch** from `main`: `git checkout -b feat/your-feature`
3. **Make your changes**
4. **Verify** before pushing (same checks as [CI](.github/workflows/ci.yml)):

```bash
pnpm ci:check
```

Git hooks run automatically after `pnpm install` (via [Husky](https://typicode.github.io/husky/)):

| Hook | Command |
|------|---------|
| `pre-commit` | `lint-staged` + `typecheck` |
| `pre-push` | `pnpm ci:check` |

```bash
pnpm docs:build    # if you change docs/**
pnpm db:migrate    # if schema changed
```

5. **Open a pull request** against `main`

## Branch Naming

| Type | Pattern | Example |
|---|---|---|
| Feature | `feat/short-description` | `feat/streaming-responses` |
| Bug fix | `fix/short-description` | `fix/agent-sse-error` |
| Docs | `docs/short-description` | `docs/api-endpoints` |
| Chore | `chore/short-description` | `chore/update-deps` |

## Commit Style

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add streaming support for chat responses
fix: reject agent POST on fossilized embryos
docs: update quick start guide
chore: update pnpm lockfile
```

## What to Contribute

- **Bug fixes** — agent parse, lifecycle, HITL notes, auth
- **Documentation** — `README.md`, `docs/` (VitePress). Keep claims aligned with runtime; mark aspirational ideas as such
- **UI/UX** — garden, embryo detail, collaborator, fossils
- **Experiments** — write-ups under `docs/experiments/` when a research question ships

## Documentation site (`docs/`)

The static site is built with [VitePress](https://vitepress.dev/). Locally:

```bash
pnpm docs:dev
pnpm docs:build
pnpm docs:preview
```

GitHub Pages runs `pnpm docs:build` on pushes to `main` when files under `docs/**` change (see `.github/workflows/pages.yml`).

## Questions?

Open an [issue](https://github.com/albegosu/hypar/issues) before starting large changes — it helps align effort.
