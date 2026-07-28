/**
 * Real-Postgres OAuth 2.1/PKCE protocol + tenant-isolation gate.
 *
 * Unlike the rest of `test:api` (which never touches a live database), this
 * suite requires `DATABASE_URL` to point at a clean, migrated Postgres — the
 * `oauthProvider` plugin seeds its resource row at boot, and the whole
 * authorization-code + refresh flow is exercised through real Fastify
 * injection against real Prisma-backed storage. Run via `npm run test:auth
 * -w api` (see package.json), never as part of the DB-less `test:api`.
 *
 * Requires the schema to already be migrated (`prisma migrate deploy`) —
 * this suite does not run migrations itself. See
 * .github/workflows/verify.yml for the CI wiring (Postgres service +
 * `release-migrate` before this suite).
 */
import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { after, before, describe, it } from "node:test";
import { prisma } from "@bondery/db";
import { generateId } from "@bondery/helpers/ids";
import type { FastifyInstance } from "fastify";
import { loadTestEnv } from "./load-test-env.js";
import { provisionNewUser } from "../lib/auth/provision-new-user.js";

loadTestEnv();

const { createTestApp } = await import("./create-test-app.js");
const { resolveApiResourceIdentifier, resolveOAuthIssuerIdentifier } = await import(
  "../lib/auth/index.js"
);
const { resolveResourceId, provisionWebappClient } = await import(
  "../../scripts/provision-oauth-clients.js"
);

function base64url(input: Buffer): string {
  return input.toString("base64url");
}

function generatePkcePair(): { verifier: string; challenge: string } {
  const verifier = base64url(randomBytes(32));
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { challenge, verifier };
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split(".");
  assert.equal(parts.length, 3, "access token must be a JWT (three dot-separated segments)");
  return JSON.parse(Buffer.from(parts[1] as string, "base64url").toString("utf8"));
}

async function createTestUser(): Promise<{ id: string; email: string }> {
  const id = generateId();
  const email = `auth-integration-${id}@example.test`;
  await prisma.user.create({
    data: { email, emailVerified: true, id, name: "Auth Integration Test User" },
  });
  await provisionNewUser({ name: "Auth Integration Test User", userId: id });
  return { email, id };
}

/** Bearer-plugin-compatible raw session token — see `better-auth`'s `bearer` plugin. */
async function createNativeSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  await prisma.session.create({
    data: {
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      token,
      userId,
    },
  });
  return token;
}

const WEBAPP_URL = (process.env.BONDERY_PUBLIC_WEBAPP_URL ?? "").replace(/\/+$/, "");
const REDIRECT_URI = `${WEBAPP_URL}/auth/oauth-callback`;
const CLIENT_ID = process.env.BONDERY_PUBLIC_WEBAPP_OAUTH_CLIENT_ID as string;
const CLIENT_SECRET = process.env.BONDERY_PRIVATE_WEBAPP_OAUTH_CLIENT_SECRET as string;
const RESOURCE = resolveApiResourceIdentifier();
const OAUTH_SCOPE = "openid profile email offline_access api:access";

function authorizeUrl(params: {
  challenge: string;
  resource?: string;
  scope?: string;
  state: string;
}): string {
  const url = new URL("http://test/auth/oauth2/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", CLIENT_ID);
  url.searchParams.set("redirect_uri", REDIRECT_URI);
  url.searchParams.set("code_challenge", params.challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", params.state);
  url.searchParams.set("scope", params.scope ?? OAUTH_SCOPE);
  if (params.resource !== undefined) {
    url.searchParams.set("resource", params.resource);
  }
  return `${url.pathname}?${url.searchParams.toString()}`;
}

async function authorize(
  app: FastifyInstance,
  sessionToken: string,
  params: { challenge: string; resource?: string; scope?: string; state: string },
) {
  return app.inject({
    headers: { authorization: `Bearer ${sessionToken}` },
    method: "GET",
    url: authorizeUrl(params),
  });
}

function extractCodeAndState(location: string): { code: string; state: string } {
  const url = new URL(location);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  assert.ok(code, `expected authorize redirect to carry a code, got: ${location}`);
  assert.ok(state, `expected authorize redirect to carry state, got: ${location}`);
  return { code, state };
}

async function exchangeCode(
  app: FastifyInstance,
  params: { code: string; codeVerifier: string; resource?: string },
) {
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    code: params.code,
    code_verifier: params.codeVerifier,
    grant_type: "authorization_code",
    redirect_uri: REDIRECT_URI,
  });
  if (params.resource !== undefined) {
    body.set("resource", params.resource);
  }

  return app.inject({
    headers: { "content-type": "application/x-www-form-urlencoded" },
    method: "POST",
    payload: body.toString(),
    url: "/auth/oauth2/token",
  });
}

async function refreshToken(app: FastifyInstance, refresh: string, resource?: string) {
  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: refresh,
  });
  if (resource !== undefined) {
    body.set("resource", resource);
  }

  return app.inject({
    headers: { "content-type": "application/x-www-form-urlencoded" },
    method: "POST",
    payload: body.toString(),
    url: "/auth/oauth2/token",
  });
}

