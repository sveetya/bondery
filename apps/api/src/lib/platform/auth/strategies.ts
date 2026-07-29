/**
 * Authentication strategies for @fastify/auth
 *
 * Provides composable auth strategies that run as onRequest hooks,
 * rejecting unauthorized requests before the body is parsed.
 *
 * Usage in route modules:
 *   fastify.addHook('onRequest', fastify.auth([fastify.verifySession]));
 *
 * Then in handlers:
 *   const { client, user } = getAuth(request);
 */

import { prisma } from "@bondery/db";
import { betterAuthPath } from "@bondery/helpers/globals/paths";
import type { ApiKeyPermission } from "@bondery/schemas";
import type { Database } from "@bondery/schemas/supabase.types";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { FastifyReply, FastifyRequest } from "fastify";
import { productPermissionFromBa } from "../../auth/api-key-permissions.js";
import { auth } from "../../auth/index.js";
import { isPlatformAdmin } from "../../auth/is-platform-admin.js";
import { forbidden, unauthorized } from "../errors/http-errors.js";
import type { AppFastifyInstance } from "../fastify-types.js";
import { assertApiKeyAccess } from "./api-key-access.js";
import { isApiKeyBearerToken } from "./api-keys.js";
import {
  createDomainDataClient,
  resolveOAuthBearerUser,
  resolveRequestAuthUser,
} from "./resolve-request-auth.js";

// ── Type augmentation ────────────────────────────────────────────────────────

declare module "fastify" {
  interface FastifyRequest {
    /** Set when the request was authenticated via a long-lived API key */
    authApiKey: {
      id: string;
      permission: ApiKeyPermission;
      label: string;
    } | null;
    /** Supabase data client — set by verifySession / verifyAuth strategies */
    authClient: SupabaseClient<Database> | null;
    /** Authenticated user — set by verifySession / verifyAuth strategies */
    authUser: { id: string; email: string } | null;
  }

  interface FastifyInstance {
    /** Enforces API key route allowlist and permission for key-authenticated requests */
    assertApiKeyAccess: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    /** Validates session + Better Auth platform admin role */
    verifyAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    /** Validates session or long-lived API key */
    verifyAuth: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    /** Validates service role key via Authorization: Bearer header for server-to-server calls */
    verifyServiceSecret: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    /** Validates Better Auth session or OAuth resource JWT */
    verifySession: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

function extractBearerToken(request: FastifyRequest): string | undefined {
  const authHeader = request.headers.authorization;
  if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
    return undefined;
  }

  return authHeader.slice(7).trim() || undefined;
}

function isJwtShapedBearerToken(token: string): boolean {
  return token.split(".").length === 3;
}

async function applyResolvedAuth(
  request: FastifyRequest,
  user: { id: string; email: string },
  apiKey: FastifyRequest["authApiKey"] = null,
): Promise<void> {
  request.authUser = user;
  request.authClient = createDomainDataClient();
  request.authApiKey = apiKey;
}

// ── Strategy registration ────────────────────────────────────────────────────

/**
 * Registers auth strategy decorators on the Fastify instance.
 * Must be called after @fastify/env (needs config) and before route registration.
 */
export function registerAuthStrategies(fastify: AppFastifyInstance): void {
  fastify.decorateRequest("authUser", null);
  fastify.decorateRequest("authClient", null);
  fastify.decorateRequest("authApiKey", null);

  fastify.decorate(
    "verifySession",
    async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
      const bearerToken = extractBearerToken(request);
      const user =
        bearerToken && isJwtShapedBearerToken(bearerToken)
          ? await resolveOAuthBearerUser(bearerToken)
          : await resolveRequestAuthUser(request);

      if (!user) {
        throw unauthorized("Unauthorized - Please log in", "auth_required");
      }

      await applyResolvedAuth(request, user);
    },
  );

