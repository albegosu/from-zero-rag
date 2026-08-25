<DocMicroLead />

# Workspaces

A **workspace** is the unit that owns a set of members and a set of settings overrides. Every signed-in user always has at least one workspace they belong to; documents, conversations and queries are scoped by the active workspace.

## Data model

```
Workspace
  ├─ ownerId     → User
  └─ members[]   → WorkspaceMember { userId, role }
                     role: 'owner' | 'editor' | 'viewer'

WorkspaceSetting { workspaceId, key, value, category }
```

Source: `prisma/schema.prisma`.

## UI

Open `/workspaces` (`pages/workspaces.vue`) to:

- See all workspaces you belong to and your role in each
- **Activate** a workspace (writes the `active-workspace` cookie)
- **Invite** a member by email (owners only)
- Override the workspace's allowed upload formats (owners and editors)

## API

All endpoints require a signed-in session.

| Method & path | Body / query | Notes |
| --- | --- | --- |
| `GET /api/workspaces` | — | Lists the caller's workspaces with `role` and an `active` flag. |
| `POST /api/workspaces` | `{ name }` | Creates a workspace; the caller becomes its `owner`. |
| `POST /api/workspaces/:id/activate` | — | Sets the `active-workspace` cookie (1-year max-age, `httpOnly`). Caller must be a member. |
| `POST /api/workspaces/:id/members` | `{ email, role? }` | Adds an existing user. `role` defaults to `editor`. **Owners only.** |
| `GET /api/workspaces/:id/settings?category=` | — | Workspace-scoped settings. `category` is `chunking` (default) or `general`. |
| `POST /api/workspaces/:id/settings` | `{ key, value, category? }` | Upsert a workspace setting. Empty `value` deletes the override. **Owners and editors only.** |

Example — create and activate a workspace:

```bash
WS=$(curl -s -X POST http://localhost:3000/api/workspaces \
  -H 'Content-Type: application/json' \
  --cookie-jar cookies.txt --cookie cookies.txt \
  -d '{"name":"Research"}' | jq -r .id)

curl -s -X POST "http://localhost:3000/api/workspaces/$WS/activate" \
  --cookie-jar cookies.txt --cookie cookies.txt
```

## Active workspace

The server middleware reads the `active-workspace` cookie and exposes it as `event.context.workspaceId`. Upload limits, allowed formats and other workspace-scoped checks read from this id.

If the cookie is missing or points to a workspace the user no longer belongs to, the server falls back to the user's first membership.

## Allowed formats override

`ALLOWED_FORMATS` is the most commonly overridden key. Resolution order on every upload:

1. **Workspace override** (`WorkspaceSetting`)
2. User override (`UserSetting`)
3. Global setting (`Setting`)
4. `ALLOWED_FORMATS` env var
5. Built-in default

The workspace settings endpoint also returns `effective_ALLOWED_FORMATS` and `workspaceOverride` so the UI can show what is actually in effect.

See [Settings →](./settings) for the full resolution model.

## Next steps

- [Roles & permissions →](./roles-and-permissions)
- [Settings →](./settings)
