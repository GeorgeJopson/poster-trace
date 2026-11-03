/** Stores binary data, such as design images, under keys. */
export interface BlobStore {
  /** Stores `data` under `key`, with `contentType` in its metadata. */
  set(key: string, data: Blob, contentType: string): Promise<void>;

  /**
   * The data under `key` as a stream, so callers can pass bytes on as they
   * arrive instead of holding the whole blob in memory. `null` if missing.
   */
  getStream(
    key: string,
  ): Promise<{ data: ReadableStream; contentType: string } | null>;

  delete(key: string): Promise<void>;
}
