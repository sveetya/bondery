import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { lookupMergePeople } from "./merge-people-lookup.js";

describe("lookupMergePeople", () => {
  const left = { id: "left" };
  const right = { id: "right" };

  it("returns both people when they exist", () => {
    const result = lookupMergePeople([left, right], "left", "right");
    assert.deepEqual(result, { leftPerson: left, rightPerson: right, status: "ready" });
  });

  it("treats a missing right contact as already merged when left remains", () => {
    const result = lookupMergePeople([left], "left", "right");
    assert.deepEqual(result, {
      mergedFromPersonId: "right",
      status: "already_merged",
      survivor: left,
    });
  });

  it("treats a missing left contact as already merged when right remains", () => {
    const result = lookupMergePeople([right], "left", "right");
    assert.deepEqual(result, {
      mergedFromPersonId: "left",
      status: "already_merged",
      survivor: right,
    });
  });

  it("returns not found when neither contact remains", () => {
    assert.equal(lookupMergePeople([], "left", "right").status, "not_found");
  });
});
