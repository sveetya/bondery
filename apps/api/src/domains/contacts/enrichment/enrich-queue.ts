import {
  getLinkedinEnrichEligibleCountWithDb,
  getLinkedinEnrichEligibleWithDb,
} from "../../../lib/data/contact-rpc.js";
import { internal } from "../../../lib/platform/errors/http-errors.js";
import { type DomainContext, DomainError } from "../../_shared/context.js";
import { domainDb } from "../../_shared/domain-db.js";

export async function getEnrichQueueEligibleCount(
  ctx: DomainContext,
): Promise<{ eligibleCount: number }> {
  const { user } = ctx;
  const db = domainDb(ctx);

  try {
    const eligibleCount = await getLinkedinEnrichEligibleCountWithDb(db, user.id);
    return { eligibleCount };
  } catch (error) {
    throw internal(
      "contact_enrich_failed",
      error instanceof Error ? error.message : "contact_enrich_failed",
    );
  }
}

export async function initEnrichQueue(
  ctx: DomainContext,
  personId?: string,
): Promise<{ totalEligible: number }> {
  const { user } = ctx;
  const db = domainDb(ctx);

  await db.linkedinEnrichQueue.deleteMany({
    where: { userId: user.id },
  });

  if (personId) {
    const person = await db.people.findFirst({
      select: { id: true },
      where: { id: personId, userId: user.id },
    });

    if (!person) {
      throw new DomainError("Contact not found", 404, "contact_not_found");
    }

    try {
      await db.linkedinEnrichQueue.create({
        data: {
          personId,
          status: "pending",
          userId: user.id,
        },
      });
    } catch (error) {
      throw internal(
        "contact_enrich_failed",
        error instanceof Error ? error.message : "contact_enrich_failed",
      );
    }

    return { totalEligible: 1 };
  }

  let eligible: Awaited<ReturnType<typeof getLinkedinEnrichEligibleWithDb>>;
  try {
    eligible = await getLinkedinEnrichEligibleWithDb(db, user.id, 25);
  } catch (error) {
    throw internal(
      "contact_enrich_failed",
      error instanceof Error ? error.message : "contact_enrich_failed",
    );
  }

  const totalEligible = eligible.length;

  if (totalEligible === 0) {
    return { totalEligible: 0 };
  }

  try {
    await db.linkedinEnrichQueue.createMany({
      data: eligible.map((row) => ({
        personId: row.person_id,
        status: "pending",
        userId: user.id,
      })),
    });
  } catch (error) {
    throw internal(
      "contact_enrich_failed",
      error instanceof Error ? error.message : "contact_enrich_failed",
    );
  }

  return { totalEligible };
}

export async function updateEnrichQueueItem(
  ctx: DomainContext,
  queueItemId: string,
  status: "completed" | "failed",
  errorMessage?: string | null,
): Promise<{ success: true }> {
  const { user } = ctx;
  const db = domainDb(ctx);

  const updated = await db.linkedinEnrichQueue.updateMany({
    data: {
      errorMessage: errorMessage ?? null,
      status,
    },
    where: { id: queueItemId, userId: user.id },
  });

  if (updated.count === 0) {
    throw internal("contact_enrich_failed", "Queue item not found");
  }

  return { success: true };
}

export async function cancelEnrichQueue(ctx: DomainContext): Promise<{ success: true }> {
  const { user } = ctx;
  const db = domainDb(ctx);

  try {
    await db.linkedinEnrichQueue.deleteMany({
      where: { userId: user.id },
    });
  } catch (error) {
    throw internal(
      "contact_enrich_failed",
      error instanceof Error ? error.message : "contact_enrich_failed",
    );
  }

  return { success: true };
}
