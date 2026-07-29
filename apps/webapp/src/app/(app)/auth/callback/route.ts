import { WEBAPP_ROUTES } from "@bondery/helpers/globals/paths";
import { NextResponse } from "next/server";
import { buildWebappRuntimeConfigFromEnv, getWebappPublicOrigin } from "@/lib/platform/runtimeConfig.server";
import { RETURN_INTENT_PARAM, parseReturnIntent } from "@/lib/auth/returnIntent";

/**
 * Legacy Supabase OAuth callback URL — redirects into the Better Auth BFF start hop.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const cfg = buildWebappRuntimeConfigFromEnv();
  const webappOrigin = getWebappPublicOrigin(cfg);
  const redirectTo = parseReturnIntent(requestUrl.searchParams);
  const startUrl = new URL(`${webappOrigin}/auth/start`);

  if (redirectTo) {
    startUrl.searchParams.set(RETURN_INTENT_PARAM, redirectTo);
  }

  if (requestUrl.searchParams.get("error")) {
    return NextResponse.redirect(`${webappOrigin}${WEBAPP_ROUTES.LOGIN}?error=oauth`);
  }

  return NextResponse.redirect(startUrl);
}
