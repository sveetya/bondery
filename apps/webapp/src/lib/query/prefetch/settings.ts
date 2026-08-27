import type { QueryClient } from "@tanstack/react-query";
import { getSettingsServer, probeSettingsServer } from "@/lib/api/domains/server/settings";
import { fetchQueryOrThrow } from "@/lib/query/fetchQueryOrThrow";
import { settingsKeys } from "@/lib/query/keys";

/** Prefetch settings only on a real success. Hop-down stays on the URL with no fake cache. */
export async function prefetchSettings(queryClient: QueryClient): Promise<void> {
  const result = await probeSettingsServer();
  if (result.status === "ok") {
    queryClient.setQueryData(settingsKeys.me(), result.queryData);
  }
}

/** Page-defining settings read — throws so hop-down hits `(shell)/error.tsx`. */
export async function fetchSettings(queryClient: QueryClient): Promise<void> {
  await fetchQueryOrThrow(queryClient, settingsKeys.me(), () => getSettingsServer());
}
