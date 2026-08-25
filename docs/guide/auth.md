<DocMicroLead />

# Authentication

hypar uses [better-auth](https://www.better-auth.com/) with a Prisma adapter. Embryo and LLM API routes require a signed-in session via `requireSessionUserId`.

## Sign-in / sign-up

| Route | Page | Purpose |
| --- | --- | --- |
| `/auth/signin` | `pages/auth/signin.vue` | Email + password sign-in. Social buttons appear when the corresponding env vars are set. |
| `/auth/signup` | `pages/auth/signup.vue` | Email + password account creation. New users are created with `role = 'user'`. |

The minimum password length is **8 characters** (`server/lib/auth.ts`).

There is **no** `/setup` wizard and no `Setting` / `app.configured` flag. First signup is a normal user.

### Providers

- **Email + password** — always on.
- **Google OAuth** — enabled when both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set.
- **GitHub OAuth** — enabled when both `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set.

See [Environment variables](./env) for the full list.

## Sessions

Cookies issued by better-auth.

| Setting | Value |
| --- | --- |
| `expiresIn` | 7 days |
| `updateAge` | refreshed on activity older than 1 day |
| Secret | `BETTER_AUTH_SECRET` (or `AUTH_SECRET`) — required, generate with `openssl rand -hex 32` |

`server/middleware/auth-session.ts` attaches the session to every H3 request as `event.context.auth`. Server handlers should read the user id via `requireSessionUserId(event)` from `server/utils/session.ts`.

In Vue components and pages use the `useAuth()` composable:

```ts
const { user, userId, isAdmin, isAuthenticated, isPending } = useAuth()
```

The browser client lives in `utils/auth-client.ts` and exposes `signIn`, `signUp`, `signOut`, `useSession`.

## Route protection

A global **client** route middleware redirects unauthenticated visitors to `/auth/signin` for every page except `PUBLIC_ROUTES` (`/auth/signin`, `/auth/signup`; `/setup` is listed but has no page). See `middleware/auth.global.ts`.

API routes that return user-scoped data call `requireSessionUserId(event)` and filter Prisma by that `userId`, so user A cannot read user B's embryos.

`GET /api/health` is unauthenticated (Compose healthcheck). `POST /api/vitals` and `POST /api/client-errors` are also unauthenticated telemetry sinks.

## Admin

`User.role` is `'user'` or `'admin'`. Signup always creates `'user'`. There is no first-user-becomes-admin hook.

`/admin` and `/admin/users` are **stubs** (“coming soon”). There is no `/api/admin/*` and no `ADMIN_API_KEY`. Promote someone with Prisma Studio or SQL:

```sql
UPDATE "User" SET role = 'admin' WHERE email = 'you@example.com';
```

The header hides the admin link for non-admins. The admin route middleware exists but is **not** applied on those pages yet.

## Next steps

- [Roles & permissions →](./roles-and-permissions) — who can do what
