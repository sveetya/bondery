# GitHub Actions layout

GitHub requires workflow files to live directly in `.github/workflows/` (no subfolders). This repo uses a **logical tree** mapped to filenames and shared building blocks.

## Logical structure

```text
verify.yml                 PR checks only (contract + path-filtered website-build)

stage/
  images.yml               -> stage-images.yml    main -> api/webapp :beta + :sha; website :sha

deploy/
  website.yml              -> deploy-website.yml  release -> promote :sha or build -> :production

release/
  api.yml                  -> release-api.yml       api-X.Y.Z tags (promote :sha, smoke, :production)
  webapp.yml               -> release-webapp.yml    webapp-X.Y.Z tags
  extension.yml            -> release-extension.yml ext-X.Y.Z tags

smoke/
  bondery-stack.yml        -> smoke-bondery-stack.yml  manual workflow_dispatch drill

shared/
  prepare-dockerignore/    -> .github/actions/shared/prepare-dockerignore/
  ghcr-login/              -> .github/actions/shared/ghcr-login/
  infisical-fetch-secrets/   -> .github/actions/shared/infisical-fetch-secrets/
  infisical-staging-secrets/ -> .github/actions/shared/infisical-staging-secrets/
  dokploy-save-compose-env/  -> .github/actions/shared/dokploy-save-compose-env/
  turbo-remote-cache/      -> .github/actions/shared/turbo-remote-cache/
  website-prune-build/     -> .github/actions/shared/website-prune-build/
  dokploy-deploy-webhook/  -> .github/actions/shared/dokploy-deploy-webhook/
  docker-build-push.yml    -> shared-docker-build-push.yml
  promote-image-tag.yml    -> shared-promote-image-tag.yml
  release-validate.yml     -> shared-release-validate.yml
  container-github-release.yml -> shared-container-github-release.yml
  smoke-bondery.yml        -> shared-smoke-bondery.yml
  promote-production.yml   -> shared-promote-production.yml
```

## Naming rules

| Prefix | Meaning | Trigger |
|--------|---------|---------|
| `verify` | Quality gates | **PR only** (`website-build` path-filtered; `contract` always runs). Uses `concurrency` to cancel stale runs. |
| `stage-images` | Integration images on main | Push to `main` (path-filtered matrix: api, webapp, website) |
| `deploy-*` | Production CD (floating channel) | Push to `release` (path-filtered); website promotes `:sha` when staged on main |
| `release-*` | Versioned production releases | Git tags `*-X.Y.Z`; promotes `:sha-<short>` to semver (no rebuild unless `force_rebuild`) |
| `shared-*` | Reusable workflows (not triggered directly) | `workflow_call` only |
| `sync-dokploy-env` | Infisical → Dokploy ops env sync | `workflow_dispatch` (OIDC only; no GitHub secrets) |

Display names use ASCII hyphens (for example `Stage - Webapp`) because GitHub rejects some workflow expressions when combined with certain name encodings, and because reusable-workflow `with:` blocks cannot use the `env` context.

**Branch protection:** `.github/rulesets/protect-main.json` sets `strict_required_status_checks_policy: true` so PRs must be up to date with `main` before merge. Apply with `pnpm run github:rulesets -- main`.

**Node on runners:** Host jobs and production Docker images pin Node 26 via `.nvmrc` (`node-version-file` in `setup-node@v7`, `node:26-alpine` in Dockerfiles). Host CI installs **pnpm 11.18.0** via `pnpm/action-setup` + `pnpm install --frozen-lockfile`. Docker builder/runner stages install pnpm globally (`npm install -g pnpm@11.18.0`) because `node:26-alpine` does not ship `corepack`.

**Dokploy webhooks** (optional repository **variables**, not secrets):

| Variable | Workflow | Dokploy app |
|----------|----------|-------------|
| `BONDERY_OPS_DOKPLOY_OPS_DEPLOY_WEBHOOK` | `deploy-website.yml` (after smoke) | `deploy/ops` marketing website |
| `BONDERY_OPS_DOKPLOY_SERVICES_DEPLOY_WEBHOOK` | `release-api.yml`, `release-webapp.yml` (after smoke + `:production` promote) | `deploy/bondery` product stack |

Payload always uses `refs/heads/release` so manual runs and tag releases match the Dokploy branch filter.

**Turbo remote cache** (`BONDERY_OPS_TURBO_TOKEN` secret + `BONDERY_OPS_TURBO_TEAM` variable):

| Where | Mechanism |
|-------|-----------|
| `verify` `contract`, `website-build` | `turbo-remote-cache` action |
| `release-extension` | job `env` `TURBO_TOKEN` / `TURBO_TEAM` |
| Docker builds (api, webapp, website) | `shared-docker-build-push` passes `TURBO_TEAM` build-arg + `turbo_token` secret; Dockerfiles mount secret on `turbo build` |

**Verify path filters:** `website-build` runs when marketing-site paths change. `contract` always runs. API HTTP integration (`test:api`) is not in CI; run manually when changing routes if needed. Auth integration (`pnpm --filter api run test:auth`) is local-only until the suite is repaired.

Docker builds also use GHA layer cache (`cache-from: type=gha`). Builder stages use BuildKit cache mounts for the pnpm store (`id=bondery-pnpm-store`): `pnpm fetch` after copying pruned manifests, then `pnpm install` after copying full sources. Requires BuildKit (enabled by default in Docker 23+ and GitHub Actions `docker/build-push-action`).

