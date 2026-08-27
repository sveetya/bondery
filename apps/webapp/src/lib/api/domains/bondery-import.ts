import { API_ROUTES } from "@bondery/helpers/globals/paths";
import type { ImportResultResponse } from "@bondery/schemas";
import { clientApiJson } from "@/lib/api/client";

export async function importBonderyExportZip(
  formData: FormData,
  init?: RequestInit,
): Promise<ImportResultResponse> {
  return clientApiJson<ImportResultResponse>(API_ROUTES.ME_IMPORT, {
    ...init,
    body: formData,
    method: "POST",
  });
}
