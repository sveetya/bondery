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
    return { ok: response.ok, reachable: true, status: response.status };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { error: message, ok: false, reachable: false, status: null };
  }
}

function formatProbe(label, url, result) {
  if (!result.reachable) {
    return `${label}: ${url} UNREACHABLE (${result.error ?? "connection failed"})`;
  }
  return `${label}: ${url} HTTP ${result.status}${result.ok ? " OK" : ""}`;
}

const [api, webappBff] = await Promise.all([
  probe(`${apiUrl}/health/live`),
  probe(`${webappUrl}/api/health/live`),
]);

if (!api.reachable || !webappBff.reachable) {
  console.error(`
E2E cannot reach dev servers:
  ${formatProbe("API", `${apiUrl}/health/live`, api)}
  ${formatProbe("Webapp BFF", `${webappUrl}/api/health/live`, webappBff)}

Start the full stack (api + webapp):
  pnpm run dev:webapp-api

Wait until both ports respond, then retry.
Or omit E2E_REUSE_SERVER=1 to let Playwright start servers.
`);
  process.exit(1);
}

if (!api.ok) {
  console.error(`
API is up but unhealthy:
  ${formatProbe("API", `${apiUrl}/health/live`, api)}
`);
  process.exit(1);
}

if (!webappBff.ok) {
  console.error(`
Webapp is up but /api/health/live failed (is the API reachable from the webapp BFF?):
  ${formatProbe("Webapp BFF", `${webappUrl}/api/health/live`, webappBff)}
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
