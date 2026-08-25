<DocMicroLead />

# Admin panel

`/admin/*` is reachable only to users with `role === 'admin'`. The gate is `middleware/admin.ts` on every page and `requireAdmin(event)` on every API route.

## Pages

### `/admin` — Dashboard

`pages/admin/index.vue`. Top-line counters fed by `GET /api/admin/stats`:

- Total documents, chunks, queries
- Average latency (and p50 / p95)
- Tool-call rate (share of queries that hit the knowledge-base tool)
- Document count grouped by `ingestStatus`

Quick links to the other admin pages.

### `/admin/users` — User management

`pages/admin/users.vue`. Lists every user with name, email, role, banned flag and createdAt.

Row actions:

- Toggle role between `user` and `admin` (`PATCH /api/admin/users/:id` with `{ role }`).
- Ban / unban (`PATCH /api/admin/users/:id` with `{ banned }`).

### `/admin/usage` — Per-user usage

`pages/admin/usage.vue`. Groups the `Query` table by `userId` and joins to `User`:

| userId | name | email | queryCount | avgLatencyMs |
| --- | --- | --- | --- | --- |

Ordered by query count descending.

### `/admin/settings` — Global settings

`pages/admin/settings.vue`. Loads and writes the `Setting` table by category, using the same wizard step definitions as `/setup`. Secrets are masked to `••••<last4>`; resaving the masked value is a no-op so the real secret survives.

See [Settings](./settings) for the layering model.

## Scripted access

Admin endpoints also accept an API key when `ADMIN_API_KEY` is set in the environment:

```bash
curl http://localhost:3000/api/admin/stats \
  -H "x-admin-key: $ADMIN_API_KEY"
```

`requireAdmin(event)` checks the header first, then falls back to the session. This is the supported way to drive admin endpoints from CI scripts without a browser session.

## Metrics

`GET /api/admin/metrics` returns Prometheus text exposition (`text/plain; version=0.0.4`) for scraping — request counters and span latency summaries. Same auth as the other admin endpoints.

## Related

- [Roles & permissions →](./roles-and-permissions)
- [Settings →](./settings)
- [API reference → Admin](../api/reference#admin)
