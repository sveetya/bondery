import { normalizeMobileUrlForDevice, STORAGE_URL } from "../config";

export function resolveLocalContactAvatarUrl(
  userId: string,
  personId: string,
  hasAvatar: boolean,
  updatedAt?: string | null,
): string | null {
  if (!hasAvatar || !STORAGE_URL || !userId) {
    return null;
  }

  const path = `${userId}/${personId}.jpg`;
  const baseUrl = `${STORAGE_URL.replace(/\/+$/, "")}/avatars/${path}`;
  const cacheBust = updatedAt ? `?t=${Date.parse(updatedAt)}` : "";
  return normalizeMobileUrlForDevice(`${baseUrl}${cacheBust}`);
}

export function resolveStoragePublicUrl(path: string): string | null {
  if (!STORAGE_URL) {
    return null;
  }

  const url = `${STORAGE_URL.replace(/\/+$/, "")}/avatars/${path.replace(/^\/+/, "")}`;
  return normalizeMobileUrlForDevice(url);
}
