import type { PrismaClient } from "@bondery/db";
import { deleteStorageObjects, LINKEDIN_LOGOS_BUCKET } from "../storage/get-storage.js";

async function linkedinIdsForPeople(
  db: PrismaClient,
  userId: string,
  personIds: string[],
): Promise<string[]> {
  if (personIds.length === 0) {
    return [];
  }

  const linkedinRows = await db.peopleLinkedin.findMany({
    select: { id: true },
    where: { personId: { in: personIds }, userId },
  });
  const linkedinIds = linkedinRows.map((row) => row.id);

  if (linkedinIds.length === 0) {
    return [];
  }

  return linkedinIds;
}

export async function collectLinkedInLogoIds(
  db: PrismaClient,
  userId: string,
  personIds: string[],
): Promise<string[]> {
  if (personIds.length === 0) {
    return [];
  }

  const linkedinIds = await linkedinIdsForPeople(db, userId, personIds);
  if (linkedinIds.length === 0) {
    return [];
  }

  const [workRows, eduRows] = await Promise.all([
    db.peopleWorkHistory.findMany({
      select: { companyLinkedinId: true },
      where: {
        companyLinkedinId: { not: null },
        peopleLinkedinId: { in: linkedinIds },
        userId,
      },
    }),
    db.peopleEducationHistory.findMany({
      select: { schoolLinkedinId: true },
      where: {
        peopleLinkedinId: { in: linkedinIds },
        schoolLinkedinId: { not: null },
        userId,
      },
    }),
  ]);

  const ids = new Set<string>();
  for (const row of workRows) {
    if (row.companyLinkedinId) {
      ids.add(row.companyLinkedinId);
    }
  }
  for (const row of eduRows) {
    if (row.schoolLinkedinId) {
      ids.add(row.schoolLinkedinId);
    }
  }
  return Array.from(ids);
}

export async function removeOrphanedLinkedInLogos(
  db: PrismaClient,
  userId: string,
  candidateIds: string[],
): Promise<void> {
  if (candidateIds.length === 0) {
    return;
  }

  const [workRows, eduRows] = await Promise.all([
    db.peopleWorkHistory.findMany({
      select: { companyLinkedinId: true },
      where: { companyLinkedinId: { in: candidateIds }, userId },
    }),
    db.peopleEducationHistory.findMany({
      select: { schoolLinkedinId: true },
      where: { schoolLinkedinId: { in: candidateIds }, userId },
    }),
  ]);

  const stillReferenced = new Set<string>();
  for (const row of workRows) {
    if (row.companyLinkedinId) {
      stillReferenced.add(row.companyLinkedinId);
    }
  }
  for (const row of eduRows) {
    if (row.schoolLinkedinId) {
      stillReferenced.add(row.schoolLinkedinId);
    }
  }

  const orphaned = candidateIds.filter((id) => !stillReferenced.has(id));
  if (orphaned.length === 0) {
    return;
  }

  const paths = orphaned.map((id) => `${userId}/${id}.jpg`);
  await deleteStorageObjects(LINKEDIN_LOGOS_BUCKET, paths);
}
