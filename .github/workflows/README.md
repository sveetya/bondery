# GitHub Actions layout

GitHub requires workflow files to live directly in `.github/workflows/` (no subfolders). This repo uses a **logical tree** mapped to filenames and shared building blocks.

## Logical structure

```text
verify.yml                 PR + main checks (contract + path-filtered website-build)

stage/
  api.yml                  -> stage-api.yml       main -> ghcr.io/usebondery/api:beta
  webapp.yml               -> stage-webapp.yml    main -> ghcr.io/usebondery/webapp:beta

deploy/
  website.yml              -> deploy-website.yml  release -> ghcr.io/usebondery/website:production

release/
  api.yml                  -> release-api.yml       api-X.Y.Z tags
  webapp.yml               -> release-webapp.yml    webapp-X.Y.Z tags
  extension.yml            -> release-extension.yml ext-X.Y.Z tags

smoke/
  bondery-stack.yml        -> smoke-bondery-stack.yml  tag-triggered compose smoke

shared/
  prepare-dockerignore/    -> .github/actions/shared/prepare-dockerignore/
  ghcr-login/              -> .github/actions/shared/ghcr-login/
  turbo-remote-cache/      -> .github/actions/shared/turbo-remote-cache/
  website-prune-build/     -> .github/actions/shared/website-prune-build/
  dokploy-deploy-webhook/  -> .github/actions/shared/dokploy-deploy-webhook/
  docker-build-push.yml    -> shared-docker-build-push.yml
  release-validate.yml     -> shared-release-validate.yml
  container-github-release.yml -> shared-container-github-release.yml
```

## Naming rules

| Prefix | Meaning | Trigger |
|--------|---------|---------|
| `verify` | Quality gates | PR, push to `main` (`website-build` path-filtered; `contract` always runs) |
| `stage-*` | Integration/staging images | Push to `main` (path-filtered) |
| `deploy-*` | Production CD (floating channel) | Push to `release` (path-filtered); website is Docker build-push only |
| `release-*` | Versioned production releases | Git tags `*-X.Y.Z` |
| `shared-*` | Reusable workflows (not triggered directly) | `workflow_call` only |

Display names use ASCII hyphens (for example `Stage - Webapp`) because GitHub rejects some workflow expressions when combined with certain name encodings, and because reusable-workflow `with:` blocks cannot use the `env` context.

**Node on runners:** Host jobs and production Docker images pin Node 26 via `.nvmrc` (`node-version-file` in `setup-node@v7`, `node:26-alpine` in Dockerfiles). Dependencies install with **pnpm 11.18.0** (`corepack enable` + `pnpm install --frozen-lockfile`). Third-party actions that ship their own Node runtime use Node 24 builds where available (`dorny/paths-filter@v4`, `docker/setup-compose-action@v2`). Release `smoke` jobs validate the container runtime.

**Dokploy webhooks** (optional repository **variables**, not secrets):

| Variable | Workflow | Dokploy app |
|----------|----------|-------------|
| `BONDERY_OPS_DOKPLOY_OPS_DEPLOY_WEBHOOK` | `deploy-website.yml` (after smoke) | `deploy/ops` marketing website |
| `BONDERY_OPS_DOKPLOY_SERVICES_DEPLOY_WEBHOOK` | `release-api.yml`, `release-webapp.yml` | `deploy/bondery` product stack |

Payload always uses `refs/heads/release` so manual runs and tag releases match the Dokploy branch filter.

**Turbo remote cache** (`BONDERY_OPS_TURBO_TOKEN` secret + `BONDERY_OPS_TURBO_TEAM` variable):

| Where | Mechanism |
|-------|-----------|
| `verify` `contract`, `website-build` | `turbo-remote-cache` action |
| `release-extension` | job `env` `TURBO_TOKEN` / `TURBO_TEAM` |
| Docker builds (api, webapp, website) | `shared-docker-build-push` passes `TURBO_TEAM` build-arg + `turbo_token` secret; Dockerfiles mount secret on `turbo build` |

**Verify path filters:** `website-build` runs when marketing-site paths change. `contract` always runs. API HTTP integration (`test:api`) is not in CI; run manually when changing routes if needed. Auth integration (`pnpm --filter api run test:auth`) is local-only until the suite is repaired.

Docker builds also use GHA layer cache (`cache-from: type=gha`).

## Docker channels

| Channel | Git trigger | Docker tags |
|---------|-------------|-------------|
| Stage | `main` | `:beta`, `:sha-<short>` |
| Release (api/webapp) | `api-X.Y.Z`, `webapp-X.Y.Z` | `:X.Y.Z`, `:production` |
| Deploy (website) | push to `release` | `:production`, `:sha-<short>` |

Marketing website uses **release-branch CD** (no semver tags). Product containers stay on tagged releases + pinned image tags for self-hosters.

## Local Docker builds

```bash
cp .dockerignore.api .dockerignore    # or .dockerignore.webapp / .dockerignore.website
docker build -f apps/api/Dockerfile .
# website:
docker build -f apps/website/Dockerfile .
```
