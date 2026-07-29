import { prisma } from "@bondery/db";
import { PLATFORM_ADMIN_ROLE } from "@bondery/helpers/auth/platform-admin";

/**
 * Whether `userId` is a Bondery platform operator (internal stats / ops).
 * Mirrors Better Auth `admin()` semantics: `role = admin` and not banned.
 */
export async function isPlatformAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    select: { banned: true, role: true },
    where: { id: userId },
  });

  if (!user?.role || user.banned) {
    return false;
  }

  return user.role === PLATFORM_ADMIN_ROLE;
}
