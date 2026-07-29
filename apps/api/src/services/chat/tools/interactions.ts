import type { Prisma } from "@bondery/db";
import { INTERACTION_TYPES } from "@bondery/helpers";
import { tool } from "ai";
import { z } from "zod";
import type { DomainContext } from "../../../domains/_shared/context.js";
import { domainDb } from "../../../domains/_shared/domain-db.js";
import {
  addParticipantsToInteraction,
  deleteInteractionWithSummary,
  logInteraction,
  removeParticipantsFromInteraction,
  updateInteractionDetails,
} from "../../../services/interactions/index.js";
import { formatToolDomainError } from "../domain-context.js";

export function createInteractionTools(ctx: DomainContext) {
  const db = domainDb(ctx);

  return {
    add_participants_to_interaction: tool({
      description:
        "Add one or more contacts to an existing interaction. Use this when the user says 'add X to the event/meeting/interaction' or wants to include someone in an already-logged interaction. Do NOT create a new interaction in this case.",
      execute: async ({ interactionId, participantIds }) => {
        try {
          return await addParticipantsToInteraction(ctx, interactionId, participantIds);
        } catch (error) {
          return formatToolDomainError(error, "Failed to add participants");
        }
      },
      inputSchema: z.object({
        interactionId: z
          .string()
          .uuid()
          .describe("The UUID of the existing interaction to add participants to"),
        participantIds: z.array(z.string().uuid()).min(1).describe("UUIDs of the contacts to add"),
      }),
    }),

    delete_interaction: tool({
      description:
        "Delete an interaction entirely. Use this when the user wants to remove a logged interaction. This will also remove all participant links. Ask for confirmation before deleting.",
      execute: async ({ interactionId }) => {
        try {
          return await deleteInteractionWithSummary(ctx, interactionId);
        } catch (error) {
          return formatToolDomainError(error, "Failed to delete interaction");
        }
      },
      inputSchema: z.object({
        interactionId: z.string().uuid().describe("The UUID of the interaction to delete"),
      }),
    }),

    log_interaction: tool({
      description:
        "Log a new interaction with one or more contacts. Automatically updates last_interaction on each participant.",
      execute: async ({ title, type, description, date, participantIds }) => {
        try {
          return await logInteraction(ctx, {
            date,
            description,
            participantIds,
            title,
            type,
          });
        } catch (error) {
          return formatToolDomainError(error, "Failed to log interaction");
        }
      },
      inputSchema: z.object({
        date: z
          .string()
          .describe(
            "Date of the interaction in ISO format (YYYY-MM-DD). Use today if not specified.",
          ),
        description: z
          .string()
          .max(1000)
          .optional()
          .describe("Longer description or notes about the interaction"),
        participantIds: z
          .array(z.string().uuid())
          .min(1)
          .describe("UUIDs of the contacts who participated"),
        title: z.string().max(200).optional().describe("Short title or summary of the interaction"),
        type: z.enum(INTERACTION_TYPES).describe("Type of interaction"),
      }),
    }),

    remove_participants_from_interaction: tool({
      description:
        "Remove one or more contacts from an existing interaction. Use this when the user says 'remove X from the meeting' or wants to exclude someone from an already-logged interaction.",
      execute: async ({ interactionId, participantIds }) => {
        try {
          return await removeParticipantsFromInteraction(ctx, interactionId, participantIds);
        } catch (error) {
          return formatToolDomainError(error, "Failed to remove participants");
        }
      },
      inputSchema: z.object({
        interactionId: z
          .string()
          .uuid()
          .describe("The UUID of the interaction to remove participants from"),
        participantIds: z
          .array(z.string().uuid())
          .min(1)
          .describe("UUIDs of the contacts to remove"),
      }),
    }),

    search_interactions: tool({
      description:
        "Search past interactions, optionally filtering by contact, type, or date range.",
      execute: async ({ contactId, type, dateFrom, dateTo, limit }) => {
        const where: Prisma.InteractionWhereInput = {
          userId: ctx.user.id,
        };

        if (type) {
          where.type = type;
        }

        if (dateFrom || dateTo) {
          where.date = {
            ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
            ...(dateTo ? { lte: new Date(dateTo) } : {}),
          };
        }

        if (contactId) {
          where.participants = { some: { personId: contactId } };
        }

        const interactions = await db.interaction.findMany({
          include: {
            participants: {
              include: {
                person: { select: { firstName: true, lastName: true } },
              },
            },
          },
          orderBy: { date: "desc" },
          take: limit,
          where,
        });

        return {
          interactions: interactions.map((interaction) => ({
            date: interaction.date.toISOString().slice(0, 10),
            description: interaction.description,
            id: interaction.id,
            participants: interaction.participants
              .map((participant) =>
                [participant.person.firstName, participant.person.lastName]
                  .filter(Boolean)
                  .join(" "),
              )
              .filter(Boolean),
            title: interaction.title,
            type: interaction.type,
          })),
          totalFound: interactions.length,
        };
      },
      inputSchema: z.object({
        contactId: z
          .string()
          .uuid()
          .optional()
          .describe("Filter to interactions involving this contact"),
        dateFrom: z.string().optional().describe("Start date filter (YYYY-MM-DD)"),
        dateTo: z.string().optional().describe("End date filter (YYYY-MM-DD)"),
        limit: z.number().min(1).max(25).default(10).describe("Max results to return"),
        type: z.enum(INTERACTION_TYPES).optional().describe("Filter by interaction type"),
      }),
    }),

    update_interaction: tool({
      description:
        "Update an existing interaction's details such as title, type, date, or description. Use this when the user wants to edit or change information about a previously logged interaction.",
      execute: async ({ interactionId, title, type, date, description }) => {
        try {
          return await updateInteractionDetails(ctx, interactionId, {
            date,
            description,
            title,
            type,
          });
        } catch (error) {
          return formatToolDomainError(error, "Failed to update interaction");
        }
      },
      inputSchema: z.object({
        date: z.string().optional().describe("New date in ISO format (YYYY-MM-DD)"),
        description: z.string().max(1000).optional().describe("New description or notes"),
        interactionId: z.string().uuid().describe("The UUID of the interaction to update"),
        title: z.string().max(200).optional().describe("New title or summary"),
        type: z.enum(INTERACTION_TYPES).optional().describe("New interaction type"),
      }),
    }),
  };
}
