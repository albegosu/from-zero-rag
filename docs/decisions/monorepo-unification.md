---
status: historical
---

# Plan: Unify Monorepo into a Single Nuxt 3 Project

> **Status: historical** (pre-dates the numbered ADR set). Records the multi-app layout (NestJS API, separate playground) and the **intent** to merge into one Nuxt repo. The current tree has evolved since (e.g. no `apps/*`, `/learn` quest removed from the unified app). Keep this document for **why** past decisions were made, not as a map of every file today.
>
> The durable outcome is captured in [ADR 0001 — Single Nuxt app](./0001-single-nuxt-app). See the [Decisions index](./).

## Context

The repo currently splits across four projects:
- `apps/rag-ui` — Nuxt 3 (port 3000) — main RAG frontend (search, documents, upload).
- `apps/rag-api` — NestJS (port 3001) — Prisma + pgvector backend, multi-provider embeddings/LLM.
- `packages/rag-learning` — Pure TS library (`@rag/learning`) — levels, validators, wizard data.
- `packages/rag-playground` — Nuxt 3 (port 3002) — gamified learning UI, imports `@rag/learning`.

Goal: collapse all four into ONE Nuxt 3 project at the repo root. NestJS becomes Nuxt `server/api` (h3) routes; rag-ui stays at `/`; rag-playground moves under `/learn/*`; rag-learning is inlined as `utils/learning/`. Single Dockerfile, single `package.json`, no workspace.

Outcome: simpler dev story (one `pnpm dev`, port 3000 only), no CORS, fewer build artifacts, easier deploy.

---

## A. Target Directory Structure

```
from-zero-rag/
├── nuxt.config.ts               # merged
├── app.config.ts
├── app.vue
├── package.json                 # single, all deps merged
├── tsconfig.json
├── prisma/                      # moved from apps/rag-api/prisma/
│   ├── schema.prisma
│   └── migrations/
├── prisma.config.ts
├── assets/css/main.css
├── public/
├── layouts/
│   ├── default.vue              # rag-ui shell
│   └── learn.vue                # playground shell
├── pages/
│   ├── index.vue                # rag-ui home
│   ├── upload.vue
│   ├── documents/{index,[id]}.vue
│   └── learn/
│       ├── index.vue
│       ├── onboarding.vue
│       ├── level/[id].vue
│       └── challenge/[id].vue
├── components/
│   ├── AppHeader.vue            # top-level (rag-ui)
│   ├── BottomNav.vue
│   └── learn/                   # auto-prefixed <Learn*>
├── composables/
├── stores/{documents,progress}.ts
├── plugins/i18n.ts
├── i18n/locales/{en,es}.json    # namespaced { ui:..., learn:... }
├── utils/learning/              # inlined @rag/learning
│   ├── levels/ validators/ wizard/ types/ index.ts
└── server/
    ├── api/
    │   ├── documents/{index.get, index.post, upload.post, [id].get, [id].delete, [id]/reprocess.post}.ts
    │   ├── search/{index, rag, inspect, converse}.post.ts
    │   ├── agent/chat.post.ts
    │   └── admin/{queries,stats}.get.ts
    ├── plugins/prisma.ts        # disconnect on close
    └── utils/
        ├── prisma.ts            # singleton
        ├── chunking.ts embedding.ts ollama.ts
        ├── documents.service.ts search.service.ts agent.service.ts
        ├── validation.ts        # zod schemas
        └── errors.ts
```

---

## B. NestJS → h3 Migration Mapping

Apply uniformly:
- `@Controller + @Post/@Get` → file under `server/api/...` exporting `defineEventHandler`.
- `@Body() dto` (class-validator) → `await readValidatedBody(event, schema.parse)` with zod in `server/utils/validation.ts`.
- `@Param('id')` → `getRouterParam(event, 'id')`.
- `@Query()` + pipes → `getQuery(event)` + manual `Number()`/clamp helpers.
- `@Injectable()` services → plain modules in `server/utils/*.service.ts`; replace constructor DI with direct imports of the prisma singleton + utility modules.
- `PrismaService extends PrismaClient` → `server/utils/prisma.ts` singleton (`globalThis` guard for HMR). Disconnect via `server/plugins/prisma.ts` on Nitro `close` hook.
- `NotFoundException`/`BadRequestException` → `throw createError({ statusCode, statusMessage })`.
- `@HttpCode(204)` → `setResponseStatus(event, 204)`.
- CORS / `enableCors` → delete (same-origin).
- `Logger` → `consola`/`console`.

