# syntax=docker/dockerfile:1

FROM node:26-alpine AS base
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@11.18.0
WORKDIR /app
ENV TURBO_TELEMETRY_DISABLED=1
ENV CI=true

FROM base AS prune
COPY . .
RUN pnx turbo@2.10.4 prune api --docker

FROM base AS builder
ARG TURBO_TEAM
ENV TURBO_TEAM=$TURBO_TEAM
ENV PNPM_HOME=/pnpm
ENV PATH="${PNPM_HOME}:${PATH}"
ENV PNPM_STORE_DIR=/pnpm/store
COPY --from=prune /app/out/json/ .
COPY --from=prune /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=prune /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN --mount=type=cache,id=bondery-pnpm-store,target=/pnpm/store,sharing=locked \
    pnpm fetch --store-dir "${PNPM_STORE_DIR}"
COPY --from=prune /app/out/full/ .
COPY scripts ./scripts
COPY docs ./docs
RUN --mount=type=cache,id=bondery-pnpm-store,target=/pnpm/store,sharing=locked \
    pnpm install --frozen-lockfile --ignore-scripts --offline --store-dir "${PNPM_STORE_DIR}"
ENV DATABASE_URL=postgresql://postgres:password@127.0.0.1:54322/bondery
RUN --mount=type=secret,id=turbo_token \
    export TURBO_TOKEN="$(cat /run/secrets/turbo_token 2>/dev/null || true)" && \
    pnpm exec turbo build --filter=api
RUN pnpm prune --prod

FROM node:26-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV API_HOST=0.0.0.0
ENV PORT=26631

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs nodejs

COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder --chown=nodejs:nodejs /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages ./packages

USER nodejs
EXPOSE 26631

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:26631/health/live').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Required env is validated at process start (assertRequiredEnvAtStartup in index.ts)
# before Fastify listens — fails with named missing vars (same list as scripts/check-env.ts).
CMD ["node", "apps/api/dist/index.js"]
