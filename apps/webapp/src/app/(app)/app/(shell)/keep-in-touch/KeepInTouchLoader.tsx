import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/query/client";
import { fetchKeepInTouch } from "@/lib/query/prefetch";
import { KeepInTouchClient } from "./KeepInTouchClient";

interface KeepInTouchLoaderProps {
  endDate: string;
}

export async function KeepInTouchLoader({ endDate }: KeepInTouchLoaderProps) {
  const queryClient = getQueryClient();

  await fetchKeepInTouch(queryClient);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <KeepInTouchClient endDate={endDate} />
    </HydrationBoundary>
  );
}
