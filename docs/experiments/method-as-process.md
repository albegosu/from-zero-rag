# Experiment: method as process

> **Status:** implemented (2026-08). Source of the method is the *problem-solving* workshop (Munari's project method applied to software). Hypar **embodies** it; it does not teach it. Observation of move × state in real sessions is still open — see [Open Questions](/open-questions).

The garden already captures unfinished thoughts and challenges them. Before this experiment it did not *sequence* that challenge. This experiment asks whether a methodical stance — define the problem, probe it, generate paths, then choose the simplest — makes the agent a better collaborator without turning Hypar into a workshop or a wizard.

---

## Problem

The agent asks one uncomfortable question per turn. That constraint is right. Before stance shipped, the question itself was generic: *challenge, extend, destabilize*, regardless of whether the embryo is a raw seed, a half-formed path, or something ready to close.

Three failure modes followed:

1. **Solution-shaped seeds go unchallenged as problems.** A seed like "add a definition-of-ready checklist" is already a patch. The first move should be *what problem is this solving?*, not *how do we make the checklist better?*.
2. **Lifecycle is a vitality meter, not a method.** `LATENT → GERMINATING → GROWING → MATURE` already maps onto define → probe → generate → select. The agent barely used it: `buildAgentUserMessage` **omitted** `LATENT` from the prompt. Phase 1 reversed that.
3. **Variety arrives too late, or never.** Munari's useful claim is that creativity comes from generating *paths*, not the first clever answer. The one-question rule can starve that, especially in `GROWING`.

The desired outcome: the same embryo, over its life, is walked through a process. The user never sees a stepper named Munari. The process is the agent's stance.

---

## Thesis

> Method as an antidote to the drama of the problem.

Hypar's equivalent: **tension as an antidote to the first idea.** Fossils already preserve abandoned paths. The missing piece is generating those paths on purpose before closing.

---

## What to take — and what to leave

Taken from the workshop only where it nourishes *this* process (single-user thinking with an agent). Discarded where it is pedagogy, team culture, or a tracker of product experiments.

| From the workshop | In Hypar? | How |
|---|---|---|
| Anti-pattern: first idea that comes to mind | **Yes** | First agent move treats a solution-shaped seed as an undefined problem |
| Anti-pattern: verbalize without progressing | Already present | Dialogue + unresolved tensions. Do not add "progress" UI |
| Anti-pattern: silence / fear | **No** | Team-culture. Hypar is single-user |
| Redefine: *what is the real problem? what is ambiguous?* | **Yes** | Stance for `LATENT` / first engagement |
| Generate paths, not complete solutions | **Yes** | Stance for `GROWING`; later, optional path suggestions |
| Variety before the perfect answer | **Yes, carefully** | Must not break "exactly one question" |
| 5 Whys | **Yes, as a move** | Repertoire for `GERMINATING`. Never labelled in the UI |
| Worst possible solution / reverse thinking | **Yes, as a move** | `INVERT` — "what would make this worse / wrong?" |
| Prototype → evaluate → roll out | **No** | That is delivery. Hypar is not a sprint tracker |
| "Teams that design solutions, not heroes" | **No** | Org workshop. Wrong audience |
| 6-step wizard / landing page | **No** | Turns the agent into an assistant executing a process |
| Name "Munari" / "Design Thinking" in the product | **No** | Method is invisible. Docs may cite the source |

---

## Mapping: method → lifecycle

Do not rename states. Do not add states. Change what the agent *does* in each one.

| State | Method stance | Agent move | User should feel |
|---|---|---|---|
| `LATENT` | Define the problem | `DEFINE` — real problem, ambiguity, solution-shaped seed | The seed is still a question |
| `GERMINATING` | Analyze / probe | `PROBE` or `INVERT` — assumptions, 5-why, "what would have to be true for this to be wrong?" | The idea is being tested, not decorated |
| `GROWING` | Generate paths | `VARIETY` — alternatives, connections as other paths, not the one answer | More than one way forward exists |
| `MATURE` | Select the simplest | `SIMPLEST` — remaining tension? ready to fossilize? overbuilt? | Closure is a choice |
| `FOSSIL` | Record why the path died | Already blocked from agent input | The reason is the valuable part |

Resurrection of a fossil starts a **new** embryo at `LATENT` — define again, in the new context. Do not resume the old method mid-stream.

---

## Non-goals (whole series)

- A UI stepper, "method mode", or named techniques in the garden.
- Teaching Munari, Design Thinking, or problem-solving as content.
- Multi-user / team facilitation.
- Turning tensions into tasks, checklists, or experiment metrics.
- Giving the agent external knowledge (Munari's book, design history).
- Auto-advancing lifecycle because a **move** was used. First successful agent turn on `LATENT` still sets `GERMINATING` (engage trigger, not a method-move). Other state changes stay user-driven — see [The Lifecycle](/concepts/lifecycle).
- Relaxing "exactly one question" in Phase 1–2. Paths are an **additive** field later, not a second question.

---

## Phases

Smallest PR that satisfies one slice. Each phase has its own acceptance criteria. Stop after Phase 2 if the questions do not get better; do not build path-UI on a prompt that is still generic.

### Phase 1 — Stance by state (prompt only)

**Goal:** the agent already has `state` in `AgentPromptInput` and almost never uses it. Make stance the first thing it knows. Include `LATENT`. Treat solution-shaped seeds as undefined problems.

**Touch:**

- `server/utils/embryo-agent.ts` — stance block in the system prompt (or a `stanceFor(state)` helper composed into it); always emit `Current state:` including `LATENT`; instruction: if the seed reads as a solution, the question must recover the problem.
- `tests/embryo-agent.spec.ts` — reverse the current expectation that LATENT is omitted; assert the stance text for each state.
- `docs/concepts/agent.md` — engagement table by state, matching [lifecycle](/concepts/lifecycle).

**Acceptance criteria:**

- [x] Given state `LATENT`, `buildAgentUserMessage` includes `Current state: LATENT`.
- [x] Given each state, the system prompt (or composed stance) tells the model what kind of question to ask (`DEFINE` / `PROBE` / `VARIETY` / `SIMPLEST`).
- [x] One question remains required (`question` is still the only spoken turn).
- [ ] Manual: a solution-shaped seed ("add a checklist for X") yields a problem-definition question on first auto-engage, not an implementation question.
- [ ] Manual: a `GROWING` embryo is asked for alternatives or missing paths, not another "is this wrong?" probe unless the idea is still hollow.

**Out of this phase:** new JSON fields, UI copy, schema, eval corpus.

---

### Phase 2 — Named moves, logged not shown

**Goal:** the agent names the move it made so we can see whether stance is real, and so later evals have a label. The user does not see the name.

**Touch:**

- `parseAgentResponse` accepts optional `move`: `DEFINE | PROBE | INVERT | VARIETY | SIMPLEST`.
- Persist `move` on `EmbryoEvent` payload for `AGENT_QUESTION` (JSON payload already exists — no schema migration).
- Unit tests for parse + fallback when `move` is missing or unknown (omit or coerce, do not fail the turn).

**Acceptance criteria:**

- [x] Given a model response with `"move": "DEFINE"`, the stored `AGENT_QUESTION` payload includes `{ question, move: "DEFINE" }`.
- [x] Given a missing or invalid `move`, the question is still stored; the turn does not fail.
- [x] The embryo detail UI does not render the move name.
- [ ] After a few real sessions, we can count moves per state from events (query or a one-off script). If `GROWING` is still 90% `PROBE`, the prompt is wrong — fix prompt before relying on paths.

**Out of this phase:** showing moves, forcing a move per state (suggestion, not a hard constraint on the model).

---

### Phase 3 — Paths without a second question

**Goal:** in `GROWING`, the agent may attach 2–3 *paths* (short alternative directions, not solutions). The user can promote a path to a tension, or dismiss it. The spoken turn remains one question.

**Design fork (pick one before coding):**

| Option | Shape | Trade-off |
|---|---|---|
| **A. Paths as pending tensions** | `paths: string[]` → `Tension` rows `raisedBy: AGENT`, unresolved | Fits the model. Risk: tension list becomes a brainstorm dump |
| **B. Paths as sibling embryo suggestions** | `paths[]` → `AgentNote` type e.g. `PENDING_PATH`; accept creates a new embryo linked `EXTENDS` | Atomic ideas. Heavier UX, more garden noise |
| **C. Paths only in the question** | Prompt says "ask a question that forces a choice between two named paths" | Zero schema. Weaker variety; still one string |

Recommend **A** if tensions stay short (one line, max 3 new per turn, user must accept before they persist as tensions). Recommend **C** if Phase 2 shows the model already varies well.

**Decision:** **A.** Paths persist as `PENDING_PATH` notes. Accept creates a tension (`raisedBy: AGENT`). Extra paths beyond 3 are dropped. Paths from non-`GROWING` responses are discarded.

**Acceptance criteria (if A):**

- [x] JSON may include `paths: string[]` of length 0–3. Extra items dropped.
- [x] Paths are offered as pending (dismiss / accept-as-tension). They do not auto-create tensions.
- [x] `question` remains required and singular.
- [x] Fossils never receive paths.

**Out of this phase:** auto-creating embryos, scoring paths, prototype/evaluate language.

---

### Phase 4 — Lifecycle copy as method signal

**Goal:** the user understands *why* this state exists, without a tutorial.

**Touch:** `pages/embryo/[id].vue` lifecycle panel — one faint line per current state. Optionally the same line on the garden card. No new screens.

Suggested copy (editable, not branded):

| State | Line |
|---|---|
| `LATENT` | waiting to name the real problem |
| `GERMINATING` | probing assumptions |
| `GROWING` | generating paths, not the answer |
| `MATURE` | tension resolved — close or reopen |
| `FOSSIL` | path closed, reason kept |

**Acceptance criteria:**

- [x] Copy is visible on the embryo page for the current state.
- [x] No technique names, no "Munari", no stepper.
- [x] Garden remains scannable — method line is on the detail page only.

---

### Phase 5 — Fossil reason as evaluation

**Goal:** closing is the "evaluate / select" step. The reason should distinguish *wrong problem* from *wrong path*.

The fossilization dialogue already asks why. Improve the agent's case (when it proposes fossil) and the prompt shown to the user (when they initiate):

- Was the problem ill-defined?
- Was a simpler path available?
- Did a mature idea supersede this one?

**Acceptance criteria:**

- [x] User-initiated fossilize still requires a reason (unchanged).
- [x] Agent-proposed fossil includes which of the three kinds of death it believes happened (`ILL_DEFINED` / `WRONG_PATH` / `SUPERSEDED`).
- [x] Resurrection creates a new `LATENT` embryo referencing the fossil — method restarts.

**Out of this phase:** structured `fossilReason` enum. Keep free text; the agent can *ask*, not classify for the user.

---

### Phase 6 — Evals for stance

`evals/golden.jsonl` is a leftover RAG corpus. Replace or add an embryo-agent eval file.

Each line: `{ "seed", "state", "dialogue?", "expectMove", "notes" }`.

**Acceptance criteria:**

- [x] A checked-in fixture of at least: solution-shaped seed + `LATENT` → `DEFINE`; assumption-laden seed + `GERMINATING` → `PROBE` or `INVERT`; "one obvious fix" seed + `GROWING` → `VARIETY`.
- [x] A test or script can score a model run against `expectMove` (offline, not in request path) — `scoreStanceRun` + `evals/embryo-stance.jsonl`.
- [x] RAG golden queries are not used as embryo evals.

This phase can start in parallel with Phase 2 (write the fixtures even before scoring).

---

## Constraints

- Stack stays as-is: prompt + JSON in `embryo-agent.ts`, persist via existing `EmbryoEvent.payload` and `Tension` / `AgentNote`. Phase 3 added `AgentNoteType.PENDING_PATH` (one enum migration).
- Agent still has no external knowledge by default ([The Agent](/concepts/agent)).
- Auto-engage on first visit already exists (`pages/embryo/[id].vue`). Phase 1 rides that — do not add a capture form.
- One question per invocation remains the hard rule through Phase 2.
- Visual system: terminal CSS variables only. No workshop aesthetics from `problem-solving`.

---

## Open questions this series should answer

Tracked also on [Open Questions](/open-questions):

1. **Does stance-by-state actually change the questions?** If after Phase 2 the move distribution ignores state, prompt-only is not enough (or the model is too small). That is a finding, not a reason to add UI.
2. **Variety vs one question.** Is a `paths[]` field necessary, or does a well-aimed `VARIETY` question suffice?
3. **Solution-shaped seed detection.** Prompt instruction vs a cheap heuristic before the LLM. Start with prompt; only add a heuristic if DEFINE fails in evals.
4. **Should the agent suggest lifecycle transitions** when the method-move implies it (e.g. `SIMPLEST` on a still-`GROWING` embryo)? Suggestion only, never auto-advance.

---

## Order and stop conditions

```
Phase 1 (prompt + LATENT in message)
    → Phase 2 (log move)
        → look at move × state
            → if GROWING never VARIETY: fix prompt, do not build Phase 3
            → if DEFINE works on solution-seeds: Phase 3 is optional; Phase 4/5 are cheap
Phase 6 fixtures can be written anytime after Phase 2's JSON shape is stable
```

Do not implement Phase 3–5 in the same PR as Phase 1.

---

## Verification (how we know it nourished the process)

Not "the method is visible". Success looks like:

- First questions on new embryos recover problems instead of polishing solutions.
- `GROWING` conversations branch (tensions / connections / paths) instead of circling one probe.
- Fossils record *why the path died*, not "not needed anymore".
- Docs and UI still read as a research tool, not a workshop.

---

*Related: [The Agent](/concepts/agent) · [The Lifecycle](/concepts/lifecycle) · [Open Questions](/open-questions)*
