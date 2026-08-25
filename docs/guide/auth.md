<DocMicroLead />

# Authentication

hypar uses [better-auth](https://www.better-auth.com/) with a Prisma adapter. Every request to a non-public route requires a signed-in session; admin routes additionally require `role === 'admin'`.

## Sign-in / sign-up

| Route | Page | Purpose |
| --- | --- | --- |
| `/auth/signin` | `pages/auth/signin.vue` | Email + password sign-in. Social buttons appear when the corresponding env vars are set. |
| `/auth/signup` | `pages/auth/signup.vue` | Email + password account creation. New users are created with `role = 'user'`. |
| `/setup` | `pages/setup.vue` | First-run wizard. See [First-run setup](#first-run-setup). |

The minimum password length is **8 characters** ([server/lib/auth.ts](server/lib/auth.ts)).

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

A global route middleware redirects unauthenticated visitors to `/auth/signin` for every page except `PUBLIC_ROUTES` (`/setup`, `/auth/signin`, `/auth/signup`). See `middleware/auth.global.ts`.

API routes that return user-scoped data call `requireSessionUserId(event)` and use that id in their Prisma `where` clauses, so user A can never read user B's documents, conversations or queries.

## First-run setup

On a fresh database, the first user to sign up at `/auth/signup` becomes the admin.

The account created by the wizard is the **first admin** (`role = 'admin'`). After completion the app writes `Setting { key: 'app.configured', value: 'true' }` and subsequent users that sign up at `/auth/signup` get the default `user` role.

See [Environment variables → First-run setup](./env) for what gets written to the DB versus to `.env`.

## Next steps

- [Roles & permissions →](./roles-and-permissions) — who can do what
