import { NextResponse } from "next/server";
import { WEBAPP_SESSION_COOKIE } from "@/lib/auth/constants";

/**
 * Clears the webapp's own session cookie. Does not end Better Auth's native
 * session — the browser calls `authClient.signOut()` directly for that (see
 * endSession.ts). The `oauth-provider` plugin has no token-revocation
 * endpoint, so the issued refresh/access token remains valid on the AS until
 * its natural expiry (same limitation mobile and the extension already have).
 */
export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(WEBAPP_SESSION_COOKIE, "", { maxAge: 0, path: "/" });
  return response;
}
