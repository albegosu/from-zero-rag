# hypar — Auth & Multi-user Implementation Plan

> **Status (2026-05-26):** Phases 1–4 are **shipped on `main`**. Phase 5 (removal of the `/learn` stack) is also done. This document is kept as historical context for the rollout — for current usage docs see [Authentication](/guide/auth) and [Roles & permissions](/guide/roles-and-permissions).

> Original framing below — agent instructions for completing Phases 2–5 of the auth and multi-user rollout.
> Phase 1 (better-auth bootstrap) is already merged. Read this file top to bottom before writing any code.

**Repo drift note (2026):** Some paths below reference a **staging** layout (`pages/learn/*`, `utils/learning/*`). On current **`main`**, first-run onboarding lives in **`pages/setup.vue`** with wizard data in **`utils/setup/wizard-steps.ts`** and UI under **`components/setup/`**. The Monaco `/learn` quest is **removed** from the app. Treat old `learn` paths as historical unless you are restoring that stack.

---

## Context you must understand first

**Stack:** Nuxt 3 + Nitro/H3, Vue 3, Pinia, Prisma 7 + `@prisma/adapter-pg`, PostgreSQL 16 + pgvector, Vercel AI SDK, Tailwind 4, Nuxt UI v3.

**Auth library:** `better-auth` is already installed and configured.
- Server instance: `server/lib/auth.ts`
- Catch-all handler: `server/api/auth/[...].ts`
- Session middleware: `server/middleware/auth-session.ts` — attaches `event.context.auth` to every H3 event
- Client: `utils/auth-client.ts` — exports `signIn`, `signUp`, `signOut`, `useSession`
- Composable: `composables/useAuth.ts` — exports `userId`, `isAdmin`, `isAuthenticated`, `isPending`
- Route guard: `middleware/auth.ts` — redirects unauthenticated users to `/auth/signin`
- Auth pages: `pages/auth/signin.vue` and `pages/auth/signup.vue` — already styled with the project's terminal aesthetic (use `wz-*` CSS classes, `useTerminalPrefs()` for theme)

**DB models added in Phase 1:** `User`, `Session`, `Account`, `Verification` (migration `20260512000000_add_auth`).

**Existing models already have `userId String?`:** `Document`, `Conversation`, `Query`. These are currently nullable and unenforced — Phase 3 fixes that.

**Settings table:** `Setting { key String @id, value String, category String }`. Use `key = 'app.configured'` as the setup-complete flag.

**Style conventions:** All auth/setup UI must use the project's terminal CSS variables (`--term-*`, `wz-*` classes). See `pages/auth/signin.vue` for reference. Never use plain Tailwind colors directly — use the CSS variable layer.

**DO NOT touch:**
- `server/utils/search.service.ts`, `agent.service.ts`, `embedding.ts`, `chunking.ts` — RAG core, leave as-is
- `server/workflows/ingest-document.ts` — durable ingest workflow, leave as-is
- The old **`pages/learn/`** / **`utils/learning/`** tree — it is **not** on `main`; do not reintroduce it unless explicitly reviving the quest

---

## Phase 2 — Setup guard + onboarding wizard

**Goal:** On first run (no users in DB + `app.configured` setting missing), redirect every request to `/setup`. The wizard collects provider config and creates the first admin user.

### Files to CREATE

#### `server/middleware/setup-guard.ts`
Server-side middleware. Runs before every request.

Logic:
1. Skip if path starts with `/api/auth`, `/setup`, `/api/health`, or `/_nuxt`
2. Query `prisma.setting.findUnique({ where: { key: 'app.configured' } })`
3. If not found → query `prisma.user.count()`
4. If count === 0 → this is first run:
   - For API routes (`/api/*`): throw `createError({ statusCode: 503, statusMessage: 'Setup required' })`
   - For page routes: `return sendRedirect(event, '/setup')`
5. Otherwise: do nothing, let the request through

#### `server/api/setup/complete.post.ts`
Called by the wizard on the final step. Body: `{ name, email, password }`.

