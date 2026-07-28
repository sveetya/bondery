import { Prisma } from "@bondery/db";
import type { Group, Tag } from "@bondery/schemas";

export function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export function isCheckViolation(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return (
      error.code === "P2004" ||
      (typeof error.message === "string" && error.message.includes("23514"))
    );
  }
  return false;
}

export function toIso(value: Date | string | null | undefined): string | null {
  if (value == null) {
    return null;
  }
  return value instanceof Date ? value.toISOString() : value;
}

export function toGroupDto(row: {
  id: string;
  userId: string;
  label: string;
  emoji: string | null;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Group {
  return {
    color: row.color,
    createdAt: row.createdAt.toISOString(),
    emoji: row.emoji,
    id: row.id,
    label: row.label,
    updatedAt: row.updatedAt.toISOString(),
    userId: row.userId,
  };
}

export function toTagDto(row: {
  id: string;
  userId: string;
  label: string;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Tag {
  return {
    color: row.color,
    createdAt: row.createdAt.toISOString(),
    id: row.id,
    label: row.label,
    updatedAt: row.updatedAt.toISOString(),
    userId: row.userId,
  };
}

/** Prisma model row → snake_case sync payload (matches prior Supabase `select("*")`). */
export function toSyncRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    out[snakeKey] =
      value instanceof Date ? value.toISOString() : value === undefined ? null : value;
  }
  return out;
}

export function toPeopleTagSyncRow(row: {
  id: string;
  userId: string;
  personId: string;
  tagId: string;
  createdAt: Date;
}): Record<string, unknown> {
  return {
    created_at: row.createdAt.toISOString(),
    id: row.id,
    person_id: row.personId,
    tag_id: row.tagId,
    user_id: row.userId,
  };
}
