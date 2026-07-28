#!/usr/bin/env node
/**
 * Warn when Playwright's host likely disagrees with a reused dev stack.
 */
const e2eHost = process.env.E2E_PUBLIC_HOST ?? "127.0.0.1";
const webappUrl = `http://${e2eHost}:26632`;
const apiUrl = `http://${e2eHost}:26631`;

async function probe(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    return { reachable: true, status: response.status, ok: response.ok };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { reachable: false, status: null, ok: false, error: message };
  }
}

function formatProbe(label, url, result) {
  if (!result.reachable) {
    return `${label}: ${url} UNREACHABLE (${result.error ?? "connection failed"})`;
  }
  return `${label}: ${url} HTTP ${result.status}${result.ok ? " OK" : ""}`;
}

const [api, webapp] = await Promise.all([
  probe(`${apiUrl}/status`),
  probe(`${webappUrl}/api/status`),
]);

if (!api.reachable || !webapp.reachable) {
  console.error(`
E2E cannot reach dev servers:
  ${formatProbe("API", `${apiUrl}/status`, api)}
  ${formatProbe("Webapp", `${webappUrl}/api/status`, webapp)}

Start the full stack (api + webapp):
  npm run dev:webapp-api

Wait until both ports respond, then retry.
Or omit E2E_REUSE_SERVER=1 to let Playwright start servers.
`);
  process.exit(1);
}

if (!api.ok) {
  console.error(`
API is up but unhealthy:
  ${formatProbe("API", `${apiUrl}/status`, api)}
`);
  process.exit(1);
}

if (!webapp.ok) {
  console.error(`
Webapp is up but /api/status failed (is the API reachable from the webapp BFF?):
  ${formatProbe("Webapp", `${webappUrl}/api/status`, webapp)}
`);
  process.exit(1);
}

if (process.env.E2E_REUSE_SERVER === "1") {
  console.log(
    `E2E reusing dev servers at ${e2eHost}. ` +
      "If OAuth fails, set E2E_PUBLIC_HOST to match BONDERY_PUBLIC_WEBAPP_URL " +
      "(usually `localhost` or `127.0.0.1`).",
  );
}
