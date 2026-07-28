import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { DomainDbClient } from "../domains/_shared/context.js";
import { getContactGroups } from "../services/contacts/queries-detail.js";

/**
 * Regression test for the contact-groups tenant leak: `getContactGroups`
 * used to resolve `userId` from the (untrusted) contact row itself instead
 * of the authenticated caller, so passing another user's contact ID
 * returned that user's real group names/counts. This fake Prisma client
 * enforces `where` filters the same way Postgres would, so the test fails
 * if tenant scoping regresses.
 */

type Person = { id: string; userId: string };
type PeopleGroupRow = { personId: string; groupId: string; userId: string };
type GroupRow = { id: string; userId: string; label: string };

function createFakeClient(seed: {
  people: Person[];
  peopleGroups: PeopleGroupRow[];
  groups: GroupRow[];
}): DomainDbClient {
  return {
    group: {
      findMany: async ({ where }: { where: { id: { in: string[] }; userId: string } }) =>
        seed.groups
          .filter((g) => where.id.in.includes(g.id) && g.userId === where.userId)
          .map((g) => ({
            color: null,
            createdAt: new Date(0),
            emoji: null,
            id: g.id,
            label: g.label,
            updatedAt: new Date(0),
            userId: g.userId,
          })),
    },
    people: {
      findFirst: async ({ where }: { where: { id: string; userId: string } }) =>
        seed.people.find((p) => p.id === where.id && p.userId === where.userId) ?? null,
    },
    peopleGroup: {
      findMany: async ({
        where,
      }: {
        where: { personId?: string; groupId?: { in: string[] }; userId: string };
      }) =>
        seed.peopleGroups
          .filter((pg) => pg.userId === where.userId)
          .filter((pg) => (where.personId ? pg.personId === where.personId : true))
          .filter((pg) => (where.groupId ? where.groupId.in.includes(pg.groupId) : true))
          .map((pg) => ({ groupId: pg.groupId })),
    },
    // biome-ignore lint/suspicious/noExplicitAny: minimal fake covering only the methods getContactGroups calls
  } as any;
}

describe("getContactGroups tenant isolation", () => {
  const userA = "user-a";
  const userB = "user-b";
  const contactOfA = "contact-a1";
  const contactOfB = "contact-b1";
  const groupOfB = "group-b1";

  const client = createFakeClient({
    groups: [{ id: groupOfB, label: "B's friends", userId: userB }],
    people: [
      { id: contactOfA, userId: userA },
      { id: contactOfB, userId: userB },
    ],
    peopleGroups: [{ groupId: groupOfB, personId: contactOfB, userId: userB }],
  });

  it("returns 404 (not leaked groups) when userA requests userB's contact", async () => {
    await assert.rejects(
      () => getContactGroups(client, userA, contactOfB),
      (error: unknown) => {
        assert.ok(error instanceof Error);
        assert.equal((error as { statusCode?: number }).statusCode, 404);
        return true;
      },
    );
  });

  it("returns 404 for a nonexistent contact id, same as a foreign contact", async () => {
    await assert.rejects(
      () => getContactGroups(client, userA, "does-not-exist"),
      (error: unknown) => {
        assert.equal((error as { statusCode?: number }).statusCode, 404);
        return true;
      },
    );
  });

  it("returns the owner's own groups unaffected", async () => {
    const result = await getContactGroups(client, userB, contactOfB);
    assert.equal(result.groups.length, 1);
    assert.equal(result.groups[0]?.id, groupOfB);
  });

  it("returns an empty list for a contact with no group memberships", async () => {
    const result = await getContactGroups(client, userA, contactOfA);
    assert.deepEqual(result.groups, []);
  });
});
