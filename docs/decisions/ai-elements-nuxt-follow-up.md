# Plan de mejoras — ai-elements-nuxt (post-integración hypar)

Documento para otro agente. **Contexto:** integración completada en hypar (`file:../ai-elements-nuxt`), chat en `/` con componentes `HyparChat*` + `useHyparChat` / `useHyparChatDisplay`. **Objetivo:** cerrar fricciones de DX y gaps respecto al plan original de refactor del chat.

Referencia de integración: [ai-elements-nuxt docs](https://albegosu.github.io/ai-elements-nuxt/) · [repo](https://github.com/albegosu/ai-elements-nuxt)

---

## Repo: `ai-elements-nuxt` (prioridad alta)

### 1. Publicación y instalación

**Problema:** `pnpm add ai-elements-nuxt` falla (404 en npm). Instalación desde GitHub requiere `allowBuilds: ai-elements-nuxt: true` en `pnpm-workspace.yaml` del consumidor.

**Tareas:**

- Publicar paquete en npm (o documentar instalación oficial: git + `allowBuilds`).
- En README / getting started: sección “Install from GitHub” con snippet `pnpm-workspace.yaml`.
- Verificar que `prepack` / `dist` estén listos para consumo sin build local del consumidor (salvo git install).

---

### 2. Export de tipos para consumidores

**Problema:** El alias `#ai-elements` del módulo no expone tipos de forma usable. En hypar se añadió workaround:

- [`types/ai-elements-nuxt.d.ts`](../../types/ai-elements-nuxt.d.ts) — `declare module '#ai-elements/types'` reexportando `ai-elements-nuxt/dist/runtime/types/index`.

**Tareas:**

- Añadir en `package.json` de ai-elements-nuxt exports explícitos, por ejemplo:
  - `"./types"` → `./dist/runtime/types/index.d.ts`
  - opcional: `"./utils/mapMessageParts"` para imports tipados sin depender solo de auto-import Nuxt.
- Documentar imports recomendados:

  ```ts
  import type { AiMessageProps, AiSource } from 'ai-elements-nuxt/types'
  ```

- Eliminar necesidad de shim `#ai-elements/types` en apps consumidoras.

---

### 3. Naming y documentación: `AiConversation`

**Problema:** `AiConversation` modela **lista de hilos** (`threads`, `activeId`, `@select`), no el contenedor scroll de mensajes. En hypar el thread de mensajes sigue siendo un `div.hypar-chat-thread`.

**Tareas (elegir una):**

- **A)** Renombrar a `AiThreadList` (breaking) + alias deprecado `AiConversation`.
- **B)** Mantener nombre y reforzar docs: “Conversation list / sidebar”, con ejemplo que no confunda con message list.
- Añadir componente o patrón documentado `AiMessageList` / slot recipe para scroll + `v-for` + `AiMessage` (opcional, no obligatorio).

---

### 4. Guía “RAG / transport custom”

**Problema:** `useAiChat` no se usó en hypar porque el body dinámico (`conversationId`, `model`, `searchMode`) es crítico. La integración real fue `Chat` + `DefaultChatTransport` + `toAiMessageProps`.

**Tareas:**

- Nueva guía en docs (p. ej. `guides/custom-transport-rag.md`):
  - Instanciar `Chat` con `DefaultChatTransport` y `body: () => ({ ... })`.
  - Mapear `UIMessage` → `AiMessage` vía `toAiMessageProps(message, status)`.
  - Enriquecer con metadata propia (`metadata.sources`, tool `searchKnowledgeBase`).
  - Ejemplo mínimo Vue (sin hypar).
- En `useAiChat`: documentar si acepta `body` dinámico; si no, declarar explícitamente “use Chat + toAiMessageProps”.

---

### 5. Helper opcional post-mapper (RAG)

**Problema:** Tras `toAiMessageProps`, hypar mantiene `HyparDisplayMessage` con campos extra: `searched`, `cited`, `sources` (`ConverseSource`), `results`, `userMetrics`, `latencyMs`.

**Tareas (opcional en lib):**

- Exportar utilidad tipo `mergeAiMessageProps(base, { metadata, sources })` o documentar patrón con `AiMessageProps.metadata`.
- Ejemplo de conversión `ConverseSource[]` → `AiSource[]` con `url` interna (`/documents/:id`).

---

### 6. `AiModelSelector` — API de slots

**Problema:** El slot `#option` expone `{ model, selected }`, no `{ select }`. El botón padre ya hace `@click="select(model)"`; consumidores que esperan `select` en el slot fallan en typecheck.

**Tareas:**

- Documentar props del slot `#option` en component meta / docs.
- Opcional: pasar también `select: (model) => void` en el slot scope para custom options sin depender del `<button>` wrapper.

---

### 7. `AiPromptInput` — ejemplo single-line + comandos

**Problema:** hypar usaba `<input>`; la lib usa `<textarea>`. Se resolvió con slot `#input` + `@keydown` encadenado (slash commands, flechas).

**Tareas:**

- Playground / doc: “Single-line terminal input” con slot `#input`, `#prefix`, `#actions`.
- Documentar que `@keydown` en el componente puede no bastar si se usa slot `#input` (manejar en el textarea del slot).

---

### 8. Componentes poco usados — discoverability

No integrados en hypar (plan híbrido):

