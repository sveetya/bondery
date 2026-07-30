import type { FastifyBaseLogger } from "fastify";
import { getBoss } from "./boss.js";
import { runEnrichQueueCleanup } from "./workers.js";

const ENRICH_CLEANUP_QUEUE = "enrich-queue-cleanup";
const HOURLY_REMINDER_QUEUE = "reminder-digest-hourly";

const JOB_QUEUES = [HOURLY_REMINDER_QUEUE, ENRICH_CLEANUP_QUEUE] as const;

/** pg-boss requires queues to exist before workers or schedules attach. */
export async function ensureJobQueues(): Promise<void> {
  const boss = getBoss();
  for (const queue of JOB_QUEUES) {
    await boss.createQueue(queue);
  }
}

export async function registerJobWorkers(log: FastifyBaseLogger): Promise<void> {
  const boss = getBoss();

  await boss.work(ENRICH_CLEANUP_QUEUE, async () => {
    log.info("Running enrich queue cleanup job");
    await runEnrichQueueCleanup(log);
  });
}

export async function registerJobSchedules(log: FastifyBaseLogger): Promise<void> {
  const boss = getBoss();

  // Hourly reminder digests (pg-boss replaces legacy pg_cron)
  await boss.schedule(HOURLY_REMINDER_QUEUE, "0 * * * *", {}, { tz: "UTC" });

  // Nightly enrich-queue cleanup at 02:30 UTC
  await boss.schedule(ENRICH_CLEANUP_QUEUE, "30 2 * * *", {}, { tz: "UTC" });

  log.info({ queues: [...JOB_QUEUES] }, "pg-boss schedules registered");
}
