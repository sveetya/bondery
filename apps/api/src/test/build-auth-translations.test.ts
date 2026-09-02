import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildAuthTranslations } from "../lib/auth/build-auth-translations.js";

describe("buildAuthTranslations", () => {
  it("loads flat Better Auth codes from common.errors.auth", () => {
    const translations = buildAuthTranslations();

    assert.equal(
      translations.en.INVALID_TOKEN,
      "This sign-in link isn’t valid. Request a new one.",
    );
    assert.equal(translations.cs.USER_NOT_FOUND, "Uživatel nebyl nalezen.");
    assert.equal(
      translations.de.SESSION_EXPIRED,
      "Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.",
    );
  });
});
