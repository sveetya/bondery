# CI triggers (operator view)

**Source of truth:** [`.github/workflows/README.md`](../../../../.github/workflows/README.md)

This file interprets CI for release captains. If anything conflicts, trust the workflows README.

## Pipeline layers

| Phase | Trigger | Workflow | Operator outcome |
|-------|---------|----------|------------------|
| PR checks | `pull_request` | `verify.yml` | `contract` + path-filtered `website-build`; no Docker |
| Stage artifacts | push `main` | `stage-images.yml` | `:sha-<short>` (+ `:beta` for api/webapp) per changed service |
| Website CD | push `release` | `deploy-website.yml` | Promote `:sha` → `:production` or build fallback; smoke; Dokploy ops webhook |
| API release | tag `api-X.Y.Z` | `release-api.yml` | Promote `:sha` → `X.Y.Z`; smoke; `:production`; GitHub release; Dokploy services webhook |
| Webapp release | tag `webapp-X.Y.Z` | `release-webapp.yml` | Same pattern as API |
| Extension | tag `ext-X.Y.Z` | `release-extension.yml` | Build and publish to Chrome Web Store (not container promote) |

## Promote-first semantics

Release tags **do not rebuild by default**. They run `shared-promote-image-tag.yml` to copy `ghcr.io/usebondery/{api,webapp}:sha-<short>` → `:X.Y.Z`.

**Requirement:** the tagged commit must have been on `main` long enough for `stage-images` to push `:sha-<short>`.

**Escape hatch:** `workflow_dispatch` on `release-api.yml` / `release-webapp.yml` with `force_rebuild: true` rebuilds from source. Use only when `:sha` is missing or untrusted — human-approved.

## Website on `release`

[`deploy-website.yml`](../../../../.github/workflows/deploy-website.yml):

1. Checks whether `website:sha-<short>` exists on GHCR.
2. If yes — promotes to `:production` (no full rebuild).
3. If no — `shared-docker-build-push` fallback.
4. Smoke + Dokploy ops webhook.

## Smoke

- **Product tags:** smoke runs inside `release-api.yml` / `release-webapp.yml` via `shared-smoke-bondery.yml`.
- **Website:** smoke runs inside `deploy-website.yml`.
- **Manual drill:** `smoke-bondery-stack.yml` (`workflow_dispatch`) — optional; not the primary release gate.

## Dokploy webhooks

| Variable | Workflow |
|----------|----------|
| `BONDERY_OPS_DOKPLOY_OPS_DEPLOY_WEBHOOK` | `deploy-website.yml` |
| `BONDERY_OPS_DOKPLOY_SERVICES_DEPLOY_WEBHOOK` | `release-api.yml`, `release-webapp.yml` |

Payload uses `refs/heads/release` so tag releases match Dokploy branch filters.

## Watching CI

After pushing tags or `release`, use the Cursor **babysit** skill to triage failed checks. Common failures:

- Promote failed — `:sha` missing (merge to `main` first, wait for `stage-images`, or `force_rebuild`)
- Smoke failed — inspect workflow logs; do not pin Dokploy until green
- Downstream jobs skipped after workflow structure change — re-run deploy via `workflow_dispatch`
