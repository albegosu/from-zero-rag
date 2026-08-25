# Contributing

The **canonical** contributing guide lives in the repository root:

**[`CONTRIBUTING.md`](https://github.com/albegosu/hypar/blob/main/CONTRIBUTING.md)**

---

## Quick local setup

```bash
git clone https://github.com/albegosu/hypar.git
cd hypar
pnpm install
cp .env.example .env   # configure DATABASE_URL + Ollama
npx prisma migrate deploy
pnpm dev
```

---

## Before you open a PR

```bash
pnpm build
pnpm test
pnpm docs:build   # if you touch docs/**
```

---

## Where to change things

| Goal | Likely paths |
| --- | --- |
| Embryo API | `server/api/embryos/**/*.ts` |
| Agent collaborator | `server/api/embryos/[id]/agent.post.ts` |
| UI | `pages/`, `components/` |
| Store | `stores/embryos.ts` |
| Docs site | `docs/` (VitePress) |

Questions or large features: open a **[GitHub issue](https://github.com/albegosu/hypar/issues)** first.
