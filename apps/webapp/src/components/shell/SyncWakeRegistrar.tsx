"use client";

import { useSyncWakeInvalidation } from "@/lib/query/useSyncWakeInvalidation";

/** Subscribes to sync-wake WebSocket only inside the authenticated app shell. */
export function SyncWakeRegistrar() {
  useSyncWakeInvalidation();
  return null;
}
