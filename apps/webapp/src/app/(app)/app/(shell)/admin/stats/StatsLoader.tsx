import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { isForbiddenApiError } from "@/lib/api/forbidden";
import { getQueryClient } from "@/lib/query/client";
import { fetchAdminStatsDashboard } from "@/lib/query/prefetch";

import { StatsClient, StatsForbiddenState } from "./StatsClient";

export async function StatsLoader() {
  const queryClient = getQueryClient();

  try {
    await fetchAdminStatsDashboard(queryClient);
  } catch (error) {
    if (isForbiddenApiError(error)) {
      return <StatsForbiddenState />;
    }
    throw error;
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <StatsClient />
    </HydrationBoundary>
  );
}
