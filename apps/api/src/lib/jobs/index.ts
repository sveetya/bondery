import type { FastifyBaseLogger } from "fastify";
import { startBoss, stopBoss } from "./boss.js";
import { ensureJobQueues, registerJobSchedules, registerJobWorkers } from "./schedules.js";

export async function startJobs(log: FastifyBaseLogger): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    log.warn("DATABASE_URL not set — pg-boss jobs disabled");
    return;
  }

  const boss = await startBoss();
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
