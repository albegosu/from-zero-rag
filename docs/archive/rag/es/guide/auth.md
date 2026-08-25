<DocMicroLead />

# Autenticación

hypar usa [better-auth](https://www.better-auth.com/) con adaptador Prisma. Toda petición a una ruta no pública requiere una sesión activa; las rutas de admin requieren además `role === 'admin'`.

## Inicio de sesión / registro

| Ruta | Página | Propósito |
| --- | --- | --- |
| `/auth/signin` | `pages/auth/signin.vue` | Inicio de sesión con email + contraseña. Los botones sociales aparecen cuando las variables de entorno correspondientes están configuradas. |
| `/auth/signup` | `pages/auth/signup.vue` | Creación de cuenta con email + contraseña. Los nuevos usuarios se crean con `role = 'user'`. |
| `/setup` | `pages/setup.vue` | Asistente de primera ejecución. Ver [Configuración inicial](#configuración-inicial). |

La longitud mínima de contraseña es **8 caracteres** ([server/lib/auth.ts](server/lib/auth.ts)).

### Proveedores

- **Email + contraseña** — siempre activo.
- **Google OAuth** — habilitado cuando `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` están configurados.
- **GitHub OAuth** — habilitado cuando `GITHUB_CLIENT_ID` y `GITHUB_CLIENT_SECRET` están configurados.

Consulta [Variables de entorno](/es/guide/env) para la lista completa.

## Sesiones

Cookies gestionadas por better-auth.

| Configuración | Valor |
| --- | --- |
| `expiresIn` | 7 días |
| `updateAge` | se renueva en actividad de más de 1 día |
| Secret | `BETTER_AUTH_SECRET` (o `AUTH_SECRET`) — obligatorio, genera con `openssl rand -hex 32` |

`server/middleware/auth-session.ts` adjunta la sesión a cada petición H3 como `event.context.auth`. Los handlers del servidor deben leer el id de usuario mediante `requireSessionUserId(event)` de `server/utils/session.ts`.

En componentes y páginas Vue usa el composable `useAuth()`:

```ts
const { user, userId, isAdmin, isAuthenticated, isPending } = useAuth()
```

El cliente del navegador está en `utils/auth-client.ts` y expone `signIn`, `signUp`, `signOut`, `useSession`.

## Protección de rutas

Un middleware global de ruta redirige a los visitantes no autenticados a `/auth/signin` en todas las páginas excepto `PUBLIC_ROUTES` (`/setup`, `/auth/signin`, `/auth/signup`). Ver `middleware/auth.global.ts`.

Las rutas API que devuelven datos con scope de usuario llaman a `requireSessionUserId(event)` y usan ese id en sus cláusulas `where` de Prisma, de modo que el usuario A nunca puede leer documentos, conversaciones o consultas del usuario B.

## Configuración inicial

En una base de datos nueva, todas las peticiones se redirigen a `/setup`. El asistente recoge la configuración de proveedor, BD, embeddings, chunking, búsqueda y RAG, y después pide nombre, email y contraseña.

La cuenta creada por el asistente es el **primer admin** (`role = 'admin'`). Tras completar la configuración, la app escribe `Setting { key: 'app.configured', value: 'true' }` y los usuarios que se registren después en `/auth/signup` reciben el rol `user` por defecto.

Consulta [Variables de entorno → Configuración inicial](/es/guide/env) para saber qué se escribe en BD vs. en `.env`.

## Siguientes pasos

- [Workspaces →](/guide/workspaces) — agrupar documentos y miembros
- [Roles y permisos →](/guide/roles-and-permissions) — quién puede hacer qué
- [Panel de admin →](/guide/admin-panel) — gestionar usuarios, settings y uso