Module-by-module:
- **documents** — port `documents.controller.ts` to 6 route files. Move `documents/chunking/embedding.service.ts` to `server/utils/`. Replace `FileInterceptor + UploadedFile` with `await readMultipartFormData(event)`; manually enforce 10 MB cap and normalize to `{ buffer, originalname, mimetype, size }` for `createFromFile`. `pdf-parse` stays as-is.
- **search** — port `search.controller.ts` to 4 routes; `SearchService` → `server/utils/search.service.ts` with `search/rag/inspect/converse` exports. No SSE today (converse returns final JSON); add `routeRules` only if Nitro timeout shortens it.
- **agent** — `agent.controller.ts` → `server/api/agent/chat.post.ts`; service → `server/utils/agent.service.ts` (imports docs + search services + prisma directly).
- **admin** — `queries.get.ts`, `stats.get.ts`, parsing `limit`/`offset` from query string with clamps.
- **ollama** — `apps/rag-api/src/ollama/create-ollama.ts` → `server/utils/ollama.ts` (pure factory).
- **prisma** — schema + migrations to root `prisma/`; update `prisma.config.ts` paths; add `db:migrate`, `db:generate`, `db:studio`, `postinstall` scripts.

---

## C. Frontend Merge

- **Stores**: copy both Pinia stores into `stores/` (distinct ids — no collision). Strip `apiBaseUrl` from `documents.ts`; switch to relative `$fetch('/api/...')`.
- **Components**: `AppHeader.vue`, `BottomNav.vue` stay top-level. Playground-only components move under `components/learn/` (auto-prefix `<Learn*>`).
- **Layouts**: keep `layouts/default.vue` from rag-ui. Add `layouts/learn.vue` (extracted from playground `app.vue`). Set `definePageMeta({ layout: 'learn' })` on `pages/learn/*` — or use a single `pages/learn.vue` parent with `<NuxtPage />`.
- **i18n**: one `plugins/i18n.ts`. Merge locales as `{ ui: { ... }, learn: { ... } }`. Update `t()` calls in playground pages/components to the `learn.*` prefix.
- **Monaco**: add `nuxt-monaco-editor` to `modules`; only imported from `pages/learn/challenge/[id].vue` (route-level code-split keeps it off `/`, `/documents`, `/upload`). Optionally `defineAsyncComponent` for extra safety.
- **Nuxt UI version conflict**: rag-ui uses `@nuxt/ui v2`, playground uses `v3`. Standardize on **v3**. Audit all `<U*>` components in rag-ui — `<UFormGroup>` → `<UFormField>`, `<UDropdown>` → `<UDropdownMenu>`, prop renames, color/size scales.
- **Tailwind v3 → v4**: rewrite `assets/css/main.css` entry to `@import "tailwindcss"`; replace `tailwind.config.js` with `@theme` blocks or drop it; recheck `@apply` usage.

---

## D. Routing for `/learn/*`

File-based, mechanical:
- `pages/learn/index.vue` → `/learn`
- `pages/learn/onboarding.vue` → `/learn/onboarding`
- `pages/learn/level/[id].vue` → `/learn/level/:id`
- `pages/learn/challenge/[id].vue` → `/learn/challenge/:id`

Optional `pages/learn.vue` containing `<NuxtPage />` for a persistent learn-only sub-shell. Update internal `<NuxtLink to="/level/1">` → `/learn/level/1`.

---

## E. Inline `rag-learning` into `utils/learning/`

All rag-learning content is currently consumed in the browser, so it lives client-side:
- `src/levels/*` → `utils/learning/levels/`
- `src/types/*` → `utils/learning/types/`
- `src/wizard/*` (incl. `buildEnvFile`) → `utils/learning/wizard/`
- `src/validators/*` → `utils/learning/validators/`
- `src/index.ts` → `utils/learning/index.ts` (re-exports `getAllLevels`, `getLevel`, `getChallenge`, `wizardSteps`, types, validators)

Update imports: `from '@rag/learning'` → `from '~/utils/learning'`. Promote `zod` to a top-level dep. Delete `packages/rag-learning/` after verification.

---

## F. Config Consolidation

