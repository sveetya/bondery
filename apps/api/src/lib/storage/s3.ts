import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import type { StorageAdapter, StoragePutOptions } from "./adapter.js";

async function streamToBuffer(body: unknown): Promise<Buffer> {
  if (!body) {
    return Buffer.alloc(0);
  }
  if (Buffer.isBuffer(body)) {
    return body;
  }
  if (body instanceof Uint8Array) {
    return Buffer.from(body);
  }
  const chunks: Buffer[] = [];
  for await (const chunk of body as AsyncIterable<Uint8Array>) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export type S3StorageConfig = {
  accessKeyId: string;
  endpoint: string;
  forcePathStyle?: boolean;
  publicBaseUrl: string;
  region: string;
  secretAccessKey: string;
};

export class S3Storage implements StorageAdapter {
  private readonly client: S3Client;

  constructor(private readonly config: S3StorageConfig) {
    this.client = new S3Client({
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      endpoint: config.endpoint,
      forcePathStyle: config.forcePathStyle ?? true,
      region: config.region,
    });
  }

  async put(bucket: string, key: string, data: Buffer, opts?: StoragePutOptions): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Body: data,
        Bucket: bucket,
        ContentType: opts?.contentType,
        Key: key.replace(/^\/+/, ""),
      }),
    );
  }

  async get(bucket: string, key: string): Promise<Buffer | null> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: bucket,
          Key: key.replace(/^\/+/, ""),
        }),
      );
      return await streamToBuffer(response.Body);
    } catch {
      return null;
    }
  }

  async delete(bucket: string, key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key.replace(/^\/+/, ""),
      }),
    );
  }

  getPublicUrl(bucket: string, key: string): string {
    const normalizedKey = key.replace(/^\/+/, "");
    return `${this.config.publicBaseUrl.replace(/\/$/, "")}/${bucket}/${normalizedKey}`;
  }

  async listKeys(bucket: string, prefix: string): Promise<string[]> {
    const normalizedPrefix = prefix.replace(/^\/+|\/+$/g, "");
    const listPrefix = normalizedPrefix ? `${normalizedPrefix}/` : "";

    const response = await this.client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: listPrefix,
      }),
    );

    const keys: string[] = [];
    for (const object of response.Contents ?? []) {
      if (!object.Key) {
        continue;
      }
      keys.push(object.Key);
    }

    return keys;
  }
}
