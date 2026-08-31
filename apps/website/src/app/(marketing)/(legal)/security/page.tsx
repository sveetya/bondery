import { formatMetadataTitle } from "@bondery/helpers";
import type { Metadata } from "next";
import { Security } from "@/components/legal";

export const metadata: Metadata = {
  alternates: {
    canonical: "/security",
  },
  description: "How to report a security issue to Bondery.",
  openGraph: {
    description: "How to report a security issue to Bondery.",
    title: formatMetadataTitle("Security"),
    type: "website",
    url: "/security",
  },
  title: "Security",
  twitter: {
    description: "How to report a security issue to Bondery.",
    title: formatMetadataTitle("Security"),
  },
};

export default function SecurityPage() {
  return <Security />;
}
