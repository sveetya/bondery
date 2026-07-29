#!/usr/bin/env node
/**
 * Create SeaweedFS S3 buckets (avatars, linkedin_logos) if missing.
 *
 * Usage (from repo root):
 *   npm run bootstrap:seaweedfs
 *
 * Requires AWS CLI v2 and env (from root .env.local):
 *   BONDERY_PRIVATE_S3_ENDPOINT, BONDERY_PRIVATE_S3_REGION,
 *   BONDERY_PRIVATE_S3_ACCESS_KEY_ID, BONDERY_PRIVATE_S3_SECRET_ACCESS_KEY
 */
import { execFileSync } from "node:child_process";

const endpoint = process.env.BONDERY_PRIVATE_S3_ENDPOINT;
const region = process.env.BONDERY_PRIVATE_S3_REGION ?? "eu-central-1";
const accessKeyId = process.env.BONDERY_PRIVATE_S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.BONDERY_PRIVATE_S3_SECRET_ACCESS_KEY;

if (!endpoint || !accessKeyId || !secretAccessKey) {
  console.error("Missing BONDERY_PRIVATE_S3_ENDPOINT / ACCESS_KEY_ID / SECRET_ACCESS_KEY");
  process.exit(1);
}

const buckets = ["avatars", "linkedin_logos"];

function aws(args) {
  execFileSync("aws", ["--endpoint-url", endpoint, "s3", ...args, "--region", region], {
    env: {
      ...process.env,
      AWS_ACCESS_KEY_ID: accessKeyId,
      AWS_SECRET_ACCESS_KEY: secretAccessKey,
    },
    stdio: "inherit",
  });
}

for (const bucket of buckets) {
  try {
    aws(["mb", `s3://${bucket}`]);
    console.log(`Created bucket: ${bucket}`);
  } catch {
    console.log(`Bucket exists or create skipped: ${bucket}`);
  }
}

console.log("SeaweedFS bucket bootstrap complete.");