Logic:
1. Check `app.configured` setting — if already exists, throw 409
2. Check `prisma.user.count()` — if > 0, throw 409 (setup already done)
3. Call `auth.api.signUpEmail({ body: { name, email, password } })` to create the first user via better-auth
4. Immediately update that user's role to `'admin'`:
   ```ts
   await prisma.user.update({ where: { email }, data: { role: 'admin' } })
   ```
5. Write `prisma.setting.create({ data: { key: 'app.configured', value: 'true', category: 'system' } })`
6. Return `{ ok: true }`

#### `pages/setup.vue`
Public page (`definePageMeta({ layout: false, middleware: [] })`). Uses wizard steps from **`utils/setup/wizard-steps.ts`** (provider / DB / embedding / chunking / search / RAG) and components under **`components/setup/`**, then a final step to create the first admin account.

Structure:
- Reuse the terminal aesthetic from `pages/auth/signin.vue` and existing setup components as reference
- Steps 1–6: provider/DB/embedding/chunking/search/RAG config — persisted via `/api/setup/wizard-state` and applied with `/api/setup/apply-wizard` (see `server/api/setup/*`)
- Final step: admin account creation form — name, email, password fields
- On submit of final step: POST to `/api/setup/complete` with `{ name, email, password }`
- On success: `navigateTo('/auth/signin')` with a success message

### Files to MODIFY

#### `nuxt.config.ts`
Add `/setup` to the list of routes that bypass the auth route middleware (already done via `definePageMeta` on the page, but double-check the global middleware in `middleware/auth.ts` has `/setup` in `PUBLIC_ROUTES`).

---

## Phase 3 — Enforce userId scoping on all API routes

**Goal:** Every API route that returns or mutates user data must read `userId` from `event.context.auth?.user?.id` — never from the request body or a random localStorage value.

**Pattern to apply to every route below:**

```ts
// At the top of every handler, after imports:
const userId = event.context.auth?.user?.id
if (!userId) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
```

Then use `userId` in every Prisma query `where` clause.

### Routes to update

#### `server/api/conversations/index.get.ts`
Add `where: { userId }` to the `findMany`.

#### `server/api/conversations/index.post.ts`
Set `userId` on the created conversation.

