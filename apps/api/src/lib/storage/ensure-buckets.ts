import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
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
  } catch (error) {
    if (!isBucketMissingError(error)) {
      throw error;
    }

    try {
      await client.send(new CreateBucketCommand({ Bucket: bucket }));
      console.log(`Created bucket: ${bucket}`);
    } catch (createError) {
      if (!isBucketAlreadyExistsError(createError)) {
        throw createError;
      }
      console.log(`Bucket exists: ${bucket}`);
    }
  }

  await ensureBucketPublicReadPolicy(client, bucket);
}

function buildPublicReadBucketPolicy(bucket: string): string {
  return JSON.stringify({
    Statement: [
      {
        Action: ["s3:GetObject"],
        Effect: "Allow",
        Principal: "*",
        Resource: [`arn:aws:s3:::${bucket}/*`],
      },
    ],
    Version: "2012-10-17",
  });
}

/** SeaweedFS requires per-bucket policy for anonymous GetObject (global anonymous_actions is not enough). */
async function ensureBucketPublicReadPolicy(client: S3Client, bucket: string): Promise<void> {
  await client.send(
    new PutBucketPolicyCommand({
      Bucket: bucket,
      Policy: buildPublicReadBucketPolicy(bucket),
    }),
  );
  console.log(`Public read policy applied: ${bucket}`);
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
  const failures: Array<{ bucket: string; error: unknown }> = [];

  for (const bucket of buckets) {
    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        await ensureBucket(client, bucket);
        lastError = undefined;
        break;
      } catch (error) {
        lastError = error;
        if (attempt < MAX_ATTEMPTS) {
          console.warn(
            `ensureStorageBuckets(${bucket}) attempt ${attempt} failed, retrying…`,
            error,
          );
          await sleep(RETRY_DELAY_MS);
        }
      }
    }

    if (lastError) {
      failures.push({ bucket, error: lastError });
    }
  }

  if (failures.length > 0) {
    const summary = failures.map(({ bucket }) => bucket).join(", ");
    throw new Error(`ensureStorageBuckets failed for: ${summary}`, { cause: failures[0]?.error });
  }
}
