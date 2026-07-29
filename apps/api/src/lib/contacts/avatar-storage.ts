/**
 * Avatar storage mutations and has_avatar flag maintenance.
 */

import type { PrismaClient } from "@bondery/db";
import { AVATARS_BUCKET, deleteStorageObjects, getStorage } from "../storage/get-storage.js";
import { AVATAR_IMAGE_MAX_EDGE, normalizeImageToJpeg } from "../storage/normalize-image.js";

export function getContactAvatarStoragePath(userId: string, contactId: string): string {
  return `${userId}/${contactId}.jpg`;
}

export async function setContactHasAvatar(
  db: PrismaClient,
  userId: string,
  contactId: string,
  hasAvatar: boolean,
): Promise<void> {
  await db.people.updateMany({
    data: { hasAvatar, updatedAt: new Date() },
    where: { id: contactId, userId },
  });
}

export async function uploadContactAvatarFile(
  userId: string,
  contactId: string,
  buffer: Buffer,
  _contentType: string,
): Promise<void> {
  const fileName = getContactAvatarStoragePath(userId, contactId);
  const storage = getStorage();
  const normalized = await normalizeImageToJpeg(buffer, { maxEdge: AVATAR_IMAGE_MAX_EDGE });

  await storage.delete(AVATARS_BUCKET, fileName);
  await storage.put(AVATARS_BUCKET, fileName, normalized, { contentType: "image/jpeg" });
}

export async function deleteContactAvatarFile(userId: string, contactId: string): Promise<void> {
  const fileName = getContactAvatarStoragePath(userId, contactId);
  await getStorage().delete(AVATARS_BUCKET, fileName);
}

export async function uploadContactAvatarAndSetFlag(
  db: PrismaClient,
  userId: string,
  contactId: string,
  buffer: Buffer,
  contentType: string,
): Promise<void> {
  await uploadContactAvatarFile(userId, contactId, buffer, contentType);
  await setContactHasAvatar(db, userId, contactId, true);
}

export async function deleteContactAvatarAndClearFlag(
  db: PrismaClient,
  userId: string,
  contactId: string,
): Promise<void> {
  await deleteContactAvatarFile(userId, contactId);
  await setContactHasAvatar(db, userId, contactId, false);
}

/** Remove avatar files for multiple contacts without touching DB flags. */
export async function deleteContactAvatarFiles(
  userId: string,
  contactIds: string[],
): Promise<void> {
  const keys = contactIds.map((contactId) => getContactAvatarStoragePath(userId, contactId));
  await deleteStorageObjects(AVATARS_BUCKET, keys);
}