## Docker channels

| Channel | Git trigger | Docker tags |
|---------|-------------|-------------|
| Stage (api/webapp) | `main` | `:beta`, `:sha-<short>` |
| Stage (website) | `main` | `:sha-<short>` only |
| Release (api/webapp) | `api-X.Y.Z`, `webapp-X.Y.Z` | Promote `:sha-<short>` → `:X.Y.Z`; `:production` after smoke |
| Deploy (website) | push to `release` | Promote `:sha-<short>` → `:production` when image exists on main; else build |

`:sha-<short>` is the **immutable artifact** built on `main`. `:beta` is a floating integration pointer for api/webapp only.

Release workflows support `workflow_dispatch` input `force_rebuild: true` to rebuild from source when `:sha` is missing (hotfix path).

Marketing website uses **release-branch CD** (no semver tags). Product containers stay on tagged releases + pinned image tags for self-hosters.

## Local Docker builds

BuildKit is required for pnpm store cache mounts (`DOCKER_BUILDKIT=1` on older Docker).

```bash
cp .dockerignore.api .dockerignore    # or .dockerignore.webapp / .dockerignore.website
DOCKER_BUILDKIT=1 docker build -f apps/api/Dockerfile .
# website:
DOCKER_BUILDKIT=1 docker build -f apps/website/Dockerfile .
```

If you change lockfile layout or pnpm major version, bump the BuildKit cache id in Dockerfiles (`bondery-pnpm-store`) to avoid stale store entries.

## Release smoke and Infisical

Release smoke (`shared-smoke-bondery.yml`, `smoke-bondery-stack.yml`) boots the API with `NODE_ENV=production`, which **live-verifies SMTP** at startup. Fake `smtp.example.com` placeholders from `deploy/bondery/.env.example` fail that check.

Before `smoke-release.mjs`, workflows run `./.github/actions/shared/infisical-staging-secrets`, which uses [Infisical/secrets-action](https://github.com/Infisical/secrets-action) with **OIDC** to fetch the **staging** environment from project `bondery-secrets` (EU: `https://eu.infisical.com`). The smoke script overlays these five keys into `.env.smoke`:

- `BONDERY_PRIVATE_EMAIL_ADDRESS`
- `BONDERY_PRIVATE_EMAIL_HOST`
- `BONDERY_PRIVATE_EMAIL_PASS`
- `BONDERY_PRIVATE_EMAIL_PORT`
- `BONDERY_PRIVATE_EMAIL_USER`

**Ops checklist (Infisical UI):**

1. Machine identity `f8b9e69d-bc32-4066-ad99-8ad6ecff2d21` uses **OIDC** (not Universal Auth).
2. Bound subject includes this repo's release/smoke workflows (e.g. `repo:usebondery/bondery:ref:refs/heads/release` or workflow-scoped subjects).
3. Audience: `https://github.com/usebondery`.
4. Identity has **read** on the **staging** environment.

Jobs need `permissions.id-token: write`. No GitHub secrets are required for Infisical OIDC.

**Local smoke with real SMTP:**

```bash
infisical run --projectId=7395aabc-4cab-4cfe-aef2-a66899da5430 --env=staging --domain=https://eu.infisical.com -- \
  node deploy/bondery/scripts/smoke-release.mjs --service api --tag 1.8.0
```

Use `defaultEnvironment: dev` in `.infisical.json` for `pnpm env:pull`; release smoke uses the **staging** slug.

## Dokploy ops env sync (`sync-dokploy-env.yml`)

Manual workflow: fetch **production** Infisical secrets via OIDC, upload `opsSync` domain keys to the Dokploy ops compose app (`production-ops-d3big1`). Dokploy connection creds (`BONDERY_OPS_DOKPLOY_*`) live in Infisical — **no GitHub secrets or variables** for this workflow.

| Infisical key (production) | Role |
|----------------------------|------|
| `BONDERY_OPS_DOKPLOY_HOST`, `BONDERY_OPS_DOKPLOY_API_KEY`, `BONDERY_OPS_DOKPLOY_OPS_COMPOSE_ID` | Dokploy API (required) |
| `BONDERY_OPS_DOKPLOY_OPS_DEPLOY_WEBHOOK` | Optional redeploy when `redeploy: true` |
| `BONDERY_INFRA_WEBAPP_DOMAIN`, `BONDERY_INFRA_WEBSITE_DOMAIN`, `BONDERY_INFRA_PLAUSIBLE_DOMAIN` | Uploaded to Dokploy |

**Ops checklist:**

1. Identity `f8b9e69d-bc32-4066-ad99-8ad6ecff2d21` — **read** on **production** (in addition to staging).
2. OIDC subject covers `sync-dokploy-env.yml`.
3. First run with `dry_run: true` — verify upload keys (domains only, not `BONDERY_OPS_*`).
4. `dry_run: false` — backup Dokploy env before first live sync; SHA / version / image tag stay in Dokploy UI.

`deploy-website.yml` may still use `vars.BONDERY_OPS_DOKPLOY_OPS_DEPLOY_WEBHOOK` for CD; duplicate in Infisical is fine until migrated.
