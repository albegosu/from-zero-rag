# Open Questions

These are the unresolved questions in Hypar's design. They are not gaps — they are the active tensions that drive the research. Each one is an embryo in the system itself.

This page is updated as questions are resolved or new ones emerge.

---

## What is a connection?

A connection between two embryos can be:

- **Explicit** — drawn by the user intentionally
- **Inferred** — detected by the agent based on content similarity, contradiction, or thematic overlap

The question is whether these should be visually distinct, and if so, how. An explicit connection carries the user's intent. An inferred connection carries the agent's hypothesis. Treating them the same risks elevating agent speculation to the level of user decision.

The [ai-elements surfaces](/experiments/ai-elements-surfaces) experiment draws this on a canvas: **solid** edges for explicit or confirmed links, **dashed / animated** edges for agent-inferred unconfirmed links. Whether that distinction is enough is still an observation, not a finding.

*Status: in experiment — graph surface mounted; visual language still under review.*

---

## What triggers germination?

An embryo starts as latent. What moves it to germinating?

Option A: the agent decides when to begin engaging — based on recency, connections to active embryos, or some other signal. The user doesn't trigger it.

Option B: the user manually advances an embryo to germinating. The agent begins engaging only when invited.

Option C: both — the agent can suggest germination, the user can initiate it.

Option B feels safer but may create too much friction. Option A feels natural but gives the agent a lot of initiative on something the user may not be ready for. Option C is the likely answer but needs a UI design that makes the distinction clear.

*Status: unresolved.*

---

## What does the agent know?

Does the agent have access to all embryos in all states simultaneously, or does it operate with a narrower context?

Full access means the agent can surface connections across the entire wiki — but it may also mean the agent's suggestions become overwhelming or unfocused.

Local context means the agent works well within a thread of related ideas — but may miss connections that span different areas of the wiki.

The answer likely depends on the specific operation: connection surfacing benefits from full access, while question-asking benefits from local context.

*Status: unresolved — depends on implementation and observed behavior.*

---

## Is Hypar single-user by design?

The current architecture assumes a single user. The agent has a relationship with *your* embryos — your history, your decisions, your fossils.

Multi-user collaboration would change this fundamentally. Whose fossil takes precedence? How does the agent navigate contradictions between two users' ideas? Who can initiate fossilization?

These are not impossible to answer, but they require a different model. For now, Hypar is intentionally single-user. Collaboration is a future question, not a current constraint.

*Status: deferred — single-user first.*

---

## How should the geological layers be navigated?

Fossils exist in strata. The navigation metaphor is excavation, not browsing. But how do you excavate in a UI?

Scroll depth? A separate view? A toggle between "surface" and "strata"? A search that surfaces fossils alongside living embryos when relevant?

This is one of the first UI experiments planned.

*Status: unresolved — pending experiment.*

---

## Does the agent’s question depend on lifecycle state?

Today the agent is told to challenge, extend, or destabilize, regardless of state. `LATENT` is not even included in the user message. The [method-as-process experiment](/experiments/method-as-process) proposes a stance per state: define → probe → generate paths → select the simplest.

The risk is theatre: we add stance text and the questions do not change. Phase 2 of that experiment logs a named *move* without showing it in the UI. If move × state is random, prompt-only failed.

*Status: implemented, awaiting observation — count `payload.move` on `AGENT_QUESTION` events against embryo state.*

---

## Variety vs exactly one question

Munari’s useful claim is that creativity needs alternative *paths*, not the first clever answer. Hypar’s useful constraint is one question per invocation.

These can coexist (one question that forces a choice) or they cannot (growing embryos need an explicit `paths[]` field). Phase 3 shipped option A: pending paths the user accepts as tensions. Whether the model actually fills `paths` in `GROWING` is still an observation.

*Status: implemented (option A), awaiting observation — [method as process](/experiments/method-as-process).*

---

*This page is a living document. Questions are added as they emerge and marked resolved when experiments answer them.*
