import {
  CreateBucketCommand,
  HeadBucketCommand,
  S3Client,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";
import { AVATARS_BUCKET, LINKEDIN_LOGOS_BUCKET } from "./get-storage.js";

export const STORAGE_BUCKETS = [AVATARS_BUCKET, LINKEDIN_LOGOS_BUCKET] as const;

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 2_000;

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function isBucketAlreadyExistsError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const record = error as { Code?: string; name?: string };
  const code = record.Code ?? record.name;
  return code === "BucketAlreadyOwnedByYou" || code === "BucketAlreadyExists";
}

function isBucketMissingError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const record = error as { $metadata?: { httpStatusCode?: number }; Code?: string; name?: string };
  const code = record.Code ?? record.name;
  return code === "NotFound" || code === "NoSuchBucket" || record.$metadata?.httpStatusCode === 404;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function createStorageAdminClient(config?: S3ClientConfig): S3Client {
  return new S3Client({
    credentials: {
      accessKeyId: requireEnv("BONDERY_PRIVATE_S3_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("BONDERY_PRIVATE_S3_SECRET_ACCESS_KEY"),
    },
    endpoint: requireEnv("BONDERY_PRIVATE_S3_ENDPOINT"),
    forcePathStyle: true,
    region: requireEnv("BONDERY_PRIVATE_S3_REGION"),
    ...config,
  });
}

async function ensureBucket(client: S3Client, bucket: string): Promise<void> {
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    console.log(`Bucket exists: ${bucket}`);
    return;
  } catch (error) {
    if (!isBucketMissingError(error)) {
      throw error;
    }
  }

  try {
    await client.send(new CreateBucketCommand({ Bucket: bucket }));
    console.log(`Created bucket: ${bucket}`);
  } catch (error) {
    if (isBucketAlreadyExistsError(error)) {
      console.log(`Bucket exists: ${bucket}`);
      return;
    }
    throw error;
  }
}

export type EnsureStorageBucketsOptions = {
  buckets?: readonly string[];
  client?: S3Client;
};

export async function ensureStorageBuckets(
  options: EnsureStorageBucketsOptions = {},
): Promise<void> {
  const client = options.client ?? createStorageAdminClient();
  const buckets = options.buckets ?? STORAGE_BUCKETS;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      for (const bucket of buckets) {
        await ensureBucket(client, bucket);
      }
      return;
    } catch (error) {
      if (attempt === MAX_ATTEMPTS) {
        throw error;
      }
      console.warn(`ensureStorageBuckets attempt ${attempt} failed, retrying…`, error);
      await sleep(RETRY_DELAY_MS);
    }
  }
}
