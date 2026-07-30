/**
 * Production server factory: buildApp + runtime lifecycle (auth verify, sync wake).
 */

import { buildApp } from "./build-app.js";
import { registerAuthRoutes } from "./lib/auth/routes.js";
import { shutdownRedis } from "./lib/data/redis.js";
import { stopJobs } from "./lib/jobs/index.js";
import { shutdownEmailTransporter } from "./lib/notifications/transporter.js";
import type { AppFastifyInstance } from "./lib/platform/fastify-types.js";
import { initializeRuntime } from "./lib/platform/init-runtime.js";
import { registerNotFoundRateLimit, registerRateLimit } from "./lib/platform/rate-limit.js";
import { shutdownSyncWakeRuntime } from "./lib/sync/wake/index.js";
import { registerReminderDigestJob } from "./services/notifications/register-reminder-job.js";

export async function buildServer(): Promise<AppFastifyInstance> {
  const fastify = await buildApp();

  const deps = await initializeRuntime(fastify);
  await registerRateLimit(fastify, deps.redis.commands);
  registerNotFoundRateLimit(fastify);

  await registerAuthRoutes(fastify);

  fastify.addHook("onReady", async () => {
    await registerReminderDigestJob(fastify.log);
  });

  fastify.addHook("onClose", async () => {
    await stopJobs();
    // After workers drain — reminder digest may be mid-send.
    await shutdownEmailTransporter();
    await shutdownSyncWakeRuntime();
    await shutdownRedis();
  });

  return fastify;
}
