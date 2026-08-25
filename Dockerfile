# Multi-stage build for hypar (Nuxt 3)

FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
RUN corepack enable && corepack prepare --activate
COPY patches/ ./patches/
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable && corepack prepare --activate
# Generate Prisma client now that schema is present, then build app
RUN pnpm prisma generate && pnpm run build

FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat dumb-init
WORKDIR /app

LABEL org.opencontainers.image.title="hypar" \
      org.opencontainers.image.description="hypar — AI interaction research lab" \
      org.opencontainers.image.source="https://github.com/albegosu/hypar" \
      org.opencontainers.image.licenses="MIT"

ENV NODE_ENV=production

# Copy built output and Prisma files needed for migration
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
ENV PORT=3000
ENV HOST=0.0.0.0
ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENTRYPOINT ["dumb-init", "--", "docker-entrypoint.sh"]
CMD ["node", ".output/server/index.mjs"]