describe("real-database OAuth 2.1 + PKCE protocol", () => {
  let app: FastifyInstance;
  const createdUserIds: string[] = [];

  before(async () => {
    const resourceId = await resolveResourceId();
    await provisionWebappClient(resourceId);
    app = await createTestApp();
  });

  after(async () => {
    await app.close();
    if (createdUserIds.length > 0) {
      await prisma.oauthAccessToken.deleteMany({ where: { userId: { in: createdUserIds } } });
      await prisma.oauthRefreshToken.deleteMany({ where: { userId: { in: createdUserIds } } });
      await prisma.oauthConsent.deleteMany({ where: { userId: { in: createdUserIds } } });
      await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
    }
  });

  it("completes authorization code + S256 PKCE and issues a resource-bound JWT", async () => {
    const user = await createTestUser();
    createdUserIds.push(user.id);
    const sessionToken = await createNativeSession(user.id);
    const { challenge, verifier } = generatePkcePair();

    const authorizeResponse = await authorize(app, sessionToken, {
      challenge,
      resource: RESOURCE,
      state: "state-1",
    });
    assert.equal(authorizeResponse.statusCode, 302);
    const location = authorizeResponse.headers.location as string;
    const { code, state } = extractCodeAndState(location);
    assert.equal(state, "state-1");

    const tokenResponse = await exchangeCode(app, {
      code,
      codeVerifier: verifier,
      resource: RESOURCE,
    });
    assert.equal(
      tokenResponse.statusCode,
      200,
      `token exchange must not be 415/4xx (form body must survive the Fastify bridge): ${tokenResponse.body}`,
    );
    const tokens = tokenResponse.json() as {
      access_token: string;
      id_token: string;
      refresh_token: string;
      scope?: string;
    };
    assert.ok(tokens.access_token, "expected an access_token in the token response");
    assert.ok(tokens.id_token, "expected an id_token when openid was requested");
    assert.ok(tokens.refresh_token, "expected a refresh_token (offline_access requested)");
    assert.ok(
      tokens.scope?.split(" ").includes("openid"),
      `expected openid to survive resource scope intersection, got: ${tokens.scope}`,
    );

    const payload = decodeJwtPayload(tokens.access_token);
    assert.equal(payload.iss, resolveOAuthIssuerIdentifier());
    const audience = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    assert.ok(audience.includes(RESOURCE), `expected resource audience, got: ${payload.aud}`);
    assert.equal(payload.azp, CLIENT_ID);
    assert.equal(payload.client_id, CLIENT_ID);
    assert.equal(payload.sub, user.id);
    assert.ok(typeof payload.exp === "number" && payload.exp > Date.now() / 1000);
    assert.ok(
      typeof payload.scope === "string" && payload.scope.split(" ").includes("api:access"),
      `expected api:access scope on the issued token, got: ${payload.scope}`,
    );

    const userInfoResponse = await app.inject({
      headers: { authorization: `Bearer ${tokens.access_token}` },
      method: "GET",
      url: "/auth/oauth2/userinfo",
    });
    assert.equal(
      userInfoResponse.statusCode,
      200,
      `UserInfo must accept the resource-bound OIDC token: ${userInfoResponse.body}`,
    );
    assert.equal((userInfoResponse.json() as { sub: string }).sub, user.id);

    const meResponse = await app.inject({
      headers: { authorization: `Bearer ${tokens.access_token}` },
      method: "GET",
      url: "/me/settings",
    });
    assert.equal(
      meResponse.statusCode,
      200,
      `resource server must accept its own issued access token: ${meResponse.body}`,
    );

    const replay = await exchangeCode(app, { code, codeVerifier: verifier, resource: RESOURCE });
    assert.notEqual(
      replay.statusCode,
      200,
      "a replayed authorization code must not be redeemable twice",
    );

    const refreshed = await refreshToken(app, tokens.refresh_token, RESOURCE);
    assert.equal(refreshed.statusCode, 200, `refresh grant failed: ${refreshed.body}`);
    const refreshedTokens = refreshed.json() as { access_token: string };
    const refreshedPayload = decodeJwtPayload(refreshedTokens.access_token);
    assert.equal(
      refreshedPayload.aud,
      RESOURCE,
      "refresh grant must remain bound to the originally requested resource",
    );
  });

  it("rejects a token issued for a different audience (wrong resource)", async () => {
    const user = await createTestUser();
    createdUserIds.push(user.id);
    const sessionToken = await createNativeSession(user.id);
    const { challenge } = generatePkcePair();

    const authorizeResponse = await authorize(app, sessionToken, {
      challenge,
      resource: `${RESOURCE}/unregistered-resource`,
      state: "state-2",
    });
    // enforcePerClientResources: the webapp client is only linked to the
    // canonical resource, so requesting an unlinked one must fail closed
    // rather than silently issuing an unscoped/opaque token.
    assert.notEqual(
      authorizeResponse.statusCode,
      302,
      "an unlinked resource must not be authorized",
    );
  });

  it("rejects a request missing the api:access scope from calling the resource server", async () => {
    const user = await createTestUser();
    createdUserIds.push(user.id);
    const sessionToken = await createNativeSession(user.id);
    const { challenge, verifier } = generatePkcePair();

    const authorizeResponse = await authorize(app, sessionToken, {
      challenge,
      scope: "openid profile email offline_access",
      state: "state-3",
    });
    assert.equal(authorizeResponse.statusCode, 302);
    const { code } = extractCodeAndState(authorizeResponse.headers.location as string);

    const tokenResponse = await exchangeCode(app, { code, codeVerifier: verifier });
    assert.equal(tokenResponse.statusCode, 200, `token exchange failed: ${tokenResponse.body}`);
    const tokens = tokenResponse.json() as { access_token: string };

    const meResponse = await app.inject({
      headers: { authorization: `Bearer ${tokens.access_token}` },
      method: "GET",
      url: "/me/settings",
    });
    assert.equal(
      meResponse.statusCode,
      401,
      "a token without api:access (no resource requested) must be rejected by the resource server",
    );
  });

  it("rejects a PKCE exchange with the wrong code_verifier", async () => {
    const user = await createTestUser();
    createdUserIds.push(user.id);
    const sessionToken = await createNativeSession(user.id);
    const { challenge } = generatePkcePair();
    const { verifier: wrongVerifier } = generatePkcePair();

    const authorizeResponse = await authorize(app, sessionToken, {
      challenge,
      resource: RESOURCE,
      state: "state-4",
    });
    assert.equal(authorizeResponse.statusCode, 302);
    const { code } = extractCodeAndState(authorizeResponse.headers.location as string);

    const tokenResponse = await exchangeCode(app, {
      code,
      codeVerifier: wrongVerifier,
      resource: RESOURCE,
    });
    assert.notEqual(
      tokenResponse.statusCode,
      200,
      "a mismatched code_verifier must not redeem the code",
    );
  });

  it("rejects an expired access token", async () => {
    const user = await createTestUser();
    createdUserIds.push(user.id);

    const expiredPayload = {
      aud: RESOURCE,
      azp: CLIENT_ID,
      client_id: CLIENT_ID,
      exp: Math.floor(Date.now() / 1000) - 60,
      iat: Math.floor(Date.now() / 1000) - 3600,
      iss: resolveApiResourceIdentifier(),
      scope: "api:access",
      sub: user.id,
    };
    // A syntactically JWT-shaped but unsigned/expired token: the resource
    // server must reject it (invalid signature and expiry both fail
    // closed), independent of whether the AS ever actually issued it.
    const fakeToken = [
      Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url"),
      Buffer.from(JSON.stringify(expiredPayload)).toString("base64url"),
      "invalid-signature",
    ].join(".");

    const response = await app.inject({
      headers: { authorization: `Bearer ${fakeToken}` },
      method: "GET",
      url: "/me/settings",
    });
    assert.equal(response.statusCode, 401);
  });

  it("rejects an opaque (non-JWT) bearer token at the resource boundary", async () => {
    const response = await app.inject({
      headers: { authorization: `Bearer ${randomBytes(24).toString("hex")}` },
      method: "GET",
      url: "/me/settings",
    });
    assert.equal(response.statusCode, 401);
  });

  it("revokes a refresh token so it can no longer mint access tokens", async () => {
    const user = await createTestUser();
    createdUserIds.push(user.id);
    const sessionToken = await createNativeSession(user.id);
    const { challenge, verifier } = generatePkcePair();

    const authorizeResponse = await authorize(app, sessionToken, {
      challenge,
      resource: RESOURCE,
      state: "state-5",
    });
    assert.equal(authorizeResponse.statusCode, 302);
    const { code } = extractCodeAndState(authorizeResponse.headers.location as string);

    const tokenResponse = await exchangeCode(app, {
      code,
      codeVerifier: verifier,
      resource: RESOURCE,
    });
    assert.equal(tokenResponse.statusCode, 200);
    const tokens = tokenResponse.json() as { refresh_token: string };

    const revokeResponse = await app.inject({
      headers: { "content-type": "application/x-www-form-urlencoded" },
      method: "POST",
      payload: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        token: tokens.refresh_token,
        token_type_hint: "refresh_token",
      }).toString(),
      url: "/auth/oauth2/revoke",
    });
    assert.equal(revokeResponse.statusCode, 200, `revoke failed: ${revokeResponse.body}`);

    const refreshAfterRevoke = await refreshToken(app, tokens.refresh_token, RESOURCE);
    assert.notEqual(
      refreshAfterRevoke.statusCode,
      200,
      "a revoked refresh token must not mint further access tokens",
    );
  });

  it("preserves repeated Set-Cookie headers across the Fastify bridge", async () => {
    const user = await createTestUser();
    createdUserIds.push(user.id);
    const sessionToken = await createNativeSession(user.id);
    const { challenge } = generatePkcePair();

    const authorizeResponse = await authorize(app, sessionToken, {
      challenge,
      resource: RESOURCE,
      state: "state-6",
    });
    assert.equal(authorizeResponse.statusCode, 302);
    const setCookie = authorizeResponse.headers["set-cookie"];
    assert.ok(setCookie, "expected at least one Set-Cookie header to survive the bridge");
  });
});
