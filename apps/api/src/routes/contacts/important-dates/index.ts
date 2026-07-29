/**
 * Contacts — Important Dates Routes
 * Handles important dates (birthdays, anniversaries, etc.) and upcoming reminders.
 */

import type { ImportantDateType, UpcomingReminder } from "@bondery/schemas";
import {
  importantDatesListResponseSchema,
  upcomingRemindersResponseSchema,
} from "@bondery/schemas";
import {
  avatarTransformQuerySchema,
  importantDatesReplaceBodySchema,
  uuidParamSchema,
} from "@bondery/schemas/http";
import { conflictResponse } from "@bondery/schemas/http/responses";
import type { FastifyZodOpenApiSchema } from "fastify-zod-openapi";
import { domainDb } from "../../../domains/_shared/domain-db.js";
import { replaceImportantDates } from "../../../domains/contacts/important-dates.js";
import {
  deriveReminderDateKey,
  toImportantDateFromPrisma,
} from "../../../lib/contacts/important-dates.js";
import { extractAvatarOptions } from "../../../lib/data/select-fragments.js";
import { domainContextFromRequest } from "../../../lib/platform/domain-context.js";
import { notFound } from "../../../lib/platform/errors/http-errors.js";
import type { AppFastifyInstance } from "../../../lib/platform/fastify-types.js";
import { withOkResponse } from "../../../lib/platform/openapi/responses.js";
import { withDomainRoute } from "../../../lib/platform/with-domain-route.js";
import { resolveContactAvatarUrl } from "../../../lib/storage/avatar-urls.js";

export const IMPORTANT_DATE_TYPES = [
  "birthday",
  "anniversary",
  "nameday",
  "graduation",
  "other",
] satisfies ImportantDateType[];

export const IMPORTANT_DATE_NOTIFY_VALUES = [1, 3, 7] as const;

// ── Helpers ──────────────────────────────────────────────────────

export function isImportantDateType(value: string): value is ImportantDateType {
  return IMPORTANT_DATE_TYPES.includes(value as ImportantDateType);
}

export function isValidImportantDateNotifyDaysBefore(value: number): boolean {
  return (IMPORTANT_DATE_NOTIFY_VALUES as readonly number[]).includes(value);
}

function toContactPreview(
  person: {
    id: string;
    firstName: string;
    lastName: string | null;
  },
  avatarUrl: string | null,
) {
  return {
    avatar: avatarUrl,
    firstName: person.firstName,
    id: person.id,
    lastName: person.lastName,
  };
}

export {
  deriveReminderDateKey,
  toImportantDate,
  toIsoDateKey,
} from "../../../lib/contacts/important-dates.js";

// ── Route Registration ───────────────────────────────────────────

