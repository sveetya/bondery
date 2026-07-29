import { tool } from "ai";
import { z } from "zod";
import type { DomainContext } from "../../../domains/_shared/context.js";
import { domainDb } from "../../../domains/_shared/domain-db.js";
import {
  addTagMembers,
  createTag,
  deleteTag,
  removeTagMembers,
  updateTag,
} from "../../../domains/tags/index.js";
import { formatToolDomainError } from "../domain-context.js";

export function createTagTools(ctx: DomainContext) {
  const db = domainDb(ctx);

  return {
    add_tag_to_contacts: tool({
      description: "Apply a tag to one or more contacts. Skips contacts that already have the tag.",
      execute: async ({ tagId, personIds }) => {
        try {
          await addTagMembers(ctx, tagId, personIds);
        } catch (error) {
          return formatToolDomainError(error, "Failed to tag contacts");
        }

        const people = await db.people.findMany({
          select: { firstName: true, lastName: true },
          where: { id: { in: personIds } },
        });

        const names =
          people
            .map((person) => [person.firstName, person.lastName].filter(Boolean).join(" "))
            .join(", ") || "unknown";

        return { message: `Tagged ${names}.`, tagId };
      },
      inputSchema: z.object({
        personIds: z.array(z.string().uuid()).min(1).describe("UUIDs of the contacts to tag"),
        tagId: z.string().uuid().describe("The UUID of the tag"),
      }),
    }),

    create_tag: tool({
      description:
        "Create a new tag. A color is automatically assigned from a rotating palette unless provided.",
      execute: async ({ label, color }) => {
        try {
          const { data } = await createTag(ctx, { color, label });
          const tag = data.tag;
          return {
            color: tag.color,
            id: tag.id,
            label: tag.label,
            message: `Created tag "${tag.label}"`,
          };
        } catch (error) {
          return formatToolDomainError(error, "Failed to create tag");
        }
      },
      inputSchema: z.object({
        color: z.string().optional().describe("Optional hex color override (e.g. '#3B82F6')"),
        label: z.string().min(1).max(100).describe("Tag label"),
      }),
    }),

    delete_tag: tool({
      description:
        "Delete a tag entirely. This removes the tag but does not delete the contacts associated with it. Ask for confirmation before deleting.",
      execute: async ({ tagId }) => {
        const tag = await db.tag.findFirst({
          select: { label: true },
          where: { id: tagId, userId: ctx.user.id },
        });

        try {
          await deleteTag(ctx, tagId);
          return { message: `Deleted tag "${tag?.label ?? "(unknown)"}"` };
        } catch (error) {
          return formatToolDomainError(error, "Failed to delete tag");
        }
      },
      inputSchema: z.object({
        tagId: z.string().uuid().describe("The UUID of the tag to delete"),
      }),
    }),

    remove_tag_from_contacts: tool({
      description: "Remove a tag from one or more contacts. Does not delete the tag itself.",
      execute: async ({ tagId, personIds }) => {
        try {
          await removeTagMembers(ctx, tagId, personIds);
        } catch (error) {
          return formatToolDomainError(error, "Failed to remove tag from contacts");
        }

        const people = await db.people.findMany({
          select: { firstName: true, lastName: true },
          where: { id: { in: personIds } },
        });

        const names =
          people
            .map((person) => [person.firstName, person.lastName].filter(Boolean).join(" "))
            .join(", ") || "unknown";

        return { message: `Removed tag from ${names}.`, tagId };
      },
      inputSchema: z.object({
        personIds: z.array(z.string().uuid()).min(1).describe("UUIDs of the contacts to untag"),
        tagId: z.string().uuid().describe("The UUID of the tag"),
      }),
    }),

    search_tags: tool({
      description: "Search tags by label. Returns all tags if no query is provided.",
      execute: async ({ query, limit }) => {
        const tags = await db.tag.findMany({
          orderBy: { label: "asc" },
          take: limit,
          where: {
            userId: ctx.user.id,
            ...(query ? { label: { contains: query, mode: "insensitive" } } : {}),
          },
        });

        const tagIds = tags.map((tag) => tag.id);
        const memberships = await db.peopleTag.findMany({
          select: { tagId: true },
          where: { tagId: { in: tagIds }, userId: ctx.user.id },
        });

        const countMap = new Map<string, number>();
        for (const membership of memberships) {
          countMap.set(membership.tagId, (countMap.get(membership.tagId) ?? 0) + 1);
        }

        return {
          tags: tags.map((tag) => ({
            color: tag.color,
            contactCount: countMap.get(tag.id) ?? 0,
            id: tag.id,
            label: tag.label,
          })),
          totalFound: tags.length,
        };
      },
      inputSchema: z.object({
        limit: z.number().min(1).max(25).default(10).describe("Max results to return"),
        query: z.string().optional().describe("Free-text search across tag labels"),
      }),
    }),

    update_tag: tool({
      description: "Update an existing tag's label or color.",
      execute: async ({ tagId, label, color }) => {
        try {
          await updateTag(ctx, tagId, { color, label });
          return { message: "Tag updated successfully.", tagId };
        } catch (error) {
          return formatToolDomainError(error, "Failed to update tag");
        }
      },
      inputSchema: z.object({
        color: z.string().optional().describe("New hex color"),
        label: z.string().min(1).max(100).optional().describe("New tag label"),
        tagId: z.string().uuid().describe("The UUID of the tag to update"),
      }),
    }),
  };
}
