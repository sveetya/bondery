import { parseOAuthProvidersResponse } from "@bondery/helpers/auth/oauth-providers";
import { API_ROUTES } from "@bondery/helpers/globals/paths";
import type { OAuthProvidersBitmap } from "@bondery/schemas/oauth-providers";
import { clientApiJsonOrNull } from "@/lib/api/client";

export async function getOAuthProviders(): Promise<OAuthProvidersBitmap | null> {
  const raw = await clientApiJsonOrNull<unknown>(API_ROUTES.OAUTH_PROVIDERS);
  return parseOAuthProvidersResponse(raw);
}
