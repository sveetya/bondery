import { WEBAPP_NAME, WEBAPP_ROUTES } from "@bondery/helpers/globals/paths";
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/app/getAppSession";
import { BYPASS_ONBOARDING_ONCE_COOKIE } from "@/lib/auth/constants";
import { resolveServerSession, signOutServerSession } from "@/lib/auth/resolveServerSession";
import {
  buildLoginUrl,
  buildUnavailableUrl,
  getRequestReturnPath,
  getRequestReturnPathForLogin,
} from "@/lib/auth/returnIntent";

/** Sync fallback while per-route generateMetadata streams on client navigation. */
export const metadata: Metadata = {
  title: WEBAPP_NAME,
};

/**
 * Auth gate for all `/app/*` routes. Product chrome (sidebar, shell providers)
 * lives in `(shell)/layout.tsx`; system pages use `(chromeless)/layout.tsx`.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [cookieStore, headersList] = await Promise.all([cookies(), headers()]);
  const pathname = headersList.get("x-pathname") ?? "";
  const returnPathForLogin = getRequestReturnPathForLogin(headersList);
  const returnPathForUnavailable = getRequestReturnPath(headersList);

  const session = await resolveServerSession();

  if (session.status !== "ok") {
    await signOutServerSession();
    redirect(buildLoginUrl(returnPathForLogin));
  }

  // getAppSession() is cache()-wrapped: shared with resolveLocaleSettings().
  const appSession = await getAppSession();

  if (appSession.status === "unauthorized") {
    // Session cookie is valid but API rejected the token — do not sign out (config mismatch).
    redirect(buildUnavailableUrl(returnPathForUnavailable));
  }

  if (appSession.status === "unavailable") {
    if (!pathname.startsWith(WEBAPP_ROUTES.UNAVAILABLE)) {
      redirect(buildUnavailableUrl(returnPathForUnavailable));
    }
    return <>{children}</>;
  }

  if (pathname.startsWith(WEBAPP_ROUTES.UNAVAILABLE)) {
    redirect(WEBAPP_ROUTES.HOME);
  }

  const { session: userSession } = appSession;
  const bypassOnboarding = cookieStore.get(BYPASS_ONBOARDING_ONCE_COOKIE)?.value === "1";

  if (
    !userSession.onboardingCompletedAt &&
    !bypassOnboarding &&
    !pathname.startsWith(WEBAPP_ROUTES.ONBOARDING)
  ) {
    redirect(WEBAPP_ROUTES.ONBOARDING);
  }

  if (userSession.onboardingCompletedAt && pathname.startsWith(WEBAPP_ROUTES.ONBOARDING)) {
    redirect(WEBAPP_ROUTES.HOME);
  }

  return <>{children}</>;
}
