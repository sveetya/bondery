import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { orientMergePair, swapMergeConflictChoices } from "./orientMergePair.js";

describe("orientMergePair", () => {
  it("keeps recommendation order when the current person is already left", () => {
    const choices = { firstName: "left" as const, lastName: "right" as const };
    const result = orientMergePair({
      conflictChoices: choices,
      leftPersonId: "a",
      rightPersonId: "b",
      survivorPersonId: "a",
    });
    assert.deepEqual(result, {
      conflictChoices: choices,
      leftPersonId: "a",
      rightPersonId: "b",
    });
  });

  it("swaps sides and conflict choices so the current person survives", () => {
    const result = orientMergePair({
      conflictChoices: { firstName: "left", notes: "right" },
      leftPersonId: "a",
      rightPersonId: "b",
      survivorPersonId: "b",
    });
    assert.deepEqual(result, {
      conflictChoices: { firstName: "right", notes: "left" },
      leftPersonId: "b",
      rightPersonId: "a",
    });
  });
});

describe("swapMergeConflictChoices", () => {
  it("flips left and right selections", () => {
    assert.deepEqual(swapMergeConflictChoices({ avatar: "left", headline: "right" }), {
      avatar: "right",
      headline: "left",
    });
  });
});
