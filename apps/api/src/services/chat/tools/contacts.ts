import type { Prisma } from "@bondery/db";
import { createSocialUrl } from "@bondery/helpers";
import { tool } from "ai";
import { z } from "zod";
import type { DomainContext } from "../../../domains/_shared/context.js";
import { domainDb } from "../../../domains/_shared/domain-db.js";
import { createContact } from "../../../domains/contacts/index.js";
import { searchPeopleIdsWithDb } from "../../../lib/data/search-prisma.js";
import { resolveContactAvatarUrl } from "../../../lib/storage/avatar-urls.js";
import { formatToolDomainError } from "../domain-context.js";

const contactDetailsInclude = {
  addresses: true,
  emails: { select: { preferred: true, type: true, value: true } },
  groups: {
    include: {
      group: { select: { color: true, emoji: true, id: true, label: true } },
    },
  },
  importantDates: true,
  linkedin: {
    include: {
      educationHistory: true,
      workHistory: true,
    },
  },
  phones: { select: { preferred: true, prefix: true, type: true, value: true } },
  socials: { select: { handle: true, platform: true } },
  tags: {
    include: {
      tag: { select: { color: true, id: true, label: true } },
    },
  },
} satisfies Prisma.PeopleInclude;

async function fetchContactDetails(ctx: DomainContext, contactId: string) {
  const { user } = ctx;
  const db = domainDb(ctx);

  const person = await db.people.findFirst({
    include: contactDetailsInclude,
    where: { id: contactId, userId: user.id },
  });

  if (!person) {
    return { error: "Contact not found" };
  }

  return {
    addresses: person.addresses,
    avatar: resolveContactAvatarUrl(user.id, {
      hasAvatar: person.hasAvatar,
      id: person.id,
      updatedAt: person.updatedAt.toISOString(),
    }),
    createdAt: person.createdAt.toISOString(),
    emails: person.emails,
    firstName: person.firstName,
    fullName: [person.firstName, person.middleName, person.lastName].filter(Boolean).join(" "),
    groups: person.groups.map((membership) => ({
      color: membership.group.color,
      emoji: membership.group.emoji,
      id: membership.group.id,
      label: membership.group.label,
    })),
    headline: person.headline,
    id: person.id,
    importantDates: person.importantDates,
    keepFrequencyDays: person.keepFrequencyDays,
    language: person.language,
    lastInteraction: person.lastInteraction?.toISOString() ?? null,
    lastName: person.lastName,
    linkedin: person.linkedin
      ? {
          bio: person.linkedin.bio,
          educationHistory: person.linkedin.educationHistory.map((entry) => ({
            degree: entry.degree,
            description: entry.description,
            endDate: entry.endDate?.toISOString().slice(0, 10) ?? null,
            schoolLinkedinId: entry.schoolLinkedinId,
            schoolName: entry.schoolName,
            startDate: entry.startDate?.toISOString().slice(0, 10) ?? null,
          })),
          updatedAt: person.linkedin.updatedAt.toISOString(),
          workHistory: person.linkedin.workHistory.map((entry) => ({
            companyLinkedinId: entry.companyLinkedinId,
            companyName: entry.companyName,
            description: entry.description,
            employmentType: entry.employmentType,
            endDate: entry.endDate?.toISOString().slice(0, 10) ?? null,
            location: entry.location,
            startDate: entry.startDate?.toISOString().slice(0, 10) ?? null,
            title: entry.title,
          })),
        }
      : null,
    location: person.location,
    middleName: person.middleName,
    notes: person.notes,
    phones: person.phones,
    socials: person.socials.map((social) => ({
      handle: social.handle,
      platform: social.platform,
      url: createSocialUrl(social.platform, social.handle) || null,
    })),
    tags: person.tags.map((membership) => ({
      color: membership.tag.color,
      id: membership.tag.id,
      label: membership.tag.label,
    })),
    timezone: person.timezone,
  };
}

