import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { S3Client } from "@aws-sdk/client-s3";
import { ensureStorageBuckets } from "../lib/storage/ensure-buckets.js";

function createMockClient(handlers: {
  head?: (bucket: string) => Promise<void> | void;
  create?: (bucket: string) => Promise<void> | void;
  putPolicy?: (bucket: string) => Promise<void> | void;
}): S3Client {
  return {
    send: async (command: { constructor: { name: string }; input: { Bucket?: string } }) => {
      const bucket = command.input.Bucket;
      if (!bucket) {
        throw new Error("Missing bucket");
      }

      if (command.constructor.name === "HeadBucketCommand") {
        await handlers.head?.(bucket);
        return {};
      }

      if (command.constructor.name === "CreateBucketCommand") {
        await handlers.create?.(bucket);
        return {};
      }

      if (command.constructor.name === "PutBucketPolicyCommand") {
        await handlers.putPolicy?.(bucket);
        return {};
      }

      throw new Error(`Unexpected command: ${command.constructor.name}`);
    },
  } as unknown as S3Client;
}

describe("ensureStorageBuckets", () => {
  it("creates buckets that are missing", async () => {
    const existing = new Set<string>();
    const created: string[] = [];
    const policies: string[] = [];

    const client = createMockClient({
      create: (bucket) => {
        created.push(bucket);
        existing.add(bucket);
      },
      head: (bucket) => {
        if (!existing.has(bucket)) {
          const error = new Error("NotFound") as Error & { name: string };
          error.name = "NotFound";
          throw error;
        }
      },
      putPolicy: (bucket) => {
        policies.push(bucket);
      },
    });

    await ensureStorageBuckets({ buckets: ["avatars", "linkedin-logos"], client });

    assert.deepEqual(created, ["avatars", "linkedin-logos"]);
    assert.deepEqual(policies, ["avatars", "linkedin-logos"]);
  });

  it("skips create when bucket already exists", async () => {
    const created: string[] = [];
    const policies: string[] = [];

    const client = createMockClient({
      create: (bucket) => {
        created.push(bucket);
      },
      head: async () => {},
      putPolicy: (bucket) => {
        policies.push(bucket);
      },
    });

    await ensureStorageBuckets({ buckets: ["avatars"], client });

    assert.deepEqual(created, []);
    assert.deepEqual(policies, ["avatars"]);
  });

  it("treats BucketAlreadyOwnedByYou as success", async () => {
    const client = createMockClient({
      create: () => {
        const error = new Error("BucketAlreadyOwnedByYou") as Error & { name: string };
        error.name = "BucketAlreadyOwnedByYou";
        throw error;
      },
      head: () => {
        const error = new Error("NotFound") as Error & { name: string };
        error.name = "NotFound";
        throw error;
      },
      putPolicy: async () => {},
    });

    await ensureStorageBuckets({ buckets: ["avatars"], client });
  });
});
