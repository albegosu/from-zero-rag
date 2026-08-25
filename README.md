# hypar

> **hypar** — AI interaction research lab.

A playground for exploring how humans and AI agents collaborate on knowledge work. Built as a single Nuxt 3 app with a terminal-inspired UI. Each feature is an experiment in interaction design, and the patterns that emerge are extracted into [`ai-elements-nuxt`](https://github.com/albegosu/ai-elements-nuxt).

[![CI](https://github.com/albegosu/hypar/actions/workflows/ci.yml/badge.svg)](https://github.com/albegosu/hypar/actions/workflows/ci.yml)
[![Docker Build](https://github.com/albegosu/hypar/actions/workflows/docker-build.yml/badge.svg)](https://github.com/albegosu/hypar/actions/workflows/docker-build.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

📖 [Docs](https://albegosu.github.io/hypar/)

---

## Current experiment: Embryos

The first research focus is the **Embryo** — a living unit of knowledge that replaces the static note.

- **Seed** — a raw thought captured in one sentence (immutable after create)
- **Lifecycle** — `LATENT → GERMINATING → GROWING → MATURE → FOSSIL` (method stance: define → probe → paths → simplest)
- **No delete** — dead ideas persist as fossils with a required reason (and optional kind: ill-defined / wrong path / superseded)
- **Agent as collaborator** — streams one challenging question per turn; auto-engages on first visit; you can reply
- **Tensions, paths, connections** — open questions, alternative directions, typed links (`REINFORCES` / `CONTRADICTS` / `EXTENDS` / `RESURRECTS`)

The agent is constrained: one challenging question per invocation. No summaries, no validation, no comfort. Path and fossil proposals are additive HITL notes, not a second question.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Nuxt 3 (Vue 3 + Nitro/h3) |
| UI | Nuxt UI v3 + Tailwind CSS v4 |
| State | Pinia |
| ORM | Prisma 7 |
| Database | PostgreSQL 16 |
| LLM | Ollama (local or cloud) via OpenAI-compatible API |
| AI SDK | Vercel AI SDK (`ai`, `@ai-sdk/openai`) |
| AI UI | [`ai-elements-nuxt`](https://github.com/albegosu/ai-elements-nuxt) (headless `Ai*` components) |
| Auth | better-auth (email + password, sessions, optional GitHub/Google OAuth) |

---

## Quick Start

```bash
git clone https://github.com/albegosu/hypar.git
cd hypar
pnpm install
cp .env.example .env    # DATABASE_URL, OLLAMA_URL, BETTER_AUTH_SECRET
npx prisma migrate deploy
pnpm dev
```

Open http://localhost:3000.

### With Docker

```bash
docker compose --profile full up -d --build
```

---

## Project Structure

```
hypar/
├── prisma/schema.prisma              # Embryo domain + auth models
├── pages/
│   ├── index.vue                     # embryo garden + pending queue
│   ├── embryo/[id].vue               # detail + agent + tensions + graph
│   ├── settings.vue                  # Ollama model selector
│   ├── auth/                         # signin / signup
│   └── admin/                        # stubs
├── components/embryo/                # AgentCollaborate, ConnectionGraph
├── components/garden/                # PendingQueue
├── utils/embryo-method.ts            # stance, fossil kinds
├── stores/embryos.ts
├── server/api/embryos/               # CRUD + state + agent SSE
├── docs/                             # VitePress site
└── .env.example
```

---

## Research Questions

- What does productive tension between human and agent look like?
- How should a fossil feel to navigate?
- What is the right granularity for an idea?
- How does connection between ideas emerge?

See [Experiments](https://albegosu.github.io/hypar/experiments/) and [Open Questions](https://albegosu.github.io/hypar/open-questions).

---

## License

MIT — see [LICENSE](LICENSE).

---

**A [Resizes](https://resiz.es) lab project.**
