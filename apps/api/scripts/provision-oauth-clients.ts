/**
 * Deterministic, deployment-only OAuth client/resource provisioning.
 *
 * Replaces the old session-cookie-driven `register-webapp-oauth-client.ts`
 * one-off. This script never accepts a live user session — it is meant to
 * run as part of the release pipeline (see
 * packages/db/scripts/release-migrate.ts), right after `prisma migrate
 * deploy`, so every environment (fresh DB, disaster recovery, staging, CI)
 * ends up with the same trusted first-party OAuth clients.
 *
 * It upserts directly through Prisma rather than Better Auth's
 * `/admin/oauth2/create-client` HTTP endpoint, because that endpoint is
 * gated only by `sessionMiddleware` (any signed-in user, not a real admin
 * check) and requires a request context we don't have at deploy time. To
 * remain compatible with the running `oauth-provider` plugin, this script
 * reproduces its exact default client-secret storage: since the `jwt()`
 * plugin is enabled, `storeClientSecret` defaults to `"hashed"` — a plain
 * SHA-256 digest of the UTF-8 secret, base64url-encoded without padding
 * (verified against `@better-auth/oauth-provider`'s internal
 * `defaultHasher`/`verifyStoredClientSecret`, v1.7.0-rc.2). If a future
 * Better Auth release changes this default, `verifyOAuthClientSecretHash`
 * below will need to change too — that's why it's factored out and unit
 * tested independently of a live server.
 *
 * The canonical API `oauthResource` row itself is boot-time seeded by
 * `oauthProvider({ resources: [...] })` in src/lib/auth/index.ts
 * (`resourceSeedMode: "insertOnly"`, so this script never fights an
 * admin-edited resource policy). This script only creates/links first-party
 * *clients* to that resource — a resource with no linked clients is
 * unusable given `enforcePerClientResources: true`.
 *
 * Usage: tsx --env-file=.env.development.local scripts/provision-oauth-clients.ts
 */
import { createHash } from "node:crypto";
import { prisma } from "@bondery/db";
import { generateId } from "@bondery/helpers/ids";
import {
  OAUTH_PROVIDER_SCOPES,
  resolveApiResourceIdentifier,
} from "../src/lib/auth/index.js";

export function hashOAuthClientSecret(secret: string): string {
  return createHash("sha256").update(Buffer.from(secret, "utf8")).digest("base64url");
}

function resolveWebappOrigin(): string {
  const origin = (process.env.BONDERY_PUBLIC_WEBAPP_URL ?? "").replace(/\/+$/, "");
  if (!origin) {
    throw new Error("BONDERY_PUBLIC_WEBAPP_URL is not set");
  }
  return origin;
}

function resolveExtensionRedirectUris(): string[] {
  const extensionId = process.env.BONDERY_INFRA_CHROME_EXTENSION_ID?.trim();
  if (!extensionId) {
    throw new Error("BONDERY_INFRA_CHROME_EXTENSION_ID is not set");
  }
  return [`https://${extensionId}.chromiumapp.org/`];
}

async function upsertResourceLink(clientId: string, resourceId: string): Promise<void> {
  const existing = await prisma.oauthClientResource.findFirst({ where: { clientId, resourceId } });
  if (existing) {
    return;
  }
  await prisma.oauthClientResource.create({
    data: { clientId, id: generateId(), resourceId },
  });
}

function resolveWebappRedirectUris(): string[] {
  const origin = resolveWebappOrigin();
  const uris = new Set<string>([`${origin}/auth/oauth-callback`]);

  try {
    const url = new URL(origin);
    const port = url.port ? `:${url.port}` : "";
    if (url.hostname === "localhost") {
      uris.add(`${url.protocol}//127.0.0.1${port}/auth/oauth-callback`);
    } else if (url.hostname === "127.0.0.1") {
      uris.add(`${url.protocol}//localhost${port}/auth/oauth-callback`);
    }
  } catch {
    // Keep single redirect URI when origin is malformed.
  }

  return [...uris];
}

