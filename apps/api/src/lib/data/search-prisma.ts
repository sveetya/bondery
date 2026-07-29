import type { PrismaClient } from "@bondery/db";

export interface RankedPerson {
  id: string;
  rank: number;
}

type SearchPeopleOptions = {
  groupId?: string;
  tagId?: string;
  keepInTouch?: boolean;
};

/**
 * Fuzzy people search via `search_people_ids` (pg_trgm).
 */
export async function searchPeopleIdsWithDb(
  db: PrismaClient,
  userId: string,
  query: string,
  limit: number,
  offset = 0,
  options?: SearchPeopleOptions,
): Promise<{ ranked: RankedPerson[] | null; error: string | null }> {
  try {
    const ranked = await db.$queryRaw<RankedPerson[]>`
      SELECT id, rank FROM search_people_ids(
        ${userId}::uuid,
        ${query},
        ${options?.groupId ?? null}::uuid,
        ${options?.tagId ?? null}::uuid,
        ${options?.keepInTouch ?? false},
        ${0.2}::real,
        ${limit}::int,
        ${offset}::int
      )
    `;
    return { error: null, ranked };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "unknown",
      ranked: null,
    };
  }
}

export async function countSearchPeopleIdsWithDb(
  db: PrismaClient,
  userId: string,
  query: string,
  options?: SearchPeopleOptions,
): Promise<{ count: number | null; error: string | null }> {
  try {
    const rows = await db.$queryRaw<{ count: number }[]>`
      SELECT count_search_people_ids(
        ${userId}::uuid,
        ${query},
        ${options?.groupId ?? null}::uuid,
        ${options?.tagId ?? null}::uuid,
        ${options?.keepInTouch ?? false}
      ) AS count
    `;
    const count = rows[0]?.count;
    return {
      count: typeof count === "number" ? count : Number(count ?? 0),
      error: null,
    };
  } catch (error) {
    return {
      count: null,
      error: error instanceof Error ? error.message : "unknown",
    };
  }
}
