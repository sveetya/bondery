import type { PrismaClient } from "@bondery/db";

/** Overdue keep-in-touch contact count via Postgres RPC (`get_keep_in_touch_overdue_count`). */
export async function getKeepInTouchOverdueCount(
  db: PrismaClient,
  userId: string,
): Promise<number> {
  const rows = await db.$queryRaw<{ count: number }[]>`
    SELECT get_keep_in_touch_overdue_count(${userId}::uuid) AS count
  `;
  return rows[0]?.count ?? 0;
}
