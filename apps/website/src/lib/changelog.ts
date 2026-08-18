import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { TOCItemType } from "fumadocs-core/toc";
import { source } from "@/lib/source";

const RELEASES_META_PATH = join(process.cwd(), "../../docs/changelog/releases/meta.json");

export const CHANGELOG_INDEX_SLUGS = ["changelog"] as const;
export const UNRELEASED_SLUGS = ["changelog", "unreleased"] as const;

function readReleaseVersions(): string[] {
  const meta = JSON.parse(readFileSync(RELEASES_META_PATH, "utf8")) as { pages: string[] };
  return meta.pages;
}

export function isUnpublishedChangelogSlug(slug: string[] | undefined): boolean {
  return slug?.length === 2 && slug[0] === "changelog" && slug[1] === "unreleased";
}

export function isChangelogIndexSlug(slug: string[] | undefined): boolean {
  return slug?.length === 1 && slug[0] === "changelog";
}

export function getChangelogFeedPages() {
  const versions = readReleaseVersions();
  const unreleased = source.getPage([...UNRELEASED_SLUGS]);
  const releases = versions
    .map((version) => source.getPage(["changelog", "releases", version]))
    .filter((page): page is NonNullable<typeof page> => page !== undefined);

  return { releases, unreleased };
}

export function getChangelogMergedToc(): TOCItemType[] {
  const { releases, unreleased } = getChangelogFeedPages();
  const toc: TOCItemType[] = [];
  const seen = new Set<string>();

  const pages = [...(unreleased ? [unreleased] : []), ...releases];

  for (const page of pages) {
    for (const item of page.data.toc) {
      // Category headings ("Added", "Fixed") repeat on every release and share
      // the same slug. Duplicate TOC urls freeze the docs sidebar. Keep only
      // unique version headings (## [1.8.3], ## [Unreleased]).
      if (item.depth !== 2 || seen.has(item.url)) {
        continue;
      }

      seen.add(item.url);
      toc.push(item);
    }
  }

  return toc;
}
