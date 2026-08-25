# Memory & commands

“Memory” in this app means **user-scoped text** stored as normal **`Document`** rows (with metadata), then retrieved through the same **hybrid search** path as uploads.

---

## `MEMORY_SCOPE` (`runtimeConfig.memoryScope`)

| Value | Behaviour |
| --- | --- |
| `local_per_user` (default) | Search includes global documents (`userId` null) **and** that user’s documents (including memories). |
| `global` | No user filter on documents (everyone shares the same pool — use with care). |
| `disabled` | Documents tagged as **`chat_memory`** are excluded from retrieval. |

Set via environment variable `MEMORY_SCOPE` (see [Environment variables](/guide/env)).

Memories are created with `metadata.kind = 'chat_memory'` (see `documents.service.ts`).

---

## Slash commands

Parsed from the **latest user message** text in `server/utils/agent-commands.ts`. If a command matches, **`/api/chat`** short-circuits: it does **not** run the streaming LLM tool path for that turn.

| User text | Effect |
| --- | --- |
| `/remember <text>` | Persists `<text>` as a chat-memory document for the current `userId`. |
| `/forget <term>` | Deletes chat memories for that user whose content matches `<term>`. |
| `/forget` (no term) or `/memory clear` | Deletes **all** chat memories for that user. |
| `/help`, `/memory` | Returns built-in help (currently Spanish copy in `runMemoryCommand`). |

Natural-language shortcuts (Spanish) such as `recuerda: …` / `guarda: …` are also recognised for **remember**-style saves.

---

## Agent behaviour (non-command messages)

For normal chat, `server/utils/agent.service.ts` configures **`streamText`** with:

- **`searchKnowledgeBase`** — the model chooses when to retrieve; results are injected as tool output with **numbered passages**; the system prompt instructs the model to cite **`[1]`, `[2]`, …** and to always write user-visible text after a tool call.

Retrieved chunks for the turn are merged into a list used to persist **`Message.sources`** after streaming completes.

---

## Conversations API

Chat history is stored per **`Conversation`** with **`Message`** rows (roles, `parts` JSON, optional `sources`). Useful routes:

- `GET /api/conversations?userId=` — list conversations.  
- `POST /api/conversations` — create (optional `userId`, `title`).  
- `GET /api/conversations/:id?userId=` — load messages for the UI.  
- `DELETE /api/conversations/:id` — remove a thread.

Details: [API reference — Conversations](/api/reference#conversations).

---

## Next

- [RAG pipeline →](./rag-pipeline)  
- [Hybrid search & HyDE →](./search)  
- [Learning quest →](./learning-quest)
