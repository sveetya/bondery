# Release Process

## Web applications (website, webapp, API)

The Next.js applications and the Fastify API are deployed to Vercel. Deployments happen automatically on push to `main`.

### Steps

1. Ensure all changes are committed and tested locally
2. Update `CHANGELOG.md` following the [changelog format](.github/instructions/changelog.instructions.md)
3. Push to `main` -- Vercel deploys automatically

## Database migrations

Database schema changes must be pushed to production separately.

### Steps

1. Generate TypeScript types from the latest schema:
   ```bash
   cd apps/supabase-db
   npm run gen-types
   ```

2. Push migrations to the production Supabase project:
   ```bash
   cd apps/supabase-db
   npx supabase db push
   ```

3. Verify the migration applied successfully in the Supabase dashboard

## Chrome extension

The extension uses **separate versioning** from the web applications. Tags follow the format `ext-vX.Y.Z`.

### Steps

1. Update version in both files:
   - `apps/chrome-extension/package.json` -- `"version": "X.Y.Z"`
   - `apps/chrome-extension/scripts/generate-manifest.ts` -- `version: "X.Y.Z"`

2. Regenerate the manifest:
   ```bash
   cd apps/chrome-extension
   npm run generate-manifest
   ```

3. Commit and push:
   ```bash
   git add .
   git commit -m "chore(extension): Bump version to X.Y.Z"
   git push
   ```

4. Create and push the release tag:
   ```bash
   git tag ext-vX.Y.Z
   git push origin ext-vX.Y.Z
   ```

5. GitHub Actions will automatically:
   - Build the extension in production mode
   - Sign the CRX with the private key
   - Upload to Chrome Web Store
   - Publish to the store
   - Create a GitHub release with downloadable assets

### Manual release

Alternatively, trigger a release from the GitHub Actions tab:

1. Go to the "Release Chrome Extension" workflow
2. Click "Run workflow"
3. Enter the tag in format `ext-vX.Y.Z`
4. Click "Run workflow"

### Tips

- Don't bundle listing updates (title, description, images) with code updates
- Don't bundle manifest permission changes with hotfixes
- Avoid pushing updates on Fridays (especially manifest or listing changes)
