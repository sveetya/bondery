"use client";

import { useQuery } from "@tanstack/react-query";
import { getOAuthProviders } from "@/lib/api/domains/oauth-providers";
import { settingsKeys } from "@/lib/query/keys";

const OAUTH_PROVIDERS_STALE_TIME_MS = 60_000;

export function useOAuthProvidersQuery() {
  return useQuery({
    queryFn: getOAuthProviders,
    queryKey: settingsKeys.oauthProviders(),
    refetchOnWindowFocus: false,
    staleTime: OAUTH_PROVIDERS_STALE_TIME_MS,
  });
}
