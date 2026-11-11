import type { Scan } from "./Scan";

/** Stores scans. Anyone can scan a poster, so nothing here checks ownership. */
export interface ScanRepository {
  /**
   * Stores the scan. It only ever inserts: stored scans are never changed or
   * deleted (see ADR-0015). If the scan's poster isn't stored, e.g. because
   * it was deleted since the redirect, nothing is stored and it doesn't
   * throw (see ADR-0017).
   */
  add(scan: Scan): Promise<void>;
}
