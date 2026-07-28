import { OgTitled } from "@bondery/branding/og";
import { notFound } from "next/navigation";
import { getPageImage, source } from "@/lib/source";
import { createOgImageResponse } from "@/lib/og/imageResponse";

export const revalidate = false;

type RouteContext = {
  params: Promise<{ slug: string[] }>;
};

export async function GET(_req: Request, context: RouteContext) {
  const { slug } = await context.params;
  const page = source.getPage(slug.slice(0, -1));
  if (!page) {
    notFound();
  }

  return createOgImageResponse(
    <OgTitled subtype="Docs" title={page.data.title ?? "Bondery Docs"} />,
  );
}

export function generateStaticParams() {
  return source
    .getPages()
    .map((page) => ({
      slug: getPageImage(page).segments,
    }))
    .filter(({ slug }) => !(slug[0] === "api" && slug[1] === "errors"));
}
