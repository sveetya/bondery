import { WEBAPP_ROUTES } from "@bondery/helpers/globals/paths";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getOAuthProvidersServer } from "@/lib/api/domains/server/oauth-providers";
import { getLastUsedLoginMethodCookie } from "@/lib/auth/getLastUsedLoginMethodCookie";
import { resolveServerSession, signOutStaleServerSession } from "@/lib/auth/resolveServerSession";
import { parseReturnIntent, RETURN_INTENT_PARAM } from "@/lib/auth/returnIntent";
import { LoginClient } from "./LoginClient";

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Login route gate: validated sessions redirect to the app before the login UI
 * renders. Stale or missing sessions clear auth cookies and show the login form.
 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const oauthProvidersPromise = getOAuthProvidersServer();
  const [session, lastUsedLoginMethod, params] = await Promise.all([
    resolveServerSession(),
    getLastUsedLoginMethodCookie(),
    searchParams,
  ]);
  const redirectParam = params[RETURN_INTENT_PARAM];
  const redirectValue = Array.isArray(redirectParam) ? redirectParam[0] : redirectParam;
  const returnPath = redirectValue
    ? parseReturnIntent(new URLSearchParams({ [RETURN_INTENT_PARAM]: redirectValue }))
    : null;

  if (session.status === "ok") {
    redirect(returnPath ?? WEBAPP_ROUTES.HOME);
  }

  // Drop stale BFF session cookies so they are not retried forever.
  await signOutStaleServerSession();

  const oauthProviders = await oauthProvidersPromise;

  return (
    <Suspense fallback={null}>
      <LoginClient lastUsedLoginMethod={lastUsedLoginMethod} oauthProviders={oauthProviders} />
    </Suspense>
  );
}
