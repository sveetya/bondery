import { createClient } from "@supabase/supabase-js";
import {
  HAS_MOBILE_CONFIG,
  normalizeMobileUrlForDevice,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
} from "../config";

const storageClient = HAS_MOBILE_CONFIG
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

export function resolveLocalContactAvatarUrl(
  userId: string,
  personId: string,
  hasAvatar: boolean,
  updatedAt?: string | null,
): string | null {
  if (!hasAvatar || !storageClient || !userId) {
    return null;
  }

  const path = `${userId}/${personId}.jpg`;
  const { data } = storageClient.storage.from("avatars").getPublicUrl(path);
  const baseUrl = data?.publicUrl ?? null;
  if (!baseUrl) {
    return null;
  }

  const cacheBust = updatedAt ? `?t=${Date.parse(updatedAt)}` : "";
  return normalizeMobileUrlForDevice(`${baseUrl}${cacheBust}`);
}

export function resolveStoragePublicUrl(path: string): string | null {
  if (!storageClient) {
    return null;
  }
  const { data } = storageClient.storage.from("avatars").getPublicUrl(path);
  return data?.publicUrl ? normalizeMobileUrlForDevice(data.publicUrl) : null;
}
