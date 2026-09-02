import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { EMAIL_PREVIEW_MAX_CHARS, MagicLinkEmail, ReminderDigestEmail } from "@bondery/emails";
import { defaultMagicLinkCopy } from "@bondery/emails/fixtures/default-copy";
import { renderEmailParts } from "./render-email.js";

describe("renderEmailParts", () => {
  it("sends HTML plus plaintext without legal identity on transactional mail", async () => {
    const url = "https://api.example.test/auth/magic-link/verify?token=secret-token";
    const { html, text } = await renderEmailParts(
      MagicLinkEmail({
        copy: defaultMagicLinkCopy,
        title: "Your Bondery sign-in link",
        url,
      }),
    );

    assert.match(html, /Expires in 15 minutes/);
    assert.doesNotMatch(html, /Sveetech/);
    assert.doesNotMatch(html, /Manage these notifications/);
    assert.match(text, /secret-token/);
    assert.match(text, /Sign in to Bondery/);
    assert.doesNotMatch(text, /Sveetech/);
  });

  it("clips inbox preview to 90 characters", async () => {
    const { html } = await renderEmailParts(
      MagicLinkEmail({
        copy: { ...defaultMagicLinkCopy, preview: "x".repeat(120) },
        url: "https://example.test/verify",
      }),
    );

    assert.doesNotMatch(html, /x{91}/);
    assert.match(html, new RegExp(`x{${EMAIL_PREVIEW_MAX_CHARS - 1}}…`));
  });

  it("keeps manage-notifications on reminder digest and still hides legal identity", async () => {
    const { html, text } = await renderEmailParts(
      ReminderDigestEmail({
        formattedHeadingDate: "January 1",
        targetDate: "2026-01-01",
        userId: "preview-user",
      }),
    );

    assert.match(html, /Manage these notifications in Bondery/);
    assert.match(text, /Manage these notifications in Bondery/);
    assert.doesNotMatch(html, /Sveetech/);
    assert.doesNotMatch(text, /Sveetech/);
  });
});