**`nuxt.config.ts`**:
- `modules: ['@nuxt/ui', '@pinia/nuxt', '@vueuse/nuxt', 'nuxt-monaco-editor']`
- `css: ['~/assets/css/main.css']`
- `runtimeConfig`: drop `public.apiBaseUrl`. Add private: `databaseUrl`, `googleApiKey`, `openaiApiKey`, `ollamaUrl`, `ollamaModel`, `ollamaLlmModel`, `embeddingDimensions`, chat/planner timeouts.
- Merged `app.head` (one title, deduped fonts).
- `colorMode: { preference: 'dark' }`.
- `monacoEditor: { locale: 'en' }`.
- Optional `routeRules` for `/api/search/converse`, `/api/agent/chat` if timeouts need tuning.

**`package.json`** (single):
- Runtime: union of all four (Nuxt UI v3, Pinia, VueUse, vue-i18n, vue-router, nuxt-monaco-editor, monaco-editor, marked, zod, `@google/generative-ai`, `@prisma/client`, `@prisma/adapter-pg`, ollama, openai, pdf-parse, pg, uuid).
- Dev: nuxt, typescript, vue-tsc, tailwindcss v4, @tailwindcss/vite, prisma, @types/node, @types/pdf-parse, @types/uuid.
- Drop: all `@nestjs/*`, `class-validator`, `class-transformer`, `rxjs`, `reflect-metadata`, `ts-jest`, `ts-loader`.
- Scripts: `dev`, `build`, `start`, `db:migrate`, `db:generate`, `db:studio`, `postinstall: nuxt prepare && prisma generate`.

**Workspace**: delete `pnpm-workspace.yaml`. Run a clean `pnpm install` at root.

**`tsconfig.json`**: `extends ./.nuxt/tsconfig.json`. Strict on.

---

## G. Docker / docker-compose

**Single root Dockerfile** — multi-stage:
- `deps` — `pnpm install --frozen-lockfile`
- `build` — `pnpm build` → `.output/`
- `runtime` — Node 20-alpine, copy `.output/` + `prisma/`, entrypoint runs `prisma migrate deploy` then `node .output/server/index.mjs`. Expose 3000.

**`docker-compose.yml`** collapsed:
- Keep `postgres` (pgvector) and `ollama` unchanged.
- Replace `backend`, `frontend`, `playground` with one `app` service: build root, env (`DATABASE_URL`, `OLLAMA_*`, `GOOGLE_API_KEY`, `OPENAI_API_KEY`, `EMBEDDING_DIMENSIONS`, `NUXT_HOST=0.0.0.0`, `NUXT_PORT=3000`), `ports: ["3000:3000"]`, `depends_on: postgres`.
- Drop `NUXT_PUBLIC_API_BASE_URL` build arg and the `profiles` matrix.

---

## H. Env Var Consolidation

Single `.env` at root. Remove `NUXT_PUBLIC_API_BASE_URL`, `BACKEND_PORT`, `FRONTEND_PORT`, `PLAYGROUND_PORT` (one `PORT=3000`). Keep DB + provider keys + Ollama config + timeouts. Read via `useRuntimeConfig()`, not `process.env` direct. `grep -r apiBaseUrl` and `grep -r NUXT_PUBLIC_API_BASE_URL` to confirm nothing left.

---

## I. Migration Order (with Verification Gates)

1. New branch + tag current commit.
2. Scaffold root Nuxt project (root `nuxt.config.ts`, `package.json`, `tsconfig.json`, `app.vue`, blank `pages/index.vue`). **Gate**: `pnpm dev` boots blank :3000.
3. Move Prisma to root + add `server/utils/prisma.ts` singleton. **Gate**: `prisma migrate dev` connects to existing DB.
4. Port one trivial route (`server/api/admin/stats.get.ts`) end-to-end as pattern proof. **Gate**: `curl /api/admin/stats` returns expected JSON.
5. Port documents module (utils first, then 6 routes incl. `upload.post.ts`). **Gate**: PDF upload via curl works; `GET /api/documents` lists it with chunks.
6. Port search module (4 routes). **Gate**: semantic + RAG + converse + inspect endpoints respond.
7. Port agent module. **Gate**: `/api/agent/chat` returns reply.
8. Port remaining admin route (`queries`).
9. Migrate rag-ui frontend (pages, components, composables, layout, store, css, i18n, plugin, app.config, app.vue). Strip `apiBaseUrl`. Apply Nuxt UI v2→v3 + Tailwind v3→v4 changes. **Gate**: `/`, `/documents`, `/documents/[id]`, `/upload` all functional via the new server routes.
10. Inline rag-learning under `utils/learning/`; rewrite imports. **Gate**: `pnpm build` succeeds with no `@rag/learning` resolution errors.
11. Migrate playground under `/learn/*` (pages, `components/learn/`, `progress` store, `learn.vue` layout, namespaced i18n, monaco module). **Gate**: all `/learn/*` routes work; Monaco only loads on challenge page.
12. Consolidate Dockerfile + compose. **Gate**: `docker compose up` end-to-end.
13. Delete legacy: `apps/rag-api/`, `apps/rag-ui/`, `packages/rag-learning/`, `packages/rag-playground/`, `pnpm-workspace.yaml`. Update `README.md`, `DOCKER.md`, `CONTRIBUTING.md`.
14. Final E2E pass (section J).

