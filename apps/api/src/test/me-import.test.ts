import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { remapImportId } from "@bondery/helpers/ids";
import { BONDERY_EXPORT_AVATARS_PREFIX } from "@bondery/schemas";
import AdmZip from "adm-zip";
import sharp from "sharp";
import { DomainError } from "../domains/_shared/context.js";
import { applyBonderyImport } from "../domains/me/import.js";
import { getContactAvatarStoragePath } from "../lib/contacts/avatar-storage.js";
import { resetStorageForTests, setStorageForTests } from "../lib/storage/get-storage.js";
import { loadTestEnv } from "./load-test-env.js";
import {
  ALICE_ID,
  aliceZipBuffer,
  BOB_ID,
  bobMyself,
  createCtx,
  createImportDb,
  GROUP_ID,
  PERSON_ID,
} from "./me-import-fixtures.js";
import { createMemoryStorage } from "./memory-storage.js";

loadTestEnv();

function remappedPersonId(userId: string): string {
  return remapImportId({ sourceId: PERSON_ID, table: "people", userId });
}

function remappedGroupId(userId: string): string {
  return remapImportId({ sourceId: GROUP_ID, table: "groups", userId });
}

async function validJpeg(): Promise<Buffer> {
  return sharp({
    create: { background: { b: 0, g: 0, r: 255 }, channels: 3, height: 8, width: 8 },
  })
    .jpeg()
    .toBuffer();
}

async function zipWithPhotos(files: Array<{ bytes: Buffer; id: string }>): Promise<Buffer> {
  const zip = new AdmZip(await aliceZipBuffer());
  for (const file of files) {
    zip.addFile(`${BONDERY_EXPORT_AVATARS_PREFIX}${file.id}.jpg`, file.bytes);
  }
  return zip.toBuffer();
}

