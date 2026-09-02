export const STORE_SHOT_SLUGS = [
  "open-source",
  "save-a-profile",
  "remember",
  "stay-organized",
  "every-surface",
] as const;

export type StoreShotSlug = (typeof STORE_SHOT_SLUGS)[number];

export function isStoreShotSlug(value: string): value is StoreShotSlug {
  return (STORE_SHOT_SLUGS as readonly string[]).includes(value);
}
