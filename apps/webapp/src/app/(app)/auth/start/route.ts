import { NextResponse } from "next/server";
import { OAUTH_FLOW_COOKIE } from "@/lib/auth/constants";
import {
  buildAuthorizeUrl,
  encryptOAuthFlow,
  generateCodeChallenge,
  generateCodeVerifier,
  generateOAuthState,
  oauthFlowCookieOptions,
} from "@/lib/auth/oauthClient.server";
import { parseReturnIntent } from "@/lib/auth/returnIntent";

/**
 * Hop 1 of the webapp OAuth-BFF login: mint PKCE/state, persist them in an
 * encrypted cookie, and redirect to the API authorization server.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const redirectTo = parseReturnIntent(requestUrl.searchParams);
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = generateOAuthState();
  const redirectUri = `${requestUrl.origin}/auth/oauth-callback`;

  const flowCookie = await encryptOAuthFlow({
    codeVerifier,
    redirectTo,
    state,
  });

  const response = NextResponse.redirect(
    buildAuthorizeUrl({
      codeChallenge,
      redirectUri,
      state,
    }),
  );

  response.cookies.set(
    OAUTH_FLOW_COOKIE,
    flowCookie,
    oauthFlowCookieOptions(requestUrl.protocol === "https:"),
  );

  return response;
}
