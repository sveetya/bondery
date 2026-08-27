import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { isMissingContactError } from "@/lib/api/isMissingContactError";
import { getQueryClient } from "@/lib/query/client";
import { PersonClient } from "./PersonClient";
import { PersonMissingState } from "./PersonMissingState";
import { prefetchPersonPageQueries } from "./prefetchPersonPageQueries";

interface PersonLoaderProps {
  initialTab?: string;
  myselfMode?: boolean;
  personId: string;
}

export async function PersonLoader({ personId, initialTab, myselfMode }: PersonLoaderProps) {
  const queryClient = getQueryClient();

  try {
    await prefetchPersonPageQueries(queryClient, personId);
  } catch (error) {
    if (isMissingContactError(error)) {
      return <PersonMissingState />;
    }
    throw error;
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PersonClient initialTab={initialTab} myselfMode={myselfMode} personId={personId} />
    </HydrationBoundary>
  );
}