export function registerUpcomingImportantDateRoutes(fastify: AppFastifyInstance): void {
  /**
   * GET /api/contacts/important-dates/upcoming - List upcoming reminders with notification configured
   */
  fastify.get(
    "/important-dates/upcoming",
    {
      schema: {
        description: "List upcoming important-date reminders with notifications configured.",
        querystring: avatarTransformQuerySchema,
        response: withOkResponse(upcomingRemindersResponseSchema, "Upcoming reminders"),
      } satisfies FastifyZodOpenApiSchema,
    },
    async (request) => {
      const ctx = domainContextFromRequest(request);
      const db = domainDb(ctx);
      const { user } = ctx;
      const avatarOptions = extractAvatarOptions(request.query);

      const today = new Date();
      const startDate = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
      );
      const endDate = new Date(startDate);
      endDate.setUTCMonth(endDate.getUTCMonth() + 1);

      const startDateIso = startDate.toISOString().slice(0, 10);
      const endDateIso = endDate.toISOString().slice(0, 10);

      const rows = await db.peopleImportantDate.findMany({
        include: {
          person: {
            select: {
              firstName: true,
              hasAvatar: true,
              id: true,
              lastName: true,
              updatedAt: true,
            },
          },
        },
        orderBy: { date: "asc" },
        where: {
          OR: [{ notifyDaysBefore: { not: null } }, { notifyOn: { not: null } }],
          userId: user.id,
        },
      });

      const reminderRows = rows.filter((row) => {
        const reminderDateKey = deriveReminderDateKey(row);
        if (!reminderDateKey) {
          return false;
        }

        return reminderDateKey >= startDateIso && reminderDateKey <= endDateIso;
      });

      const reminderDateKeys = Array.from(
        new Set(
          reminderRows
            .map((row) => deriveReminderDateKey(row))
            .filter((value): value is string => Boolean(value)),
        ),
      );

      let latestDispatchByReminderDate = new Map<string, string>();
      if (reminderDateKeys.length > 0) {
        const dispatchRows = await db.reminderDispatchLog.findMany({
          orderBy: { createdAt: "desc" },
          select: { createdAt: true, reminderDate: true },
          where: {
            reminderDate: { in: reminderDateKeys.map((key) => new Date(`${key}T00:00:00.000Z`)) },
            userId: user.id,
          },
        });

        latestDispatchByReminderDate = dispatchRows.reduce((accumulator, row) => {
          const reminderDateKey = row.reminderDate.toISOString().slice(0, 10);
          if (!accumulator.has(reminderDateKey)) {
            accumulator.set(reminderDateKey, row.createdAt.toISOString());
          }

          return accumulator;
        }, new Map<string, string>());
      }

      const reminders: UpcomingReminder[] = reminderRows
        .map((row) => {
          const person = row.person;
          if (!person) {
            return null;
          }

          const importantDate = toImportantDateFromPrisma(row);
          const reminderDateKey = deriveReminderDateKey(row);
          const notificationSentAt = reminderDateKey
            ? latestDispatchByReminderDate.get(reminderDateKey) || null
            : null;

          return {
            importantDate,
            notificationSent: Boolean(notificationSentAt),
            notificationSentAt,
            person: toContactPreview(
              person,
              resolveContactAvatarUrl(
                user.id,
                {
                  hasAvatar: person.hasAvatar,
                  id: person.id,
                  updatedAt: person.updatedAt.toISOString(),
                },
                avatarOptions,
              ),
            ),
          };
        })
        .filter((value): value is NonNullable<typeof value> => value != null)
        .sort((a, b) => {
          const aReminderDate = deriveReminderDateKey({
            date: a.importantDate.date,
            notifyDaysBefore: a.importantDate.notifyDaysBefore,
            notifyOn: a.importantDate.notifyOn,
          });
          const bReminderDate = deriveReminderDateKey({
            date: b.importantDate.date,
            notifyDaysBefore: b.importantDate.notifyDaysBefore,
            notifyOn: b.importantDate.notifyOn,
          });

          if (aReminderDate && bReminderDate && aReminderDate !== bReminderDate) {
            return aReminderDate.localeCompare(bReminderDate);
          }

          return a.importantDate.date.localeCompare(b.importantDate.date);
        });

      return { reminders };
    },
  );
}

export function registerContactImportantDateRoutes(fastify: AppFastifyInstance): void {
  /**
   * GET /api/contacts/:id/important-dates - Get normalized important dates for a person
   */
  fastify.get(
    "/:id/important-dates",
    {
      schema: {
        description: "Get important dates for a contact.",
        params: uuidParamSchema,
        response: withOkResponse(importantDatesListResponseSchema, "Important dates"),
      } satisfies FastifyZodOpenApiSchema,
    },
    async (request) => {
      const ctx = domainContextFromRequest(request);
      const db = domainDb(ctx);
      const { user } = ctx;
      const { id: personId } = request.params;

      const person = await db.people.findFirst({
        select: { id: true },
        where: { id: personId, userId: user.id },
      });

      if (!person) {
        throw notFound("Contact not found", "not_found");
      }

      const rows = await db.peopleImportantDate.findMany({
        orderBy: { createdAt: "asc" },
        where: { personId, userId: user.id },
      });

      return {
        dates: rows.map(toImportantDateFromPrisma),
      };
    },
  );

  /**
   * PUT /api/contacts/:id/important-dates - Replace normalized important dates for a person
   */
  fastify.put(
    "/:id/important-dates",
    {
      schema: {
        body: importantDatesReplaceBodySchema,
        description: "Replace all important dates for a contact.",
        params: uuidParamSchema,
        response: {
          ...withOkResponse(importantDatesListResponseSchema, "Important dates replaced"),
          ...conflictResponse,
        },
      } satisfies FastifyZodOpenApiSchema,
    },
    withDomainRoute(
      { body: importantDatesReplaceBodySchema, params: uuidParamSchema },
      async (ctx, { body, params }) => {
        const { data } = await replaceImportantDates(ctx, params.id, body.dates);
        return { dates: data.dates };
      },
    ),
  );
}
