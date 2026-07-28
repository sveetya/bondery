import {
  DeleteObjectCommand,
  GetObjectCommand,
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

export class S3Storage implements StorageAdapter {
  private readonly client: S3Client;

  constructor(
    private readonly bucket: string,
    private readonly publicBaseUrl: string,
    config: {
      endpoint?: string;
      region: string;
      accessKeyId: string;
      secretAccessKey: string;
      forcePathStyle?: boolean;
    },
  ) {
    this.client = new S3Client({
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      endpoint: config.endpoint,
      forcePathStyle: config.forcePathStyle ?? Boolean(config.endpoint),
      region: config.region,
    });
  }

  private objectKey(bucket: string, key: string): string {
    return `${bucket}/${key.replace(/^\/+/, "")}`;
  }

  async put(bucket: string, key: string, data: Buffer, opts?: StoragePutOptions): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Body: data,
        Bucket: this.bucket,
        ContentType: opts?.contentType,
        Key: this.objectKey(bucket, key),
      }),
    );
  }

  async get(bucket: string, key: string): Promise<Buffer | null> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: this.objectKey(bucket, key),
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
        Bucket: this.bucket,
        Key: this.objectKey(bucket, key),
      }),
    );
  }

  getPublicUrl(bucket: string, key: string): string {
    const normalizedKey = key.replace(/^\/+/, "");
    return `${this.publicBaseUrl.replace(/\/$/, "")}/${bucket}/${normalizedKey}`;
  }
}
