import type { PostMeta } from "../../../src/app/blog/_lib/types";
import { sveetya } from "../../../src/data/team";
import { techCategoryConfig } from "../../../src/lib/blog/categories";

/**
 * Metadata for the "Going Supaless" infrastructure blog post.
 * Imported by both the MDX file (for Next.js) and metadata.ts (for the announce script).
 */
export const postMeta: PostMeta = {
  announce: {
    enabled: true,
    redditTitle:
      "Going Supaless: why Bondery migrated off Supabase to Postgres, Better Auth, and SeaweedFS",
  },
  author: sveetya.name,
  category: techCategoryConfig.slug,
  date: "2026-07-30",
  description:
    "Bondery no longer runs on Supabase. Here's why we moved to our own Postgres stack — and what privacy, self-hosting, and passkeys had to do with it.",
  slug: "going-supaless",
  tags: [
    "infrastructure",
    "Supabase",
    "Postgres",
    "Better Auth",
    "self-hosting",
    "open source",
    "privacy",
  ],
  title: "Going Supaless",
};
