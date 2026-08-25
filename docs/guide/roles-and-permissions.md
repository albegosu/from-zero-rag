<DocMicroLead />

# Roles & permissions

hypar uses a single role axis on the `User` model — `user` or `admin`.

## Application role

Stored as `User.role` (default `'user'`). Set by the better-auth `admin` plugin and by the first-run setup.

| Role | What it unlocks |
| --- | --- |
| `user` | Default for every signup. Can use the embryo garden and manage their own settings. |
| `admin` | Everything above, plus full access to the `/admin/*` pages and `/api/admin/*` endpoints. |

The server-side check is `requireAdmin(event)` in `server/utils/admin-auth.ts`. It also accepts a fallback `Authorization: Bearer <ADMIN_API_KEY>` (or `x-admin-key`) header for CI scripts when `ADMIN_API_KEY` is set.

Client-side, `useAuth()` exposes `isAdmin`, and `middleware/admin.ts` gates admin pages.

### Promoting / demoting

From `/admin/users` or via the API:

```bash
curl -X PATCH http://localhost:3000/api/admin/users/<USER_ID> \
  -H 'Content-Type: application/json' \
  -H "x-admin-key: $ADMIN_API_KEY" \
  -d '{"role":"admin"}'
```

`PATCH /api/admin/users/:id` also accepts `{ banned: true|false }` to disable an account without deleting it.

## Next steps

- [Authentication →](./auth)
- [Environment variables →](./env)