export async function provisionWebappClient(resourceId: string): Promise<void> {
  const clientId = process.env.BONDERY_PUBLIC_WEBAPP_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.BONDERY_PRIVATE_WEBAPP_OAUTH_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error(
      "BONDERY_PUBLIC_WEBAPP_OAUTH_CLIENT_ID and BONDERY_PRIVATE_WEBAPP_OAUTH_CLIENT_SECRET must both be set",
    );
  }

  const redirectUris = resolveWebappRedirectUris();
  const hashedSecret = hashOAuthClientSecret(clientSecret);

  await prisma.oauthClient.upsert({
    create: {
      clientId,
      clientSecret: hashedSecret,
      enableEndSession: true,
      grantTypes: ["authorization_code", "refresh_token"],
      id: generateId(),
      name: "Bondery Webapp (BFF)",
      public: false,
      redirectUris,
      requirePKCE: true,
      responseTypes: ["code"],
      scopes: [...OAUTH_PROVIDER_SCOPES],
      skipConsent: true,
      tokenEndpointAuthMethod: "client_secret_post",
      type: "web",
    },
    update: {
      clientSecret: hashedSecret,
      disabled: false,
      enableEndSession: true,
      grantTypes: ["authorization_code", "refresh_token"],
      name: "Bondery Webapp (BFF)",
      public: false,
      redirectUris,
      requirePKCE: true,
      responseTypes: ["code"],
      scopes: [...OAUTH_PROVIDER_SCOPES],
      skipConsent: true,
      tokenEndpointAuthMethod: "client_secret_post",
      type: "web",
    },
    where: { clientId },
  });

  await upsertResourceLink(clientId, resourceId);
  // biome-ignore lint/suspicious/noConsole: CLI script output
  console.log(`Provisioned webapp OAuth client ${clientId} (redirect_uris: ${redirectUris.join(", ")})`);
}

export async function provisionExtensionClient(resourceId: string): Promise<void> {
  const clientId = process.env.BONDERY_PUBLIC_OAUTH_CLIENT_ID?.trim();
  if (!clientId) {
    throw new Error("BONDERY_PUBLIC_OAUTH_CLIENT_ID is not set");
  }

  const redirectUris = resolveExtensionRedirectUris();

  await prisma.oauthClient.upsert({
    create: {
      clientId,
      clientSecret: null,
      grantTypes: ["authorization_code", "refresh_token"],
      id: generateId(),
      name: "Bondery Chrome Extension",
      public: true,
      redirectUris,
      requirePKCE: true,
      responseTypes: ["code"],
      scopes: [...OAUTH_PROVIDER_SCOPES],
      skipConsent: false,
      tokenEndpointAuthMethod: "none",
      type: "user-agent-based",
    },
    update: {
      disabled: false,
      grantTypes: ["authorization_code", "refresh_token"],
      name: "Bondery Chrome Extension",
      public: true,
      redirectUris,
      requirePKCE: true,
      responseTypes: ["code"],
      scopes: [...OAUTH_PROVIDER_SCOPES],
      tokenEndpointAuthMethod: "none",
      type: "user-agent-based",
    },
    where: { clientId },
  });

  await upsertResourceLink(clientId, resourceId);
  // biome-ignore lint/suspicious/noConsole: CLI script output
  console.log(
    `Provisioned extension OAuth client ${clientId} (redirect_uris: ${redirectUris.join(", ")})`,
  );
}

/**
 * Upserts the canonical API resource directly (rather than relying on the
 * running API process to have booted and lazily seeded it via
 * `oauthProvider({ resources })`). Provisioning must be independently
 * runnable right after `prisma migrate deploy`, before the API container's
 * first boot — see release-migrate.ts ordering.
 */
export async function resolveResourceId(): Promise<string> {
  const identifier = resolveApiResourceIdentifier();
  if (!identifier) {
    throw new Error("BONDERY_PUBLIC_API_URL is not set");
  }

  await prisma.oauthResource.upsert({
    create: {
      allowedScopes: [...OAUTH_PROVIDER_SCOPES],
      id: generateId(),
      identifier,
      name: "Bondery API",
    },
    update: {
      // Keep the canonical first-party resource deterministic. Better Auth
      // intersects requested scopes with this list; dropping `openid` would
      // suppress ID tokens and make UserInfo unavailable.
      allowedScopes: [...OAUTH_PROVIDER_SCOPES],
      disabled: false,
    },
    where: { identifier },
  });

  return identifier;
}

async function main(): Promise<void> {
  const resourceId = await resolveResourceId();
  await provisionWebappClient(resourceId);
  await provisionExtensionClient(resourceId);
}

// Guarded so `test:auth` can import the functions above (e.g. to provision a
// clean test database) without this CLI's `main()` also running and calling
// `process.exit()` as a side effect of the import.
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      // biome-ignore lint/suspicious/noConsole: CLI script output
      console.error(error);
      process.exit(1);
    });
}
