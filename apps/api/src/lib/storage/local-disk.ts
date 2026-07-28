import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StorageAdapter, StoragePutOptions } from "./adapter.js";

function resolvePath(rootDir: string, bucket: string, key: string): string {
  const normalizedKey = key.replace(/^\/+/, "");
  const full = path.join(rootDir, bucket, normalizedKey);
  const resolvedRoot = path.resolve(rootDir, bucket);
  const resolvedFull = path.resolve(full);
  if (!resolvedFull.startsWith(resolvedRoot + path.sep) && resolvedFull !== resolvedRoot) {
    throw new Error("Invalid storage key");
  }
  return resolvedFull;
}

export class LocalDiskStorage implements StorageAdapter {
  constructor(
    private readonly rootDir: string,
    private readonly publicBaseUrl: string,
  ) {}

  async put(bucket: string, key: string, data: Buffer, opts?: StoragePutOptions): Promise<void> {
    const filePath = resolvePath(this.rootDir, bucket, key);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, data);
    void opts;
  }

  async get(bucket: string, key: string): Promise<Buffer | null> {
    const filePath = resolvePath(this.rootDir, bucket, key);
    try {
      return await readFile(filePath);
    } catch {
      return null;
    }
  }

  async delete(bucket: string, key: string): Promise<void> {
    const filePath = resolvePath(this.rootDir, bucket, key);
    try {
      await unlink(filePath);
    } catch {
      // ignore missing files
    }
  }

  getPublicUrl(bucket: string, key: string): string {
    const normalizedKey = key.replace(/^\/+/, "");
    return `${this.publicBaseUrl.replace(/\/$/, "")}/${bucket}/${normalizedKey}`;
  }
}
