# hypar

**An AI interaction research lab.**

Hypar is a playground for exploring how humans and AI agents collaborate on knowledge work. It's built as a Nuxt 3 app with a terminal-inspired UI, and each feature is an experiment in interaction design.

The patterns and components that emerge from these experiments are extracted into [`ai-elements-nuxt`](https://github.com/albegosu/ai-elements-nuxt) — a reusable library for building AI-native interfaces.

---

## The first experiment: Embryos

The current research focus is the **Embryo** — a living unit of knowledge that replaces the static note.

An embryo is a raw thought captured in a single sentence (the *seed*). Unlike a note, it has a lifecycle: it can germinate, grow, mature, or fossilize. It never gets deleted — dead ideas persist as fossils, because the reasoning behind why something didn't work is itself knowledge.

An AI agent acts as collaborator, not assistant. It challenges ideas with questions, surfaces contradictions, and can propose fossilization for stale thoughts. The user always decides, but with context they didn't have before.

→ [Read about the Embryo concept](/concepts/embryo)
→ [The Lifecycle](/concepts/lifecycle)
→ [The Agent as collaborator](/concepts/agent)
→ [Fossils & memory](/concepts/fossils)

---

## Research questions

These are the questions driving current and upcoming experiments:

- **What does productive tension between human and agent look like?** The agent challenges ideas, not validates them. What's the right UI surface for that negotiation?
- **How should a fossil feel to navigate?** Fossils are geological memory. What visual language distinguishes dead ideas from living ones without building a filing cabinet?
- **What is the right granularity for an idea?** A sentence? A paragraph? Does the system need to support splitting and merging embryos?
- **How does connection emerge?** Can the agent suggest links between embryos, and what does the user's confirmation flow look like?

→ [Open questions](/open-questions)
→ [Experiments](/experiments/)

---

## Quick start

```bash
git clone https://github.com/albegosu/hypar.git
cd hypar
pnpm install
cp .env.example .env   # configure DATABASE_URL and Ollama
npx prisma migrate deploy
pnpm dev
```

→ [Getting started guide](/guide/getting-started)
→ [Docker setup](/guide/docker)
→ [Environment variables](/guide/env)
