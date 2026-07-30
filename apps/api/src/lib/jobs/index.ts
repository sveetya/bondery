import type { FastifyBaseLogger } from "fastify";

import { getDatabaseUrl, requireDatabaseUrl } from "../data/database-url.js";
import { shouldSkipLiveRuntimeVerify } from "../platform/runtime-env.js";
import { startBoss, stopBoss } from "./boss.js";
import { ensureJobQueues, registerJobSchedules, registerJobWorkers } from "./schedules.js";

export async function startJobs(log: FastifyBaseLogger, databaseUrl?: string): Promise<void> {
  const url = (databaseUrl ?? getDatabaseUrl())?.trim();
  if (!url) {
    if (shouldSkipLiveRuntimeVerify()) {
      log.info("DATABASE_URL not set — pg-boss jobs disabled in test");
      return;
    }

    requireDatabaseUrl();
  }

  const boss = await startBoss(url ?? requireDatabaseUrl());
  boss.on("error", (error) => {
    log.error({ err: error }, "pg-boss error");
  });

  await ensureJobQueues();
  await registerJobSchedules(log);
  await registerJobWorkers(log);
  log.info("pg-boss jobs started");
}

export async function stopJobs(): Promise<void> {
  await stopBoss();
}
