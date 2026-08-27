import type { QueryClient } from "@tanstack/react-query";
import { getMergeRecommendationsServer } from "@/lib/api/domains/server/mergeRecommendations";
import type { MergeRecommendationsParams } from "@/lib/api/resources/mergeRecommendations";
import { fetchQueryOrThrow } from "@/lib/query/fetchQueryOrThrow";
import { mergeRecommendationKeys } from "@/lib/query/keys";

export async function prefetchMergeRecommendations(
  queryClient: QueryClient,
  params?: MergeRecommendationsParams,
): Promise<void> {
  await queryClient.prefetchQuery({
    queryFn: () => getMergeRecommendationsServer(params),
    queryKey: mergeRecommendationKeys.list(params ?? {}),
  });
}

export async function fetchMergeRecommendations(
  queryClient: QueryClient,
  params?: MergeRecommendationsParams,
): Promise<void> {
  await fetchQueryOrThrow(queryClient, mergeRecommendationKeys.list(params ?? {}), () =>
    getMergeRecommendationsServer(params),
  );
}
