# AGENTS.md

First-read for coding agents (Cursor, Claude, Grok Bot, etc.). Keep claims aligned with docs and code — do not invent roadmap or behaviour.

## What hypar is (now)

**hypar** is an AI interaction **research lab** — a Nuxt 3 playground for how humans and agents collaborate on knowledge work. Patterns that survive are extracted into [`ai-elements-nuxt`](https://github.com/albegosu/ai-elements-nuxt).

Current focus: **Embryos** (seed → `LATENT → GERMINATING → GROWING → MATURE → FOSSIL`). This is **not** the archived RAG product.

Archived RAG lives on branch [`archive/rag-v1`](https://github.com/albegosu/hypar/tree/archive/rag-v1) / tag [`v0.4-rag`](https://github.com/albegosu/hypar/releases/tag/v0.4-rag). See [docs/history.md](docs/history.md).

## Non-negotiables

- **No delete** — ideas close as fossils with a **required reason** (optional kind: ill-defined / wrong path / superseded). Fossils reject further PATCH/agent (`409`).
- **Agent = one challenging question per turn** — no summaries, validation, comfort, or preamble. Paths / fossil / connection proposals are additive HITL fields, not a second question.
- **Patterns extract to ai-elements-nuxt** — UI maps embryo events onto headless `Ai*` primitives; do not grow a generic chatbot transcript.

## Where truth lives

| Source | Role |
|---|---|
| [README.md](README.md) | Product snapshot + stack + structure |
| [docs/](docs/) (VitePress) | Canonical docs site |
| [docs/direction.md](docs/direction.md) | Lab / product north star |
| [docs/decisions/](docs/decisions/) | ADRs (settled choices) |
| [docs/experiments/](docs/experiments/) | Research write-ups |
| [docs/open-questions.md](docs/open-questions.md) | Active design tensions |
| [agents-plans/](agents-plans/) | **Scratch only — not source of truth** |

Prefer reading docs and code over inventing behaviour. When docs and code disagree, fix the drift; do not paper over it in plans.

## Stack + key paths

Nuxt 3 · Nuxt UI v3 · Tailwind v4 · Pinia · Prisma 7 · Postgres 16 · Ollama · Vercel AI SDK · ai-elements-nuxt · better-auth.

| Path | What |
|---|---|
| `pages/` | Garden, embryo detail, settings, auth |
| `server/api/embryos/` | CRUD + state + agent SSE |
| `prisma/` | Embryo domain + auth |
| `utils/embryo-method.ts` | Stance, fossil kinds |
| `components/embryo/`, `components/garden/` | Collaborator, graph, pending queue |
| `stores/embryos.ts` | Pinia embryo store |

## How to verify

```bash
pnpm ci:check          # lint + typecheck + test + build (same as CI)
pnpm docs:build        # if you change docs/**
```

## Docs entry points

- Direction: [docs/direction.md](docs/direction.md)
- Decisions: [docs/decisions/](docs/decisions/)
- Concepts: embryo, lifecycle, agent, fossils under `docs/concepts/`
- Architecture: [docs/architecture/](docs/architecture/)
