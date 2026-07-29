import type { ContactSelectable } from "@bondery/schemas";
import type { PeopleListQuery } from "@bondery/schemas/http";
import type { DomainContext } from "../../domains/_shared/context.js";
import { buildPaginatedResponse } from "../../lib/data/pagination.js";
import {
  mapSelectableContactRecord,
  selectableContactSelect,
} from "../../lib/data/prisma-mappers.js";
import { extractAvatarOptions } from "../../lib/data/select-fragments.js";
import { type ServiceLog, toContactSelectable } from "./queries-shared.js";
import { buildPeopleListPagination, queryPeoplePage } from "./query-people-page.js";

type ContactListContext = Pick<DomainContext, "db" | "user"> & { log?: ServiceLog };

export async function listSelectableContacts(ctx: ContactListContext, query: PeopleListQuery) {
  const { user } = ctx;
  const avatarOptions = extractAvatarOptions(query);
  const page = await queryPeoplePage(
    ctx,
    query,
    { map: mapSelectableContactRecord, select: selectableContactSelect },
    ctx.log,
  );

  const contacts: ContactSelectable[] = page.rows.map((row) =>
    toContactSelectable(
      user.id,
      row as ReturnType<typeof mapSelectableContactRecord>,
      avatarOptions,
    ),
  );

  const pagination = buildPeopleListPagination(query, contacts.length, page.count);

  return buildPaginatedResponse("contacts", contacts, pagination);
}
