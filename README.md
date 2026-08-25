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

- **Seed** — a raw thought captured in one sentence
- **Lifecycle** — `LATENT → GERMINATING → GROWING → MATURE → FOSSIL`
- **No delete** — dead ideas persist as fossils with the reasoning for why they died
- **Agent as collaborator** — challenges ideas with questions, surfaces contradictions, can propose fossilization
- **Tensions** — open questions attached to an embryo, raised by user or agent

The agent is constrained: one challenging question per invocation. No summaries, no validation, no comfort.

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
| Auth | better-auth (email + password, sessions, roles) |

---

## Quick Start

```bash
git clone https://github.com/albegosu/hypar.git
cd hypar
pnpm install
cp .env.example .env    # configure DATABASE_URL + Ollama
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
├── prisma/schema.prisma       # Embryo domain + auth models
├── pages/
│   ├── index.vue              # embryo garden
│   ├── embryo/[id].vue        # detail + agent + tensions
│   ├── auth/                  # signin / signup
│   ├── settings.vue           # stub
│   └── admin/                 # users
├── components/
│   ├── AppHeader.vue
│   ├── BottomNav.vue
│   └── micro/                 # micrographic glyphs
├── stores/embryos.ts          # Pinia store
├── server/api/embryos/        # CRUD + state + agent
├── docs/                      # VitePress site
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
