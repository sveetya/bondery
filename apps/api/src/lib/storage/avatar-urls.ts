import type { AvatarTransformOptions } from "@bondery/schemas";
import { AVATARS_BUCKET, getStorage } from "./get-storage.js";

export function buildContactAvatarUrl(
  userId: string,
  personId: string,
  _options?: AvatarTransformOptions,
  updatedAt?: string | null,
): string | null {
  const path = `${userId}/${personId}.jpg`;
  const storage = getStorage();
  let baseUrl = storage.getPublicUrl(AVATARS_BUCKET, path);

  if (updatedAt) {
    const ts = new Date(updatedAt).getTime();
    if (!Number.isNaN(ts)) {
      const sep = baseUrl.includes("?") ? "&" : "?";
      baseUrl = `${baseUrl}${sep}t=${ts}`;
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
  userId: string,
  contact: ContactAvatarSource,
  options?: AvatarTransformOptions,
): string | null {
  if (!contact.hasAvatar) {
    return null;
  }

  return buildContactAvatarUrl(userId, contact.id, options, contact.updatedAt);
}

export function buildLinkedinLogoUrl(userId: string, linkedinId: string): string {
  const storage = getStorage();
  return storage.getPublicUrl("linkedin_logos", `${userId}/${linkedinId}.jpg`);
}
