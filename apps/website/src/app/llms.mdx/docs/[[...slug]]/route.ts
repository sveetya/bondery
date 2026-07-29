import { notFound } from "next/navigation";
import { getLLMText } from "@/lib/get-llm-text";
import { source } from "@/lib/source";

export const revalidate = false;

type RouteContext = {
  params: Promise<{ slug?: string[] }>;
};

export async function GET(_req: Request, { params }: RouteContext) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page || page.type === "openapi") {
    notFound();
  }

  return new Response(await getLLMText(page), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
    },
  });
}

export function generateStaticParams() {
  return source
    .getPages()
    .filter((page) => page.type !== "openapi")
    .map((page) => ({
      slug: page.slugs,
    }));
}