---

## J. End-to-End Verification

- Fresh `pnpm install && pnpm prisma migrate deploy` clean.
- `pnpm dev` on :3000, no console errors.
- DB: pgvector extension + tables present.
- `/upload` → small PDF → appears on `/documents` with chunk count > 0.
- `/documents/[id]` shows chunks.
- POST `/api/search` → results; `/api/search/rag` → reply with sources; `/api/search/converse` returns within timeout (no CORS preflight); `/api/search/inspect` → embedding preview + latency.
- POST `/api/agent/chat` → planner output, optional `used_kb: true` with sources.
- `/api/admin/stats` and `/api/admin/queries` work.
- `/learn` → level map. `/learn/onboarding` → wizard produces env file. `/learn/level/1` lists challenges. `/learn/challenge/<id>` Monaco loads, validator runs, progress persists across reload.
- Bundle audit: `/` does NOT load Monaco chunks; challenge page does.
- `pnpm build && node .output/server/index.mjs` works.
- `docker compose up` reproduces all of the above.

---

## K. Critical Files to Read & Risks

**Read before each step**:
- Prisma: `apps/rag-api/prisma/schema.prisma`, `prisma.config.ts`, `src/prisma/prisma.service.ts`.
- Documents: `src/documents/{documents.controller,documents.service,chunking.service,embedding.service}.ts`, `dto/create-document.dto.ts`.
- Search: `src/search/{search.controller,search.service}.ts`, `dto/{search,converse}.dto.ts`.
- Agent: `src/agent/{agent.controller,agent.service}.ts`, `dto/agent-chat.dto.ts`.
- UI merge: `apps/rag-ui/{nuxt.config.ts,app.vue,app.config.ts}`, `stores/documents.ts`, `components/AppHeader.vue`, `i18n/locales/en.json`.
- Learning: `packages/rag-learning/src/{index.ts,wizard-types.ts}`, all `validators/`.
- Playground: `packages/rag-playground/{nuxt.config.ts,app.vue}`, `stores/progress.ts`, all `pages/*.vue` and `components/*.vue`, `i18n/locales/en.json`.

**Risks / gotchas**:
- DI → top-level imports may surface circular deps between docs/search/agent services — break with explicit interface separation if it appears.
- `class-validator` → zod (or valibot); preserve `whitelist: true` semantics with `.strict()`.
- `FileInterceptor` size limits NOT enforced by `readMultipartFormData` — manual 10 MB check required.
- `converse` client uses 210 s timeout — verify Nitro/Node defaults don't kill earlier; if streaming added later use h3 `eventStream`/`sendStream` (don't port `Sse()`/Observable patterns).
- CORS removed — drop `enableCors`, drop `NUXT_PUBLIC_API_BASE_URL` everywhere.
- Nuxt UI v2→v3: high-effort breaking change, audit every `<U*>` component.
- Tailwind v3→v4: CSS entry syntax changes, `@apply` rules need recheck.
- i18n key collisions (`home`, `nav.back`) — namespace under `ui.*`, `learn.*`.
- Monaco SSR — `nuxt-monaco-editor` is client-only, but verify; wrap in `<ClientOnly>` if needed.
- Prisma 7 + ESM: ensure `@prisma/adapter-pg` config matches NestJS bootstrap in `prisma.config.ts`.
- Pinia `progress` store's `new Date()` defaults cause SSR hydration mismatch — guard with `import.meta.client` or move to a hydration action.
- Pages calling `$fetch('/api/...')` in `setup()` should use `useAsyncData` for proper SSR hydration.
- Workspace removal: `rm -rf node_modules **/node_modules pnpm-lock.yaml` before first root `pnpm install`.
- Tests: rag-api has Jest specs (`chunking.service.spec.ts`, `search.service.spec.ts`) — port to Vitest, don't drop coverage silently.
