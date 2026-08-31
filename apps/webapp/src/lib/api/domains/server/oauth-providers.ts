import "server-only";

import { parseOAuthProvidersResponse } from "@bondery/helpers/auth/oauth-providers";
import { API_ROUTES } from "@bondery/helpers/globals/paths";
import type { OAuthProvidersBitmap } from "@bondery/schemas/oauth-providers";
import { serverApiJsonOrNull } from "@/lib/api/server";

/**
 * RSC/prefetch: fail-open (null) on network/5xx so hosted GitHub stays enabled.
 * `revalidate: 60` matches API `Cache-Control: max-age=60`. Next caches 2xx
 * across visitors; misses stay uncached so a blip cannot stick as "all on".
 */
export async function getOAuthProvidersServer(): Promise<OAuthProvidersBitmap | null> {
  const raw = await serverApiJsonOrNull<unknown>(API_ROUTES.OAUTH_PROVIDERS, undefined, {
    next: { revalidate: 60 },
    transportPolicy: false,
  });
  return parseOAuthProvidersResponse(raw);
}
