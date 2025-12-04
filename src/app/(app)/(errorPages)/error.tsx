import { useTranslations } from "next-intl";

export default function Page() {
  // ?NOTE: https://next-intl.dev/docs/environments/error-files#errorjs
  // const t = useTranslations("NotFoundPage");
  // return <h1>{t("title")}</h1>;

  return <h1> Error Page </h1>;
}
