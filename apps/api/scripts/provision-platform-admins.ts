/**
 * Deployment-only platform admin provisioning.
 *
 * Promotes operator accounts to `user.role = admin` from
 * `BONDERY_PRIVATE_PLATFORM_ADMIN_EMAILS`. Idempotent — safe on every deploy.
 * Runs after `prisma migrate deploy` via packages/db/scripts/release-migrate.ts.
 *
 * Usage: tsx --env-file=.env.development.local scripts/provision-platform-admins.ts
 */
import { prisma } from "@bondery/db";
import { PLATFORM_ADMIN_ROLE } from "@bondery/helpers/auth/platform-admin";

function resolvePlatformAdminEmails(): string[] {
  const raw = process.env.BONDERY_PRIVATE_PLATFORM_ADMIN_EMAILS?.trim();
  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length > 0);
}

export async function provisionPlatformAdmins(): Promise<void> {
  const emails = resolvePlatformAdminEmails();
  if (emails.length === 0) {
    return;
  }

  for (const email of emails) {
    const result = await prisma.user.updateMany({
      data: { role: PLATFORM_ADMIN_ROLE },
      where: { email: { equals: email, mode: "insensitive" } },
    });

    if (result.count === 0) {
      console.warn(`provision-platform-admins: no user found for email ${email}`);
    }
  }
}

async function main(): Promise<void> {
  await provisionPlatformAdmins();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