| Componente | Motivo | Acción sugerida |
|------------|--------|-----------------|
| `AiInlineCitation` | Citas `[n]` en texto; hypar usa lista `AiSources` + pills | Doc “citations in markdown body” vs sources footer |
| `AiErrorBoundary` | Se usó markup con `data-ai-error-boundary`, no el componente | Ejemplo error de chat con slot i18n |
| Voice / Workflow / Code (excepto markdown) | Fuera de alcance RAG | Sin cambio; playground mock |

---

## Repo: `hypar` (prioridad media)

### 9. Dependencia: de `file:` a npm/git estable

**Estado:** `"ai-elements-nuxt": "file:../ai-elements-nuxt"` en [`package.json`](../../package.json).

**Tareas:**

- Cuando exista npm: cambiar a versión semver.
- CI: documentar que el clone debe incluir sibling o usar npm.
- Mantener `allowBuilds` si sigue instalación git.

---

### 10. Cerrar gaps del plan original en hypar

| Item plan | Estado | Tarea |
|-----------|--------|--------|
| `AiInlineCitation` | No usado | Evaluar en `HyparChatMessage` si el texto tiene `[n]` y hay `sources` |
| `AiErrorBoundary` | Parcial (solo atributos) | Envolver `HyparChatThread` o usar componente con slot error i18n |
| `HyparChatError.vue` | No creado | Extraer bloque error de `HyparChatThread.vue` o usar `AiErrorBoundary` |
| `marked` en chat | OK (`AiMarkdown`) | `marked` sigue en `pages/setup.vue` — no tocar salvo unificación |
| `selectSearchMode` / `selectModel` en page | Watchers en composable; funciones exportadas pero no usadas en page | Limpiar exports muertos o usar en controles |

---

### 11. UX menor post-integración

**Tareas:**

- `AiModelSelector`: click-outside para cerrar (antes `document.addEventListener` en hypar; el componente de la lib puede no cerrar al clicar fuera).
- Sincronizar `scrollRef` entre `HyparChatThread` y `useHyparChat` vía `watchEffect` — funciona; documentar en comentario del composable.
- Revisión visual light/dark en `.terminal-theme` + `ai-elements-hypar.css`.

---

### 12. Checklist de regresión manual (hypar)

Ejecutar smoke en `/` sin cambios de servidor:

- [ ] Streaming + stop
- [ ] `sessionStorage` / cargar conversación
- [ ] Pills searched / not searched / cited
- [ ] Expandir retrieval chunks
- [ ] Errores: rate limit, quota, Ollama
- [ ] Slash commands (`/remember`, `/new`, `/help`, …)
- [ ] Sidebar conversaciones + docs recientes
- [ ] i18n ES/EN
- [ ] Selectores model + search mode

---

## Orden sugerido para el agente

1. npm publish + install docs  
2. types export  
3. RAG custom transport guide  
4. `AiConversation` naming/docs  
5. slots `ModelSelector` / `PromptInput`  
6. hypar dependency pin  
7. hypar follow-ups (§10–11)  
8. regression checklist (§12)

---

## Criterios de “hecho”

**ai-elements-nuxt:**

- Instalable con `pnpm add ai-elements-nuxt` (npm) o doc git probada.
- Tipos importables sin shim en consumidor.
- Guía custom transport + `toAiMessageProps` publicada.

**hypar:**

- `pnpm typecheck`, `pnpm test`, `pnpm build` verdes.
- Checklist §12 pasada manualmente o con e2e mínimo si se añade.

---

## Archivos clave (hypar)

| Archivo | Rol |
|---------|-----|
| [`composables/useHyparChat.ts`](../../composables/useHyparChat.ts) | Estado, `Chat`, transport |
| [`composables/useHyparChatDisplay.ts`](../../composables/useHyparChatDisplay.ts) | `toAiMessageProps` + RAG |
| [`components/chat/HyparChatMessage.vue`](../../components/chat/HyparChatMessage.vue) | Slots `AiMessage` |
| [`components/chat/HyparChatInput.vue`](../../components/chat/HyparChatInput.vue) | `AiPromptInput` |
| [`components/chat/HyparChatControls.vue`](../../components/chat/HyparChatControls.vue) | Search mode + `AiModelSelector` |
| [`components/chat/HyparChatSidebar.vue`](../../components/chat/HyparChatSidebar.vue) | `AiConversation` + docs |
| [`assets/css/ai-elements-hypar.css`](../../assets/css/ai-elements-hypar.css) | Tema terminal |
| [`types/ai-elements-nuxt.d.ts`](../../types/ai-elements-nuxt.d.ts) | Shim tipos (eliminar cuando lib exporte tipos) |
| [`pages/index.vue`](../../pages/index.vue) | Orquestación del chat |

---

## Resumen DX (referencia)

| Área | Valoración |
|------|------------|
| Instalación módulo Nuxt | Muy fácil |
| Headless + `data-ai-*` + CSS propio | Muy fácil |
| Mapper AI SDK → `AiMessage` | Fácil |
| App RAG con metadata/tool custom | Media (capa extra inevitable) |
| DX TypeScript consumidor | Mejorable (exports de tipos) |
| Distribución npm/git | Fricción hoy |

**Componentes Ai* usados en producción (~10–12):** `AiMessage`, `AiMarkdown`, `AiStreamingCursor`, `AiTool`, `AiSources`, `AiPromptInput`, `AiModelSelector`, `AiSuggestion`, `AiShimmer`, `AiConversation` (sidebar). Fuera de alcance en esta fase: Voice, Workflow, Code (salvo markdown vía `AiMarkdown`), ToolApproval, Plan, Task, Agent, etc.
