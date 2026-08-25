# RAG Learning Quest

> **Legacy design doc.** Describes the Monaco `/learn` quest from an older monorepo layout. On current `main` there is **no** `/learn` route or `utils/learning/` tree — see [Learning quest](/features/learning-quest) for status. Keep this page as reference if you reintroduce the quest.

An interactive, gamified learning platform built into hypar. Accessible at `/learn` — no separate app or port needed.

---

## What is RAG Learning Quest?

A tutorial-by-doing system that teaches RAG (Retrieval-Augmented Generation) through **interactive coding challenges** instead of passive reading.

### Key Features

- **3 Complete Levels** — Embeddings, Chunking, Vector Database
- **9 Coding Challenges** — easy → hard, ~3.5 hours of learning
- **650 XP total** available
- **Live Code Editor** — Monaco Editor (VSCode-like) in browser
- **Instant Validation** — run tests and get feedback immediately
- **Hint System** — progressive hints with XP trade-offs
- **Progress Tracking** — persisted in localStorage

---

## Quick Start

```bash
pnpm dev
```

Open http://localhost:3000/learn.

---

## Learning Path

### Level 1: Embeddings Fundamentals

| Challenge | Difficulty | XP |
|---|---|---|
| Generate Your First Embedding | Easy | 50 |
| Calculate Text Similarity | Medium | 75 |
| LRU Cache for Embeddings | Hard | 100 |

Complete all 3 → unlock **"Embedding Master"** badge (+ 200 XP bonus)

### Level 2: Chunking Strategies

| Challenge | Difficulty | XP |
|---|---|---|
| Fixed-Size Chunking | Easy | 50 |
| Chunking with Overlap | Medium | 75 |
| Sentence-Aware Chunking | Hard | 100 |

### Level 3: Vector Database

| Challenge | Difficulty | XP |
|---|---|---|
| Create a Vector Table | Easy | 50 |
| Vector Insertion & Queries | Medium | 75 |
| Similarity Search with HNSW | Hard | 100 |

Complete all 3 → unlock **"Vector Wizard"** badge (+ 225 XP bonus)

---

## Gamification

### XP System

| Difficulty | Base XP | Hint Penalty |
|---|---|---|
| Easy | 50 | −5 per hint |
| Medium | 75 | −10 per hint |
| Hard | 100 | −20 per hint |

### Unlock Conditions

A level unlocks when you complete the minimum required challenges from the previous level and meet the XP threshold.

---

## Routes

| URL | Description |
|---|---|
| `/learn` | Level map |
| `/learn/onboarding` | Wizard — generates a `.env` file for running the real RAG app |
| `/learn/level/:id` | Level details and challenge list |
| `/learn/challenge/:id` | Code editor + test console |

---

## Architecture

The learning logic lives entirely in `utils/learning/`:

```
utils/learning/
├── index.ts           # exports: getAllLevels, getLevel, getChallenge, wizardSteps
├── types/             # TypeScript interfaces (Challenge, Level, ValidationResult, etc.)
├── levels/            # Level and challenge data
│   ├── level-1-embeddings.ts
│   ├── level-2-chunking.ts
│   └── level-3-vector-db.ts
├── validators/        # Automated test runners
│   ├── base-validator.ts
│   ├── embedding-basic-validator.ts
│   ├── similarity-validator.ts
│   ├── lru-cache-validator.ts
│   ├── chunking-fixed-validator.ts
│   ├── chunking-overlap-validator.ts
│   ├── chunking-sentence-validator.ts
│   ├── vector-table-validator.ts
│   ├── vector-insertion-validator.ts
│   └── similarity-search-validator.ts
└── wizard/            # Onboarding wizard steps + env file generator
```

Progress is managed by the `progress` Pinia store (`stores/progress.ts`) and persisted to localStorage.

Monaco Editor is loaded only on `/learn/challenge/*` pages — it is not bundled into the main RAG app routes.

---

## Adding a New Challenge

1. Add challenge data to the relevant level file in `utils/learning/levels/`
2. Create a validator extending `BaseValidator` in `utils/learning/validators/`
3. Export the challenge from `utils/learning/index.ts`
4. Test by navigating to `/learn/challenge/<new-id>`

---

## Roadmap

- [x] Level 1: Embeddings (3 challenges)
- [x] Level 2: Chunking (3 challenges)
- [x] Level 3: Vector DB (3 challenges)
- [ ] Level 4: Retrieval Pipeline
- [ ] Level 5: LLM Integration
- [ ] Level 6: Production Optimization
- [ ] Cloud progress sync
- [ ] Certificate generation
