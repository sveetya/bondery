import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isValidUuid } from "./generate-id.js";
import { remapImportId } from "./remap-import-id.js";

const USER_A = "11111111-1111-4111-8111-111111111111";
const USER_B = "22222222-2222-4222-8222-222222222222";
const SOURCE = "person-1";

describe("remapImportId", () => {
  it("returns a valid UUID and is deterministic", () => {
    const first = remapImportId({ sourceId: SOURCE, table: "people", userId: USER_A });
    const second = remapImportId({ sourceId: SOURCE, table: "people", userId: USER_A });
    assert.equal(isValidUuid(first), true);
    assert.equal(first, second);
  });

  it("differs by userId, table, and sourceId", () => {
    const base = remapImportId({ sourceId: SOURCE, table: "people", userId: USER_A });
    const otherUser = remapImportId({ sourceId: SOURCE, table: "people", userId: USER_B });
    const otherTable = remapImportId({ sourceId: SOURCE, table: "groups", userId: USER_A });
    const otherSource = remapImportId({ sourceId: "person-2", table: "people", userId: USER_A });

    assert.notEqual(base, otherUser);
    assert.notEqual(base, otherTable);
    assert.notEqual(base, otherSource);
  });
});