#### `server/api/conversations/[id].get.ts`
Add `where: { id: ..., userId }` — 404 if not found (prevents user A reading user B's conversation).

#### `server/api/conversations/[id].delete.ts`
Add `where: { id: ..., userId }` to the delete.

#### `server/api/documents/index.get.ts`
Add `where: { userId }` to the `findMany`.

#### `server/api/documents/index.post.ts`
Set `userId` on the created document.

#### `server/api/documents/[id].get.ts`
Add `where: { id: ..., userId }`.

#### `server/api/documents/[id].delete.ts`
Add `where: { id: ..., userId }`.

#### `server/api/documents/upload.post.ts`
Pass `userId` into the document creation and into the ingest workflow payload.

#### `server/api/chat.post.ts`
Read `userId` from session. Pass it to `conversations.service` and `agent.service` so memory commands (`/remember`, `/forget`) are scoped per user.

#### `server/api/search/index.post.ts` and `server/api/search/rag.post.ts`
Pass `userId` to `search.service` so memory documents are filtered by user.

### Admin routes — role check instead of API key

#### `server/utils/admin-auth.ts`
Replace the current API key check with a role check:

```ts
export function requireAdmin(event: H3Event): void {
  const user = event.context.auth?.user
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  if (user.role !== 'admin') throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
}
```

Keep the old API key fallback for backward compat: if `ADMIN_API_KEY` is set AND the header matches, also allow through (useful for CI/scripts).

### Prisma migration needed

`Document.userId` and `Conversation.userId` are currently `String?`. After Phase 3, all new records will have a userId. Add a migration that makes these `NOT NULL` with a sensible default for existing rows (e.g. a placeholder `'legacy'` userId), then enforce at the application layer. Do this as a separate migration: `20260512100000_userid_not_null`.

---

## Phase 4 — Admin panel

**Goal:** A set of pages under `/admin/*` only accessible to users with `role === 'admin'`.

### Route guard

#### `middleware/admin.ts`
```ts
export default defineNuxtRouteMiddleware(() => {
  const { isAdmin, isPending } = useAuth()
  if (!isPending.value && !isAdmin.value) return navigateTo('/')
})
```

Apply with `definePageMeta({ middleware: ['admin'] })` on every admin page.

### Files to CREATE

#### `pages/admin/index.vue`
Admin dashboard. Shows: total users, total documents, total conversations, total queries in last 7 days. Fetches from existing `/api/admin/stats`.

#### `pages/admin/users.vue`
User management table. Columns: name, email, role, createdAt, banned.
Actions per row: change role (admin ↔ user), ban/unban.

Requires new API endpoints:

**`server/api/admin/users.get.ts`**
Returns `prisma.user.findMany({ select: { id, name, email, role, banned, createdAt } })`.

**`server/api/admin/users/[id].patch.ts`**
Body: `{ role?: string, banned?: boolean }`. Updates the user. Uses `requireAdmin`.

#### `pages/admin/usage.vue`
Token usage overview. Groups `Query` records by `userId`, shows count and average latency per user. Fetches from:

**`server/api/admin/usage.get.ts`**
```ts
const rows = await prisma.query.groupBy({
  by: ['userId'],
  _count: { id: true },
  _avg: { latencyMs: true },
  orderBy: { _count: { id: 'desc' } },
})
```
Join with `prisma.user.findMany` to get names/emails.

#### `pages/admin/settings.vue`
Already exists as `pages/settings.vue` — move/rename it under `/admin/settings` and gate with the admin middleware. Update any navigation links.

### Navigation

Add an admin section to `components/AppHeader.vue` — only visible when `isAdmin` is true. Link to `/admin`.

---

## Phase 5 — Remove learning/docs from the product

> **Status on `main`:** the Nuxt `/learn` stack described in this phase has **already been removed**. Keep this section as an audit checklist if you fork or restore files from history.

**Goal:** Strip the staging-only features so the product repo is clean.

### Files and folders to DELETE

```
pages/learn/
layouts/learn.vue
utils/learning/
components/learn/
stores/progress.ts
docs/               # VitePress site
.vitepress/
evals/
scripts/eval-rag.ts
```

### Dependencies to REMOVE from `package.json`

```
monaco-editor
nuxt-monaco-editor
vitepress
```

### `nuxt.config.ts` changes

Remove from `modules`:
```ts
'nuxt-monaco-editor',
```

Remove:
```ts
monacoEditor: { locale: 'en' },
```

Remove from `modules/copy-workflow-bundles.ts` any reference to Monaco.

### Navigation cleanup

In `components/AppHeader.vue` and `components/BottomNav.vue`, remove any links to `/learn`.

### `package.json` scripts to REMOVE
```
"docs:dev", "docs:build", "docs:preview", "eval"
```

---

## Execution order

```
Phase 2  →  Phase 3  →  Phase 4  →  Phase 5
```

Do not start Phase 3 until Phase 2 is working end-to-end (setup flow creates admin, login works).
Do not start Phase 5 until Phase 4 admin panel is functional.
Phase 5 is purely destructive — commit the deletions separately so they're easy to review.

---

## Definition of done (per phase)

**Phase 2:** Fresh DB → visit `http://localhost:3000` → redirected to `/setup` → complete wizard → redirected to `/auth/signin` → sign in with the admin credentials created in setup → land on `/`.

**Phase 3:** User A and User B each sign up. A uploads a document. B cannot see or retrieve A's document via any API route.

**Phase 4:** Admin user visits `/admin/users`, sees all users, can change roles. `/admin/usage` shows query counts per user.

**Phase 5:** `pnpm dev` starts with no Monaco warnings. `/learn` returns 404. The interactive learning stack is removed from the Nuxt app. **Note:** the **VitePress** site under `docs/` is separate from the app — it stays in `devDependencies` and is built with `pnpm docs:build` for GitHub Pages; it is not loaded by `pnpm dev` unless you run `pnpm docs:dev`.

---

*Last updated: 2026-05-26 · Phases 1–5 complete · superseded by the [Users & access](/guide/auth) guides*
