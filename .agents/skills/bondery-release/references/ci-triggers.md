# CI triggers (operator view)

**Source of truth:** [`.github/workflows/README.md`](../../../../.github/workflows/README.md)

This file interprets CI for release captains. If anything conflicts, trust the workflows README.

## Pipeline layers

| Phase | Trigger | Workflow | Operator outcome |
|-------|---------|----------|------------------|
| PR checks | `pull_request` | `verify.yml` | `contract` (+ `check:versions`) + path-filtered `website-build` |
| Stage artifacts | push `main` | `stage-images.yml` | `:sha-<short>` (+ `:beta` for api/webapp) per changed service |
| Website CD | push `release` | `deploy-website.yml` | Promote `:sha` → `:production` or build fallback; smoke; Dokploy ops webhook |
| **Unified release** | tag `vX.Y.Z` | `release.yml` | One GitHub release; promote/smoke api/webapp; CWS extension; Dokploy webhook |

## Promote-first semantics

Release tags **do not rebuild by default**. They promote `ghcr.io/usebondery/{api,webapp}:sha-<short>` → `:X.Y.Z`.

**Requirement:** the tagged commit must be on `release` and have `:sha-<short>` from `stage-images` on `main`.

**CI recovery:** `workflow_dispatch` on `release.yml` with `mode: retry-promote` (not operator hotfix). Optional `force_rebuild: true` when `:sha` is missing.

## Website on `release`

[`deploy-website.yml`](../../../../.github/workflows/deploy-website.yml):

1. Checks whether `website:sha-<short>` exists on GHCR.
2. If yes — promotes to `:production` (no full rebuild).
3. If no — `shared-docker-build-push` fallback.
4. Smoke + Dokploy ops webhook.

## Smoke

- **Unified release:** smoke runs per changed component via `shared-release-container.yml`.
- **Website:** smoke runs inside `deploy-website.yml`.
- **Manual drill:** `smoke-bondery-stack.yml` (`workflow_dispatch`).

## Dokploy webhooks

Fetched from **Infisical production** (OIDC) in CI.

| Infisical key | Workflow |
|---------------|----------|
| `BONDERY_OPS_DOKPLOY_WEBSITE_DEPLOY_WEBHOOK` | `deploy-website.yml` |
| `BONDERY_OPS_DOKPLOY_SERVICES_DEPLOY_WEBHOOK` | `release.yml` |

Payload uses `refs/heads/release` so tag releases match Dokploy branch filters.

**Extension CI:** Chrome ops ids and public URLs from Infisical production; `PRIVATE_CHROME_*` signing keys remain GitHub secrets.

## Watching CI

After pushing `vX.Y.Z` or `release`, use the Cursor **babysit** skill to triage failed checks. Common failures:

- Promote failed — `:sha` missing (merge to `main` first, wait for `stage-images`, or `retry-promote` with `force_rebuild`)
- Smoke failed — inspect workflow logs; do not update Dokploy `BONDERY_INFRA_VERSION` until green
- Extension gate — approve `production-containers` environment only after CWS is live
