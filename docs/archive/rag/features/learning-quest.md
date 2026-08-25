# Learning quest

## Current status (unified app)

The **Monaco-based learning quest** (`/learn/*`, levels, XP, validators) shipped with an **older monorepo layout** (separate playground package). When the stack was collapsed into a **single Nuxt app**, the quest UI was **removed** to reduce maintenance and bundle size. There is **no** `/learn` route in the current `main` tree.

What you have instead today:

- This **VitePress** site (guides, features, API, architecture, roadmap).
- The **RAG app** at `/` with documents, chat, upload, `/setup`, and `/admin/*`.
- Design notes: [Learning (historical)](/learning/learning) describes how the quest was meant to work if you bring it back.

## If you reintroduce a quest

See the RFC [Phase 5 — remove learning](/rfcs/2026-auth-phases) for the inverse checklist (what “done” looked like when stripping the stack). For a future reintroduction, prefer lazy-loading Monaco only on challenge routes and keep `/` free of editor chunks.

## Related

- [Memory & commands](./memory) — `/remember`, `/forget`, `/memory clear` in chat (still in the app).
- [Contributing](/contributing) — how to work on the repo today.