describe("applyBonderyImport", () => {
  beforeEach(() => {
    setStorageForTests(createMemoryStorage());
  });

  afterEach(() => {
    resetStorageForTests();
  });

  it("restores Alice's graph onto an empty Bob account without a second myself", async () => {
    const zipBuffer = await aliceZipBuffer();
    const db = createImportDb({ people: [bobMyself()] });
    const result = await applyBonderyImport(createCtx(BOB_ID, db), zipBuffer);

    const adaId = remappedPersonId(BOB_ID);
    const groupId = remappedGroupId(BOB_ID);
    const myselfRows = db.peopleStore.filter((row) => row.myself === true);
    const ada = db.peopleStore.find((row) => row.id === adaId);

    assert.equal(result.importResult.people.inserted, 1);
    assert.equal(result.importResult.people.skipped, 0);
    assert.equal(result.importResult.photos.inserted, 0);
    assert.equal(result.importResult.groups.inserted, 1);
    assert.equal(myselfRows.length, 1);
    assert.equal(myselfRows[0]?.id, BOB_ID);
    assert.equal(myselfRows[0]?.firstName, "Bob");
    assert.equal(
      db.peopleStore.some((row) => row.id === ALICE_ID),
      false,
    );
    assert.equal(ada?.hasAvatar, false);
    assert.equal(ada?.myself, false);
    assert.equal(ada?.userId, BOB_ID);
    assert.equal(
      db.groupMemberships.some((row) => row.personId === BOB_ID && row.groupId === groupId),
      true,
    );
    assert.equal(
      db.groupMemberships.some((row) => row.personId === adaId && row.groupId === groupId),
      true,
    );
    assert.equal(
      db.participants.some((row) => row.personId === BOB_ID),
      true,
    );
    assert.equal(
      db.participants.some((row) => row.personId === adaId),
      true,
    );
    assert.equal(
      db.relationships.some((row) => row.sourcePersonId === adaId && row.targetPersonId === BOB_ID),
      true,
    );
    assert.equal(
      db.phones.some((row) => row.personId === BOB_ID),
      false,
    );
    assert.equal(
      db.emails.some((row) => row.personId === BOB_ID),
      false,
    );
    assert.equal(
      db.phones.some((row) => row.personId === adaId),
      true,
    );
    assert.ok(db.getGisCalls() > 0);
  });

  it("re-importing the same ZIP inserts nothing and does not duplicate channels", async () => {
    const zipBuffer = await aliceZipBuffer();
    const db = createImportDb({ people: [bobMyself()] });
    const first = await applyBonderyImport(createCtx(BOB_ID, db), zipBuffer);
    const phoneCount = db.phones.length;
    const emailCount = db.emails.length;
    const peopleCount = db.peopleStore.length;

    const second = await applyBonderyImport(createCtx(BOB_ID, db), zipBuffer);

    assert.ok(first.importResult.people.inserted > 0);
    assert.equal(second.importResult.people.inserted, 0);
    assert.ok(second.importResult.people.skipped > 0);
    assert.equal(second.importResult.groups.inserted, 0);
    assert.equal(db.phones.length, phoneCount);
    assert.equal(db.emails.length, emailCount);
    assert.equal(db.peopleStore.length, peopleCount);
  });

  it("copies Alice's ZIP for Bob even when Alice's original people PKs already exist", async () => {
    const zipBuffer = await aliceZipBuffer();
    const db = createImportDb({
      people: [
        bobMyself(),
        {
          firstName: "Ada",
          hasAvatar: true,
          id: PERSON_ID,
          lastName: "Lovelace",
          myself: false,
          userId: ALICE_ID,
        },
      ],
    });

    const result = await applyBonderyImport(createCtx(BOB_ID, db), zipBuffer);
    const adaId = remappedPersonId(BOB_ID);

    assert.notEqual(adaId, PERSON_ID);
    assert.equal(result.importResult.people.inserted, 1);
    assert.equal(
      db.peopleStore.some((row) => row.id === PERSON_ID),
      true,
    );
    assert.equal(
      db.peopleStore.some((row) => row.id === adaId && row.userId === BOB_ID),
      true,
    );
  });

  it("rejects invalid archives without writing", async () => {
    async function expectInvalid(buffer: Buffer) {
      const db = createImportDb({ people: [bobMyself()] });
      await assert.rejects(
        () => applyBonderyImport(createCtx(BOB_ID, db), buffer),
        (error: unknown) =>
          error instanceof DomainError &&
          error.code === "import_bondery_invalid" &&
          error.statusCode === 400,
      );
      assert.equal(db.getWrites(), 0);
    }

    const validZip = new AdmZip(await aliceZipBuffer());
    const manifestEntry = validZip.getEntry("manifest.json");
    assert.ok(manifestEntry);
    const manifest = JSON.parse(manifestEntry.getData().toString("utf8")) as {
      format: string;
    };
    manifest.format = "not-bondery";
    validZip.deleteFile("manifest.json");
    validZip.addFile("manifest.json", Buffer.from(`${JSON.stringify(manifest)}\n`));
    await expectInvalid(validZip.toBuffer());

    const nestedZip = new AdmZip(await aliceZipBuffer());
    const peopleEntry = nestedZip.getEntry("people.json");
    assert.ok(peopleEntry);
    nestedZip.addFile("nested/people.json", peopleEntry.getData());
    await expectInvalid(nestedZip.toBuffer());

    const linkedInZip = new AdmZip();
    linkedInZip.addFile("Connections.csv", Buffer.from("First Name,Last Name\nAda,Lovelace\n"));
    await expectInvalid(linkedInZip.toBuffer());

    const bombZip = new AdmZip();
    for (let index = 0; index < 33; index += 1) {
      bombZip.addFile(`entry-${index}.txt`, Buffer.from("x"));
    }
    await expectInvalid(bombZip.toBuffer());
  });

  it("adds extra people next to existing contacts instead of fusing them", async () => {
    const zipBuffer = await aliceZipBuffer();
    const existingAdaId = "99999999-9999-4999-8999-999999999999";
    const db = createImportDb({
      people: [
        bobMyself(),
        {
          firstName: "Ada",
          hasAvatar: true,
          id: existingAdaId,
          lastName: "Lovelace",
          myself: false,
          userId: BOB_ID,
        },
      ],
    });

    const result = await applyBonderyImport(createCtx(BOB_ID, db), zipBuffer);
    const importedAdaId = remappedPersonId(BOB_ID);

    assert.equal(result.importResult.people.inserted, 1);
    assert.equal(
      db.peopleStore.some((row) => row.id === existingAdaId && row.userId === BOB_ID),
      true,
    );
    assert.equal(
      db.peopleStore.some((row) => row.id === importedAdaId && row.userId === BOB_ID),
      true,
    );
    assert.equal(
      db.peopleStore.filter((row) => row.firstName === "Ada" && row.userId === BOB_ID).length,
      2,
    );
  });

  it("attaches a JPEG to a newly inserted person", async () => {
    const jpeg = await validJpeg();
    const storage = createMemoryStorage();
    setStorageForTests(storage);
    const zipBuffer = await zipWithPhotos([{ bytes: jpeg, id: PERSON_ID }]);
    const db = createImportDb({ people: [bobMyself()] });

    const result = await applyBonderyImport(createCtx(BOB_ID, db), zipBuffer);
    const adaId = remappedPersonId(BOB_ID);
    const ada = db.peopleStore.find((row) => row.id === adaId);

    assert.equal(result.importResult.people.inserted, 1);
    assert.equal(result.importResult.photos.inserted, 1);
    assert.equal(ada?.hasAvatar, true);
    assert.ok(storage.objects.has(`avatars/${getContactAvatarStoragePath(BOB_ID, adaId)}`));
  });

  it("skips the exporter profile photo and does not replace the importer", async () => {
    const jpeg = await validJpeg();
    const storage = createMemoryStorage();
    setStorageForTests(storage);
    const zipBuffer = await zipWithPhotos([
      { bytes: jpeg, id: PERSON_ID },
      { bytes: jpeg, id: ALICE_ID },
    ]);
    const db = createImportDb({ people: [bobMyself()] });

    const result = await applyBonderyImport(createCtx(BOB_ID, db), zipBuffer);
    const adaId = remappedPersonId(BOB_ID);
    const bob = db.peopleStore.find((row) => row.id === BOB_ID);

    assert.equal(result.importResult.photos.inserted, 1);
    assert.ok(result.importResult.photos.skipped >= 1);
    assert.equal(bob?.hasAvatar, true);
    assert.equal(
      storage.objects.has(`avatars/${getContactAvatarStoragePath(BOB_ID, BOB_ID)}`),
      false,
    );
    assert.ok(storage.objects.has(`avatars/${getContactAvatarStoragePath(BOB_ID, adaId)}`));
  });

  it("skips photos on re-import of the same ZIP", async () => {
    const jpeg = await validJpeg();
    const storage = createMemoryStorage();
    setStorageForTests(storage);
    const zipBuffer = await zipWithPhotos([{ bytes: jpeg, id: PERSON_ID }]);
    const db = createImportDb({ people: [bobMyself()] });

    const first = await applyBonderyImport(createCtx(BOB_ID, db), zipBuffer);
    const objectCount = storage.objects.size;
    const second = await applyBonderyImport(createCtx(BOB_ID, db), zipBuffer);

    assert.equal(first.importResult.photos.inserted, 1);
    assert.equal(second.importResult.photos.inserted, 0);
    assert.ok(second.importResult.photos.skipped > 0);
    assert.equal(storage.objects.size, objectCount);
  });

  it("returns insert counts when GIS updates fail after writes", async () => {
    const zipBuffer = await aliceZipBuffer();
    const db = createImportDb({ people: [bobMyself()] });
    db.$executeRaw = async () => {
      throw new Error("gis unavailable");
    };

    const result = await applyBonderyImport(createCtx(BOB_ID, db), zipBuffer);

    assert.equal(result.importResult.people.inserted, 1);
    assert.equal(result.importResult.groups.inserted, 1);
  });

  it("returns insert counts when sync changelog emit fails after writes", async () => {
    const zipBuffer = await aliceZipBuffer();
    const db = createImportDb({ people: [bobMyself()] });
    db.syncChangeLog.createMany = async () => {
      throw new Error("duplicate server_sequence");
    };

    const result = await applyBonderyImport(createCtx(BOB_ID, db), zipBuffer);

    assert.equal(result.importResult.people.inserted, 1);
    assert.equal(result.importResult.groups.inserted, 1);
    assert.equal(
      db.peopleStore.some((row) => row.userId === BOB_ID && row.myself !== true),
      true,
    );
  });

  it("skips a corrupt JPEG and still imports JSON", async () => {
    const zipBuffer = await zipWithPhotos([
      { bytes: Buffer.from("not-a-jpeg!!!!"), id: PERSON_ID },
    ]);
    const db = createImportDb({ people: [bobMyself()] });

    const result = await applyBonderyImport(createCtx(BOB_ID, db), zipBuffer);
    const adaId = remappedPersonId(BOB_ID);
    const ada = db.peopleStore.find((row) => row.id === adaId);

    assert.equal(result.importResult.people.inserted, 1);
    assert.equal(result.importResult.photos.inserted, 0);
    assert.ok(result.importResult.photos.skipped >= 1);
    assert.equal(ada?.hasAvatar, false);
  });
});
