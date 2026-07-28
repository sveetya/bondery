import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { generateId, isUuidV7, isValidUuid } from "./generate-id.js";

describe("generateId", () => {
  it("returns a valid UUIDv7", () => {
    const id = generateId();
    assert.equal(isValidUuid(id), true);
    assert.equal(isUuidV7(id), true);
  });

  it("returns unique values", () => {
    const ids = new Set(Array.from({ length: 20 }, () => generateId()));
    assert.equal(ids.size, 20);
  });
});
