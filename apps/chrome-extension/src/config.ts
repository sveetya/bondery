/**
 * Chrome Extension Configuration
 *
 * Environment variables are loaded by WXT/Vite from:
 * - .env
 * - .env.local
 * - .env.[mode]
 * - .env.[mode].local
 *
 * Product vars use BONDERY_PUBLIC_* (see vite.envPrefix in wxt.config.ts).
 * Framework vars like WXT_DEBUG remain on the WXT_ prefix.
 */

export const OAUTH_SCOPE = "openid profile email offline_access api:access";

export const config = {
  /** API base URL (Better Auth + resource server) */
  apiUrl: import.meta.env.BONDERY_PUBLIC_API_URL,
  /** Webapp base URL (used for app navigation and redirects) */
  appUrl: import.meta.env.BONDERY_PUBLIC_WEBAPP_URL,
  /** OAuth 2.1 public client ID (provisioned via provision-oauth-clients.ts) */
  oauthClientId: import.meta.env.BONDERY_PUBLIC_OAUTH_CLIENT_ID,
} as const;

/** Normalize loopback hostnames for OAuth issuer/resource consistency. */
export function normalizeOAuthBaseUrl(url: string): string {
  return url.replace("http://localhost:", "http://127.0.0.1:").replace(/\/+$/, "");
}

export function getOAuthResource(): string {
  return normalizeOAuthBaseUrl(config.apiUrl);
}

export function getOAuthTokenUrl(): string {
  return `${normalizeOAuthBaseUrl(config.apiUrl)}/auth/oauth2/token`;
}

export function getOAuthAuthorizeUrl(): string {
  return `${normalizeOAuthBaseUrl(config.apiUrl)}/auth/oauth2/authorize`;
}
