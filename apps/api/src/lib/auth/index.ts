/**
 * Better Auth instance — replaces Supabase Auth (GoTrue).
 *
 * Mounted at /auth/* (see routes.ts). Handles:
 *  - GitHub + LinkedIn social sign-in (webapp, mobile)
 *  - Bearer sessions for mobile/API clients (`bearer` plugin)
 *  - JWT/JWKS issuance for services that need a verifiable access token
 *  - Acting as its own OAuth 2.1 / OIDC provider (`oauth-provider` plugin) for
 *    all first-party clients — webapp, mobile, chrome-extension — each doing a
 *    real Authorization Code + PKCE exchange against this API. Replaces
 *    Supabase's OAuth server.
 *  - `expo` plugin for mobile deep-link + SecureStore session handling.
 *
 * `databaseHooks.user.create.after` replaces the old `handle_new_user()`
 * Postgres trigger: seeds `user_settings` + the "myself" `people` row.
 */
import { prisma } from "@bondery/db";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer, jwt, lastLoginMethod } from "better-auth/plugins";
import { expo } from "@better-auth/expo";
import { oauthProvider } from "@better-auth/oauth-provider";
import { resolveCookieDomain } from "@bondery/helpers/auth/resolve-cookie-domain";
import { generateId } from "@bondery/helpers/ids";
import { BETTER_AUTH_BASE_PATH } from "@bondery/helpers/globals/paths";
import { resolveRuntimeTrustedOrigins } from "../platform/trusted-origins.js";
import { provisionNewUser, resolveDefaultLocale } from "./provision-new-user.js";

function resolveWebappUrl(): string {
  return (process.env.BONDERY_PUBLIC_WEBAPP_URL ?? "").replace(/\/+$/, "");
}

/**
 * The one canonical protected-resource identifier for this API, per RFC 8707.
 * All first-party clients (webapp BFF, chrome-extension) must request this
 * exact `resource` value — 1.7's `enforcePerClientResources` (on by default)
 * additionally requires each client to be explicitly linked to it via
 * `oauthClientResource` (see scripts/provision-oauth-clients.ts). Widening or
 * omitting the resource fails closed instead of falling back to a legacy
 * unscoped/opaque token.
 */
export function resolveApiResourceIdentifier(): string {
  return (process.env.BONDERY_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
}

export const API_ACCESS_SCOPE = "api:access";
export const OAUTH_PROVIDER_SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  API_ACCESS_SCOPE,
] as const;

export function resolveTrustedOAuthClientIds(): Set<string> | undefined {
  const clientIds = [
    process.env.BONDERY_PUBLIC_OAUTH_CLIENT_ID?.trim(), // chrome-extension
    process.env.BONDERY_PUBLIC_WEBAPP_OAUTH_CLIENT_ID?.trim(), // webapp BFF
  ].filter((value): value is string => Boolean(value));
  return clientIds.length > 0 ? new Set(clientIds) : undefined;
}

function resolveAuthErrorPageUrl(): string {
  const webappUrl = resolveWebappUrl();
  return webappUrl ? `${webappUrl}/login` : "";
}

/**
 * The Better Auth issuer is the API's own domain — the auth server's identity
 * must not be borrowed from one of its own clients. OAuth callbacks (GitHub/
 * LinkedIn), the JWT `iss` claim, and the session cookie are all derived from
 * this. `loginPage`/`consentPage` below still point at the webapp — that's the
 * browser-facing UI, a separate concern from the issuer identity.
 */
