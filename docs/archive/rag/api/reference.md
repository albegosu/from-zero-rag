# API reference

All routes are **same-origin** Nitro handlers under **`/api/*`**. Request bodies use JSON unless noted. Validation is done with **Zod** (`readValidatedBody` / `getValidatedQuery`).

---

## Conventions

| Topic | Detail |
| --- | --- |
| Base URL | Same host as the Nuxt app (e.g. `http://localhost:3000`). |
| Errors | Typical `4xx` / `5xx` with JSON `{ statusMessage, message }` where applicable. |
| Admin auth | `GET/POST /api/admin/*` use `requireAdmin`: session with **`role === 'admin'`**, **or** `Authorization: Bearer <ADMIN_API_KEY>` / `x-admin-key` when `ADMIN_API_KEY` is set. |
| Rate limits | In-memory token bucket per **IP + session user id**: chat `POST /api/chat` **30/min**; `POST /api/documents/upload` **10/min**; other document `POST`/`DELETE` **30/min** (`server/middleware/rate-limit.ts`). Optional `REDIS_URL` for multi-instance (`server/utils/distributed-store.ts`). |

---

## Authentication

All `/api/auth/*` routes are served by [better-auth](https://www.better-auth.com/) via the catch-all handler `server/api/auth/[...].ts`. The shapes follow the upstream contract — most callers should use the browser client in [`utils/auth-client.ts`](utils/auth-client.ts) (`signIn`, `signUp`, `signOut`, `useSession`) rather than hand-rolling requests.

| Path | Notes |
| --- | --- |
| `POST /api/auth/sign-up/email` | Email + password account. New users get `role = 'user'`. |
| `POST /api/auth/sign-in/email` | Email + password sign-in. Sets the session cookie. |
| `GET  /api/auth/sign-in/social` | OAuth start. Google / GitHub providers enabled when their env vars are set. |
| `POST /api/auth/sign-out` | Clears the session. |
| `GET  /api/auth/get-session` | Returns `{ user, session }` or `null`. Read on every page by `useAuth()`. |

The first-run wizard has a separate completion endpoint:

### `POST /api/setup/complete`

Body: `{ name, email, password }`. Creates the first user, promotes them to `admin`, and writes the `app.configured` setting. Returns 409 once setup has already been completed.

See [Authentication](/guide/auth) and [Roles & permissions](/guide/roles-and-permissions) for the model.

---

## Health

### `GET /api/health`

JSON status for load balancers: DB connectivity, embedding provider reachability, timestamp.

---

## Chat

### `POST /api/chat`

**Streaming** agentic chat (AI SDK **UIMessage** stream).

**Body (JSON)**

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `messages` | array | yes | 1–50 UIMessage-shaped objects (`role`, `parts`, optional `id`). |
| `userId` | string | no | Max 200 chars; scopes memory + retrieval. |
| `conversationId` | string (uuid) | no | Continue an existing thread. |
| `limit` | number | no | Retrieval `limit` for the KB tool (1–20, implementation default if omitted). |

Text parts are capped at **64 KiB** each.

**Response:** `UIMessageStream` (not plain JSON — streamed chunks).

**Side effects:** appends user + assistant messages, may create/refine conversation title, logs a **`Query`** row on completion.

**Example:**

```bash
curl -N -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {
        "role": "user",
        "parts": [{ "type": "text", "text": "What is hybrid search?" }]
      }
    ],
    "conversationId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

The response is a streamed `UIMessageStream` — clients should use the AI SDK `useChat` composable or consume the stream incrementally.

---

## Conversations

### `GET /api/conversations`

**Query:** optional `userId`.

**Response:** `{ items: ConversationSummary[] }`.

### `POST /api/conversations`

**Body:** optional `userId`, optional `title`.

**Response:** `{ id }` — new conversation UUID.

### `GET /api/conversations/:id`

**Query:** optional `userId` (access check).

**Response:** conversation with messages (shape from `getConversation`).

### `DELETE /api/conversations/:id`

Deletes the conversation and cascaded messages.

---

## Documents

### `GET /api/documents`

List documents (service-defined filters / fields).

### `POST /api/documents`

Create from inline text.

**Body**

| Field | Type | Required |
| --- | --- | --- |
| `title` | string | yes (1–500 chars) |
| `content` | string | yes |
| `sourceType` | `"text"` \| `"markdown"` | yes |
| `userId` | string | no |
| `metadata` | object | no |

Returns creation + workflow **`runId`** / status for async ingest (see service).

### `POST /api/documents/upload`

**Multipart** form: part **`file`** (required) + optional **`userId`** (text). PDF / text / markdown, **max 10 MB**, MIME validated.

Returns **`documentId`**, **`runId`**, **`processing`** status.

**Example:**

```bash
curl -X POST http://localhost:3000/api/documents/upload \
  -F "file=@./my-document.pdf"
```

```json
{
  "documentId": "clxyz123...",
  "runId": "run_abc456",
  "status": "processing"
}
```

Poll `GET /api/documents/:id/ingest-status?runId=run_abc456` until status is `completed` or `failed`.

### `GET /api/documents/:id`

Single document metadata + chunks (when ready).

### `DELETE /api/documents/:id`

Deletes document and cascaded chunks.

### `POST /api/documents/:id/reprocess`

Re-runs ingestion (embeddings refreshed). Returns new **`runId`**.

### `GET /api/documents/:id/ingest-status`

**Query:** `runId` (workflow run).

Poll until status is terminal (`completed` / `failed` / etc. — see handler).

---

## Search

### `POST /api/search`

**Body:** `{ query: string, limit?: number }` — `limit` 1–20, default **5**.

**Response:** ranked chunk list (hybrid + MMR). No HyDE.

**Example:**

```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{ "query": "hybrid search", "limit": 5 }'
```

```json
{
  "results": [
    {
      "id": "chunk_abc",
      "content": "Hybrid search combines vector similarity with BM25...",
      "score": 0.87,
      "documentId": "doc_123",
      "documentTitle": "RAG Architecture"
    }
  ]
}
```

### `POST /api/search/rag`

**Body:** `{ query: string, limit?: number, userId?: string }`.

**Response:** `{ query, results, context, sources }` — `context` is `[n]`-numbered passages for prompting; **no** LLM call here.

### `POST /api/search/inspect`

**Auth:** signed-in session (workspace-scoped). **Body:** `{ query: string, limit?: number }`.

**Response:** embedding preview (first dims), per-phase **latency**, `results`, `sources` — debug endpoint.

---

## Admin

Uses `requireAdmin` (see conventions).

### `GET /api/admin/metrics`

Prometheus text exposition (`text/plain`) — request counters and span latency summaries from `server/utils/metrics.ts`.

### `GET /api/admin/stats`

Aggregate counts: documents, chunks, queries, latency percentiles, ingest status breakdown, tool-call share.

### `GET /api/admin/usage`

Recent query log and latency stats.

### `GET /api/admin/users`

List users (admin UI for role changes).

### `PATCH /api/admin/users/:id`

Body: `{ role: 'admin' | 'user' }` — promote or demote users.

### `GET /api/admin/settings`

**Query:** `category` — read tunable settings.

### `POST /api/admin/settings`

**Body:** `{ key, value, category }` — upsert a setting. If `value` starts with `••••` (the mask returned by the GET endpoint), the write is skipped — the real secret is preserved.

---

## Workspaces

All workspace routes require a signed-in session. The handler reads the caller's `userId` from the session and checks `WorkspaceMember` for the right role.

### `GET /api/workspaces`

Lists the caller's workspaces with `role` and an `active` flag.

### `POST /api/workspaces`

**Body:** `{ name }` (1–100 chars). Creates a workspace and the caller is its `owner`.

### `POST /api/workspaces/:id/activate`

Sets the `active-workspace` cookie (httpOnly, 1-year max-age). Caller must be a member.

### `POST /api/workspaces/:id/members`

**Body:** `{ email, role? }` — `role` is `editor` (default) or `viewer`. **Owners only.** Invitee must already be a registered user.

### `GET /api/workspaces/:id/settings`

**Query:** `category` — `chunking` (default) or `general`. Returns workspace overrides plus, for `chunking`, the resolved `effective_ALLOWED_FORMATS` and a `workspaceOverride` flag.

### `POST /api/workspaces/:id/settings`

**Body:** `{ key, value, category? }`. Empty `value` deletes the override. **Owners and editors only.**

See [Workspaces](/guide/workspaces) for the model and the active-workspace cookie semantics.

---

## User settings

Per-user overrides on top of global `Setting` values. Requires a signed-in session.

### `GET /api/user/settings`

**Query:** `category` — one of `apis`, `vectorDb`, `embeddings`, `chunking`, `search`, `rag`, `general`.

Returns, per field, either `{ override, system, hasOverride }` (scalars) or `{ configured, systemConfigured }` (secrets — values are never returned). For the `chunking` category and an active workspace, also returns `effective_ALLOWED_FORMATS` and `workspaceOverride_ALLOWED_FORMATS`.

### `PUT /api/user/settings`

**Body:** `{ key, value, category? }`. Empty `value` deletes the override. Invalidates the per-user rate-limit cache.

See [Settings](/guide/settings) for the resolution order.

---

## Related docs

- [RAG pipeline](/features/rag-pipeline)  
- [Hybrid search & HyDE](/features/search)  
- [Architecture](/architecture/)
