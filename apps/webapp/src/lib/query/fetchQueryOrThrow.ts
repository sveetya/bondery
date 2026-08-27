import type {
  FetchInfiniteQueryOptions,
  InfiniteData,
  QueryClient,
  QueryFunction,
  QueryKey,
} from "@tanstack/react-query";

/** Like prefetchQuery, but rejects so RSC loaders can hit `(shell)/error.tsx`. */
export function fetchQueryOrThrow<T>(
  queryClient: QueryClient,
  queryKey: QueryKey,
  queryFn: QueryFunction<T>,
): Promise<T> {
  return queryClient.fetchQuery({ queryFn, queryKey });
}

/** Like prefetchInfiniteQuery, but rejects so RSC loaders can hit `(shell)/error.tsx`. */
export function fetchInfiniteQueryOrThrow<TQueryFnData, TPageParam>(
  queryClient: QueryClient,
  options: FetchInfiniteQueryOptions<TQueryFnData, Error, TQueryFnData, QueryKey, TPageParam>,
): Promise<InfiniteData<TQueryFnData, TPageParam>> {
  return queryClient.fetchInfiniteQuery(options);
}
