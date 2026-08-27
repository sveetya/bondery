import { formatContactName } from "@bondery/helpers/contact";
import type { Metadata } from "next";
import { cache } from "react";
import { getContactDetailServer } from "@/lib/api/domains/server/contacts";
import { getSingleContactPageTranslations } from "@/lib/i18n/generated/hooks.server";
import { entityPageTitle } from "@/lib/metadata/pageTitles";
import { PersonLoader } from "./PersonLoader";
import { PersonMissingState } from "./PersonMissingState";

const getContactForPage = cache((id: string) => getContactDetailServer(id, "large"));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ personId: string }>;
}): Promise<Metadata> {
  const { personId } = await params;
  try {
    const contact = await getContactForPage(personId);
    return entityPageTitle(formatContactName(contact));
  } catch {
    const t = await getSingleContactPageTranslations();
    return entityPageTitle(t("PersonFallbackTitle"));
  }
}

export default async function PersonPage({
  params,
  searchParams,
}: {
  params: Promise<{ personId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { personId } = await params;
  const { tab } = await searchParams;
  const t = await getSingleContactPageTranslations();

  if (!personId) {
    return <PersonMissingState description={t("PersonNotSelected")} />;
  }

  return (
    <PersonLoader initialTab={typeof tab === "string" ? tab : undefined} personId={personId} />
  );
}
