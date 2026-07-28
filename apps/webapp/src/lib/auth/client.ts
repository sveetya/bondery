import type { WebappRuntimeConfig } from "@bondery/schemas";
import { resolveCookieDomain } from "@bondery/helpers/auth/resolve-cookie-domain";
import { BETTER_AUTH_BASE_PATH } from "@bondery/helpers/globals/paths";
import { oauthProviderClient } from "@better-auth/oauth-provider/client";
import { createAuthClient } from "better-auth/client";
import { lastLoginMethodClient } from "better-auth/client/plugins";
import { getWebappRuntimeConfigSync } from "@/lib/platform/runtimeConfig.client";

/**
 * The Better Auth issuer is the API's own domain (see apps/api/src/lib/auth/index.ts),
 * so this client talks directly to the API — same-site as the webapp under the shared
 * registrable domain, so the API's native session cookie flows on these calls without
 * needing a same-origin proxy. Used only for the handful of operations that require
 * Better Auth's own native session (social sign-in, link/unlink, OAuth consent) — the
 * webapp's own RSC-facing session is a separate, independent OAuth client credential
 * (see oauthClient.server.ts).
 */
export function resolveAuthClientBaseUrl(config: WebappRuntimeConfig): string {
  return config.apiBaseUrl;
}

export function createWebappAuthClient(config?: WebappRuntimeConfig) {
  const cfg = config ?? getWebappRuntimeConfigSync();
  const apiBaseUrl = resolveAuthClientBaseUrl(cfg);

  const cookieDomain = resolveCookieDomain(cfg.webappUrl);

  return createAuthClient({
    baseURL: apiBaseUrl,
    basePath: BETTER_AUTH_BASE_PATH,
    fetchOptions: {
      credentials: "include",
    },
    plugins: [
      oauthProviderClient(),
      lastLoginMethodClient(cookieDomain ? { domain: cookieDomain } : {}),
    ],
  });
}

export type WebappAuthClient = ReturnType<typeof createWebappAuthClient>;
