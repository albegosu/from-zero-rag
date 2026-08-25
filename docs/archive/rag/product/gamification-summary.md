# Gamification Summary

> **Legacy design doc.** XP and challenge mechanics for the old `/learn` + `utils/learning/` quest. That UI is **not** in the current unified app; see [Learning quest](/features/learning-quest). Below is kept as product reference.

Overview of the challenge system and XP mechanics in RAG Learning Quest.

---

## Challenge System

Challenges are defined in `utils/learning/levels/` and validated by classes in `utils/learning/validators/`. Each challenge has:

- **Starter code** — scaffolded function signature
- **Test cases** — input/expected output pairs
- **Validator** — executes user code and checks output
- **Hints** — progressive hints with XP penalties
- **Theory** — concept explanation inline with the challenge

---

## XP & Badges

| Difficulty | Base XP | Hint penalty |
|---|---|---|
| Easy | 50 | −5 per hint |
| Medium | 75 | −10 per hint |
| Hard | 100 | −20 per hint |

| Badge | Unlock condition |
|---|---|
| Embedding Master | Complete all Level 1 challenges |
| Vector Wizard | Complete all Level 3 challenges |

Total available XP across 9 challenges: **650 XP** (not counting level bonuses).

---

## Progress Storage

Progress is stored in `localStorage` via the `progress` Pinia store (`stores/progress.ts`). This means progress is:

- Instant — no backend round-trip
- Offline-capable
- Per-browser (not synced across devices)

Future: optional cloud sync via the existing user ID system.

---

## Level Unlocking

Each level specifies a `minChallengesRequired` to unlock the next level. Users can skip to hard challenges within a level if they choose.

---

## UX Flow

```
/learn  →  level map (visual grid)
  └── click level  →  /learn/level/:id  (objectives + challenge list)
        └── click challenge  →  /learn/challenge/:id
              ├── left panel: description, theory, hints
              └── right panel: Monaco editor + test console
                    └── all tests pass  →  XP awarded, badge check, progress saved
```

---

## Design Decisions

**Why Monaco?** Industry-standard editor (same as VSCode). Gives syntax highlighting, auto-complete, and error squiggles — familiar to developers.

**Why localStorage?** No account required to start learning. Simple, instant, works offline. A cloud sync option can be layered on top later without changing the validator architecture.

**Why inline in `utils/learning/`?** Previously a separate `@rag/learning` workspace package. Inlining removes the build/publish step and keeps everything in one repo with no inter-package version drift.
