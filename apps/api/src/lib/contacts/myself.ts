import type { PrismaClient } from "@bondery/db";
import type { AvatarTransformOptions } from "@bondery/schemas";
import { resolveContactAvatarUrl } from "../storage/avatar-urls.js";

export type MyselfProfile = {
  firstName: string | null;
  avatarUrl: string | null;
};

/**
 * Returns the authenticated user's display name and avatar URL derived from
 * the "myself" contact record.
 */
export async function getMyselfProfile(
  db: PrismaClient,
  userId: string,
  avatarOptions?: AvatarTransformOptions,
): Promise<MyselfProfile> {
  const myself = await db.people.findFirst({
    select: { firstName: true, hasAvatar: true, updatedAt: true },
    where: { myself: true, userId },
  });

  const avatarUrl = resolveContactAvatarUrl(
    userId,
    {
      hasAvatar: myself?.hasAvatar ?? false,
      id: userId,
      updatedAt: myself?.updatedAt?.toISOString(),
    },
    avatarOptions,
  );

  return {
    avatarUrl,
    firstName: myself?.firstName ?? null,
  };
}
