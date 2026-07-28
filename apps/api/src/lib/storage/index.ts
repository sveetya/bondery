import type { StorageAdapter } from "./adapter.js";
import { LocalDiskStorage } from "./local-disk.js";
import { S3Storage } from "./s3.js";

export type { StorageAdapter, StoragePutOptions } from "./adapter.js";

let storageAdapter: StorageAdapter | null = null;

export function getStorage(): StorageAdapter {
  if (!storageAdapter) {
    storageAdapter = createStorageAdapter();
  }
  return storageAdapter;
}

/** Test hook — reset cached adapter between tests. */
export function resetStorageForTests(): void {
  storageAdapter = null;
}

function resolveApiBaseUrl(): string {
  return (process.env.BONDERY_PUBLIC_API_URL ?? "http://localhost:26631").replace(/\/+$/, "");
}

function hasS3Credentials(): boolean {
  return Boolean(
    process.env.BONDERY_PRIVATE_S3_BUCKET &&
      process.env.BONDERY_PRIVATE_S3_REGION &&
      process.env.BONDERY_PRIVATE_S3_ACCESS_KEY_ID &&
      process.env.BONDERY_PRIVATE_S3_SECRET_ACCESS_KEY,
  );
}

function resolveStorageDriver(): "local" | "s3" {
  const explicit = process.env.BONDERY_STORAGE_DRIVER?.toLowerCase();
  if (explicit === "s3") {
    return "s3";
  }
  if (explicit === "local") {
    return "local";
  }
  return hasS3Credentials() ? "s3" : "local";
}

function createStorageAdapter(): StorageAdapter {
  const driver = resolveStorageDriver();

  if (driver === "s3") {
    const bucket = process.env.BONDERY_PRIVATE_S3_BUCKET;
    const region = process.env.BONDERY_PRIVATE_S3_REGION;
    const accessKeyId = process.env.BONDERY_PRIVATE_S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.BONDERY_PRIVATE_S3_SECRET_ACCESS_KEY;
    const endpoint = process.env.BONDERY_PRIVATE_S3_ENDPOINT;
    const publicBaseUrl =
      process.env.BONDERY_PUBLIC_STORAGE_URL?.trim() || resolveApiBaseUrl();

    if (!bucket || !region || !accessKeyId || !secretAccessKey) {
      throw new Error(
        "S3 storage requires BONDERY_PRIVATE_S3_BUCKET, BONDERY_PRIVATE_S3_REGION, " +
          "BONDERY_PRIVATE_S3_ACCESS_KEY_ID, BONDERY_PRIVATE_S3_SECRET_ACCESS_KEY",
      );
    }

    return new S3Storage(bucket, publicBaseUrl, {
      accessKeyId,
      endpoint: endpoint || undefined,
      forcePathStyle: Boolean(endpoint),
      region,
      secretAccessKey,
    });
  }

  const rootDir = process.env.BONDERY_PRIVATE_STORAGE_LOCAL_PATH ?? "/data/storage";
  return new LocalDiskStorage(rootDir, `${resolveApiBaseUrl()}/files`);
}

export const AVATARS_BUCKET = "avatars";
export const LINKEDIN_LOGOS_BUCKET = "linkedin_logos";
