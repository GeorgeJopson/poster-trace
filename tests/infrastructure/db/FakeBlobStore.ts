import type { BlobStore } from "@infrastructure/storage/BlobStore";

export class FakeBlobStore implements BlobStore {
  readonly blobs = new Map<string, { data: Blob; contentType: string }>();

  async set(key: string, data: Blob, contentType: string): Promise<void> {
    this.blobs.set(key, { data, contentType });
  }

  async getStream(key: string) {
    const blob = this.blobs.get(key);
    return blob
      ? { data: blob.data.stream(), contentType: blob.contentType }
      : null;
  }

  async delete(key: string): Promise<void> {
    this.blobs.delete(key);
  }
}
