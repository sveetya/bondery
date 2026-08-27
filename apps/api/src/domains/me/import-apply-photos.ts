import type { PrismaClient } from "@bondery/db";
import type { ImportTypeResult } from "@bondery/schemas";
import { uploadContactAvatarAndSetFlag } from "../../lib/contacts/avatar-storage.js";
import { typeResult } from "./import-helpers.js";

const PHOTO_UPLOAD_CONCURRENCY = 8;

type InsertedPerson = { hasAvatar: boolean; id: string };

export async function attachImportedPhotos(options: {
  db: PrismaClient;
  insertedPeople: InsertedPerson[];
  insertedPersonIds: Set<string>;
  photos: Map<string, Buffer>;
  photosSkipped: number;
  remapPersonId: (sourceId: string) => string;
  userId: string;
}): Promise<ImportTypeResult> {
  const { db, insertedPeople, insertedPersonIds, photos, photosSkipped, remapPersonId, userId } =
    options;

  const insertedById = new Map(insertedPeople.map((person) => [person.id, person]));
  const photoEntries = [...photos.entries()];
  let inserted = 0;

  for (let index = 0; index < photoEntries.length; index += PHOTO_UPLOAD_CONCURRENCY) {
    const chunk = photoEntries.slice(index, index + PHOTO_UPLOAD_CONCURRENCY);
    const outcomes = await Promise.all(
      chunk.map(async ([sourceId, buffer]): Promise<string | null> => {
        const remappedId = remapPersonId(sourceId);
        if (remappedId === userId || !insertedPersonIds.has(remappedId)) {
          return null;
        }
        try {
          await uploadContactAvatarAndSetFlag(db, userId, remappedId, buffer, "image/jpeg");
          return remappedId;
        } catch {
          return null;
        }
      }),
    );

    for (const remappedId of outcomes) {
      if (!remappedId) {
        continue;
      }
      inserted += 1;
      const person = insertedById.get(remappedId);
      if (person) {
        person.hasAvatar = true;
      }
    }
  }

  return typeResult(photos.size, inserted, photosSkipped);
}
