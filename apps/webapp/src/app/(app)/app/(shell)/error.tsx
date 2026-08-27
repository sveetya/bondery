"use client";

import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { useEffect } from "react";
import { QueryLoadError } from "@/components/shell/QueryLoadError";

export default function AppShellError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { reset: resetQueryErrors } = useQueryErrorResetBoundary();

  useEffect(() => {
    // biome-ignore lint/suspicious/noConsole: Next.js error.tsx reports the boundary error
    console.error(error);
  }, [error]);

  return (
    <QueryLoadError
      onRetry={() => {
        resetQueryErrors();
        reset();
      }}
    />
  );
}
