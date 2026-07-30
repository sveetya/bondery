import type { ComponentType } from "react";
import type { PostMeta } from "@/app/blog/_lib/types";

import GoingSupaless, { postMeta as goingSupaless } from "./tech/going-supaless.mdx";
import April2026Release, { postMeta as april2026Release } from "./updates/april-2026-release.mdx";
import IntroducingBondery, {
  postMeta as introducingBondery,
} from "./updates/introducing-bondery.mdx";
import July2026Release, { postMeta as july2026Release } from "./updates/july-2026-release.mdx";

/** Central registry of all blog posts. Add new imports here when publishing. */
export const allPosts: PostMeta[] = [
  goingSupaless,
  july2026Release,
  april2026Release,
  introducingBondery,
];

/**
 * Maps "category/slug" to the MDX component.
 * Add a new entry here whenever you add a post to `allPosts`.
 */
export const postComponents: Record<string, ComponentType> = {
  [`${goingSupaless.category}/${goingSupaless.slug}`]: GoingSupaless,
  [`${july2026Release.category}/${july2026Release.slug}`]: July2026Release,
  [`${april2026Release.category}/${april2026Release.slug}`]: April2026Release,
  [`${introducingBondery.category}/${introducingBondery.slug}`]: IntroducingBondery,
};
