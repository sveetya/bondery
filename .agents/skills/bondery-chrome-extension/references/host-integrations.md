# Host integrations

Threat model (spoofable `postMessage`, MAIN-world privilege): [integrations-and-clients.md](../../bondery-security/references/integrations-and-clients.md). This file is how the integrations are built.

## Shadow DOM

LinkedIn and Instagram content scripts set `cssInjectionMode: "ui"`. UI mounts through `lib/ui/renderInShadowRoot.tsx` (`createShadowRootUi`).

WXT rewrites `:root` → `:host` in bundled CSS. Mantine must match:

- `cssVariablesSelector=":host"`
- `getRootElement={() => shadowHost}` so `data-mantine-color-scheme` is on the host

Popup and welcome are not in a shadow root — they import Mantine CSS at their own entrypoints. Do not copy `:host` there.

## LinkedIn

Entrypoint: `entrypoints/linkedin.content/index.tsx`. Matches `https://www.linkedin.com/*`, `https://linkedin.com/*`, `https://*.linkedin.com/*`. `runAt: "document_start"`.

**Scrape** (`features/linkedin/scrape/scrapeProfile.ts`): Voyager is primary (`fetchFullWorkHistory`, `fetchFullEducation`, `fetchProfileLocation`). SDUI/DOM is fallback (`extractSduiWorkHistory`, `extractSduiEducation`, `extractSduiIdentity`). Identity/bio still come from SDUI.

**Button:** delayed inject (1.5s, retry 3s) so the action bar exists. SPA: poll `location.href` every 500ms, `clearStaleButtonIfNeeded`, re-inject after 1s. `MutationObserver` on `document.body` waits for `button.artdeco-button` or `data-control-name="message"` (locale-safe; do not rely on English `aria-label^='Message'` alone).

**Open in Bondery** (`LinkedInButton`): scrape then `ADD_PERSON_REQUEST`. If the contact already exists, opens `${config.appUrl}${WEBAPP_ROUTES.PERSON}/:id`.

**Auto-enrich** (`autoEnrich.ts`): when this tab is the enrich target, `scrapeLinkedInProfile(username, { skipLazySectionScroll: true })` — Voyager does not need the lazy DOM sections. Background tabs often have no Message button; wait for SDUI topcard + Voyager URN instead.

## Instagram

Entrypoint: `entrypoints/instagram.content/index.tsx`. Injects MAIN-world interceptor via `injectScript("/instagram-interceptor.js", { keepInDom: true })` at `document_start`. The unlisted script is `entrypoints/instagram-interceptor.ts` (`defineUnlistedScript` → `installInstagramNetworkInterceptor`). Manifest lists it under `web_accessible_resources` for Instagram matches.

The interceptor patches `fetch`/`XHR`, looks for GraphQL `PolarisProfilePageContentQuery`, and `postMessage`s `BONDERY_IG_NETWORK_META` with source `bondery-instagram-network-interceptor`. The isolated-world content script reads that into `lastInterceptedProfileMeta`. That channel is **privileged and spoofable** — implement the intercept here; do not “harden” it in this skill (security owns the threat model).

SPA URL polling and MutationObserver mirror LinkedIn. Button custom element: `bondery-instagram`.

## Webapp bridge

Entrypoint: `entrypoints/webapp.content/index.tsx`. **Matches are hardcoded:** `https://app.usebondery.com/*`, `http://localhost/*`. Staging and custom domains never get this script unless those strings change.

`features/webapp-bridge/index.ts` translates page `postMessage` ↔ background `sendMessage`:

| Page → extension | Extension → page |
|------------------|------------------|
| `BONDERY_EXTENSION_PING` | `BONDERY_EXTENSION_PONG` (+ `version`) |
| `BONDERY_AUTH_STATUS_REQUEST` | `BONDERY_AUTH_STATUS_RESPONSE` |
| `BONDERY_ENRICH_REQUEST` | `BONDERY_ENRICH_RESULT` |
| `BONDERY_OPEN_EXTENSIONS_PAGE` | `BONDERY_OPEN_EXTENSIONS_PAGE_ACK` |

Webapp detector: `apps/webapp/src/lib/extension/detectBonderyChromeExtension.ts` (ping/pong, default 1200ms).

## Enrich from LinkedIn

Background `features/background/enrich.ts`:

1. Webapp → bridge → `ENRICH_PERSON_REQUEST`.
2. Background opens an **inactive** LinkedIn tab for `/in/{handle}/`.
3. Pending state in memory + `chrome.storage.session` key `pendingEnrich` (survives SW restart).
4. Alarms: **90s** timeout (`1.5` min), keepalive every **0.4** min so the service worker does not sleep mid-scrape.
5. On tab complete (plus retries), `RUN_PENDING_ENRICH`. Content script asks `GET_ENRICH_CONTEXT`, scrapes, `SUBMIT_ENRICH_DATA`.
6. Background calls `enrichPersonFromLinkedIn`, closes the LinkedIn tab, `ENRICH_PERSON_RESULT` to the webapp tab.

Requires a **LinkedIn session in the same Chrome profile**. A logged-out enrich tab will scrape a login wall.

## Facebook

`ScrapedProfileData.platform` and `findPersonBySocial` accept `"facebook"`. There is **no** `facebook.content` entrypoint and no host inject. Do not add a Facebook button because the union mentions it.

## Host-integrations checklist

- [ ] New host UI goes through `renderInShadowRoot` with `:host`
- [ ] LinkedIn inject stays locale-agnostic (control-name / artdeco, not English aria-label only)
- [ ] Instagram interceptor stays unlisted + `web_accessible_resources`; threat model reviewed in `bondery-security`
- [ ] Bridge matches still prod + localhost unless product explicitly expands them
- [ ] Enrich still uses inactive tab + session persist + keepalive; documents the same-profile LinkedIn login requirement
- [ ] No Facebook content script “for completeness”
