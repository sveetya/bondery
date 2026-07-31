# Chrome extension release

Extension releases are **sequential and blocking** when extension code changed. See [sequencing-and-gates.md](sequencing-and-gates.md).

## Tag and CI

```bash
git tag ext-X.Y.Z
git push origin ext-X.Y.Z
```

Triggers [`release-extension.yml`](../../../../.github/workflows/release-extension.yml) (`Release - Extension`). Manual dispatch is also available with input `release_tag: ext-X.Y.Z`.

## Stop for Chrome Web Store

After pushing the tag:

1. **Stop.** Do not push `main:release` or product tags.
2. Wait until the user confirms Google's review is complete and the extension is **live** in the Chrome Web Store.

## Rejection

If Google rejects the submission:

1. Fix issues on `main`.
2. Create a new patch tag (`ext-X.Y.Z` with incremented patch).
3. Re-submit via CI.
4. Do **not** proceed with webapp/API release until the extension is live.

## Listing and permission changes

Keep hotfixes small. Avoid bundling Chrome Web Store listing or permission changes with unrelated code fixes — they slow review and increase rejection risk.

## Local development

OAuth setup, unpacked extension loading, and simulating `MIN_EXTENSION_VERSION`: [`apps/chrome-extension/README.md`](../../../../apps/chrome-extension/README.md).

## Extension checklist

- [ ] `ext-X.Y.Z` matches release `X.Y.Z`
- [ ] `release-extension` workflow succeeded
- [ ] User confirmed extension live in CWS before product deploy
- [ ] `MIN_EXTENSION_VERSION` updated on `main` if API gating changed (see [prerequisites.md](prerequisites.md))
