<DocMicroLead />

# Primeros pasos

hypar se ejecuta como un **único proceso Nuxt 3** — frontend, rutas API y workers en segundo plano, todo en uno. No hay un contenedor backend separado que gestionar.

**Plantilla de entorno:** en la raíz del repositorio ejecuta `cp .env.example .env` — ese archivo es la única plantilla versionada para Docker y desarrollo local, y coincide con lo que describen el `README.md` y `CONTRIBUTING.md` (no existe un `.env.docker` commiteado; mantén tu `.env` privado fuera del control de versiones).

## Requisitos previos

- **Docker 20.10+** y **Docker Compose 2.0+** (camino recomendado)
- O **Node.js 20+** y **pnpm 10+** para desarrollo local
- Al menos una API key para embeddings: [Google AI Studio](https://aistudio.google.com/app/apikey) es gratuita y recomendada

---

## Opción 1 — Docker (recomendado)

```bash
# 1. Clonar
git clone https://github.com/albegosu/hypar.git
cd hypar

# 2. Configurar
cp .env.example .env
# Edita .env — establece GOOGLE_API_KEY como mínimo

# 3. Iniciar (app + postgres + ollama)
docker compose --profile full up -d --build

# 4. Abrir
open http://localhost:3000
```

La app ejecuta `prisma migrate deploy` automáticamente al arrancar — no necesitas un paso de migración manual.

**Detener:**
```bash
docker compose --profile full down
```

---

## Opción 2 — Desarrollo local

```bash
# 1. Clonar e instalar
git clone https://github.com/albegosu/hypar.git
cd hypar
pnpm install

# 2. Configurar
cp .env.example .env
# Edita .env — establece DATABASE_URL y GOOGLE_API_KEY

# 3. Ejecutar migraciones de base de datos
pnpm db:migrate

# 4. Iniciar servidor de desarrollo
pnpm dev
```

Abre [http://localhost:3000](http://localhost:3000).

---

## Scripts útiles

| Script | Descripción |
|---|---|
| `pnpm dev` | Servidor de desarrollo con HMR |
| `pnpm build` | Build de producción |
| `pnpm start` | Ejecutar build de producción |
| `pnpm db:migrate` | Ejecutar migraciones Prisma (dev) |
| `pnpm db:deploy` | Ejecutar migraciones (producción) |
| `pnpm db:studio` | Abrir Prisma Studio |
| `pnpm typecheck` | Verificación de tipos TypeScript |
| `pnpm test` | Ejecutar suite Vitest |
| `pnpm exec vitepress dev docs` | Servir esta documentación localmente (VitePress) |

---

## Elegir un modelo de chat

El modelo por defecto (`OLLAMA_LLM_MODEL=llama3.1:8b`) soporta tool calling de forma fiable — el agente buscará en la base de conocimiento cuando sea relevante y citará fuentes.

Los modelos más pequeños como `tinyllama` **no** soportan tool calling e ignorarán la base de conocimiento por completo.

```env
# .env
OLLAMA_LLM_MODEL=llama3.1:8b        # buen equilibrio — funciona con 8 GB VRAM
# OLLAMA_LLM_MODEL=qwen2.5:7b-instruct  # alternativa rápida
```

Los embeddings (`nomic-embed-text`, 768 dimensiones) funcionan bien tal cual, independientemente del LLM elegido.

Si prefieres proveedores cloud, establece `GOOGLE_API_KEY` o `OPENAI_API_KEY` — tienen prioridad sobre Ollama tanto para embeddings como para generación.

---

## Siguientes pasos

- [Autenticación →](/es/guide/auth) — inicio de sesión, configuración inicial, sesiones
- [Workspaces →](/guide/workspaces) — agrupar documentos y miembros
- [Docker (desarrollo) →](/es/guide/docker)
- [Despliegue en producción con TLS automático →](/es/guide/production)
- [Variables de entorno →](/es/guide/env)
