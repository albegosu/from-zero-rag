---
status: accepted
date: 2026-08-01
---

# ADR 0002: Agent one-question constraint

- **Status:** accepted
- **Date:** 2026-08-01

## Context

The agent is a collaborator in thinking, not a chatbot or search engine. Unconstrained multi-turn advice collapses into comfort, summaries, and validation — the opposite of productive tension.

## Decision

Each agent invocation streams **exactly one challenging question**. No summaries, validation, comfort, or preamble in the spoken turn. Lifecycle stance (define → probe → variety → simplest) shapes the question; path, connection, and fossil proposals are **additive HITL fields**, not a second question.

## Consequences

- Prompt and parse contracts stay narrow (`question` + optional `paths` / `connections` / `fossil`).
- UI maps events onto `ai-elements-nuxt` primitives, not a generic chat transcript.
- Variety of *paths* coexists with the one-question constraint (pending paths accepted as tensions) — see [Open Questions](/open-questions) and [method as process](/experiments/method-as-process).

## Sources

- [The Agent](/concepts/agent)
- [Architecture — Agent integration](/architecture/)
- [README](https://github.com/albegosu/hypar/blob/main/README.md) — “one challenging question per turn”
- [Open Questions — Variety vs exactly one question](/open-questions)
