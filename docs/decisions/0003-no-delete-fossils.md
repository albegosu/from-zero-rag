---
status: accepted
date: 2026-08-01
---

# ADR 0003: No-delete fossils

- **Status:** accepted
- **Date:** 2026-08-01

## Context

Deleting dead ideas destroys the reasoning that often matters more than the idea itself — why something was abandoned, what was tried, what might resurface later.

## Decision

Hypar has **no delete operation** for embryos. Ideas close as **fossils** with a **required reason** (optional kind: ill-defined / wrong path / superseded). Fossils retain seed, history, and connections. PATCH and agent calls on fossils return `409`. Resurrection creates a **new** `LATENT` embryo linked with `RESURRECTS`; the fossil stays closed.

## Consequences

- Fossilization UX always captures *why* an idea ended.
- Garden includes strata navigation for fossils; agent context may include a small fossil sample.
- Silent delete and silent un-fossilize are out of scope.

## Sources

- [Fossils & Memory](/concepts/fossils)
- [Architecture](/architecture) — “No delete”
- [README](https://github.com/albegosu/hypar/blob/main/README.md) — “No delete”
- [The Lifecycle](/concepts/lifecycle)
