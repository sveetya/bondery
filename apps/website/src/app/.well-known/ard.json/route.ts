import { WEBSITE_URL } from "@/lib/config";
import catalog from "./manifest.json";

const ARD_CONTEXT = "https://agenticresourcediscovery.org/context/v1" as const;

type ArdCatalogSourceEntry = {
  description: string;
  displayName: string;
  kind: string;
  path: string;
  representativeQueries: string[];
  tags: string[];
  type: string;
};

type ArdCatalogManifest = {
  entries: ArdCatalogSourceEntry[];
  updatedAt: string;
};

type ArdEntry = {
  "@context": typeof ARD_CONTEXT;
  description: string;
  displayName: string;
  identifier: string;
  representativeQueries: string[];
  tags: string[];
  type: string;
  updatedAt: string;
  url: string;
};

const manifest: ArdCatalogManifest = catalog;

export const dynamic = "force-dynamic";

export function GET() {
  const origin = WEBSITE_URL.replace(/\/+$/, "");
  const publisherHost = new URL(WEBSITE_URL).hostname;

  const entries: ArdEntry[] = manifest.entries.map((entry) => ({
    "@context": ARD_CONTEXT,
    description: entry.description,
    displayName: entry.displayName,
    identifier: `urn:air:${publisherHost}:${entry.kind}`,
    representativeQueries: entry.representativeQueries,
    tags: entry.tags,
    type: entry.type,
    updatedAt: manifest.updatedAt,
    url: `${origin}${entry.path}`,
  }));

  return Response.json(
    { entries },
    {
      headers: {
        "Cache-Control": "max-age=86400",
        "Content-Type": "application/json",
      },
    },
  );
}
