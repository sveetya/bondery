/** Tenant scoping helpers for Prisma queries (application-layer isolation). */

export function userIdWhere(userId: string): { userId: string } {
  return { userId };
}

export function ownedByUser<T extends { userId: string }>(row: T | null, userId: string): T | null {
  if (!row || row.userId !== userId) {
    return null;
  }
  return row;
}
