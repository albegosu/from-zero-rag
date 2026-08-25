# The Lifecycle

Every embryo moves through states. The lifecycle is not a progress bar — it is a signal of how alive an idea is, and what kind of engagement it needs. The lifecycle **is** the method: define, probe, generate paths, then select the simplest. States are not renamed; the stance changes.

## States

```
latent → germinating → growing → mature
                                    ↓
                                 fossil
```

### Latent

The embryo exists but the agent has not yet engaged with it. The seed has been captured. The tension is implicit — present but not yet surfaced.

A latent embryo is waiting. Opening it auto-engages the agent; the first successful turn advances it to germinating.

### Germinating

The agent has begun engaging. The first questions have been asked. The embryo is aware of its own tensions.

This is the most fragile state. The idea could grow into something or reveal itself as hollow. The agent's job here is to probe without breaking — to find the genuine tension without exhausting the embryo before it has developed.

### Growing

Connections are forming. The embryo has survived initial questioning and is developing shape. Other embryos may be linking to it, or it to them. The agent may propose **paths** — alternative directions, not the answer — which you can keep as tensions or dismiss.

### Mature

The idea has a clearer shape. Remaining work is to close or reopen. The agent asks whether this is the simplest effective form, and may propose fossilization.

A mature embryo is ready to be closed — either because it has been absorbed into something else, or because it has achieved its final form. The transition out of mature is always to [fossil](/concepts/fossils), though you can still jump backward to a living state before closing.

### Fossil

The embryo has been closed. It is no longer active, but it is not erased. A fossil retains:

- The original seed
- The full lifecycle history
- The reason for closure (always recorded)
- The connections it held at the time of closure

See [Fossils & Memory](/concepts/fossils) for the full picture.

---

## Transitions

### Who advances an embryo?

- **First agent engage** on a `LATENT` embryo silently sets `GERMINATING` (logged as `STATE_CHANGED` initiated by `AGENT`). That is the germination trigger in the current lab.
- **You** can jump to any other living state from the detail page at any time (including backward). There is no adjacency graph.
- The agent does **not** suggest other lifecycle transitions. Path and fossil proposals are separate HITL notes.

### The fossilization transition

Fossilization is terminal. It always requires a reason. It is never silent.

See [Fossils & Memory](/concepts/fossils) for how fossilization works.

### Reverting states

An embryo can move backward in the lifecycle if new tensions emerge. A mature embryo can return to growing. A fossilized embryo cannot be reverted.

**Resurrection** — a new `LATENT` embryo that references a fossil via `RESURRECTS` — is a designed connection type. There is no dedicated “resurrect” flow yet; you can draw a `RESURRECTS` link by hand.

---

## What state signals

| State | What it means | Agent engagement |
|---|---|---|
| Latent | Waiting to name the real problem | **DEFINE** — recover the problem if the seed is already a solution |
| Germinating | Being probed | **PROBE / INVERT** — assumptions, not patches |
| Growing | Generating paths, not the answer | **VARIETY** — alternative directions; optional path proposals |
| Mature | Tension resolved — close or reopen | **SIMPLEST** — remaining tension, or fossil proposal |
| Fossil | Path closed, reason kept | No agent input |

---

*Next: [The Agent](/concepts/agent)*
