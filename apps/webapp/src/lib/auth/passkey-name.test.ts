import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatPasskeyName, inferPasskeyNameParts } from "./passkey-name.js";

describe("inferPasskeyNameParts", () => {
  it("parses Chrome on Windows", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    assert.deepEqual(inferPasskeyNameParts(ua), { browser: "Chrome", os: "Windows" });
  });

  it("parses Safari on macOS", () => {
    const ua =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";
    assert.deepEqual(inferPasskeyNameParts(ua), { browser: "Safari", os: "macOS" });
  });

  it("prefers userAgentData brands over the UA string", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    const parts = inferPasskeyNameParts(ua, {
      brands: [{ brand: "Not/A)Brand" }, { brand: "Chromium" }, { brand: "Microsoft Edge" }],
      platform: "Windows",
    });
    assert.deepEqual(parts, { browser: "Edge", os: "Windows" });
  });

  it("skips Chromium GREASE brands including Not=A?Brand", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    const parts = inferPasskeyNameParts(ua, {
      brands: [{ brand: "Not=A?Brand" }, { brand: "Chromium" }, { brand: "Google Chrome" }],
      platform: "Windows",
    });
    assert.deepEqual(parts, { browser: "Chrome", os: "Windows" });
  });
});

describe("formatPasskeyName", () => {
  const template = ({ browser, os }: { browser: string; os: string }) => `${browser} on ${os}`;

  it("joins browser and os", () => {
    assert.equal(
      formatPasskeyName({ browser: "Chrome", os: "Windows" }, "Passkey", template),
      "Chrome on Windows",
    );
  });

  it("falls back to a single known part", () => {
    assert.equal(formatPasskeyName({ browser: "Chrome", os: null }, "Passkey", template), "Chrome");
    assert.equal(formatPasskeyName({ browser: null, os: "macOS" }, "Passkey", template), "macOS");
  });

  it("uses the translated fallback when nothing is known", () => {
    assert.equal(formatPasskeyName({ browser: null, os: null }, "Passkey", template), "Passkey");
  });
});
