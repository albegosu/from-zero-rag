# Open Questions

These are the unresolved questions in Hypar's design. They are not gaps — they are the active tensions that drive the research. Each one is an embryo in the system itself.

This page is updated as questions are resolved or new ones emerge.

---

## What is a connection?

A connection between two embryos can be:

- **Explicit** — drawn by the user intentionally (`detectedBy: USER`, confirmed)
- **Inferred** — detected by the agent based on contradiction, reinforcement, or overlap

The question is whether these should be visually distinct, and if so, how. An explicit connection carries the user's intent. An inferred connection carries the agent's hypothesis. Treating them the same risks elevating agent speculation to the level of user decision.

The [ai-elements surfaces](/experiments/ai-elements-surfaces) experiment draws this on a canvas: **solid** edges for explicit or confirmed links, **dashed / animated** edges for agent-inferred unconfirmed links.

**Current runtime:** the agent writes unconfirmed `Connection` rows (`detectedBy: AGENT`) plus a HITL note. Accept confirms the row; dismiss deletes it. The graph draws **dashed** edges for unconfirmed agent links.

*Status: in experiment — data path and graph surface mounted; whether the visual language is enough is still an observation.*

---

## What triggers germination?

An embryo starts as latent. What moves it to germinating?

**Current runtime (option mixed):** opening a `LATENT` embryo auto-engages the agent. The first successful agent turn sets `GERMINATING` and the collaborator shows **state → germinating · first engage**. You can also jump state by hand.

Still open: should that auto-advance be visible? Should the agent wait to be invited? Should forgotten latent embryos germinate without a visit?

*Status: partially answered — first engage is the trigger; UX of the silent advance is still an observation.*

---

## What does the agent know?

Does the agent have access to all embryos in all states simultaneously, or does it operate with a narrower context?

**Current runtime:** current embryo + up to 15 living peers and 5 fossils. No external knowledge.

Full access would let the agent surface resurrection and old contradictions — and may overwhelm. Local context is better for questions and worse for memory.

*Status: implemented as local living context — whether that is the right bound is still open.*

---

## Is Hypar single-user by design?

The current architecture assumes a single user per garden. The agent has a relationship with *your* embryos — your history, your decisions, your fossils. Auth is multi-account (email/password, optional OAuth); data is isolated by `userId`. There is no shared garden.

Multi-user collaboration would change this fundamentally. Whose fossil takes precedence? How does the agent navigate contradictions between two users' ideas? Who can initiate fossilization?

*Status: deferred — single garden per user first.*

---

## How should the geological layers be navigated?

Fossils exist in strata. The navigation metaphor is excavation, not browsing. But how do you excavate in a UI?

Scroll depth? A separate view? A toggle between "surface" and "strata"? A search that surfaces fossils alongside living embryos when relevant?

Today fossils are grouped in the garden **strata** view by age (week / month / older). Whether that is enough excavation is still an observation.

*Status: in experiment — strata filter shipped; metaphor still under review.*

---

## Does the agent’s question depend on lifecycle state?

The [method-as-process experiment](/experiments/method-as-process) shipped stance per state: define → probe → generate paths → select the simplest. `LATENT` is included in the prompt. The move is logged on the event, not shown in the UI.

The remaining risk is theatre: we added stance text and the questions do not change. Count `payload.move` on `AGENT_QUESTION` events against embryo state. If `GROWING` is still 90% `PROBE`, the prompt failed.

*Status: implemented, awaiting observation.*

---

## Variety vs exactly one question

Munari’s useful claim is that creativity needs alternative *paths*, not the first clever answer. Hypar’s useful constraint is one question per invocation.

Phase 3 shipped option A: pending paths the user accepts as tensions. Whether the model actually fills `paths` in `GROWING` is still an observation.

*Status: implemented (option A), awaiting observation — [method as process](/experiments/method-as-process).*

---

*This page is a living document. Questions are added as they emerge and marked resolved when experiments answer them.*
