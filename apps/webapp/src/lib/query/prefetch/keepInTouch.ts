import type { QueryClient } from "@tanstack/react-query";
import { getKeepInTouchContactsServer } from "@/lib/api/domains/server/keepInTouch";
import { fetchQueryOrThrow } from "@/lib/query/fetchQueryOrThrow";
import { contactKeys } from "@/lib/query/keys";

export async function prefetchKeepInTouch(queryClient: QueryClient): Promise<void> {
  await queryClient.prefetchQuery({
    queryFn: () => getKeepInTouchContactsServer(),
    queryKey: contactKeys.keepInTouch(),
  });
}

export async function fetchKeepInTouch(queryClient: QueryClient): Promise<void> {
  await fetchQueryOrThrow(queryClient, contactKeys.keepInTouch(), () =>
    getKeepInTouchContactsServer(),
  );
}
