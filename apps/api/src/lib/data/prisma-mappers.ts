import type { Prisma } from "@bondery/db";

export const contactListSelect = {
  createdAt: true,
  firstName: true,
  hasAvatar: true,
  headline: true,
  id: true,
  keepFrequencyDays: true,
  language: true,
  lastInteraction: true,
  lastInteractionActivityId: true,
  latitude: true,
  location: true,
  longitude: true,
  middleName: true,
  myself: true,
  notes: true,
  notesUpdatedAt: true,
  timezone: true,
  updatedAt: true,
  userId: true,
  lastName: true,
} satisfies Prisma.PeopleSelect;

export type ContactListRecord = Prisma.PeopleGetPayload<{ select: typeof contactListSelect }>;

export function mapContactListRecord(contact: ContactListRecord) {
  return {
    createdAt: contact.createdAt.toISOString(),
    firstName: contact.firstName,
    gisPoint: null,
    hasAvatar: contact.hasAvatar,
    headline: contact.headline,
    id: contact.id,
    keepFrequencyDays: contact.keepFrequencyDays,
    language: contact.language,
    lastInteraction: contact.lastInteraction?.toISOString() ?? null,
    lastInteractionActivityId: contact.lastInteractionActivityId,
    latitude: contact.latitude,
    location: contact.location,
    longitude: contact.longitude,
    middleName: contact.middleName,
    myself: contact.myself,
    notes: contact.notes,
    notesUpdatedAt: contact.notesUpdatedAt?.toISOString() ?? null,
    timezone: contact.timezone,
    updatedAt: contact.updatedAt.toISOString(),
    userId: contact.userId,
    lastName: contact.lastName,
  };
}

export const tagSelect = {
  color: true,
  createdAt: true,
  id: true,
  label: true,
  updatedAt: true,
  userId: true,
} satisfies Prisma.TagSelect;

export function mapTagRecord(tag: Prisma.TagGetPayload<{ select: typeof tagSelect }>) {
  return {
    color: tag.color,
    createdAt: tag.createdAt.toISOString(),
    id: tag.id,
    label: tag.label,
    updatedAt: tag.updatedAt.toISOString(),
    userId: tag.userId,
  };
}

export const chatSessionSelect = {
  createdAt: true,
  id: true,
  title: true,
  updatedAt: true,
  userId: true,
} satisfies Prisma.ChatSessionSelect;

export function mapChatSessionRecord(
  session: Prisma.ChatSessionGetPayload<{ select: typeof chatSessionSelect }>,
) {
  return {
    createdAt: session.createdAt.toISOString(),
    id: session.id,
    title: session.title,
    updatedAt: session.updatedAt.toISOString(),
    userId: session.userId,
  };
}

export const chatMessageSelect = {
  content: true,
  createdAt: true,
  id: true,
  role: true,
  sessionId: true,
} satisfies Prisma.ChatMessageSelect;

export function mapChatMessageRecord(
  message: Prisma.ChatMessageGetPayload<{ select: typeof chatMessageSelect }>,
) {
  return {
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    id: message.id,
    role: message.role,
    sessionId: message.sessionId,
  };
}
