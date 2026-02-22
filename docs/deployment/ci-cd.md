# CI/CD

## GitHub Actions workflows

### Release Chrome Extension

**File:** `.github/workflows/release-extension.yml`

**Triggers:**
- Push of a tag matching `ext-v*.*.*` (e.g. `ext-v0.5.6`)
- Manual dispatch with a `release_tag` input

**What it does:**

1. Checks out code and sets up Node.js 22
2. Installs dependencies with `npm ci`
3. Validates the tag format (`ext-vX.Y.Z`)
4. Creates the production environment file
5. Builds the extension and its dependencies: `npx turbo build --filter=chrome-extension...`
6. Signs the CRX using the private key from secrets
7. Validates key pair integrity (public key matches private key)
8. Authenticates to Google Cloud with service account
9. Uploads the signed CRX to Chrome Web Store
10. Publishes the extension
11. Creates a GitHub release with:
    - `.zip` archive (for manual installation)
    - `.crx` signed package
    - `.pem` public key
12. Cleans up old extension releases and tags

**Required secrets:**

| Secret | Description |
|---|---|
| `PRIVATE_CHROME_EXTENSION_ID` | Chrome Web Store extension ID |
| `PRIVATE_CHROME_PUBLISHER_ID` | CWS publisher ID |
| `PRIVATE_CHROME_SERVICE_ACCOUNT_KEY_JSON` | Google Cloud service account JSON |
| `PRIVATE_CHROME_PRIVATE_SIGNING_KEY` | PEM private key for CRX signing |
| `PRIVATE_CHROME_PUBLIC_SIGNING_KEY` | PEM public key for verification |

**Required variables:**

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_WEBAPP_URL` | Production webapp URL |

## Turborepo remote caching

The CI workflow uses Turborepo's remote caching to speed up builds:

```yaml
env:
  TURBO_TEAM: ${{ secrets.PRIVATE_TURBO_TEAM }}
  TURBO_TOKEN: ${{ secrets.PRIVATE_TURBO_TOKEN }}
```

## Vercel deployments

Website, webapp, and API are deployed via Vercel's Git integration (not GitHub Actions). Vercel watches the `main` branch and deploys automatically.

Each app is a separate Vercel project:
- `usebondery.com` -- website
- `app.usebondery.com` -- webapp
- `api.usebondery.com` -- API

Preview deployments are created for pull requests.

## Team guidelines

Development guidelines are maintained in `.github/instructions/`:

| File | Description |
|---|---|
| `changelog.instructions.md` | Changelog format and commit message conventions |
| `library-docs.instructions.md` | Library documentation standards |
| `code-guality.instructions.md` | Code quality guidelines |
