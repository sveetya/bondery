import type { ImportResult } from "@bondery/schemas";
import { parseBonderyExportZip } from "../../lib/import/parse-bondery-export-zip.js";
import { internal } from "../../lib/platform/errors/http-errors.js";
import { captureProductEvent } from "../../services/analytics/posthog-capture.js";
import { type DomainContext, DomainError } from "../_shared/context.js";
import { applyParsedImport } from "./import-apply.js";

export async function applyBonderyImport(
  ctx: DomainContext,
  zipBuffer: Buffer,
): Promise<{ importResult: ImportResult }> {
  const parsed = parseBonderyExportZip(zipBuffer, { log: ctx.log });

  let importResult: ImportResult;
  try {
    importResult = await applyParsedImport(ctx, parsed);
  } catch (error) {
    if (error instanceof DomainError && error.code === "import_bondery_invalid") {
      throw error;
    }
    ctx.log?.error({ err: error }, "Failed to apply Bondery export import");
    throw internal("import_bondery_failed", error);
  }

  try {
    await captureProductEvent(ctx, "account_settings:import_generate", {
      groups_count: parsed.groups.length,
      interactions_count: parsed.interactions.length,
      is_empty:
        parsed.people.length === 0 &&
        parsed.groups.length === 0 &&
        parsed.tags.length === 0 &&
        parsed.interactions.length === 0,
      people_count: parsed.people.length,
      tags_count: parsed.tags.length,
    });
  } catch {
    // Analytics must not block the import after writes succeed.
  }

  return { importResult };
}
