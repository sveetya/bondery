import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/query/client";
import type { ContactsListFilterParams } from "@/lib/query/contactsListParams";
import { fetchContactsInfinite } from "@/lib/query/prefetch";
import { PeopleClient } from "../../PeopleClient";

interface PeopleTableLoaderProps {
  filter: ContactsListFilterParams;
  savedColumnVisibility?: { key: string; visible: boolean }[];
}

/**
 * Fetches the contacts infinite query (throws on hop-down) and hydrates PeopleClient.
 */
export async function PeopleTableLoader({ filter, savedColumnVisibility }: PeopleTableLoaderProps) {
  const queryClient = getQueryClient();

  await fetchContactsInfinite(queryClient, filter);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PeopleClient savedColumnVisibility={savedColumnVisibility} />
    </HydrationBoundary>
  );
}
