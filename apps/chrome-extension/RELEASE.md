# Chrome Extension Releases

## Creating a New Release

To create a new release of the Bondee Chrome Extension:

1. **Update the version** in `apps/chrome-extension/package.json`

2. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Bump extension version to X.Y.Z"
   ```

3. **Create and push a version tag**:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

4. **GitHub Actions will automatically**:
   - Build the extension in production mode
   - Create a GitHub release
   - Upload the extension as a downloadable `.zip` file

## Manual Release (Alternative)

You can also trigger a release manually from the GitHub Actions tab:
1. Go to the "Release Chrome Extension" workflow
2. Click "Run workflow"
3. Select the branch
4. Click "Run workflow"

## Environment Variables

The workflow uses these environment variables:
- `APP_URL`: Production app URL

To override these, add them as repository secrets in GitHub Settings → Secrets and variables → Actions.

## Installation for End Users

Once a release is created, users can:
1. Go to the [Releases page](https://github.com/YOUR_USERNAME/bondee/releases)
2. Download the latest `bondee-extension-vX.Y.Z.zip` file
3. Extract the zip file
4. Open Chrome and go to `chrome://extensions/`
5. Enable "Developer mode"
6. Click "Load unpacked" and select the extracted folder
