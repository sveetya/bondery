# bondery-release references

| File | When to read |
|------|----------------|
| [prerequisites.md](prerequisites.md) | Before any push to `release` or product tags — bumps, changelog, openapi, build on `main` |
| [sequencing-and-gates.md](sequencing-and-gates.md) | Extension gate, website exception, extension-unchanged shortcut |
| [ci-triggers.md](ci-triggers.md) | What CI does on `main`, `release`, and tags (thin pointer to workflows README) |
| [dokploy-pins.md](dokploy-pins.md) | `BONDERY_INFRA_*_IMAGE_TAG` pins, env codegen, Dokploy redeploy |
| [extension.md](extension.md) | `ext-X.Y.Z`, Chrome Web Store review, rejection path |
| [rollback-hotfix.md](rollback-hotfix.md) | Patch hotfix and production rollback |
| [post-release.md](post-release.md) | Blog and community announce after technical deploy |
