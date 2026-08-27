import type { QueryClient } from "@tanstack/react-query";
import { getAdminStatsDashboardServer } from "@/lib/api/domains/server/stats";
import { fetchQueryOrThrow } from "@/lib/query/fetchQueryOrThrow";
import { statsKeys } from "@/lib/query/keys";

export async function prefetchAdminStatsDashboard(queryClient: QueryClient): Promise<void> {
  await queryClient.prefetchQuery({
    queryFn: () => getAdminStatsDashboardServer(),
    queryKey: statsKeys.dashboard(),
  });
}

export async function fetchAdminStatsDashboard(queryClient: QueryClient): Promise<void> {
  await fetchQueryOrThrow(queryClient, statsKeys.dashboard(), () => getAdminStatsDashboardServer());
}
