import "leaflet/dist/leaflet.css";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PaymentFailureModal } from "@/components/billing/PaymentFailureModal";
import { AppShellRefreshRegistrar } from "@/components/shell/AppShellRefreshRegistrar";
import { AppShellWithQueryBadges } from "@/components/shell/AppShellWithQueryBadges";
import { AppShellWrapper } from "@/components/shell/AppShellWrapper";
import { ColorSchemeSync } from "@/components/shell/ColorSchemeSync";
import { SessionResyncOnFocus } from "@/components/shell/SessionResyncOnFocus";
import { UserSessionProvider } from "@/components/shell/UserSessionProvider";
import { getRequestSession } from "@/lib/auth/getRequestSession";
import { BYPASS_ONBOARDING_ONCE_COOKIE } from "@/lib/auth/constants";
import { WEBAPP_ROUTES, WEBAPP_NAME } from "@bondery/helpers/globals/paths";
import { cookies, headers } from "next/headers";
import { Suspense } from "react";
import { EnrichResumeDetector } from "@/components/extension/EnrichResumeDetector";
import { EnrichStatusNotificationManager } from "@/components/extension/EnrichStatusNotificationManager";
import { ExtensionUpdateNotificationManager } from "@/components/extension/ExtensionUpdateNotificationManager";
import { ServiceWorkerRegistration } from "@/components/shell/ServiceWorkerRegistration";
import { SyncWakeRegistrar } from "@/components/shell/SyncWakeRegistrar";
import { SIDEBAR_COOKIE_NAME } from "@/lib/cookies/constants";

export const metadata: Metadata = {
  title: WEBAPP_NAME,
};

/** Authenticated product chrome: sidebar, shell providers, onboarding gate. */
export default async function AppShellLayout({ children }: { children: React.ReactNode }) {
  const [cookieStore, headersList] = await Promise.all([cookies(), headers()]);
  const pathname = headersList.get("x-pathname") ?? "";
  const session = await getRequestSession();
  if (session.kind !== "authenticated" || session.api !== "ok" || !session.shell) {
    redirect(WEBAPP_ROUTES.UNAVAILABLE);
  }

  const userSession = session.shell;
  const bypassOnboarding = cookieStore.get(BYPASS_ONBOARDING_ONCE_COOKIE)?.value === "1";

  if (bypassOnboarding) {
    cookieStore.set(BYPASS_ONBOARDING_ONCE_COOKIE, "", { maxAge: 0, path: "/app" });
  }

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

  const initialCollapsed = cookieStore.get(SIDEBAR_COOKIE_NAME)?.value === "true";
  const { displayName, avatarUrl, colorScheme } = userSession;

  return (
    <UserSessionProvider avatarUrl={avatarUrl} colorScheme={colorScheme} displayName={displayName}>
      <AppShellRefreshRegistrar />
      <SyncWakeRegistrar />
      <SessionResyncOnFocus />
      <ServiceWorkerRegistration />
      <ColorSchemeSync />
      <EnrichStatusNotificationManager />
      <EnrichResumeDetector />
      <ExtensionUpdateNotificationManager />
      <PaymentFailureModal />
      <Suspense
        fallback={
          <AppShellWrapper
            avatarUrl={avatarUrl}
            hasActiveMergeRecommendations={false}
            hasOverdueKeepInTouch={false}
            initialCollapsed={initialCollapsed}
            userName={displayName}
          >
            {children}
          </AppShellWrapper>
        }
      >
        <AppShellWithQueryBadges initialCollapsed={initialCollapsed}>
          {children}
        </AppShellWithQueryBadges>
      </Suspense>
    </UserSessionProvider>
  );
}