  fastify.decorate(
    "verifyAuth",
    async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
      const bearerToken = extractBearerToken(request);

      if (bearerToken && isApiKeyBearerToken(bearerToken)) {
        const verification = await auth.api.verifyApiKey({
          body: { key: bearerToken },
        });

        if (!verification.valid || !verification.key) {
          throw unauthorized("Invalid API key", "invalid_api_key");
        }

        const userId = verification.key.referenceId;
        const permission = productPermissionFromBa(verification.key.permissions);

        const keyUser = await prisma.user.findUnique({
          select: { email: true, id: true },
          where: { id: userId },
        });

        if (!keyUser?.email) {
          throw unauthorized("Invalid API key", "invalid_api_key");
        }

        await applyResolvedAuth(
          request,
          { email: keyUser.email, id: keyUser.id },
          {
            id: verification.key.id,
            label: verification.key.name ?? "",
            permission,
          },
        );
        return;
      }

      const resolvedUser = await resolveRequestAuthUser(request);
      if (!resolvedUser) {
        throw unauthorized("Unauthorized - Please log in", "auth_required");
      }

      await applyResolvedAuth(request, resolvedUser);
    },
  );

  fastify.decorate(
    "assertApiKeyAccess",
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      assertApiKeyAccess(request, reply);
    },
  );

  const verifiedServiceTokens = new Set<string>();

  fastify.decorate(
    "verifyServiceSecret",
    async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
      const authHeader = request.headers.authorization;
      if (typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
        request.log.warn(
          { reason: "missing or malformed Authorization header", url: request.url },
          "verifyServiceSecret: rejected",
        );
        throw unauthorized("Unauthorized", "service_auth_required");
      }

      const token = authHeader.slice(7);
      if (isApiKeyBearerToken(token)) {
        request.log.warn(
          { reason: "API key sent to service-secret route", url: request.url },
          "verifyServiceSecret: rejected",
        );
        throw unauthorized("Unauthorized", "service_auth_invalid");
      }
      if (verifiedServiceTokens.has(token)) {
        return;
      }

      const client = createClient(fastify.config.BONDERY_PUBLIC_SUPABASE_URL, token, {
        auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
      });

      const { error } = await client.auth.admin.listUsers({ page: 1, perPage: 1 });
      if (error) {
        request.log.warn(
          {
            reason: "GoTrue admin call rejected token",
            supabaseError: error.message,
            url: request.url,
          },
          "verifyServiceSecret: rejected",
        );
        throw unauthorized("Unauthorized", "service_auth_invalid");
      }

      verifiedServiceTokens.add(token);
    },
  );

  fastify.decorate(
    "verifyAdmin",
    async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      await fastify.verifySession(request, reply);

      const { user } = getAuth(request);

      if (!(await isPlatformAdmin(user.id))) {
        throw forbidden("Forbidden - Admin access required", "admin_required");
      }
    },
  );
}

/**
 * Verifies Better Auth JWKS is reachable at startup.
 */
export async function verifyAuthAtStartup(fastify: AppFastifyInstance): Promise<void> {
  const baseUrl = fastify.config.BONDERY_PUBLIC_API_URL.replace(/\/+$/, "");
  const jwksUrl = `${baseUrl}${betterAuthPath("/jwks")}`;

  try {
    const response = await fetch(jwksUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    fastify.log.error({ err: error, jwksUrl }, "Better Auth JWKS is not reachable");
    throw new Error(`Better Auth JWKS is not reachable at ${jwksUrl}`);
  }

  fastify.log.info({ jwksUrl }, "Better Auth JWKS reachable");
}

// ── Helper for handlers ──────────────────────────────────────────────────────

/**
 * Retrieve the authenticated user and data client from the request.
 * Only call this inside handlers protected by verifySession.
 */
export function getAuth(request: FastifyRequest): {
  user: { id: string; email: string };
  client: SupabaseClient<Database>;
} {
  const client = request.authClient;
  const user = request.authUser;
  if (!client || !user) {
    throw new Error("getAuth called without verifySession");
  }

  return { client, user };
}
