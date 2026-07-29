import { WEBAPP_ROUTES } from "@bondery/helpers/globals/paths";
import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/app/getAppSession";
import { preloadWebNamespaces } from "@/lib/i18n/preloadNamespaces.server";
import { resolveLocaleSettings } from "@/lib/i18n/resolveLocaleSettings";

export default async function AdminStatsRouteLayout({ children }: { children: React.ReactNode }) {
  const { locale } = await resolveLocaleSettings();
  await preloadWebNamespaces(locale, ["web.admin"]);

  const appSession = await getAppSession();
  if (appSession.status !== "ok" || !appSession.session.isPlatformAdmin) {
    redirect(WEBAPP_ROUTES.HOME);
  }

  return children;
}