export function resolveBetterAuthIssuerUrl(): string {
  const apiUrl = (process.env.BONDERY_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
  if (apiUrl) {
    return apiUrl;
  }

  return resolveWebappUrl();
}

/** OAuth/OIDC issuer advertised by Better Auth for this non-root base path. */
export function resolveOAuthIssuerIdentifier(): string {
  const baseUrl = resolveBetterAuthIssuerUrl();
  return baseUrl ? `${baseUrl}${BETTER_AUTH_BASE_PATH}` : "";
}

function resolveUseSecureCookies(): boolean {
  return resolveBetterAuthIssuerUrl().startsWith("https://");
}

const crossSubdomainCookieDomain = resolveCookieDomain(process.env.BONDERY_PUBLIC_WEBAPP_URL);

export const auth = betterAuth({
  baseURL: resolveBetterAuthIssuerUrl(),
  basePath: BETTER_AUTH_BASE_PATH,
  secret: process.env.BONDERY_PRIVATE_BETTER_AUTH_SECRET,
  onAPIError: {
    errorURL: resolveAuthErrorPageUrl() || undefined,
  },
  trustedOrigins: resolveRuntimeTrustedOrigins(),

  database: prismaAdapter(prisma, { provider: "postgresql" }),

  socialProviders: {
    github: {
      clientId: process.env.BONDERY_PRIVATE_AUTH_GITHUB_CLIENT_ID ?? "",
      clientSecret: process.env.BONDERY_PRIVATE_AUTH_GITHUB_CLIENT_SECRET ?? "",
    },
    // Better Auth's built-in "linkedin" provider maps to LinkedIn's OIDC
    // flow (`openid`, `profile`, `email` scopes) — equivalent to Supabase's
    // `linkedin_oidc` provider.
    linkedin: {
      clientId: process.env.BONDERY_PRIVATE_AUTH_LINKEDIN_CLIENT_ID ?? "",
      clientSecret: process.env.BONDERY_PRIVATE_AUTH_LINKEDIN_CLIENT_SECRET ?? "",
    },
  },

  session: {
    // Match previous Supabase access-token lifetime; refreshed transparently
    // by the client plugins (web cookie refresh, expoClient, bearer).
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh cookie once per day of activity
  },

  account: {
    // AES-256-GCM for GitHub/LinkedIn tokens in `Account`. Better Auth
    // encrypts on write and decrypts in getAccessToken / account-info /
    // refresh. Existing plaintext rows still work until the next
    // refresh/re-link (decryptOAuthToken passes non-encrypted values through).
    // App code must not read Account.accessToken/refreshToken/idToken via
    // Prisma — use auth.api.getAccessToken if a plaintext provider token is needed.
    encryptOAuthTokens: true,
  },

  plugins: [
    bearer(),
    jwt(),
    expo(),
    lastLoginMethod({ storeInDatabase: false }),
    oauthProvider({
      // Deliberately NOT `/login`: that page's server-side gate checks the
      // webapp's own independent OAuth-BFF session (see
      // resolveServerSession()) and redirects straight past the login UI
      // when it's valid. This page is reached by /oauth2/authorize only
      // when the API's own native session is missing, which the webapp
      // session says nothing about — reusing `/login` here caused a
      // redirect loop whenever a caller had a valid webapp session but no
      // native AS session. `/oauth/login` is a dedicated AS-only login
      // gate that always starts fresh social sign-in.
      loginPage: `${resolveWebappUrl()}/oauth/login`,
      consentPage: `${resolveWebappUrl()}/oauth/consent`,
      cachedTrustedClients: resolveTrustedOAuthClientIds(),
      scopes: [...OAUTH_PROVIDER_SCOPES],
      // Boot-time seed only — never overwrites an admin-edited row
      // (resourceSeedMode defaults to "insertOnly"). The actual
      // client -> resource links are created by
      // scripts/provision-oauth-clients.ts, which also owns the client rows.
      resources: resolveApiResourceIdentifier()
        ? [
            {
              identifier: resolveApiResourceIdentifier(),
              name: "Bondery API",
              // oauth-provider intersects requested scopes with each resource's
              // allowedScopes. OIDC scopes must survive that intersection for
              // the token endpoint to issue an ID token and permit UserInfo.
              allowedScopes: [...OAUTH_PROVIDER_SCOPES],
            },
          ]
        : [],
      // Default true: a client must be linked to this resource
      // (oauthClientResource) to receive a token for it — see provisioning.
      enforcePerClientResources: true,
    }),
  ],

  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          await provisionNewUser({
            locale: resolveDefaultLocale(new Headers()),
            name: user.name,
            userId: user.id,
          });
        },
      },
    },
  },

  advanced: {
    useSecureCookies: resolveUseSecureCookies(),
    ...(crossSubdomainCookieDomain && {
      crossSubDomainCookies: {
        domain: crossSubdomainCookieDomain,
        enabled: true,
      },
    }),
    // Preserve Postgres uuid columns already referenced by every app table.
    database: { generateId: () => generateId() },
  },
});

export type Auth = typeof auth;