export function createContactTools(ctx: DomainContext) {
  const { user } = ctx;
  const db = domainDb(ctx);

  return {
    create_contact: tool({
      description:
        "Create a new contact. Returns the created contact's ID and a link to their page.",
      execute: async ({ firstName, lastName }) => {
        try {
          const { data } = await createContact(ctx, {
            firstName,
            lastName,
          });
          const contact = data.contact;
          const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(" ");
          return {
            fullName,
            id: data.personId,
            message: `Created contact "${fullName}"`,
          };
        } catch (error) {
          return formatToolDomainError(error, "Failed to create contact");
        }
      },
      inputSchema: z.object({
        firstName: z.string().min(1).max(50).describe("First name (required)"),
        headline: z.string().max(100).optional().describe("Headline or title"),
        language: z.string().max(5).optional().describe("Language code, e.g. 'en', 'cs', 'es'"),
        lastName: z.string().max(50).optional().describe("Last name"),
        location: z.string().max(100).optional().describe("Location"),
        notes: z.string().max(500).optional().describe("Notes about the contact"),
      }),
    }),

    get_contact_details: tool({
      description:
        "Get full details of a specific contact by ID, including phones, emails, addresses, tags, and social links.",
      execute: async ({ contactId }) => fetchContactDetails(ctx, contactId),
      inputSchema: z.object({
        contactId: z.string().uuid().describe("The contact's UUID"),
      }),
    }),

    get_myself_details: tool({
      description:
        "Get the full profile of the current user (their own 'myself' contact), including phones, emails, addresses, LinkedIn bio, work history, education, tags, and groups. Use this when the user asks about themselves.",
      execute: async () => fetchContactDetails(ctx, user.id),
      inputSchema: z.object({}),
    }),

    search_contacts: tool({
      description:
        "Search contacts by name, location, tag, language, or headline. Returns up to 10 matches.",
      execute: async ({ query, tag, language, location, limit }) => {
        let matchedIds: string[] | null = null;

        if (query) {
          const { ranked, error } = await searchPeopleIdsWithDb(db, user.id, query, limit);

          if (error) {
            return { error: `Failed to search contacts: ${error}` };
          }

          if (ranked && ranked.length > 0) {
            matchedIds = ranked.map((row) => row.id);
          } else {
            const fallback = await db.people.findMany({
              select: { id: true },
              take: limit,
              where: {
                myself: false,
                OR: [
                  { headline: { contains: query, mode: "insensitive" } },
                  { location: { contains: query, mode: "insensitive" } },
                  { notes: { contains: query, mode: "insensitive" } },
                ],
                userId: user.id,
              },
            });

            matchedIds = fallback.map((row) => row.id);
          }
        }

        const where: Prisma.PeopleWhereInput = {
          myself: false,
          userId: user.id,
        };

        if (matchedIds !== null) {
          if (matchedIds.length === 0) {
            return { contacts: [], totalFound: 0 };
          }
          where.id = { in: matchedIds };
        }

        if (language) {
          where.language = language;
        }

        if (location) {
          where.location = { contains: location, mode: "insensitive" };
        }

        const contacts = await db.people.findMany({
          include: {
            tags: {
              include: {
                tag: { select: { color: true, label: true } },
              },
            },
          },
          orderBy: { firstName: "asc" },
          take: limit,
          where,
        });

        let results = contacts;

        if (tag) {
          results = results.filter((contact) =>
            contact.tags.some(
              (membership) => membership.tag.label.toLowerCase() === tag.toLowerCase(),
            ),
          );
        }

        return {
          contacts: results.map((contact) => ({
            avatar: resolveContactAvatarUrl(user.id, {
              hasAvatar: contact.hasAvatar,
              id: contact.id,
              updatedAt: contact.updatedAt.toISOString(),
            }),
            firstName: contact.firstName,
            fullName: [contact.firstName, contact.middleName, contact.lastName]
              .filter(Boolean)
              .join(" "),
            headline: contact.headline,
            id: contact.id,
            keepFrequencyDays: contact.keepFrequencyDays,
            language: contact.language,
            lastInteraction: contact.lastInteraction?.toISOString() ?? null,
            lastName: contact.lastName,
            location: contact.location,
            middleName: contact.middleName,
            tags: contact.tags.map((membership) => membership.tag.label),
          })),
          totalFound: results.length,
        };
      },
      inputSchema: z.object({
        language: z.string().optional().describe("Filter by language code, e.g. 'es' for Spanish"),
        limit: z.number().min(1).max(25).default(10).describe("Max results to return"),
        location: z.string().optional().describe("Filter by location (partial match)"),
        query: z
          .string()
          .optional()
          .describe("Free-text search across name, headline, location, and notes"),
        tag: z.string().optional().describe("Filter by tag label (exact match)"),
      }),
    }),
  };
}
