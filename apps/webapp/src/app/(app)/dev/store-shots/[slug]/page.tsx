import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ComponentType } from "react";
import { EverySurfaceShot } from "../_components/shots/EverySurfaceShot";
import { OpenSourceShot } from "../_components/shots/OpenSourceShot";
import { RememberShot } from "../_components/shots/RememberShot";
import { SaveAProfileShot } from "../_components/shots/SaveAProfileShot";
import { StayOrganizedShot } from "../_components/shots/StayOrganizedShot";
import { STORE_SHOT_COPY } from "../_lib/copy";
import { isStoreShotSlug, STORE_SHOT_SLUGS, type StoreShotSlug } from "../_lib/slugs";

const SHOT_COMPONENTS: Record<StoreShotSlug, ComponentType> = {
  "every-surface": EverySurfaceShot,
  "open-source": OpenSourceShot,
  remember: RememberShot,
  "save-a-profile": SaveAProfileShot,
  "stay-organized": StayOrganizedShot,
};

interface StoreShotPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return STORE_SHOT_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: StoreShotPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!isStoreShotSlug(slug)) {
    return { robots: { follow: false, index: false } };
  }
  return {
    robots: { follow: false, index: false },
    title: STORE_SHOT_COPY[slug].headline,
  };
}

export default async function StoreShotPage({ params }: StoreShotPageProps) {
  const { slug } = await params;
  if (!isStoreShotSlug(slug)) {
    notFound();
  }

  const Shot = SHOT_COMPONENTS[slug];
  return <Shot />;
}
