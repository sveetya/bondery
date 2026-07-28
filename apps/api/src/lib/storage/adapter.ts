export interface StoragePutOptions {
  contentType?: string;
}

export interface StorageAdapter {
  put(bucket: string, key: string, data: Buffer, opts?: StoragePutOptions): Promise<void>;
  get(bucket: string, key: string): Promise<Buffer | null>;
  delete(bucket: string, key: string): Promise<void>;
  getPublicUrl(bucket: string, key: string): string;
}
