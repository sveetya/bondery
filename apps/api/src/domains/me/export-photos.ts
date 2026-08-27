import { BONDERY_EXPORT_AVATARS_PREFIX } from "@bondery/schemas";
import type AdmZip from "adm-zip";
import { contactIdFromAvatarStorageKey } from "../../lib/contacts/avatar-storage.js";
import { AVATARS_BUCKET, getStorage } from "../../lib/storage/get-storage.js";

const PHOTO_FETCH_CONCURRENCY = 8;

/** List `{userId}/` in avatars, then GET files that belong to people in this export. */
export async function addExportedAvatarFiles(options: {
  personIds: Set<string>;
  userId: string;
  zip: AdmZip;
}): Promise<void> {
  const { personIds, userId, zip } = options;
  if (personIds.size === 0) {
    return;
  }

  const storage = getStorage();
  const listedKeys = await storage.listKeys(AVATARS_BUCKET, userId);
  const keysToFetch = listedKeys.filter((key) => {
    const contactId = contactIdFromAvatarStorageKey(userId, key);
    return contactId !== null && personIds.has(contactId);
  });

  for (let index = 0; index < keysToFetch.length; index += PHOTO_FETCH_CONCURRENCY) {
    const chunk = keysToFetch.slice(index, index + PHOTO_FETCH_CONCURRENCY);
    const fetched = await Promise.all(
      chunk.map(async (key) => {
        const contactId = contactIdFromAvatarStorageKey(userId, key);
        if (!contactId) {
          return null;
        }
        const buffer = await storage.get(AVATARS_BUCKET, key);
        if (!buffer) {
          return null;
        }
        return { buffer, contactId };
      }),
    );

    for (const photo of fetched) {
      if (!photo) {
        continue;
      }
      zip.addFile(`${BONDERY_EXPORT_AVATARS_PREFIX}${photo.contactId}.jpg`, photo.buffer);
    }
  }
}
