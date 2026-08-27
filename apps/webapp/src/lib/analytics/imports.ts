import { captureEvent } from "./client";

export type ImportSource = "bondery_export" | "instagram" | "linkedin" | "vcard";

export function captureImportComplete(
  importSource: ImportSource,
  itemCount: number,
  isFirstImport: boolean,
): void {
  captureEvent("imports:import_complete", {
    import_source: importSource,
    is_first_import: isFirstImport,
    item_count: itemCount,
  });
}
