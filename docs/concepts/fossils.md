# Fossils & Memory

Hypar has no delete operation.

When an idea ends — when it has been superseded, contradicted, exhausted, or simply abandoned — it does not disappear. It becomes a **fossil**: closed, preserved, and part of the long-term memory of the system.

## What a fossil is

A fossil is an embryo that has been closed. It retains everything the embryo was:

- **The original seed** — the raw thought as it was first captured
- **The full lifecycle history** — every state transition, every agent question, every user decision
- **The reason for closure** — always recorded, never optional
- **The connections it held** — which embryos were linked to it at the time of fossilization

Fossils stay in the garden, visually quieter. They are not a separate archive product.

## Why fossils exist

The alternative — deletion — destroys information that is often more valuable than the idea itself.

The most important knowledge in a thinking system is not always the ideas that survived. It is:

- **Why certain ideas were abandoned** — the reasoning behind a decision not to pursue something is a decision about something else
- **What was tried and failed** — a fossil with a documented reason for closure is a map of explored territory
- **What resurfaces** — an idea that seemed wrong in one context may become right in another

The agent can see a few recent fossils in context and may propose `RESURRECTS`. It still cannot search the whole strata on demand.

## The geological metaphor

Living embryos exist on the surface — visible, active, engaged. Fossils exist in strata below.

**Strata navigation** lives in the garden filter **strata**: fossils grouped by age (near surface / buried / deep). You can also excavate a single fossil from its detail page.

## Fossilization

Fossilization always requires a reason. It cannot happen silently.

### When the user initiates

A form: optional kind chips and required free-text reason. Closing is evaluation: was the problem ill-defined, was the path wrong, or did another idea supersede this one? This is friction on purpose — it is the moment when the most valuable piece of information is captured: *why* the idea ended.

Kinds (product surface, encoded in the reason string):

| Kind | Meaning |
|---|---|
| `ILL_DEFINED` | The problem was never named |
| `WRONG_PATH` | A simpler path existed |
| `SUPERSEDED` | Another idea replaced this one |

`fossilReason` remains free text. Kinds are UX/event metadata, not a schema enum.

### When the agent suggests

On `MATURE`, the agent may propose a kind + reason as a pending note. You accept (fossilize) or dismiss. There is no multi-turn negotiation with the agent at close time.

### What cannot happen

An embryo cannot become a fossil without a recorded reason. PATCH and agent calls on a fossil return `409`.

## Resurrection

A fossilized embryo cannot be "un-fossilized" — its lifecycle is complete.

**Resurrection** creates a new embryo at `LATENT` that references the fossil with connection type `RESURRECTS`. Use **↺ resurrect** on the fossil page. The new embryo starts its own lifecycle; the fossil stays closed. The agent may also propose `RESURRECTS` when a fossil is in context.

That is the system's mechanism for *"That idea was right, but we weren't ready for it then."*

---

*Back to: [The Agent](/concepts/agent)*
