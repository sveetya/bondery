import { WEBSITE_ROUTES } from "@bondery/helpers";
import type { MetadataRoute } from "next";
import { getAllPosts } from "@/app/blog/_lib";
import { BLOG_CATEGORIES } from "@/lib/blog/categories";
import { isUnpublishedChangelogSlug } from "@/lib/changelog";
import { WEBSITE_URL } from "@/lib/config";
import { source } from "@/lib/source";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const blogCategoryEntries: MetadataRoute.Sitemap = BLOG_CATEGORIES.map((cat) => ({
    changeFrequency: "weekly" as const,
    lastModified: now,
    priority: 0.7,
    url: `${WEBSITE_URL}/blog/${cat}`,
  }));

  const blogPostEntries: MetadataRoute.Sitemap = getAllPosts().map((post) => ({
    changeFrequency: "monthly" as const,
    lastModified: new Date(post.date),
    priority: 0.8,
    url: `${WEBSITE_URL}/blog/${post.category}/${post.slug}`,
  }));

  const docEntries: MetadataRoute.Sitemap = source
    .getPages()
    .filter((page) => !page.data.hidden)
    .filter((page) => !isUnpublishedChangelogSlug(page.slugs))
    .map((page) => ({
      changeFrequency: "weekly" as const,
      lastModified: page.data.lastModified ? new Date(page.data.lastModified) : now,
      priority: 0.6,
      url: `${WEBSITE_URL}${page.url}`,
    }));

  return [
    {
      changeFrequency: "monthly",
      lastModified: now,
      priority: 1,
      url: `${WEBSITE_URL}${WEBSITE_ROUTES.HOME}`,
    },
    {
      changeFrequency: "monthly",
      lastModified: now,
      priority: 0.8,
      url: `${WEBSITE_URL}${WEBSITE_ROUTES.CONTACT}`,
    },
    {
      changeFrequency: "yearly",
      lastModified: now,
      priority: 0.5,
      url: `${WEBSITE_URL}${WEBSITE_ROUTES.PRIVACY}`,
    },
    {
      changeFrequency: "yearly",
      lastModified: now,
      priority: 0.5,
      url: `${WEBSITE_URL}${WEBSITE_ROUTES.TERMS}`,
    },
    {
      changeFrequency: "yearly",
      lastModified: now,
      priority: 0.5,
      url: `${WEBSITE_URL}${WEBSITE_ROUTES.SECURITY}`,
    },
    ...docEntries,
    ...blogCategoryEntries,
    ...blogPostEntries,
  ];
}
