<DocMicroLead />

# Variables de entorno

La **plantilla canónica** es `.env.example` en la raíz del repositorio. Tras clonar:

```bash
cp .env.example .env
```

Edita `.env` para tu máquina; nunca commites secretos reales.

- **Docker Compose:** los valores por defecto para Postgres y la app se definen en `docker-compose.yml`. Consulta la [guía Docker](/es/guide/docker) para uso con contenedores.
- **Local `pnpm dev`:** configura `DATABASE_URL`, `OLLAMA_URL` (normalmente `http://localhost:11434`) y `WORKFLOW_LOCAL_DATA_DIR` como se describe en `.env.example`.
- **Onboarding / primera ejecución:** abre **`/setup`** en la app. El asistente (pasos de BD + proveedor) configura claves y crea el primer admin; **no** escribe `.env` por ti — sigue usando el **`.env.example`** de la raíz como plantilla y sincroniza valores manualmente si es necesario.

---

## Selección de proveedor

Dos variables controlan qué proveedores de IA están activos. Si se omiten, el runtime detecta la primera API key presente.

| Variable | Valores | Descripción |
|---|---|---|
| `EMBEDDING_PROVIDER` | `gemini` `openai` `voyage` `ollama-local` | Proveedor de embeddings explícito. Sobreescribe la detección por clave. |
| `LLM_PROVIDER` | `anthropic` `openai` `mistral` `ollama-cloud` `ollama-local` | Proveedor de chat/LLM explícito. Sobreescribe la detección por clave. |

---

## Proveedores de embedding

| Variable | Proveedor | Descripción |
|---|---|---|
| `GOOGLE_API_KEY` | Gemini | API key de [Google AI Studio](https://aistudio.google.com/app/apikey). Usa `gemini-embedding-001` por defecto. |
| `OPENAI_API_KEY` | OpenAI | API key de [OpenAI](https://platform.openai.com/api-keys). Compartida con el LLM de OpenAI si ambos están configurados. |
| `VOYAGE_API_KEY` | Voyage AI | API key de [Voyage AI](https://dashboard.voyageai.com/api-keys). Usa `voyage-3` por defecto. |
| `OLLAMA_URL` | Ollama | URL base, ej. `http://localhost:11434`. Se usa para embeddings y LLM. |
| `OLLAMA_MODEL` | Ollama | Nombre del modelo de embedding (por defecto: `nomic-embed-text`). |
| `EMBEDDING_MODEL` | todos | Sobreescribe el modelo para el proveedor de embeddings activo. |
| `EMBEDDING_DIMENSIONS` | todos | Tamaño del vector — debe coincidir con la columna `pgvector` (por defecto: `768`). |

**Orden de fallback** (cuando `EMBEDDING_PROVIDER` no está establecido): Gemini → OpenAI → Voyage → Ollama.

---

## Proveedores LLM / chat

| Variable | Proveedor | Descripción |
|---|---|---|
| `ANTHROPIC_API_KEY` | Anthropic | API key de la [consola de Anthropic](https://console.anthropic.com/settings/keys). |
| `ANTHROPIC_MODEL` | Anthropic | Nombre del modelo (por defecto: `claude-sonnet-4-6`). |
| `OPENAI_API_KEY` | OpenAI | Compartida con embedding si ambos están configurados. |
| `OPENAI_LLM_MODEL` | OpenAI | Modelo de chat (por defecto: `gpt-4.1-mini`). |
| `MISTRAL_API_KEY` | Mistral | API key de la [consola de Mistral](https://console.mistral.ai/api-keys/). |
| `MISTRAL_MODEL` | Mistral | Nombre del modelo (por defecto: `mistral-medium-latest`). |
| `OLLAMA_API_KEY` | Ollama Cloud | Clave auth para [Ollama Cloud](https://ollama.com/settings/keys). |
| `OLLAMA_LLM_MODEL` | Ollama | Modelo de chat (por defecto: `tinyllama` local / `kimi-k2.5:cloud` cloud). |
| `OLLAMA_CHAT_TIMEOUT_MS` | Ollama | Timeout de respuesta LLM en ms (por defecto: `180000`). |
| `OLLAMA_PLANNER_TIMEOUT_MS` | Ollama | Timeout del planner/tool step en ms (por defecto: `60000`). |

**Orden de fallback** (cuando `LLM_PROVIDER` no está establecido): Anthropic → Mistral → OpenAI → Ollama.

---

## Base de datos

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión completa a Postgres. Obligatoria. |

**Ejemplo pgvector auto-hospedado:**
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/rag_db
```

**Ejemplo Supabase Vector (directo):**
```
DATABASE_URL=postgresql://postgres:password@db.<project-ref>.supabase.co:5432/postgres
```

**Ejemplo Supabase Vector (transaction pooler — recomendado para serverless):**
```
DATABASE_URL=postgresql://postgres.<project-ref>:password@aws-0-<region>.pooler.supabase.com:6543/postgres
```

El asistente de configuración (paso 2) puede ayudarte a elegir un estilo de conexión **Postgres**; aun así copia la cadena final a `.env` tú mismo.

---

## Aplicación

| Variable | Por defecto | Descripción |
|---|---|---|
| `MEMORY_SCOPE` | `local_per_user` | `local_per_user` / `global` / `disabled` |
| `MEMORY_PROACTIVE` | `true` | Guardar automáticamente hechos del usuario en memoria |
| `ADMIN_API_KEY` | — | Clave opcional para proteger endpoints de admin |
| `WORKFLOW_LOCAL_DATA_DIR` | `./data/workflow` | Directorio de estado del workflow durable |

Para valores configurables en runtime almacenados en la base de datos (modelo, chunking, búsqueda, tunables RAG) consulta [Settings](/guide/settings). Todo lo que aparece en este archivo se lee una vez al arrancar desde el entorno.
