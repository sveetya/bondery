import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
  MarkdownCopyButton,
  PageLastUpdate,
  ViewOptionsPopover,
} from "fumadocs-ui/layouts/docs/page";
import { createRelativeLink } from "fumadocs-ui/mdx";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OpenAPIPage } from "@/components/api-page";
import { getMDXComponents } from "@/components/mdx";
import { getDocsGithubUrl, getPageMarkdownUrl } from "@/lib/get-llm-text";
import { getPageImage, source } from "@/lib/source";

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

function DocPageActions({ page }: { page: (typeof source)["$inferPage"] }) {
  if (page.type === "openapi") {
    return null;
  }

  const markdownUrl = getPageMarkdownUrl(page);
  const githubUrl = getDocsGithubUrl(page);

  return (
    <div className="flex flex-row items-center gap-2 border-b pt-2 pb-6">
      <MarkdownCopyButton markdownUrl={markdownUrl} />
      <ViewOptionsPopover githubUrl={githubUrl} markdownUrl={markdownUrl} />
    </div>
  );
}

export default async function DocPage(props: PageProps) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) {
    notFound();
  }

  const lastEdit =
    page.type !== "openapi" && page.data.lastModified ? new Date(page.data.lastModified) : null;

  if (page.type === "openapi") {
    return (
      <DocsPage full toc={page.data.toc}>
        <DocsTitle>{page.data.title}</DocsTitle>
        {page.data.description ? <DocsDescription>{page.data.description}</DocsDescription> : null}
        <DocsBody>
          <OpenAPIPage {...page.data.getOpenAPIPageProps()} />
        </DocsBody>
        {lastEdit ? <PageLastUpdate className="mt-8" date={lastEdit} /> : null}
      </DocsPage>
    );
  }

  const MDX = page.data.body;

  return (
    <DocsPage full={page.data.full} toc={page.data.toc}>
      <DocsTitle>{page.data.title}</DocsTitle>
      {page.data.description ? (
        <DocsDescription className="mb-0">{page.data.description}</DocsDescription>
      ) : null}
      <DocPageActions page={page} />
      <DocsBody>
        <MDX
          components={getMDXComponents({
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
      {lastEdit ? <PageLastUpdate className="mt-8" date={lastEdit} /> : null}
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) {
    notFound();
  }

  const image = getPageImage(page).url;

  return {
    description: page.data.description,
    openGraph: {
      images: [image],
    },
    title: page.data.title,
    twitter: {
      card: "summary_large_image",
      images: [image],
    },
  };
}
