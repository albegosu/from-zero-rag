<DocMicroLead />

# Roles & permissions

hypar uses a single role axis on the `User` model — `user` or `admin`.

## Application role

Stored as `User.role` (default `'user'`). Set on signup; there is no first-run promotion.

| Role | What it unlocks |
| --- | --- |
| `user` | Default for every signup. Own embryos, settings (model selector), garden. |
| `admin` | Same, plus the `/admin/*` nav link. Those pages are stubs today. |

There is no `requireAdmin` helper in the API, no `/api/admin/*`, and no `ADMIN_API_KEY`. Embryo APIs are owner-scoped for every signed-in user.

Client-side, `useAuth()` exposes `isAdmin`. `middleware/admin.ts` gates `/admin` and `/admin/users`.

### Promoting / demoting

Use Prisma Studio (`pnpm db:studio`) or SQL:

```sql
UPDATE "User" SET role = 'admin' WHERE email = 'you@example.com';
UPDATE "User" SET role = 'user'  WHERE email = 'you@example.com';
```

`User.banned` exists on the schema (better-auth admin plugin fields) but there is no UI or API to toggle it.

## Next steps

- [Authentication →](./auth)
- [Environment variables →](./env)
