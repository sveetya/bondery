/**
 * Production server factory: buildApp + runtime lifecycle (auth verify, sync wake).
 */

import { buildApp } from "./build-app.js";
import { registerAuthRoutes } from "./lib/auth/routes.js";
import { shutdownRedis } from "./lib/data/redis.js";
import type { AppFastifyInstance } from "./lib/platform/fastify-types.js";
import { initSyncWakeRuntime, shutdownSyncWakeRuntime } from "./lib/sync/wake/index.js";

export async function buildServer(): Promise<AppFastifyInstance> {
  const fastify = await buildApp();

  await registerAuthRoutes(fastify);

  fastify.addHook("onReady", async () => {
    await initSyncWakeRuntime(fastify.log);
  });

  fastify.addHook("onClose", async () => {
    await shutdownSyncWakeRuntime();
    await shutdownRedis();
  });

  return fastify;
}
