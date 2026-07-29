import { prisma } from "@bondery/db";
import {
  coerceSupportedLocale,
  type SupportedLocale,
} from "@bondery/schemas/locale/supported-locale";

export async function getUserSettingsLanguage(userId: string): Promise<SupportedLocale | null> {
  const settings = await prisma.userSettings.findUnique({
    select: { language: true },
    where: { userId },
  });

  if (!settings?.language) {
    return null;
  }

  return coerceSupportedLocale(settings.language);
}
