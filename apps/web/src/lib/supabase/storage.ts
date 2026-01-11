import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Generates a public URL for a storage avatar.
 *
 * Note: Avatar URLs are stored as full public URLs in the database.
 * This helper can be used to generate URLs from storage paths if needed.
 *
 * @param supabase - Supabase client instance
 * @param avatarPath - The storage path to the avatar (e.g., "userId/profile.jpg") or existing URL
 * @returns The public URL or null if the path is already a URL or generation failed
 */
export async function getPublicAvatarUrl(
  supabase: SupabaseClient,
  avatarPath: string | null
): Promise<string | null> {
  if (!avatarPath) return null;

  // If already a URL, return as-is
  if (avatarPath.startsWith("http")) {
    return avatarPath;
  }

  // Generate public URL for storage
  const { data: publicUrlData } = supabase.storage
    .from("profile-photos")
    .getPublicUrl(avatarPath);

  return publicUrlData?.publicUrl || null;
}
