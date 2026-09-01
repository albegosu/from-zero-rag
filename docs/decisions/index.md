# Decisions (ADRs)

Architecture Decision Records for hypar. Short, durable records of **settled** choices — not experiment prose and not scratch plans.

Scratch explorations live in [`agents-plans/`](https://github.com/albegosu/hypar/blob/main/agents-plans/) and are **not** source of truth. Research write-ups live under [Experiments](/experiments/). Product north star: [Direction](/direction).

## Status vocabulary

| Status | Meaning |
|---|---|
| **proposed** | Under discussion; not yet binding |
| **accepted** | Current decision — follow unless superseded |
| **superseded** | Replaced by a newer ADR (link it) |
| **deprecated** | No longer advised; kept for history |
| **historical** | Pre-dates the current ADR set or records intent that later evolved; useful context, not a map of today's tree |

## Naming

```
NNNN-short-title.md
```

- `NNNN` — zero-padded sequence (`0001`, `0002`, …)
- `short-title` — kebab-case

Optional YAML frontmatter:

```yaml
---
status: accepted
date: 2026-08-01
---
```

## Template

Copy [`_template.md`](./_template.md) when proposing a new ADR.

## Index

| ADR | Status | Summary |
|---|---|---|
| [0001 — Single Nuxt app](./0001-single-nuxt-app) | accepted | One Nuxt 3 process; no separate API repo / CORS split |
| [0002 — Agent one-question constraint](./0002-agent-one-question) | accepted | Exactly one challenging question per agent turn |
| [0003 — No-delete fossils](./0003-no-delete-fossils) | accepted | No delete; close with required reason as fossil |
| [monorepo-unification](./monorepo-unification) | historical | Pre-ADR plan to collapse multi-app RAG monorepo into one Nuxt app |

---

*Agents: start at [AGENTS.md](https://github.com/albegosu/hypar/blob/main/AGENTS.md). Do not invent decisions — cite existing docs or open an ADR as **proposed**.*
