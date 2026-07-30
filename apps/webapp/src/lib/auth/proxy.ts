import { WEBAPP_ROUTES } from "@bondery/helpers/globals/paths";
import { type NextRequest, NextResponse } from "next/server";
import { BYPASS_ONBOARDING_ONCE_COOKIE, WEBAPP_SESSION_COOKIE } from "@/lib/auth/constants";
import {
  decryptWebappSession,
  encryptWebappSession,
  refreshSessionPayload,
  webappSessionCookieOptions,
} from "@/lib/auth/oauthClient.server";

const REFRESH_BUFFER_SECONDS = 5 * 60;

/**
 * Refreshes the webapp's own session state for the current request.
 *
 * Route protection for /app/* is handled in app/layout.tsx (single gate).
 * This layer refreshes a near-expiry access token before Server Components
 * render — App Router forbids setting cookies during RSC render, so token
 * refresh has to happen here — and applies benign redirects.
 */
export async function updateSession(request: NextRequest, requestHeaders?: Headers) {
  const cookieValue = request.cookies.get(WEBAPP_SESSION_COOKIE)?.value;
  let session = cookieValue ? await decryptWebappSession(cookieValue) : null;
  let refreshedCookie: string | null = null;
  let sessionExpired = false;

  if (session) {
    const now = Math.floor(Date.now() / 1000);
    if (session.accessTokenExpiresAt <= now + REFRESH_BUFFER_SECONDS) {
      const refreshed = await refreshSessionPayload(session);
      if (refreshed) {
        session = refreshed;
        refreshedCookie = await encryptWebappSession(refreshed);
      } else {
        session = null;
        sessionExpired = true;
      }
    }
  }

  const response =
    session && request.nextUrl.pathname === WEBAPP_ROUTES.APP_GROUP
      ? NextResponse.redirect(new URL(WEBAPP_ROUTES.DEFAULT_PAGE_AFTER_LOGIN, request.nextUrl))
      : NextResponse.next({
          request: requestHeaders
            ? {
                headers: requestHeaders,
              }
            : request,
        });

  if (refreshedCookie) {
    response.cookies.set(
      WEBAPP_SESSION_COOKIE,
      refreshedCookie,
      webappSessionCookieOptions(request.nextUrl.protocol === "https:"),
    );
  } else if (sessionExpired) {
    response.cookies.set(WEBAPP_SESSION_COOKIE, "", { maxAge: 0, path: "/" });
  }

  if (
    request.cookies.get(BYPASS_ONBOARDING_ONCE_COOKIE)?.value === "1" &&
    request.nextUrl.pathname.startsWith(WEBAPP_ROUTES.APP_GROUP)
  ) {
    response.cookies.set(BYPASS_ONBOARDING_ONCE_COOKIE, "", { maxAge: 0, path: "/app" });
  }

  return response;
}
