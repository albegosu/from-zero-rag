# Contributing to hypar

Thanks for your interest in contributing! This is primarily a learning project, but improvements, bug fixes and ideas are welcome.

## Getting Started

### Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [pnpm 10+](https://pnpm.io/) — `npm install -g pnpm`
- [Docker + Docker Compose](https://docs.docker.com/get-docker/)
- A Google AI / OpenAI / Ollama API key for embeddings

### Local Setup

```bash
# 1. Clone the repo
git clone https://github.com/albegosu/hypar.git
cd hypar

# 2. Install dependencies
pnpm install

# 3. Start the database
docker compose --profile api up -d

# 4. Configure environment
cp .env.example .env
# Edit .env — for local `pnpm dev` set DATABASE_URL, OLLAMA_URL (localhost), GOOGLE_API_KEY or OpenAI, WORKFLOW_LOCAL_DATA_DIR (see comments in .env.example)
# WORKFLOW_LOCAL_DATA_DIR=./data/workflow is created automatically on first run

# 5. Run database migrations
pnpm db:migrate

# 6. Start the dev server
pnpm dev
```

Open http://localhost:3000.

## Project Structure

```
hypar/
├── pages/              # App routes (/, /documents, /upload, /setup, /auth/*, /admin/*)
├── components/         # Vue components
├── stores/             # Pinia stores
├── docs/               # VitePress site (guides, ADRs, RFCs) → GitHub Pages
├── server/
│   ├── api/            # h3 route handlers
│   └── utils/          # Services and utilities
├── utils/setup/        # Setup wizard catalog + steps
├── prisma/             # Database schema + migrations
└── nuxt.config.ts
```

## Development Workflow

1. **Fork** the repository
2. **Create a branch** from `main`: `git checkout -b feat/your-feature`
3. **Make your changes**
4. **Verify** before pushing (same checks as [CI](.github/workflows/ci.yml)):

```bash
# Full pipeline (lint, typecheck, tests, build)
pnpm ci:check
```

Git hooks run automatically after `pnpm install` (via [Husky](https://typicode.github.io/husky/)):

| Hook | Command |
|------|---------|
| `pre-commit` | `lint-staged` + `typecheck` |
| `pre-push` | `pnpm ci:check` |

Optional [pre-commit](https://pre-commit.com/) (Python): `pip install pre-commit && pre-commit install && pre-commit install --hook-type pre-push` — uses `.pre-commit-config.yaml` with the same commands.

```bash
# Docs site (if you change docs/**)
pnpm docs:build

# Database (if schema changed)
pnpm db:migrate
```

5. **Open a pull request** against `main`

## Branch Naming

| Type | Pattern | Example |
|---|---|---|
| Feature | `feat/short-description` | `feat/streaming-responses` |
| Bug fix | `fix/short-description` | `fix/chunking-offset` |
| Docs | `docs/short-description` | `docs/api-endpoints` |
| Chore | `chore/short-description` | `chore/update-deps` |

## Commit Style

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add streaming support for chat responses
fix: correct chunk offset calculation for unicode text
docs: update quick start guide
chore: update pnpm lockfile
```

## What to Contribute

- **Bug fixes** — especially around chunking, embedding edge cases, or memory commands
- **Documentation** — `README.md`, `docs/` (VitePress), ADRs under `docs/decisions/`, RFCs under `docs/rfcs/`
- **UI/UX improvements** — chat interface, document management, admin, setup wizard

## Documentation site (`docs/`)

The static site is built with [VitePress](https://vitepress.dev/). Locally:

```bash
pnpm docs:dev      # edit with hot reload
pnpm docs:build    # must pass before merging doc changes that affect Pages
pnpm docs:preview  # serve the production build
```

GitHub Pages runs `pnpm docs:build` on pushes to `main` when files under `docs/**` change (see `.github/workflows/pages.yml`).

## Questions?

Open an [issue](https://github.com/albegosu/hypar/issues) before starting large changes — it helps align effort.
