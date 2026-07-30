import type { FastifyBaseLogger } from "fastify";
import { getBoss } from "../../lib/jobs/boss.js";
import { runReminderDigestDispatch } from "./reminder-dispatch.js";

export const HOURLY_REMINDER_QUEUE = "reminder-digest-hourly";

export async function registerReminderDigestJob(log: FastifyBaseLogger): Promise<void> {
  const boss = getBoss();

  await boss.work(HOURLY_REMINDER_QUEUE, async () => {
    log.info("Running hourly reminder digest job");
    const result = await runReminderDigestDispatch();
    log.info(result, "Hourly reminder digest complete");
  });
}
