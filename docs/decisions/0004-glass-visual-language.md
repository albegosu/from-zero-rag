---
status: accepted
date: 2026-09-01
---

# ADR 0004: Glass visual language

- **Status:** accepted
- **Date:** 2026-09-01

## Context

Hypar’s UI spoke in a terminal/CLI voice (mono-first chrome, `$ command` panel headers, CRT greens). That read as a leftover from the RAG-era reference stack, not as the product voice for the embryo lab. Light and dark theme tokens still existed, but both felt “terminal with a palette swap.”

## Decision

Adopt a **glass + rounded** visual language for the Nuxt app shell and surfaces:

- Translucent panels, soft `rgba` borders / highlight edges, large corner radii, soft elevation
- Light mode: warm/neutral ambient wash behind frosted cards
- Dark mode: atmospheric gradient wash behind dark glass; white primary CTAs; soft glow for live states (e.g. growing)
- Sans labels by default; monospace only for seed/code-like bits
- Keep the existing theme toggle (`useTerminalPrefs` / `AppHeader`) — both modes are glass, not terminal-green
- Keep the CSS variable layer (`--term-*` under `.terminal-theme`) for low churn; values change, names can migrate later

Docs/marketing VitePress can retain a distinct aesthetic; this ADR binds the **app** surfaces.

## Consequences

- New UI work should use glass tokens and clean sans labels, not invent CLI panel headers
- Embryo flows and APIs are unchanged — visual language only
- Further embryo-detail layout hierarchy work may iterate without reopening this decision

## Sources

- [Direction](/direction) — lab north star; visual language is a settled product choice
- `assets/css/main.css`, `assets/css/ai-elements-hypar.css` — token and surface implementation
- `components/AppHeader.vue` — theme toggle wiring
