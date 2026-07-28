/**
 * Seeds app-domain rows for a newly registered Better Auth user.
 *
 * Replaces the old Supabase `handle_new_user()` trigger on `auth.users`.
 * Must be idempotent: partial state (e.g. `user_settings` without `people`)
 * can exist when settings were migrated or a prior hook attempt failed
 * mid-transaction.
 */
import { prisma, type SupportedLocale } from "@bondery/db";

function splitDisplayName(name: string | null | undefined): {
  firstName: string;
  lastName: string | null;
} {
  const trimmed = name?.trim() ?? "";
  if (!trimmed) {
    return { firstName: "", lastName: null };
  }

  const [firstName, ...rest] = trimmed.split(/\s+/);
  const lastName = rest.join(" ").trim();
  return { firstName, lastName: lastName || null };
}

export function resolveDefaultLocale(headers: Headers): SupportedLocale {
  const acceptLanguage = headers.get("accept-language") ?? "";
  if (acceptLanguage.startsWith("cs")) return "cs";
  if (acceptLanguage.startsWith("de")) return "de";
  return "en";
}

export async function provisionNewUser(params: {
  userId: string;
  name?: string | null;
  locale?: SupportedLocale;
}): Promise<void> {
  const { userId, name } = params;
  const locale: SupportedLocale = params.locale ?? "en";
  const now = new Date();
  const { firstName, lastName } = splitDisplayName(name);

  const [settings, myself] = await Promise.all([
    prisma.userSettings.findUnique({
      select: { id: true },
      where: { userId },
    }),
    prisma.people.findFirst({
      select: { id: true },
      where: { myself: true, userId },
    }),
  ]);

  if (!settings) {
    await prisma.userSettings.create({
      data: {
        aiMessagesMonthResetAt: now,
        language: locale,
        nextReminderAtUtc: now,
        timezone: "UTC",
        userId,
      },
    });
  }

  if (!myself) {
    await prisma.people.create({
      data: {
        firstName,
        id: userId,
        lastName,
        lastInteraction: now,
        myself: true,
        userId,
      },
    });
  }
}
