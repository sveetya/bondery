/**
 * Decide whether a merge request can run, is already complete, or is missing contacts.
 * Left is the survivor; right is the contact that is deleted on success.
 *
 * A retry after a successful merge can arrive with the pair swapped. Treat either
 * remaining contact as the survivor so the client gets success instead of 404.
 */
export type MergePeopleLookup<T extends { id: string }> =
  | { leftPerson: T; rightPerson: T; status: "ready" }
  | { mergedFromPersonId: string; status: "already_merged"; survivor: T }
  | { status: "not_found" };

export function lookupMergePeople<T extends { id: string }>(
  peopleRows: T[],
  leftPersonId: string,
  rightPersonId: string,
): MergePeopleLookup<T> {
  const leftPerson = peopleRows.find((person) => person.id === leftPersonId);
  const rightPerson = peopleRows.find((person) => person.id === rightPersonId);

  if (leftPerson && rightPerson) {
    return { leftPerson, rightPerson, status: "ready" };
  }

  if (leftPerson) {
    return { mergedFromPersonId: rightPersonId, status: "already_merged", survivor: leftPerson };
  }

  if (rightPerson) {
    return { mergedFromPersonId: leftPersonId, status: "already_merged", survivor: rightPerson };
  }

  return { status: "not_found" };
}
