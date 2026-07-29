import { createGroupSchema, updateGroupSchema } from "@bondery/schemas";
import { tool } from "ai";
import { z } from "zod";
import type { DomainContext } from "../../../domains/_shared/context.js";
import { domainDb } from "../../../domains/_shared/domain-db.js";
import {
  addGroupMembers,
  createGroup,
  deleteGroup,
  removeGroupMembers,
  updateGroup,
} from "../../../domains/groups/index.js";
import { formatToolDomainError } from "../domain-context.js";

export function createGroupTools(ctx: DomainContext) {
  const db = domainDb(ctx);

  return {
    add_contacts_to_group: tool({
      description: "Add one or more contacts to a group. Skips contacts that are already members.",
      execute: async ({ groupId, personIds }) => {
        try {
          await addGroupMembers(ctx, groupId, personIds);
        } catch (error) {
          return formatToolDomainError(error, "Failed to add contacts to group");
        }

        const people = await db.people.findMany({
          select: { firstName: true, lastName: true },
          where: { id: { in: personIds } },
        });

        const names =
          people
            .map((person) => [person.firstName, person.lastName].filter(Boolean).join(" "))
            .join(", ") || "unknown";

        return { groupId, message: `Added ${names} to the group.` };
      },
      inputSchema: z.object({
        groupId: z.string().uuid().describe("The UUID of the group"),
        personIds: z.array(z.string().uuid()).min(1).describe("UUIDs of the contacts to add"),
      }),
    }),

    create_group: tool({
      description:
        "Create a new group for organizing contacts. Returns the created group's details.",
      execute: async ({ label, emoji, color }) => {
        try {
          const { data } = await createGroup(ctx, { color, emoji, label });
          const group = data.group;
          return {
            color: group.color,
            emoji: group.emoji,
            id: group.id,
            label: group.label,
            message: `Created group "${group.label}"`,
          };
        } catch (error) {
          return formatToolDomainError(error, "Failed to create group");
        }
      },
      inputSchema: createGroupSchema,
    }),

    delete_group: tool({
      description:
        "Delete a group entirely. This removes the group but does not delete the contacts in it. Ask for confirmation before deleting.",
      execute: async ({ groupId }) => {
        const group = await db.group.findFirst({
          select: { label: true },
          where: { id: groupId, userId: ctx.user.id },
        });

        try {
          await deleteGroup(ctx, groupId);
          return { message: `Deleted group "${group?.label ?? "(unknown)"}"` };
        } catch (error) {
          return formatToolDomainError(error, "Failed to delete group");
        }
      },
      inputSchema: z.object({
        groupId: z.string().uuid().describe("The UUID of the group to delete"),
      }),
    }),

    remove_contacts_from_group: tool({
      description:
        "Remove one or more contacts from a group. Does not delete the contacts themselves.",
      execute: async ({ groupId, personIds }) => {
        try {
          await removeGroupMembers(ctx, groupId, personIds);
        } catch (error) {
          return formatToolDomainError(error, "Failed to remove contacts from group");
        }

        const people = await db.people.findMany({
          select: { firstName: true, lastName: true },
          where: { id: { in: personIds } },
        });

        const names =
          people
            .map((person) => [person.firstName, person.lastName].filter(Boolean).join(" "))
            .join(", ") || "unknown";

        return { groupId, message: `Removed ${names} from the group.` };
      },
      inputSchema: z.object({
        groupId: z.string().uuid().describe("The UUID of the group"),
        personIds: z.array(z.string().uuid()).min(1).describe("UUIDs of the contacts to remove"),
      }),
    }),

    search_groups: tool({
      description: "Search groups by name. Returns all groups if no query is provided.",
      execute: async ({ query, limit }) => {
        const groups = await db.group.findMany({
          orderBy: { label: "asc" },
          take: limit,
          where: {
            userId: ctx.user.id,
            ...(query ? { label: { contains: query, mode: "insensitive" } } : {}),
          },
        });

        const groupIds = groups.map((group) => group.id);
        const memberships = await db.peopleGroup.findMany({
          select: { groupId: true },
          where: { groupId: { in: groupIds }, userId: ctx.user.id },
        });

        const countMap = new Map<string, number>();
        for (const membership of memberships) {
          countMap.set(membership.groupId, (countMap.get(membership.groupId) ?? 0) + 1);
        }

        return {
          groups: groups.map((group) => ({
            color: group.color,
            contactCount: countMap.get(group.id) ?? 0,
            emoji: group.emoji,
            id: group.id,
            label: group.label,
          })),
          totalFound: groups.length,
        };
      },
      inputSchema: z.object({
        limit: z.number().min(1).max(25).default(10).describe("Max results to return"),
        query: z.string().optional().describe("Free-text search across group names"),
      }),
    }),

    update_group: tool({
      description: "Update an existing group's name, emoji, or color.",
      execute: async ({ groupId, label, emoji, color }) => {
        try {
          await updateGroup(ctx, groupId, { color, emoji, label });
          return { groupId, message: "Group updated successfully." };
        } catch (error) {
          return formatToolDomainError(error, "Failed to update group");
        }
      },
      inputSchema: updateGroupSchema.extend({
        groupId: z.string().uuid().describe("The UUID of the group to update"),
      }),
    }),
  };
}
