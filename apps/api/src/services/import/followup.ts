import type { DomainContext } from "../../domains/_shared/context.js";
import { domainDb } from "../../domains/_shared/domain-db.js";
import { internal } from "../../lib/platform/errors/http-errors.js";
import { maybeCaptureActivation } from "../../services/analytics/maybe-capture-activation.js";

export async function markBulkImportCompleted(ctx: DomainContext): Promise<void> {
  const { user } = ctx;
  const db = domainDb(ctx);

  const before = await db.userSettings.findUnique({
    select: { importCompletedAt: true },
    where: { userId: user.id },
  });

  try {
    await db.userSettings.update({
      data: {
        importCompletedAt: new Date(),
        importFollowupPlatform: null,
        importFollowupStatus: null,
      },
      where: { userId: user.id },
    });
  } catch (error) {
    throw internal("import_failed", error instanceof Error ? error.message : "import_failed");
  }

  if (!before?.importCompletedAt) {
    try {
      await maybeCaptureActivation(ctx, "first_import");
    } catch {
      // Analytics must not block the import after writes succeed.
    }
  }
}
