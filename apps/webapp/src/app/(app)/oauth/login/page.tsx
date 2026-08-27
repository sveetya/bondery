import { Suspense } from "react";
import { getLastUsedLoginMethodCookie } from "@/lib/auth/getLastUsedLoginMethodCookie";
import { OAuthLoginClient } from "./OAuthLoginClient";

/**
 * Authorization-server login continuation — configured as
 * `oauthProvider.loginPage` in apps/api/src/lib/auth/index.ts.
 *
 * Reached only when the API's `/oauth2/authorize` endpoint has no native
 * Better Auth session (e.g. the Chrome extension's first sign-in, or a
 * stale/expired native session on a reload of `/oauth/consent`). This page
 * intentionally has NO server-side session gate: it must never redirect
 * based on the webapp's own independent OAuth-BFF session
 * (`resolveServerSession()`) — that cookie proves nothing about the
 * authorization-server session this page exists to (re)establish, and
 * gating on it previously caused a redirect loop with `/oauth/consent`.
 */
export default async function OAuthLoginPage() {
  const lastUsedLoginMethod = await getLastUsedLoginMethodCookie();

  return (
    <Suspense fallback={null}>
      <OAuthLoginClient lastUsedLoginMethod={lastUsedLoginMethod} />
    </Suspense>
  );
}
