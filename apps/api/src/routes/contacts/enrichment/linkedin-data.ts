/**
 * Contacts — LinkedIn Data Routes
 */

import { prisma } from "@bondery/db";
import { linkedinCompanyUrl } from "@bondery/helpers";
import {
  linkedInDataRequestSchema,
  linkedInDataResponseSchema,
  linkedInDataUpsertResponseSchema,
} from "@bondery/schemas";
import { uuidParamSchema } from "@bondery/schemas/http";
import type { FastifyZodOpenApiSchema } from "fastify-zod-openapi";
import { upsertLinkedInWorkHistory } from "../../../domains/contacts/enrichment/linkedin-data.js";
import { getAuth } from "../../../lib/platform/auth/strategies.js";
import type { AppFastifyInstance } from "../../../lib/platform/fastify-types.js";
import { withOkResponse } from "../../../lib/platform/openapi/responses.js";
import { ENRICH_TIER } from "../../../lib/platform/rate-limit.js";
import { withDomainRoute } from "../../../lib/platform/with-domain-route.js";
import { buildLinkedinLogoUrl } from "../../../lib/storage/avatar-urls.js";

export function registerLinkedInDataRoutes(fastify: AppFastifyInstance): void {
  fastify.post(
    "/:id/linkedin-data",
    {
      config: { rateLimit: ENRICH_TIER },
      schema: {
        body: linkedInDataRequestSchema,
        description: "Upsert scraped LinkedIn work history for a contact.",
        params: uuidParamSchema,
        response: withOkResponse(linkedInDataUpsertResponseSchema, "LinkedIn data upserted"),
      } satisfies FastifyZodOpenApiSchema,
    },
    withDomainRoute(
      { body: linkedInDataRequestSchema, params: uuidParamSchema },
      async (ctx, { body, params }) =>
        upsertLinkedInWorkHistory(ctx, params.id, body.workHistory ?? []),
    ),
  );

  fastify.get(
    "/:id/linkedin-data",
    {
      schema: {
        description: "Get LinkedIn work history and education for a contact.",
        params: uuidParamSchema,
        response: withOkResponse(linkedInDataResponseSchema, "LinkedIn data"),
      } satisfies FastifyZodOpenApiSchema,
    },
    async (request) => {
      const { user } = getAuth(request);
      const { id: personId } = request.params;

      const linkedinRow = await prisma.peopleLinkedin.findFirst({
        select: { bio: true, id: true, updatedAt: true },
        where: { personId, userId: user.id },
      });

      if (!linkedinRow) {
        return { education: [], linkedinBio: null, syncedAt: null, workHistory: [] };
      }

      const [workHistory, education] = await Promise.all([
        prisma.peopleWorkHistory.findMany({
          orderBy: { startDate: "desc" },
          where: { peopleLinkedinId: linkedinRow.id, userId: user.id },
        }),
        prisma.peopleEducationHistory.findMany({
          orderBy: { startDate: "desc" },
          where: { peopleLinkedinId: linkedinRow.id, userId: user.id },
        }),
      ]);

      const sortByActiveFirst = <T extends { endDate: Date | null; startDate: Date | null }>(
        rows: T[],
      ): T[] =>
        rows.sort((a, b) => {
          const aActive = a.endDate === null;
          const bActive = b.endDate === null;
          if (aActive !== bActive) {
            return aActive ? -1 : 1;
          }
          if (!a.startDate && !b.startDate) {
            return 0;
          }
          if (!a.startDate) {
            return 1;
          }
          if (!b.startDate) {
            return -1;
          }
          return a.startDate > b.startDate ? -1 : 1;
        });

      return {
        education: sortByActiveFirst(education).map((row) => ({
          createdAt: row.createdAt.toISOString(),
          degree: row.degree,
          description: row.description,
          endDate: row.endDate?.toISOString().slice(0, 10) ?? null,
          id: row.id,
          peopleLinkedinId: row.peopleLinkedinId,
          schoolLinkedinUrl: linkedinCompanyUrl(row.schoolLinkedinId),
          schoolLogoUrl: row.schoolLinkedinId
            ? buildLinkedinLogoUrl(user.id, row.schoolLinkedinId)
            : null,
          schoolName: row.schoolName,
          startDate: row.startDate?.toISOString().slice(0, 10) ?? null,
          updatedAt: row.updatedAt.toISOString(),
          userId: row.userId,
        })),
        linkedinBio: linkedinRow.bio ?? null,
        syncedAt: linkedinRow.updatedAt.toISOString(),
        workHistory: sortByActiveFirst(workHistory).map((row) => ({
          companyLinkedinUrl: linkedinCompanyUrl(row.companyLinkedinId),
          companyLogoUrl: row.companyLinkedinId
            ? buildLinkedinLogoUrl(user.id, row.companyLinkedinId)
            : null,
          companyName: row.companyName,
          createdAt: row.createdAt.toISOString(),
          description: row.description,
          employmentType: row.employmentType,
          endDate: row.endDate?.toISOString().slice(0, 10) ?? null,
          id: row.id,
          location: row.location,
          peopleLinkedinId: row.peopleLinkedinId,
          startDate: row.startDate?.toISOString().slice(0, 10) ?? null,
          title: row.title,
          updatedAt: row.updatedAt.toISOString(),
          userId: row.userId,
        })),
      };
    },
  );
}
