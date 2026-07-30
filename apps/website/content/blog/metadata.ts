import type { PostMeta } from "@/app/blog/_lib/types";

import { postMeta as goingSupaless } from "./tech/going-supaless.meta";
import { postMeta as april2026Release } from "./updates/april-2026-release.meta";
import { postMeta as introducingBondery } from "./updates/introducing-bondery.meta";
import { postMeta as july2026Release } from "./updates/july-2026-release.meta";

/**
 * Thin metadata-only registry — plain PostMeta objects, no MDX component imports.
 * Used by the announce script (scripts/announce.ts) which runs via tsx and cannot
 * process MDX. When adding a new post, add its postMeta import here AND the full
 * MDX component import in posts.ts.
 */
export const allPostMeta: PostMeta[] = [
  goingSupaless,
  july2026Release,
  april2026Release,
  introducingBondery,
];
