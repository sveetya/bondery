import type { DomainContext } from "../../domains/_shared/context.js";
import { domainDb } from "../../domains/_shared/domain-db.js";
import { internal } from "../../lib/platform/errors/http-errors.js";

export async function markBulkImportCompleted(ctx: DomainContext): Promise<void> {
  const { user } = ctx;
  const db = domainDb(ctx);

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
}
