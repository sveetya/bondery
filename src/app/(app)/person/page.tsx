import { useTranslations } from "next-intl";

export default function Page() {
  const t = useTranslations("SingleContactPage");
  return <h1>{t("Title")}</h1>;
}
