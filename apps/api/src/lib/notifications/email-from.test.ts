import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EMAIL_FROM_DISPLAY_NAME, formatEmailFrom } from "./email-from.js";

describe("formatEmailFrom", () => {
  it("uses a single Robot from Bondery display name for all product mail", () => {
    assert.equal(EMAIL_FROM_DISPLAY_NAME, "Robot from Bondery");
    assert.equal(
      formatEmailFrom("robot@usebondery.com"),
      "Robot from Bondery <robot@usebondery.com>",
    );
  });
});
