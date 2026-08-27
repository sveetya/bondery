import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { BONDERY_EXPORT_AVATARS_PREFIX } from "@bondery/schemas";
import AdmZip from "adm-zip";
import { DomainError } from "../domains/_shared/context.js";
import { parseBonderyExportZip } from "../lib/import/parse-bondery-export-zip.js";
import { resetStorageForTests, setStorageForTests } from "../lib/storage/get-storage.js";
import { loadTestEnv } from "./load-test-env.js";
import { aliceZipBuffer, PERSON_ID } from "./me-import-fixtures.js";
import { createMemoryStorage } from "./memory-storage.js";

loadTestEnv();

function jpegMagicStub(): Buffer {
  return Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
}

function extraPhotoId(index: number): string {
  return `00000000-0000-4000-8000-${index.toString().padStart(12, "0")}`;
}

describe("parseBonderyExportZip", () => {
  beforeEach(() => {
    setStorageForTests(createMemoryStorage());
  });

  afterEach(() => {
    resetStorageForTests();
  });

  it("parses a JSON-only ZIP with an empty photo map", async () => {
    const parsed = parseBonderyExportZip(await aliceZipBuffer());
    assert.equal(parsed.photos.size, 0);
    assert.equal(parsed.photosSkipped, 0);
    assert.ok(parsed.people.length > 0);
    assert.equal(parsed.myself.length, 1);
    assert.equal(
      parsed.people.some((person) => person.id === parsed.myself[0]?.id),
      false,
    );
    assert.equal(parsed.groupMemberships.length, 2);
    assert.equal(parsed.tagMemberships.length, 1);
    assert.equal(parsed.groups[0]?.members.length, 2);
  });

  it("collects a valid avatars/{uuid}.jpg file", async () => {
    const zip = new AdmZip(await aliceZipBuffer());
    zip.addFile(`${BONDERY_EXPORT_AVATARS_PREFIX}${PERSON_ID}.jpg`, jpegMagicStub());
    const parsed = parseBonderyExportZip(zip.toBuffer());
    assert.equal(parsed.photos.size, 1);
    assert.ok(parsed.photos.has(PERSON_ID));
    assert.equal(parsed.photosSkipped, 0);
  });

  it("still collects the unreleased photos/ folder alias", async () => {
    const zip = new AdmZip(await aliceZipBuffer());
    zip.addFile(`photos/${PERSON_ID}.jpg`, jpegMagicStub());
    const parsed = parseBonderyExportZip(zip.toBuffer());
    assert.equal(parsed.photos.size, 1);
    assert.ok(parsed.photos.has(PERSON_ID));
  });

  it("accepts more than 32 total entries when extras are photos", async () => {
    const zip = new AdmZip(await aliceZipBuffer());
    for (let index = 0; index < 25; index += 1) {
      zip.addFile(`${BONDERY_EXPORT_AVATARS_PREFIX}${extraPhotoId(index)}.jpg`, jpegMagicStub());
    }
    const parsed = parseBonderyExportZip(zip.toBuffer());
    assert.equal(parsed.photos.size, 25);
  });

  it("rejects zip-slip paths", async () => {
    const zip = new AdmZip(await aliceZipBuffer());
    zip.addFile("secret.json", Buffer.from("{}"));
    const slipped = zip.getEntry("secret.json");
    assert.ok(slipped);
    // AdmZip sanitizes ".." on addFile; keep the stored entry name unsafe.
    slipped.entryName = "../secret.json";
    assert.throws(
      () => parseBonderyExportZip(zip.toBuffer()),
      (error: unknown) => error instanceof DomainError && error.code === "import_bondery_invalid",
    );
  });

  it("skips nested and non-uuid photo paths without invalidating the ZIP", async () => {
    const zip = new AdmZip(await aliceZipBuffer());
    zip.addFile(`${BONDERY_EXPORT_AVATARS_PREFIX}not-a-uuid.jpg`, jpegMagicStub());
    zip.addFile(`${BONDERY_EXPORT_AVATARS_PREFIX}a/b.jpg`, jpegMagicStub());
    zip.addFile(`${BONDERY_EXPORT_AVATARS_PREFIX}${PERSON_ID}.png`, jpegMagicStub());
    const parsed = parseBonderyExportZip(zip.toBuffer());
    assert.equal(parsed.photos.size, 0);
    assert.equal(parsed.photosSkipped, 0);
  });

  it("skips a corrupt JPEG at a valid photo path", async () => {
    const zip = new AdmZip(await aliceZipBuffer());
    zip.addFile(`${BONDERY_EXPORT_AVATARS_PREFIX}${PERSON_ID}.jpg`, Buffer.from("not-a-jpeg!!!!"));
    const parsed = parseBonderyExportZip(zip.toBuffer());
    assert.equal(parsed.photos.size, 0);
    assert.equal(parsed.photosSkipped, 1);
  });
});
