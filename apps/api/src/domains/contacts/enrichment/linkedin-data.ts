import type { ScrapedWorkHistoryEntry } from "@bondery/schemas";
import { internal } from "../../../lib/platform/errors/http-errors.js";
import { type DomainContext, DomainError } from "../../_shared/context.js";
import { domainDb } from "../../_shared/domain-db.js";

export async function upsertLinkedInWorkHistory(
  ctx: DomainContext,
  personId: string,
  workHistory: ScrapedWorkHistoryEntry[],
): Promise<{ success: true; count: number }> {
  const { user, log } = ctx;
  const db = domainDb(ctx);

  log?.info(
    { personId, userId: user.id, workHistory, workHistoryCount: workHistory.length },
    "[linkedin-data] POST received",
  );

  const person = await db.people.findFirst({
    select: { id: true },
    where: { id: personId, userId: user.id },
  });

  if (!person) {
    throw new DomainError("Contact not found", 404, "contact_not_found");
  }

  const linkedinRow = await db.peopleLinkedin.upsert({
    create: {
      personId,
      userId: user.id,
    },
    update: {
      updatedAt: new Date(),
    },
    where: {
      personId,
    },
  });

  await db.peopleWorkHistory.deleteMany({
    where: { peopleLinkedinId: linkedinRow.id, userId: user.id },
  });

  if (workHistory.length > 0) {
    const rows = workHistory.map((entry) => ({
      companyLinkedinId: entry.companyLinkedinId ?? null,
      companyName: entry.companyName,
      employmentType: entry.employmentType ?? null,
      endDate: entry.endDate ? new Date(entry.endDate) : null,
      location: entry.location ?? null,
      peopleLinkedinId: linkedinRow.id,
      startDate: entry.startDate ? new Date(entry.startDate) : null,
      title: entry.title ?? null,
      userId: user.id,
    }));

    log?.info({ rows }, "[linkedin-data] Inserting rows");

    try {
      await db.peopleWorkHistory.createMany({ data: rows });
    } catch (insertError) {
      log?.error({ insertError }, "[linkedin-data] Insert failed");
      throw internal(
        "contact_enrich_failed",
        insertError instanceof Error ? insertError.message : "contact_enrich_failed",
      );
    }
  }

  log?.info({ count: workHistory.length, personId }, "[linkedin-data] Upsert complete");
  return { count: workHistory.length, success: true };
}
