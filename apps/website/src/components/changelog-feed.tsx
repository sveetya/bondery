import { createRelativeLink } from "fumadocs-ui/mdx";
import { getMDXComponents } from "@/components/mdx";
import { getChangelogFeedPages } from "@/lib/changelog";
import { type Page, source } from "@/lib/source";

type ChangelogFeedProps = {
  page: Page;
};

export function ChangelogFeed({ page }: ChangelogFeedProps) {
  const { releases, unreleased } = getChangelogFeedPages();
  const components = getMDXComponents({
    a: createRelativeLink(source, page),
  });
  const feedPages = [...(unreleased ? [unreleased] : []), ...releases];

  return (
    <>
      {feedPages.map((entry) => {
        const Body = entry.data.body;
        return <Body components={components} key={entry.url} />;
      })}
    </>
  );
}
