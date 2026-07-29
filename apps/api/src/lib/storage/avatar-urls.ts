import type { AvatarTransformOptions } from "@bondery/schemas";
import type { Database } from "@bondery/schemas/supabase.types";
import type { SupabaseClient } from "@supabase/supabase-js";

const AVATAR_SIZE_MAP = { large: 256, medium: 128, small: 64 } as const;
const AVATAR_QUALITY_MAP = { high: 90, low: 40, medium: 70 } as const;

export function buildContactAvatarUrl(
  client: SupabaseClient<Database>,
  userId: string,
  personId: string,
  options?: AvatarTransformOptions,
  updatedAt?: string | null,
): string | null {
  const path = `${userId}/${personId}.jpg`;

  const transform: Record<string, number> = {};
  if (options?.size) {
    const px = AVATAR_SIZE_MAP[options.size];
    transform.width = px;
    transform.height = px;
  }
  if (options?.quality) {
    transform.quality = AVATAR_QUALITY_MAP[options.quality];
  }

  const hasTransform = Object.keys(transform).length > 0;

  const { data } = client.storage
    .from("avatars")
    .getPublicUrl(path, hasTransform ? { transform } : undefined);

  const baseUrl = data?.publicUrl ?? null;
  if (!baseUrl) {
    return null;
  }

  if (updatedAt) {
    const ts = new Date(updatedAt).getTime();
    if (!Number.isNaN(ts)) {
      const sep = baseUrl.includes("?") ? "&" : "?";
      return `${baseUrl}${sep}t=${ts}`;
    }
  }

  return baseUrl;
}

export type ContactAvatarSource = {
  id: string;
  hasAvatar: boolean;
  updatedAt?: string | null;
};

export function resolveContactAvatarUrl(
  client: SupabaseClient<Database>,
  userId: string,
  contact: ContactAvatarSource,
  options?: AvatarTransformOptions,
): string | null {
  if (!contact.hasAvatar) {
    return null;
  }

  return buildContactAvatarUrl(client, userId, contact.id, options, contact.updatedAt);
}
