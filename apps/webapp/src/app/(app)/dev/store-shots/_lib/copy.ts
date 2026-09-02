import type { StoreShotSlug } from "./slugs";

/** Hardcoded EN marketing copy for Chrome Web Store listing frames. */
export const STORE_SHOT_COPY: Record<StoreShotSlug, { headline: string; subcopy?: string }> = {
  "every-surface": {
    headline: "Access Bondery your way from every device",
  },
  "open-source": {
    headline: "Open-source personal CRM for building better bonds",
  },
  remember: {
    headline: "Remember when you last met and talked about",
  },
  "save-a-profile": {
    headline: "Save a profile from socials in one click",
  },
  "stay-organized": {
    headline: "Stay organized with labels, groups, map, or AI text search",
  },
};
