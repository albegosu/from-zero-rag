# Changelog


## Unreleased — embryo lab

The RAG product was archived (`archive/rag-v1`, tag `v0.4-rag`). `main` is an AI interaction research lab. The entries below cover the pivot and PRs **#100–#104**. Older RAG-era notes remain under [pre-unification-snapshot...main](#pre-unificationsnapshotmain) for history.

### Pivot

- Reframe Hypar as an embryo garden: living ideas, fossils instead of delete, agent as collaborator
- Purge RAG routes, evals, and docs leftovers (#99, #100)
- Reorient the VitePress landing to the lab identity (#98, #100)

### Embryo collaborator

- Fossil UX, typed connections, richer garden, agent dismiss (#101)
- Streaming agent, connection picker with search, pending-connection HITL
- Auto-engage on first visit and reply loop (#103)
- Method stance by lifecycle (`DEFINE` / `PROBE` / `INVERT` / `VARIETY` / `SIMPLEST`), pending paths, fossil kinds (#104)
- `ai-elements-nuxt` surfaces: collaborator, graph, garden queue, model selector (#104)
- Inferred agent connections (unconfirmed rows + dashed graph), resurrection, garden strata, visible first-engage germination

### Fixes

- Drop leftover RAG eval step that failed every push (#102)

---


## pre-unification-snapshot...main

[compare changes](https://github.com/albegosu/hypar/compare/pre-unification-snapshot...main)

### 🚀 Enhancements

- **pages:** Deploy guides in github pages ([a82059ca1](https://github.com/albegosu/hypar/commit/a82059ca1))
- **runtime-envs:** Wire steps 3-6 to runtime + DB-backed settings UI ([da8d47795](https://github.com/albegosu/hypar/commit/da8d47795))
- **runtime:** Add settings to modify parameters in runtime ([6b925b07f](https://github.com/albegosu/hypar/commit/6b925b07f))
- **login:** Add login ([5dd8c22ac](https://github.com/albegosu/hypar/commit/5dd8c22ac))
- **chat:** Surface active search mode in header ([575cca89b](https://github.com/albegosu/hypar/commit/575cca89b))
- Add workspaces ([86b289d6a](https://github.com/albegosu/hypar/commit/86b289d6a))
- Brand identity refresh and Ollama Cloud host fix ([a445cecb4](https://github.com/albegosu/hypar/commit/a445cecb4))
- Add husky to the project ([b413d185d](https://github.com/albegosu/hypar/commit/b413d185d))
- Add screenshots ([37842e055](https://github.com/albegosu/hypar/commit/37842e055))

### 🩹 Fixes

- **wizards:** Sync rag and wizards envs ([1249ff92d](https://github.com/albegosu/hypar/commit/1249ff92d))
- **pages-workflow:** Define job build ([2d553a8b0](https://github.com/albegosu/hypar/commit/2d553a8b0))
- **pages-workflow:** Define job build ([4b7159cdb](https://github.com/albegosu/hypar/commit/4b7159cdb))
- **pages-workflow:** Define job build ([6e09b98a6](https://github.com/albegosu/hypar/commit/6e09b98a6))
- **docs:** Hero canvas and ScrollTrigger on mobile ([4408a47fb](https://github.com/albegosu/hypar/commit/4408a47fb))
- **agent:** Preserve base system prompt in all modes + expose AGENT_MAX_STEPS ([32ba1e5cf](https://github.com/albegosu/hypar/commit/32ba1e5cf))
- **ui:** Align pipeline trace candidate count with actual fetchLimit ([7f4547bf0](https://github.com/albegosu/hypar/commit/7f4547bf0))
- **chat:** Split KB pill into 'searched' and 'cited' ([dd2a73d0b](https://github.com/albegosu/hypar/commit/dd2a73d0b))
- **chat:** Defer user message persistence until stream is alive ([0cae472a4](https://github.com/albegosu/hypar/commit/0cae472a4))
- **embedding:** Invalidate cache on (re)ingest ([9a9a4e5c1](https://github.com/albegosu/hypar/commit/9a9a4e5c1))
- **UI:** Save settings ([0c800d7d3](https://github.com/albegosu/hypar/commit/0c800d7d3))
- Enotfound ollama models ([47aec3ef6](https://github.com/albegosu/hypar/commit/47aec3ef6))
- **chat:** Sanitize UI messages before model conversion ([2c0b5a44b](https://github.com/albegosu/hypar/commit/2c0b5a44b))
- Fix quota error ([00a4e29be](https://github.com/albegosu/hypar/commit/00a4e29be))
- Resolve admin settings from runtime and fetch Ollama Cloud models via /api/tags ([4d8d335f5](https://github.com/albegosu/hypar/commit/4d8d335f5))
- Fix screenshots ([24f0ff191](https://github.com/albegosu/hypar/commit/24f0ff191))
- Docs favicon ([0eba294ca](https://github.com/albegosu/hypar/commit/0eba294ca))
- Hoisted ([7f233a29c](https://github.com/albegosu/hypar/commit/7f233a29c))

### 💅 Refactors

- **app:** Unify RAG app into single Nuxt project and rood Docker layout ([2ee760db8](https://github.com/albegosu/hypar/commit/2ee760db8))
- **sdk:** Add ai sdk and workflows sdk with deep changes ([a24e5960d](https://github.com/albegosu/hypar/commit/a24e5960d))

### 📖 Documentation

- **guides:** Update guides ([754466640](https://github.com/albegosu/hypar/commit/754466640))
- **landing:** Rebuild home with three pillars and roadmap track ([2edfef075](https://github.com/albegosu/hypar/commit/2edfef075))
- **landing:** Paraboloid animation ([b92b859c6](https://github.com/albegosu/hypar/commit/b92b859c6))
- **readme:** Post-refactor cleanup + 'What is RAG?' + glossary ([82f44f29f](https://github.com/albegosu/hypar/commit/82f44f29f))
- Archive 2 agents-plans into docs/, drop 3 ephemeral notes ([2e105f534](https://github.com/albegosu/hypar/commit/2e105f534))
- Updated docs ([df340c854](https://github.com/albegosu/hypar/commit/df340c854))
- Review all documentation and rename repo to albegosu/hypar ([f8af1aa6c](https://github.com/albegosu/hypar/commit/f8af1aa6c))

### 🏡 Chore

- **workflows:** Remove and fix workflows ([22f15da8f](https://github.com/albegosu/hypar/commit/22f15da8f))
- Baseline post-VitePress refactor + gitignore hygiene ([e152c896b](https://github.com/albegosu/hypar/commit/e152c896b))
- Remove unused files and gsap dependency ([ee72c6baa](https://github.com/albegosu/hypar/commit/ee72c6baa))
- **i18n:** Drop orphan home.* namespace from locales ([ad1e5ea5a](https://github.com/albegosu/hypar/commit/ad1e5ea5a))
- Fix 3 pre-existing typecheck errors ([457263c5b](https://github.com/albegosu/hypar/commit/457263c5b))

### ❤️ Contributors

- Albegosu <albegosu@gmail.com>

