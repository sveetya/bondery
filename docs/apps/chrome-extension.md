# Chrome Extension

**Package:** `apps/chrome-extension`
**Version:** 0.5.6
**Bundler:** Parcel
**Manifest:** v3

The Chrome extension lets users import contacts from social media profiles directly into Bondery with a single click.

## Supported platforms

| Platform | Content script | Injection target |
|---|---|---|
| LinkedIn | `src/linkedin/` | Profile action area (next to "Message" button) |
| Instagram | `src/instagram/` | Profile header area |
| Facebook | `src/facebook/` | Profile action area |

## How it works

1. When the user visits a profile page on a supported platform, the content script activates
2. A `MutationObserver` watches for DOM changes (handles SPA navigation)
3. The extension injects a small "Add to Bondery" button into the profile UI
4. When clicked, the button extracts profile data from the page DOM:
   - Username / handle
   - First name, middle name, last name
   - Profile image URL
   - Job title
   - Location / workplace
5. The extension redirects to the API endpoint:
   ```
   GET {API_URL}/api/redirect?linkedin=username&firstName=...
   ```
6. The API creates or finds the contact, then redirects to the webapp at `/app/person/:id`

## Extension detection

The webapp includes a bridge (`src/webapp/bridge.ts`) that detects if the extension is installed:

1. Webapp sends a `BONDERY_EXTENSION_PING` message via `postMessage`
2. If the extension's content script is present, it responds with `BONDERY_EXTENSION_PONG`
3. The webapp can then show extension-aware UI elements

## Configuration

Environment variables control the target URLs:

| Variable | Description | Dev default |
|---|---|---|
| `NEXT_PUBLIC_WEBAPP_URL` | Webapp URL (redirect target) | `http://localhost:3002` |

## Development

```bash
cd apps/chrome-extension

# Build for development
npm run dev

# Build for production
npm run build

# Generate icons from SVG source
npm run gen-icons

# Generate manifest.json
npm run gen-manifest
```

### Loading in Chrome

1. Build the extension: `npm run build`
2. Open `chrome://extensions/` in Chrome
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `dist/` folder

## Permissions

- `storage` -- local storage access
- Host permissions: `*://*.instagram.com/*`, `*://*.linkedin.com/*`, `*://*.facebook.com/*`, `http://localhost/*`

## Release process

See [Chrome Extension Release](../deployment/ci-cd.md) for the automated release workflow via GitHub Actions.

## Tech stack

- React 19
- TypeScript
- Parcel bundler
- Mantine UI components
- Shared packages: `@bondery/branding`, `@bondery/helpers`, `@bondery/mantine-next`
