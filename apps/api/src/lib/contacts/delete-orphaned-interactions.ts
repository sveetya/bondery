import type { PrismaClient } from "@bondery/db";

const IN_FILTER_CHUNK_SIZE = 500;

function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
}

export type DeleteOrphanedInteractionsOptions = {
  /**
   * When true, also deletes interactions that already have zero participants.
   * Enabled for bulk contact deletes where orphaned timeline rows are likely.
   */
  includeParticipantlessInteractions?: boolean;
};

/**
 * Deletes interactions that would have no remaining participants after removing
 * the given contacts. Interactions that only involve the user's "myself" card
 * are kept because that contact is never included in `contactIds`.
 */
export async function deleteOrphanedInteractionsForDeletedContacts(
  db: PrismaClient,
  userId: string,
  contactIds: string[],
  options?: DeleteOrphanedInteractionsOptions,
): Promise<void> {
  if (!Array.isArray(contactIds) || contactIds.length === 0) {
    return;
  }

  const deletedContactIds = new Set(contactIds.filter(Boolean));
  if (deletedContactIds.size === 0) {
    return;
  }

  const impactedMemberships = await db.interactionParticipant.findMany({
    select: { interactionId: true, personId: true },
    where: { personId: { in: Array.from(deletedContactIds) } },
  });

  const candidateInteractionIds = new Set(
    impactedMemberships.map((membership) => membership.interactionId),
  );

  if (options?.includeParticipantlessInteractions) {
    const interactions = await db.interaction.findMany({
      select: { id: true, participants: { select: { personId: true } } },
      where: { userId },
    });

    for (const interaction of interactions) {
      if (interaction.participants.length === 0) {
        candidateInteractionIds.add(interaction.id);
      }
    }
  }

  if (candidateInteractionIds.size === 0) {
    return;
  }

  const ownedInteractionIds: string[] = [];
  for (const chunk of chunkArray(Array.from(candidateInteractionIds), IN_FILTER_CHUNK_SIZE)) {
    const rows = await db.interaction.findMany({
      select: { id: true },
      where: { id: { in: chunk }, userId },
    });
    ownedInteractionIds.push(...rows.map((row) => row.id));
  }

  if (ownedInteractionIds.length === 0) {
    return;
  }

  const allMemberships: Array<{ interactionId: string; personId: string }> = [];
  for (const chunk of chunkArray(ownedInteractionIds, IN_FILTER_CHUNK_SIZE)) {
    const rows = await db.interactionParticipant.findMany({
      select: { interactionId: true, personId: true },
      where: { interactionId: { in: chunk } },
    });
    allMemberships.push(...rows);
  }

  const participantsByInteractionId = new Map<string, Set<string>>();
  for (const membership of allMemberships) {
    const participants =
      participantsByInteractionId.get(membership.interactionId) ?? new Set<string>();
    participants.add(membership.personId);
    participantsByInteractionId.set(membership.interactionId, participants);
  }

  const interactionIdsToDelete: string[] = [];

  for (const interactionId of ownedInteractionIds) {
    const participants = participantsByInteractionId.get(interactionId);

    if (!participants || participants.size === 0) {
      interactionIdsToDelete.push(interactionId);
      continue;
    }

    const allParticipantsDeleted = Array.from(participants).every((personId) =>
      deletedContactIds.has(personId),
    );

    if (allParticipantsDeleted) {
      interactionIdsToDelete.push(interactionId);
    }
  }

  if (interactionIdsToDelete.length === 0) {
    return;
  }

  for (const chunk of chunkArray(interactionIdsToDelete, IN_FILTER_CHUNK_SIZE)) {
    await db.interaction.deleteMany({
      where: { id: { in: chunk }, userId },
    });
  }
}
