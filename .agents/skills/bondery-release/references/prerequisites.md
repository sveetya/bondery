# Prerequisites on `main`

Complete all steps on `main` **before** pushing to `release` or tagging `vX.Y.Z`.

## 1. Bump version numbers

Bump root [`package.json`](../../../../package.json) `version`, then propagate:

```bash
pnpm run sync-version
```

This updates all workspace `package.json` files (including mobile), `app.config.ts`, Android `versionName`, and `BONDERY_INFRA_VERSION` in the manifest / deploy examples.

Version math and changelog cut: [`bondery-changelog` versioning](../../bondery-changelog/references/versioning-and-release.md).

## 2. Minimum extension version

When the extension API surface changes, update `MIN_EXTENSION_VERSION` in [`packages/helpers/src/globals/paths.ts`](../../../../packages/helpers/src/globals/paths.ts). This drives the API `426 extension_outdated` gate so users upgrade before incompatible webapp/API deploys.

Skip if the release does not change extension–API compatibility.

## 3. Product changelog

Cut the changelog per [`bondery-changelog` versioning](../../bondery-changelog/references/versioning-and-release.md): create `docs/changelog/releases/X.Y.Z.mdx`, add its import to `docs/changelog.mdx`, and reset `docs/changelog/unreleased.mdx`. Follow [`bondery-changelog` format](../../bondery-changelog/references/format.md).

## 4. OpenAPI spec

```bash
pnpm run generate:openapi
```

Commit generated output so API docs and clients stay in sync.

## 5. Build and verify

```bash
pnpm run build
pnpm run check:versions
```

Or run `bondery-verification-loop` for the release-scoped diff. Fix failures before proceeding.

## 6. Commit to `main`

Commit prerequisites as one or more logical commits on `main` (often via a `chore/release-X.Y.Z` PR). Merge PRs first so `stage-images` can build `:sha-<short>` for the release commit.

## Unified release tag

One tag drives api, webapp, and extension (when changed):

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

[`release.yml`](../../../../.github/workflows/release.yml) path-filters which components promote. Unchanged api/webapp images are retagged from the previous `v*` version.

Production releases use unified `vX.Y.Z` tags only (`release.yml`).

## Prerequisites checklist

- [ ] `pnpm run sync-version` and `pnpm run check:versions` pass
- [ ] `MIN_EXTENSION_VERSION` updated if extension/API compatibility changed
- [ ] `docs/changelog/releases/X.Y.Z.mdx` created; import added to `docs/changelog.mdx`; fresh `Unreleased` in `unreleased.mdx`
- [ ] OpenAPI generated and committed
- [ ] `pnpm run build` (or verification loop) passes
- [ ] Changes merged on `main`
- [ ] `stage-images` green on release commit for changed services
