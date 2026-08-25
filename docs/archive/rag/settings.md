<DocMicroLead />

# Settings

hypar resolves runtime configuration through a three-layer system, persisted in three Prisma tables. Most keys are typed by the wizard step definitions in `utils/setup/wizard-steps.ts`.

## The three tables

| Table | Scope | Edited from |
| --- | --- | --- |
| `Setting` | Global. One row per key. | Admin panel (`/admin/settings`) and the setup wizard. |
| `WorkspaceSetting` | One workspace. | `/workspaces` (owners and editors). |
| `UserSetting` | One user. | `/settings`. |

All three carry `key`, `value` (string) and `category`. Categories are: `apis`, `vectorDb`, `embeddings`, `chunking`, `search`, `rag`, `general` (`Setting`/`UserSetting`) or the narrower `chunking` / `general` for `WorkspaceSetting`.

## Resolution order

For an arbitrary setting at request time:

```
UserSetting        ┐
  → WorkspaceSetting   (only certain keys, e.g. ALLOWED_FORMATS)
    → Setting (DB global)
      → process.env / runtimeConfig
        → wizard default
```

The resolver is `getEffectiveSettingForUpload()` in `server/utils/settings.service.ts`.

For `.env`-only options (DB URL, secret keys at boot) this order does not apply — those live exclusively in environment variables; see [Environment variables](./env).

## Secrets

API keys (`GOOGLE_API_KEY`, `OPENAI_API_KEY`, etc.) are flagged as `secret` in the wizard definitions and are never returned in plain text by the settings endpoints:

- `GET /api/admin/settings` returns `••••<last4>`.
- `GET /api/user/settings` returns `{ configured, systemConfigured }` booleans instead of the value.
- `POST /api/admin/settings` skips writes when the body echoes a masked `••••…` value, so refreshing the admin form never clobbers the real secret.

## User endpoints

| Method & path | Description |
| --- | --- |
| `GET /api/user/settings?category=` | Caller's overrides for that category, plus the resolved system value for each field. |
| `PUT /api/user/settings` | Body `{ key, value, category? }`. Empty `value` deletes the override. Also invalidates the per-user rate-limit cache. |

## Admin endpoints

| Method & path | Description |
| --- | --- |
| `GET /api/admin/settings?category=` | Global settings, secrets masked. |
| `POST /api/admin/settings` | Body `{ key, value, category? }`. Upserts into `Setting`. |

## Workspace endpoints

| Method & path | Description |
| --- | --- |
| `GET /api/workspaces/:id/settings?category=` | Workspace overrides plus the effective value of `ALLOWED_FORMATS`. |
| `POST /api/workspaces/:id/settings` | Body `{ key, value, category? }`. Owners and editors only. |

## Commonly tuned keys

| Key | Layer that usually owns it | Notes |
| --- | --- | --- |
| `GOOGLE_API_KEY`, `OPENAI_API_KEY`, `OLLAMA_BASE_URL` | Global (`Setting`) | Set via the setup wizard. |
| `EMBEDDING_PROVIDER`, `EMBEDDING_MODEL` | Global | One per deployment. |
| `CHUNK_SIZE`, `CHUNK_OVERLAP` | User override on top of global | Per-user experimentation. |
| `ALLOWED_FORMATS` | Workspace override on top of global | Lets a workspace narrow or widen what its members can upload. |
| `RAG_TOP_K`, `RAG_MMR_LAMBDA` | User override on top of global | Per-user tuning. |

## Next steps

- [Admin panel →](./admin-panel)
- [Workspaces →](./workspaces)
- [Environment variables →](./env)
