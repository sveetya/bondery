"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { registerAppShellRefresh } from "@/lib/app/refreshAppShell";

/** Registers router.refresh for refreshAppShell() — route gates / last-resort identity, not preference saves. */
export function AppShellRefreshRegistrar() {
  const router = useRouter();

  useEffect(() => registerAppShellRefresh(() => router.refresh()), [router]);

  return null;
}
