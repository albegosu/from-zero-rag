# Security Policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| `main`  | Yes       |

## Reporting a vulnerability

If you discover a security issue, please **do not** open a public GitHub issue.

1. Email **alberto@resiz.es** with a description and reproduction steps.
2. Allow up to **7 business days** for an initial response.
3. We will coordinate disclosure and a fix release when appropriate.

## Security practices in this project

- Session auth via **better-auth**. Embryo and LLM routes call `requireSessionUserId` and filter by `userId`.
- Production startup validates `DATABASE_URL`, auth secret, and `OLLAMA_URL` (`server/utils/env-validation.ts`).
- In-memory rate limit on agent POST (`/api/embryos/:id/agent`). Single-instance only.
- Run `pnpm audit` in CI; keep dependencies updated via Dependabot.

## Deployment checklist

- Set strong `BETTER_AUTH_SECRET` (`openssl rand -hex 32`).
- Never commit `.env`; use `.env.example` as a template only.
- Expose only ports 80/443 (Caddy) in production; keep PostgreSQL and Ollama on the internal Docker network.
- Replace the Compose dev fallback secret (`insecure-dev-docker-change-me`) before any real deployment.
