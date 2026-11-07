import type { BlobStore, StoredBlob } from "@infrastructure/storage/BlobStore";

type FakeBlob = { data: Blob; contentType: string; uploadedAt: Date | null };

export class FakeBlobStore implements BlobStore {
  readonly blobs = new Map<string, FakeBlob>();

  /** `now` is when each blob is stamped as uploaded. */
  constructor(private readonly now: () => Date = () => new Date()) {}

  async set(key: string, data: Blob, contentType: string): Promise<void> {
    this.blobs.set(key, { data, contentType, uploadedAt: this.now() });
  }

  async getStream(key: string) {
    const blob = this.blobs.get(key);
    return blob
      ? { data: blob.data.stream(), contentType: blob.contentType }
      : null;
  }

  async list(): Promise<StoredBlob[]> {
    return [...this.blobs].map(([key, { uploadedAt }]) => ({
      key,
      uploadedAt,
    }));
  }

  async delete(key: string): Promise<void> {
    this.blobs.delete(key);
  }
}
