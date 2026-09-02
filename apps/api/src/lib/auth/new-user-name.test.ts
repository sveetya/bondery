import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  firstNameFromEmail,
  resolveNewUserDisplayName,
  splitDisplayName,
} from "./new-user-name.js";

describe("firstNameFromEmail", () => {
  it("uses the local-part without changing case", () => {
    assert.equal(firstNameFromEmail("User@email.com"), "User");
    assert.equal(firstNameFromEmail("marilokms@protonmail.com"), "marilokms");
  });

  it("keeps plus tags and dots", () => {
    assert.equal(firstNameFromEmail("First.Last+tag@example.com"), "First.Last+tag");
  });

  it("returns empty when there is no local-part", () => {
    assert.equal(firstNameFromEmail(""), "");
    assert.equal(firstNameFromEmail("@example.com"), "");
  });
});

describe("splitDisplayName", () => {
  it("splits an OAuth display name on whitespace", () => {
    assert.deepEqual(splitDisplayName("Jane Doe"), { firstName: "Jane", lastName: "Doe" });
    assert.deepEqual(splitDisplayName("Jane Mary Doe"), {
      firstName: "Jane",
      lastName: "Mary Doe",
    });
  });

  it("treats a single token as first name", () => {
    assert.deepEqual(splitDisplayName("User"), { firstName: "User", lastName: null });
  });
});

describe("resolveNewUserDisplayName", () => {
  it("prefers a trimmed IdP name over the email local-part", () => {
    assert.equal(
      resolveNewUserDisplayName({ email: "jane@example.com", name: " Jane Doe " }),
      "Jane Doe",
    );
  });

  it("falls back to the email local-part when name is missing", () => {
    assert.equal(resolveNewUserDisplayName({ email: "User@email.com", name: "" }), "User");
    assert.equal(resolveNewUserDisplayName({ email: "User@email.com", name: null }), "User");
  });
});
