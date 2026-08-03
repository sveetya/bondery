# syntax=docker/dockerfile:1

FROM node:26-alpine AS base
RUN apk add --no-cache libc6-compat
RUN npm install -g pnpm@11.18.0
WORKDIR /app
ENV TURBO_TELEMETRY_DISABLED=1
ENV CI=true

FROM base AS prune
COPY . .
RUN pnx turbo@2.10.4 prune webapp --docker

FROM base AS builder
ARG TURBO_TEAM
ENV TURBO_TEAM=$TURBO_TEAM
ENV PNPM_HOME=/pnpm
ENV PATH="${PNPM_HOME}:${PATH}"
ENV PNPM_STORE_DIR=/pnpm/store
COPY --from=prune /app/out/json/ .
COPY --from=prune /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=prune /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN --mount=type=cache,id=bondery-pnpm-store-v2,target=/pnpm/store,sharing=locked \
    pnpm fetch --store-dir "${PNPM_STORE_DIR}"
COPY --from=prune /app/out/full/ .
COPY scripts ./scripts
COPY docs ./docs
# Placeholder public env vars for build-time static generation only.
# Runtime reads BONDERY_PUBLIC_* via runtimeConfig.server.ts (never build-inlined).
ENV BONDERY_PUBLIC_API_URL=https://api.example.com
ENV BONDERY_PUBLIC_WEBAPP_URL=https://app.example.com
ENV BONDERY_PUBLIC_WEBSITE_URL=https://example.com
RUN --mount=type=cache,id=bondery-pnpm-store-v2,target=/pnpm/store,sharing=locked \
    pnpm install --frozen-lockfile --ignore-scripts --no-runtime --store-dir "${PNPM_STORE_DIR}"
RUN --mount=type=secret,id=turbo_token \
    export TURBO_TOKEN="$(cat /run/secrets/turbo_token 2>/dev/null || true)" && \
    pnpm exec turbo build --filter=webapp
RUN pnpm prune --prod --ignore-scripts

FROM node:26-alpine AS runner
WORKDIR /app

ARG BONDERY_INFRA_VERSION
ARG BONDERY_INFRA_GIT_SHA
ARG BUILD_DATE

ENV NODE_ENV=production
ENV PORT=26632
ENV BONDERY_INFRA_VERSION=$BONDERY_INFRA_VERSION
ENV BONDERY_INFRA_GIT_SHA=$BONDERY_INFRA_GIT_SHA
ENV BUILD_DATE=$BUILD_DATE

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs nodejs

COPY --from=builder --chown=nodejs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/apps/webapp/package.json ./apps/webapp/package.json
COPY --from=builder --chown=nodejs:nodejs /app/apps/webapp/.next ./apps/webapp/.next
COPY --from=builder --chown=nodejs:nodejs /app/apps/webapp/public ./apps/webapp/public
COPY --from=builder --chown=nodejs:nodejs /app/apps/webapp/next.config.ts ./apps/webapp/next.config.ts
COPY --from=builder --chown=nodejs:nodejs /app/packages ./packages

USER nodejs
WORKDIR /app/apps/webapp
EXPOSE 26632

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:26632/health/live').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "../../node_modules/next/dist/bin/next", "start"]
