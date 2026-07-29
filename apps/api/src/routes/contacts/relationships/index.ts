/**
 * Contacts — Relationship Routes
 * Handles creation, retrieval, and deletion of relationships between contacts.
 */

import type { RelationshipType } from "@bondery/schemas";
import {
  contactRelationshipResponseSchema,
  contactRelationshipsResponseSchema,
  createContactRelationshipInputSchema,
  messageResponseSchema,
  updateContactRelationshipInputSchema,
} from "@bondery/schemas";
import {
  avatarTransformQuerySchema,
  contactRelationshipIdParamSchema,
  uuidParamSchema,
} from "@bondery/schemas/http";
import { conflictResponse } from "@bondery/schemas/http/responses";
import type { FastifyZodOpenApiSchema } from "fastify-zod-openapi";
import { domainDb } from "../../../domains/_shared/domain-db.js";
import {
  createRelationship,
  deleteRelationship,
  updateRelationship,
} from "../../../domains/contacts/relationships.js";
import { extractAvatarOptions } from "../../../lib/data/select-fragments.js";
import { domainContextFromRequest } from "../../../lib/platform/domain-context.js";
import { notFound } from "../../../lib/platform/errors/http-errors.js";
import type { AppFastifyInstance } from "../../../lib/platform/fastify-types.js";
import { withCreatedResponse, withOkResponse } from "../../../lib/platform/openapi/responses.js";
import { withDomainRoute } from "../../../lib/platform/with-domain-route.js";
import { resolveContactAvatarUrl } from "../../../lib/storage/avatar-urls.js";

const RELATIONSHIP_TYPES: RelationshipType[] = [
  "parent",
  "child",
  "spouse",
  "partner",
  "sibling",
  "friend",
  "colleague",
  "neighbor",
  "guardian",
  "dependent",
  "other",
] satisfies RelationshipType[];

function _isRelationshipType(value: string): value is RelationshipType {
  return RELATIONSHIP_TYPES.includes(value as RelationshipType);
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

export function registerRelationshipRoutes(fastify: AppFastifyInstance): void {
  fastify.get(
    "/:id/relationships",
    {
      schema: {
        description: "List relationships for a contact.",
        params: uuidParamSchema,
        querystring: avatarTransformQuerySchema,
        response: withOkResponse(contactRelationshipsResponseSchema, "Contact relationships"),
      } satisfies FastifyZodOpenApiSchema,
    },
    async (request) => {
      const ctx = domainContextFromRequest(request);
      const db = domainDb(ctx);
      const { user } = ctx;
      const avatarOpts = extractAvatarOptions(request.query);
      const { id: personId } = request.params;

      const person = await db.people.findFirst({
        select: { id: true },
        where: { id: personId, userId: user.id },
      });

      if (!person) {
        throw notFound("Contact not found", "not_found");
      }

      const rows = await db.peopleRelationship.findMany({
        orderBy: { createdAt: "asc" },
        where: {
          OR: [{ sourcePersonId: personId }, { targetPersonId: personId }],
          userId: user.id,
        },
      });

      if (rows.length === 0) {
        return { relationships: [] };
      }

      const personIds = Array.from(
        new Set(
          rows.flatMap((relationship) => [
            relationship.sourcePersonId,
            relationship.targetPersonId,
          ]),
        ),
      );

      const peopleRows = await db.people.findMany({
        select: {
          firstName: true,
          hasAvatar: true,
          id: true,
          lastName: true,
          updatedAt: true,
        },
        where: { id: { in: personIds }, userId: user.id },
      });

      const peopleById = new Map(peopleRows.map((personRow) => [personRow.id, personRow]));

      const formattedRelationships = rows
        .map((relationship) => {
          const sourcePerson = peopleById.get(relationship.sourcePersonId);
          const targetPerson = peopleById.get(relationship.targetPersonId);

          if (!sourcePerson || !targetPerson) {
            return null;
          }

          return {
            createdAt: relationship.createdAt.toISOString(),
            id: relationship.id,
            relationshipType: relationship.relationshipType as RelationshipType,
            sourcePerson: toContactPreview(
              sourcePerson,
              resolveContactAvatarUrl(
                user.id,
                {
                  hasAvatar: sourcePerson.hasAvatar,
                  id: sourcePerson.id,
                  updatedAt: sourcePerson.updatedAt.toISOString(),
                },
                avatarOpts,
              ),
            ),
            sourcePersonId: relationship.sourcePersonId,
            targetPerson: toContactPreview(
              targetPerson,
              resolveContactAvatarUrl(
                user.id,
                {
                  hasAvatar: targetPerson.hasAvatar,
                  id: targetPerson.id,
                  updatedAt: targetPerson.updatedAt.toISOString(),
                },
                avatarOpts,
              ),
            ),
            targetPersonId: relationship.targetPersonId,
            updatedAt: relationship.updatedAt.toISOString(),
            userId: relationship.userId,
          };
        })
        .filter(
          (relationship): relationship is NonNullable<typeof relationship> => relationship != null,
        );

      return { relationships: formattedRelationships };
    },
  );

  fastify.post(
    "/:id/relationships",
    {
      schema: {
        body: createContactRelationshipInputSchema,
        description: "Create a relationship between two contacts.",
        params: uuidParamSchema,
        response: {
          ...withCreatedResponse(contactRelationshipResponseSchema, "Relationship created"),
          ...conflictResponse,
        },
      } satisfies FastifyZodOpenApiSchema,
    },
    withDomainRoute(
      { body: createContactRelationshipInputSchema, params: uuidParamSchema },
      async (ctx, { body, params }, reply) => {
        const { data } = await createRelationship(
          ctx,
          params.id,
          body.relatedPersonId,
          body.relationshipType,
        );
        return reply.status(201).send({ relationship: data.relationship });
      },
    ),
  );

  fastify.patch(
    "/:id/relationships/:relationshipId",
    {
      schema: {
        body: updateContactRelationshipInputSchema,
        description: "Update a relationship for a contact.",
        params: contactRelationshipIdParamSchema,
        response: {
          ...withOkResponse(contactRelationshipResponseSchema, "Relationship updated"),
          ...conflictResponse,
        },
      } satisfies FastifyZodOpenApiSchema,
    },
    withDomainRoute(
      { body: updateContactRelationshipInputSchema, params: contactRelationshipIdParamSchema },
      async (ctx, { body, params }) => {
        const { data } = await updateRelationship(
          ctx,
          params.id,
          params.relationshipId,
          body.relatedPersonId,
          body.relationshipType,
        );
        return { relationship: data.relationship };
      },
    ),
  );

  fastify.delete(
    "/:id/relationships/:relationshipId",
    {
      schema: {
        description: "Delete a relationship for a contact.",
        params: contactRelationshipIdParamSchema,
        response: withOkResponse(messageResponseSchema, "Relationship deleted"),
      } satisfies FastifyZodOpenApiSchema,
    },
    withDomainRoute({ params: contactRelationshipIdParamSchema }, async (ctx, { params }) => {
      await deleteRelationship(ctx, params.id, params.relationshipId);
      return { message: "Relationship deleted successfully" };
    }),
  );
}
