import type { KeepInTouchCountResponse } from "@bondery/schemas";
import { getKeepInTouchOverdueCount as queryKeepInTouchOverdueCount } from "../../lib/data/keep-in-touch.js";
import { internal } from "../../lib/platform/errors/http-errors.js";
import type { DomainContext } from "../_shared/context.js";
import { domainDb } from "../_shared/domain-db.js";

export async function getKeepInTouchOverdueCount(
  ctx: DomainContext,
): Promise<KeepInTouchCountResponse> {
  const db = domainDb(ctx);

  try {
    const overdueCount = await queryKeepInTouchOverdueCount(db, ctx.user.id);
    return { overdueCount };
  } catch (error) {
    throw internal(
      "internal_server_error",
      error instanceof Error ? error.message : "Failed to count overdue contacts",
    );
  }
}
