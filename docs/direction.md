# Direction

Lab and product north star for hypar. One page. Grounded in [README](https://github.com/albegosu/hypar/blob/main/README.md), [history](/history), and [open questions](/open-questions) — not a speculative roadmap.

## Why hypar exists

Hypar started as a RAG reference implementation. Shipping that stack surfaced a deeper question: not *how* to build AI knowledge tools, but *what they should feel like to use*. Chat-over-retrieval felt like the wrong abstraction — a search engine dressed as conversation.

The pivot (August 2026): explore a knowledge system where the agent is a **collaborator in the thinking process**, not a document retriever. The RAG work was archived, not deleted — see [History](/history).

## Current lab focus

**Embryos** — living units of knowledge that replace the static note.

- **Seed** — one immutable sentence at create
- **Lifecycle** — `LATENT → GERMINATING → GROWING → MATURE → FOSSIL` (method stance: define → probe → paths → simplest)
- **No delete** — closed ideas persist as fossils with a required reason
- **Agent as collaborator** — one challenging question per turn; auto-engage; HITL for paths, connections, fossil proposals
- **Tensions, paths, connections** — open questions, alternative directions, typed links

Each shipped surface is an experiment. Findings live under [Experiments](/experiments/); unresolved tensions under [Open Questions](/open-questions).

## What we are optimizing for

- Productive **tension** between human and agent (challenge over comfort)
- Ideas that stay **accountable** when they die (reasoned fossils, not silent delete)
- Interaction patterns small enough to **extract** into reusable primitives ([`ai-elements-nuxt`](https://github.com/albegosu/ai-elements-nuxt))
- Claims that match **runtime** — aspirational ideas stay marked as such

## What we are not optimizing for

- A general-purpose chatbot or RAG product on `main`
- Multi-user shared gardens (deferred — single garden per user; see [Open Questions](/open-questions))
- Invented roadmap items that are not backed by experiments or ADRs
- Treating [agents-plans/](https://github.com/albegosu/hypar/blob/main/agents-plans/) scratch notes as product truth

## Experiments ↔ product ↔ extraction

```
experiment in hypar  →  observe  →  document in docs/experiments/
                                 →  settle durable choices in docs/decisions/
                                 →  extract surviving UI patterns to ai-elements-nuxt
```

Hypar is the lab. `ai-elements-nuxt` is the library. Docs (this site + [AGENTS.md](https://github.com/albegosu/hypar/blob/main/AGENTS.md)) are the shared source of truth for assistants and humans.

## Pointers

| Need | Where |
|---|---|
| Agent first-read | [AGENTS.md](https://github.com/albegosu/hypar/blob/main/AGENTS.md) |
| Active tensions | [Open Questions](/open-questions) |
| Experiment log | [Experiments](/experiments/) |
| Settled choices | [Decisions](/decisions/) |
| How it is built | [Architecture](/architecture) |
| Pivot story | [History](/history) |
