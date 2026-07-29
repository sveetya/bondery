#!/usr/bin/env tsx
import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
/**
 * One-time migration: Supabase Storage → SeaweedFS S3.
 *
 * Prerequisites:
 * - BONDERY_PUBLIC_SUPABASE_URL + BONDERY_PRIVATE_SUPABASE_SECRET_KEY (source)
 * - BONDERY_PRIVATE_S3_* + buckets bootstrapped on target SeaweedFS
 *
 * Usage:
 *   cd archive/supabase-db
 *   tsx --env-file=.env.local scripts/migrate-storage-from-supabase.ts [--dry-run]
 */
import { createClient } from "@supabase/supabase-js";

const BUCKETS = ["avatars", "linkedin_logos"] as const;
const dryRun = process.argv.includes("--dry-run");

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

const supabase = createClient(
  requireEnv("BONDERY_PUBLIC_SUPABASE_URL"),
  requireEnv("BONDERY_PRIVATE_SUPABASE_SECRET_KEY"),
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const s3 = new S3Client({
  credentials: {
    accessKeyId: requireEnv("BONDERY_PRIVATE_S3_ACCESS_KEY_ID"),
    secretAccessKey: requireEnv("BONDERY_PRIVATE_S3_SECRET_ACCESS_KEY"),
  },
  endpoint: requireEnv("BONDERY_PRIVATE_S3_ENDPOINT"),
  forcePathStyle: true,
  region: requireEnv("BONDERY_PRIVATE_S3_REGION"),
});

async function listAllKeys(bucket: string, prefix = ""): Promise<string[]> {
  const keys: string[] = [];
  const stack = [prefix];

  while (stack.length > 0) {
    const current = stack.pop() ?? "";
    const { data, error } = await supabase.storage.from(bucket).list(current, {
      limit: 1000,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      throw error;
    }

    for (const entry of data ?? []) {
      const path = current ? `${current}/${entry.name}` : entry.name;
      if (entry.id) {
        keys.push(path);
      } else {
        stack.push(path);
      }
    }
  }

  return keys;
}

async function objectExists(bucket: string, key: string): Promise<boolean> {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function migrateBucket(bucket: (typeof BUCKETS)[number]): Promise<void> {
  const keys = await listAllKeys(bucket);
  console.log(`[${bucket}] ${keys.length} object(s) discovered`);

  let copied = 0;
  let skipped = 0;
  let failed = 0;

  for (const key of keys) {
    if (await objectExists(bucket, key)) {
      skipped += 1;
      continue;
    }

    if (dryRun) {
      console.log(`[dry-run] would copy ${bucket}/${key}`);
      copied += 1;
      continue;
    }

    const { data, error } = await supabase.storage.from(bucket).download(key);
    if (error || !data) {
      console.error(`[${bucket}] download failed: ${key}`, error?.message);
      failed += 1;
      continue;
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    try {
      await s3.send(
        new PutObjectCommand({
          Body: buffer,
          Bucket: bucket,
          ContentType: data.type || "image/jpeg",
          Key: key,
        }),
      );
      copied += 1;
    } catch (putError) {
      console.error(`[${bucket}] upload failed: ${key}`, putError);
      failed += 1;
    }
  }

  console.log(`[${bucket}] copied=${copied} skipped=${skipped} failed=${failed}`);
  if (failed > 0) {
    process.exitCode = 1;
  }
}

async function main(): Promise<void> {
  for (const bucket of BUCKETS) {
    await migrateBucket(bucket);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
