import { bumpPersonSyncTxid, getCurrentSyncTxid } from "../../lib/data/sync-txid.js";

export async function capturePersonSyncTxid(personId: string, userId: string): Promise<string> {
  return bumpPersonSyncTxid(personId, userId);
}

export async function captureCurrentSyncTxid(): Promise<string> {
  return getCurrentSyncTxid();
}

export async function withPersonTxid<T extends { personId: string }>(
  userId: string,
  fn: () => Promise<T>,
): Promise<{ data: T; txid: string }> {
  const data = await fn();
  const txid = await capturePersonSyncTxid(data.personId, userId);
  return { data, txid };
}

export async function withTxid<T>(fn: () => Promise<T>): Promise<{ data: T; txid: string }> {
  const data = await fn();
  const txid = await captureCurrentSyncTxid();
  return { data, txid };
}
