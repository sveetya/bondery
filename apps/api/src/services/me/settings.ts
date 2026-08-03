import type { ColorScheme, SupportedLocale } from "@bondery/db";
import type { UpdateSettingsBody } from "@bondery/schemas";
import { DEFAULT_LOCALE } from "@bondery/schemas/locale/supported-locale";
import { type DomainContext, DomainError } from "../../domains/_shared/context.js";
import { domainDb } from "../../domains/_shared/domain-db.js";
import { internal } from "../../lib/platform/errors/http-errors.js";
import {
  captureProductEvent,
  invalidateProductAnalyticsCache,
} from "../analytics/posthog-capture.js";

export type UserSettingsLanguage = SupportedLocale;

const DEFAULT_REMINDER_SEND_HOUR = "08:00:00";
const NEW_SIGNUP_WINDOW_MS = 30_000;

function normalizeReminderSendHour(value: string): string {
  const [hourPart, minutePart, secondPart] = value.trim().split(":");
  const normalizedHour = hourPart.padStart(2, "0");
  const normalizedMinute = minutePart.padStart(2, "0");
  const normalizedSecond = (secondPart || "00").padStart(2, "0");
  return `${normalizedHour}:${normalizedMinute}:${normalizedSecond}`;
}

export function formatSettingsPatchData(result: {
  timezone?: string | null;
  reminderSendHour?: string | null;
  timeFormat?: string | null;
  language?: UserSettingsLanguage | null;
  colorScheme?: ColorScheme | null;
  leftSwipeAction?: string | null;
  rightSwipeAction?: string | null;
  groupSortOrder?: string | null;
  tagSortOrder?: string | null;
  productAnalyticsEnabled?: boolean | null;
}) {
  return {
    colorScheme: result.colorScheme,
    groupSortOrder: result.groupSortOrder,
    language: result.language,
    leftSwipeAction: result.leftSwipeAction,
    productAnalyticsEnabled: result.productAnalyticsEnabled,
    reminderSendHour: result.reminderSendHour,
    rightSwipeAction: result.rightSwipeAction,
    tagSortOrder: result.tagSortOrder,
    timeFormat: result.timeFormat,
    timezone: result.timezone,
  };
}

export async function ensureDefaultSettings(ctx: DomainContext) {
  const db = domainDb(ctx);
  const { user } = ctx;

  const settings = await db.userSettings.findUnique({
    where: { userId: user.id },
  });

  if (settings) {
    return settings;
  }

  try {
    const created = await db.userSettings.create({
      data: {
        aiMessagesMonthResetAt: new Date(),
        colorScheme: "auto",
        language: DEFAULT_LOCALE as SupportedLocale,
        nextReminderAtUtc: new Date(),
        reminderSendHour: DEFAULT_REMINDER_SEND_HOUR,
        timeFormat: "24h",
        timezone: "UTC",
        userId: user.id,
      },
    });

    void captureProductEvent(ctx, "signup_flow:user_create", {
      signup_method: "email",
    });

    return created;
  } catch {
    throw internal("settings_failed_to_create_default_settings");
  }
}

export async function updateUserSettings(ctx: DomainContext, input: UpdateSettingsBody) {
  const db = domainDb(ctx);
  const { user } = ctx;

  const updatePayload: {
    timezone?: string;
    reminderSendHour?: string;
    language?: UserSettingsLanguage;
    colorScheme?: ColorScheme;
    timeFormat?: string;
    leftSwipeAction?: string;
    rightSwipeAction?: string;
    groupSortOrder?: string;
    tagSortOrder?: string;
    productAnalyticsEnabled?: boolean;
  } = {};

  if (input.timezone !== undefined) {
    updatePayload.timezone = input.timezone;
  }
  if (input.reminderSendHour !== undefined) {
    updatePayload.reminderSendHour = normalizeReminderSendHour(input.reminderSendHour);
  }
  if (input.language !== undefined) {
    updatePayload.language = input.language as UserSettingsLanguage;
  }
  if (input.colorScheme !== undefined) {
    updatePayload.colorScheme = input.colorScheme as ColorScheme;
  }
  if (input.timeFormat !== undefined) {
    updatePayload.timeFormat = input.timeFormat;
  }
  if (input.leftSwipeAction !== undefined) {
    updatePayload.leftSwipeAction = input.leftSwipeAction;
  }
  if (input.rightSwipeAction !== undefined) {
    updatePayload.rightSwipeAction = input.rightSwipeAction;
  }
  if (input.groupSortOrder !== undefined) {
    updatePayload.groupSortOrder = input.groupSortOrder;
  }
  if (input.tagSortOrder !== undefined) {
    updatePayload.tagSortOrder = input.tagSortOrder;
  }
  if (input.productAnalyticsEnabled !== undefined) {
    updatePayload.productAnalyticsEnabled = input.productAnalyticsEnabled;
  }

  if (Object.keys(updatePayload).length === 0) {
    throw new DomainError("No settings fields provided", 400, "settings_no_fields");
  }

  if (input.onlyIfNewSignup) {
    const signupSettings = await db.userSettings.findUnique({
      select: {
        colorScheme: true,
        createdAt: true,
        language: true,
        reminderSendHour: true,
        timeFormat: true,
        timezone: true,
      },
      where: { userId: user.id },
    });

    const isNewSignup =
      signupSettings?.createdAt &&
      Date.now() - signupSettings.createdAt.getTime() < NEW_SIGNUP_WINDOW_MS;

    if (!isNewSignup) {
      return {
        data: signupSettings ? formatSettingsPatchData(signupSettings) : null,
        skipped: true as const,
        success: true as const,
      };
    }
  }

  const existingSettings = await db.userSettings.findUnique({
    select: { id: true },
    where: { userId: user.id },
  });

  const result = existingSettings
    ? await db.userSettings.update({
        data: updatePayload,
        where: { userId: user.id },
      })
    : await db.userSettings.create({
        data: {
          aiMessagesMonthResetAt: new Date(),
          nextReminderAtUtc: new Date(),
          userId: user.id,
          ...updatePayload,
        },
      });

  if (input.productAnalyticsEnabled !== undefined) {
    invalidateProductAnalyticsCache(user.id);
  }

  return {
    data: formatSettingsPatchData(result),
    success: true as const,
  };
}
