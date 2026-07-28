import { OgTitled } from "@bondery/branding/og";
import { BLOG_CATEGORIES, getBlogCategoryTitle } from "@/app/(marketing)/blog/_lib";
import { createOgImageResponse, OG_IMAGE_CONTENT_TYPE } from "@/lib/og/imageResponse";

export const contentType = OG_IMAGE_CONTENT_TYPE;
export const size = { height: 630, width: 1200 };

type ImageProps = {
  params: Promise<{ category: string }>;
};

export function generateStaticParams() {
  return BLOG_CATEGORIES.map((category) => ({ category }));
}

export default async function Image({ params }: ImageProps) {
  const { category } = await params;
  const title = getBlogCategoryTitle(category);

  return createOgImageResponse(
    <OgTitled subtype={category === "all" ? undefined : "Blog"} title={title} />,
  );
}
