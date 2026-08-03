import { captureEvent } from "./client";

export type ImportSource = "linkedin" | "instagram" | "vcard";

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
