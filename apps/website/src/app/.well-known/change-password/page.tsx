import { WEBAPP_ROUTES } from "@bondery/helpers/globals/paths";
import { redirect } from "next/navigation";
import { webappUrl } from "@/lib/webapp-url";

export default function ChangePasswordPage() {
  redirect(webappUrl(WEBAPP_ROUTES.WELL_KNOWN_CHANGE_PASSWORD));
}
