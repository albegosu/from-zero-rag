<DocMicroLead />

# Guía Docker

## Arquitectura

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Nuxt 3 App    │────▶│  PostgreSQL 16   │     │     Ollama      │
│  (app, :3000)   │     │  + pgvector      │     │  (opcional,     │
│  UI + API       │     │  (postgres,:5432)│     │   :11434)       │
└─────────────────┘     └──────────────────┘     └─────────────────┘
```

Todo en un contenedor — sin separación frontend/backend.

---

## Inicio rápido

```bash
# 1. Configurar
cp .env.example .env
# Edita .env — establece GOOGLE_API_KEY (recomendado) u OPENAI_API_KEY como mínimo

# 2. Iniciar (app + base de datos + Ollama local)
docker compose --profile full up -d --build

# 3. Abrir
open http://localhost:3000
```

La app ejecuta `prisma migrate deploy` automáticamente al arrancar.

---

## Perfiles

| Perfil | Servicios iniciados |
|---|---|
| `full` | app + postgres + ollama |
| `api` | postgres + ollama (sin app) |
| `all` | igual que `full` |

```bash
# Iniciar todo
docker compose --profile full up -d --build

# Detener
docker compose --profile full down

# Detener y borrar volúmenes (borra todos los datos)
docker compose --profile full down -v
```

---

## Acceso

| Servicio | URL |
|---|---|
| App (UI + API) | http://localhost:3000 |
| PostgreSQL | localhost:5432 |
| Ollama (si está activo) | http://localhost:11434 |

---

## Variables de entorno

Para la referencia completa, consulta [Variables de entorno](/guide/env). Aquí se resumen las esenciales para Docker.

### Mínimas requeridas

| Variable | Por defecto | Descripción |
|---|---|---|
| `PORT` | 3000 | Puerto de la app |
| `DATABASE_URL` | — | Cadena de conexión completa a Postgres (pgvector o Supabase) |

### Contenedor PostgreSQL (solo docker-compose)

| Variable | Por defecto | Descripción |
|---|---|---|
| `POSTGRES_USER` | rag | Usuario de BD |
| `POSTGRES_PASSWORD` | rag_password | Contraseña de BD |
| `POSTGRES_DB` | rag_db | Nombre de BD |
| `POSTGRES_PORT` | 5432 | Puerto de Postgres |

### Selección de proveedor

| Variable | Por defecto | Descripción |
|---|---|---|
| `EMBEDDING_PROVIDER` | auto-detect | `gemini` / `openai` / `voyage` / `ollama-local` |
| `LLM_PROVIDER` | auto-detect | `anthropic` / `openai` / `mistral` / `ollama-cloud` / `ollama-local` |

---

## Comandos útiles

```bash
# Logs
docker compose logs -f app
docker compose logs -f postgres
docker compose logs -f ollama

# Acceso a shell
docker compose exec app sh
docker compose exec postgres psql -U rag -d rag_db

# Reconstruir tras cambios en el código
docker compose --profile full up -d --build

# Ejecutar migración manualmente
docker compose exec app pnpm db:deploy

# Descargar modelo de Ollama manualmente
docker compose exec ollama ollama pull llama3.1:8b
```

---

## Volúmenes de datos

| Volumen | Contenido |
|---|---|
| `postgres_data` | Archivos de datos PostgreSQL |
| `ollama_data` | Modelos descargados de Ollama |
| `workflow_data` | Estado del workflow durable (ingestión) |

---

## Primera ejecución

En el primer arranque, el contenedor Ollama descarga los modelos configurados. Puede tardar varios minutos según la velocidad de conexión:

```bash
docker compose logs -f ollama
```

Verás descargar `nomic-embed-text` y `llama3.1:8b`. La app está lista una vez ambos estén descargados.

---

## Health check

La app expone `GET /api/health`:

```bash
curl http://localhost:3000/api/health
# {"status":"ok","checks":{"db":true,"embedding":true},"ts":"..."}
```

Docker Compose usa este endpoint para determinar cuándo el contenedor de la app está sano.

---

## Resolución de problemas

**La app no puede alcanzar la base de datos:**
```bash
docker compose exec postgres pg_isready -U rag
docker compose logs postgres
```

**Puerto ya en uso:**
Cambia `PORT` o `POSTGRES_PORT` en `.env`.

**Reconstruir desde cero:**
```bash
docker compose --profile full down -v
docker system prune -a
docker compose --profile full up -d --build
```

**Backup de la base de datos:**
```bash
docker compose exec postgres pg_dump -U rag rag_db > backup_$(date +%Y%m%d).sql
```

---

## ¿Pasar a producción?

El `docker-compose.yml` de desarrollo expone todos los puertos y no está securizado para producción. Consulta la guía de [Despliegue en producción](/guide/production) — usa `docker-compose.prod.yml` con Caddy para TLS automático y mantiene la base de datos fuera de la red pública.
