import type { DomainContext } from "../_shared/context.js";
import {
  removePeopleGroupMemberships,
  upsertPeopleGroupMemberships,
} from "../_shared/people-groups.js";

export async function addGroupMembers(
  ctx: DomainContext,
  groupId: string,
  personIds: string[],
): Promise<{
  data: { addedCount: number; skippedCount: number };
  txid: string;
  serverSequence: number;
}> {
  const result = await upsertPeopleGroupMemberships(ctx, groupId, personIds);
  return {
    data: { addedCount: result.addedCount, skippedCount: result.skippedCount },
    serverSequence: result.serverSequence,
    txid: result.txid,
  };
}

export async function removeGroupMembers(
  ctx: DomainContext,
  groupId: string,
  personIds: string[],
): Promise<{ data: { removedCount: number }; txid: string; serverSequence: number }> {
  const result = await removePeopleGroupMemberships(ctx, groupId, personIds);
  return {
    data: { removedCount: result.removedCount },
    serverSequence: result.serverSequence,
    txid: result.txid,
  };
}
