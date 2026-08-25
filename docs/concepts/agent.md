# The Agent

The agent in Hypar is not an assistant. It does not wait for queries. It does not retrieve documents on demand.

It is a **collaborator with its own voice** — one that has stakes in the health of the knowledge system and participates actively in the development of ideas.

## What the agent is not

**Not a search engine.** You don't query the agent. The agent engages with your embryos — it comes to you, with context you didn't ask for, because you opened the idea (auto-engage) or you replied.

**Not a chatbot.** General conversation is not the agent's purpose. Every interaction is anchored to a specific embryo. The agent doesn't chat — it thinks alongside. The UI is `ai-elements-nuxt` primitives mapped onto embryo events, not a `useAiChat` transcript.

**Not an assistant.** An assistant executes instructions. The agent makes proposals. You can ignore them. But the agent has a perspective and shares it.

## What the agent does

### Asks questions

The agent's primary mode of engagement is the question. Not questions to gather information for itself, but questions that push an embryo forward.

The question is not generic. It follows the [lifecycle](/concepts/lifecycle) as a method:

| State | Preferred move | What the question does |
|---|---|---|
| Latent | **DEFINE** | Names the real problem. If the seed is already a solution, recovers what it is papering over. |
| Germinating | **PROBE** (or **INVERT**) | Tests assumptions. *What would have to be true for this to be wrong?* |
| Growing | **VARIETY** | Opens alternative *paths* — directions, not the first clever answer. Paths are proposals the user can keep as tensions or dismiss. |
| Mature | **SIMPLEST** | Asks whether this is the simplest effective form, and whether it is time to close. |
| Fossil | — | No agent input. |

The spoken turn is still **exactly one question**. Paths and fossil proposals are additive fields, not a second question. The move name is logged on the `AGENT_QUESTION` event; it is not shown in the UI.

The turn **streams**: the client previews the forming `question` field, then persists the parsed JSON on `done`.

Good agent questions are uncomfortable. They identify the tension the embryo hasn't resolved:

- *"What problem is this checklist actually solving?"*
- *"What would have to be true for this to be wrong?"*
- *"This is the same idea as another living embryo. What's different?"*

The agent does not ask questions to be helpful. It does not teach a named method. The method is how it thinks.

### Surfaces connections

The agent may propose links of type `REINFORCES`, `CONTRADICTS`, or `EXTENDS` to other **living** embryos. Those proposals land as `PENDING_CONNECTION` notes. You accept (creates a confirmed connection) or dismiss.

The agent does not currently propose `RESURRECTS`, and it does not see fossils (see [What the agent knows](#what-the-agent-knows)).

Connections are surfaced as proposals, not facts. You decide whether the connection is real.

### Suggests fossilization

On `MATURE` embryos the agent may attach a `PENDING_FOSSIL` note with one of three kinds of death:

- **Ill-defined problem** (`ILL_DEFINED`) — the idea closed because the problem was never named
- **Wrong path** (`WRONG_PATH`) — a simpler path existed
- **Superseded** (`SUPERSEDED`) — another idea replaced this one

You accept (fossilize with that reason) or dismiss. The agent does not fossilize silently.

### Records reasoning

Every agent question, every accepted path, every dismissed note, every reply is an event or a note. Skip (dismiss without reply) does **not** write a `USER_RESPONSE` event — only the note is dismissed.

---

## The negotiation model

| Trigger | What happens |
|---|---|
| User initiates fossilization | A reason form (optional kind chips + required text). Not an agent interview. |
| Agent suggests fossilization | HITL confirm widget. Accept, or dismiss. Decision is the note + `FOSSIL_PROPOSED` / `FOSSILIZED` events. |
| User ignores agent suggestion | Dismiss the note. The agent does not auto-repeat that turn. |

A trace remains for accept and for agent proposals. Fossilization cannot happen without a recorded reason.

---

## What the agent knows

Per invocation the agent receives:

- The current embryo: seed, state, unresolved tensions, last ~12 agent/user turns
- Up to **20 other living embryos** owned by you (fossils excluded)
- Which of those are already outgoing connection targets (so it does not re-propose them)

It does **not** currently have:

- Fossils or fossil reasons
- The rest of the garden beyond that cap
- External knowledge by default

This is a lab constraint, not the long-term research answer. Connection surfacing would benefit from fossils; question-asking benefits from a narrow thread. See [Open Questions](/open-questions).

You can pick the Ollama model in **Settings**; the choice is a cookie sent on the next agent POST.

---

## The agent's tone

The agent is direct. It does not hedge unnecessarily. It does not apologize for surfacing a contradiction.

But the agent is not aggressive. It makes proposals, not pronouncements. It presents its reasoning, not conclusions. The user's mind is the system being augmented — the agent never overrides it.

---

*Next: [Fossils & Memory](/concepts/fossils)*
