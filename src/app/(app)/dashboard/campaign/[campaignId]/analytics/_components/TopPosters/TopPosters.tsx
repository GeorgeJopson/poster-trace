import type { TopPosterDto } from "@application/dto/AnalyticsDto";

import { posterDesignLabel } from "../../../posterDesignLabel";
import styles from "./TopPosters.module.css";

interface TopPostersProps {
  posters: TopPosterDto[];
  /** The campaign's design ids, in campaign order. */
  designIds: string[];
}

/** The campaign's most scanned posters, most first. */
export default function TopPosters({ posters, designIds }: TopPostersProps) {
  return (
    <section className={styles.section} aria-labelledby="top-posters-heading">
      <h2 id="top-posters-heading" className={styles.heading}>
        Top posters
      </h2>
      {posters.length === 0 ? (
        <p>No scans yet.</p>
      ) : (
        <ol className={styles.list}>
          {posters.map(({ posterId, designId, scanCount }) => (
            <li key={posterId} className={styles.poster}>
              <span>
                {posterDesignLabel(designIds.indexOf(designId))}{" "}
                <span className={styles.posterId} title={posterId}>
                  #{posterId.slice(0, 8)}
                </span>
              </span>
              <span className={styles.scanCount}>
                {scanCount} {scanCount === 1 ? "scan" : "scans"}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
