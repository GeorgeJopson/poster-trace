import type { TopPosterDto } from "@application/dto/AnalyticsDto";

import { designLabel } from "../../designLabel";
import analyticsStyles from "../../Analytics.module.css";
import styles from "./TopPosters.module.css";

interface TopPostersProps {
  posters: TopPosterDto[];
  /** The campaign's design ids, in campaign order. */
  designIds: string[];
}

/** The campaign's most scanned posters, most first. */
export default function TopPosters({ posters, designIds }: TopPostersProps) {
  return (
    <section
      className={analyticsStyles.section}
      aria-labelledby="top-posters-heading"
    >
      <h2 id="top-posters-heading" className={analyticsStyles.heading}>
        Top posters
      </h2>
      {posters.length === 0 ? (
        <p>No scans yet.</p>
      ) : (
        <ol className={styles.list}>
          {posters.map(({ posterId, designId, scans }) => (
            <li key={posterId} className={styles.poster}>
              <span>
                {designLabel(designIds, designId)}{" "}
                <span className={styles.posterId} title={posterId}>
                  #{posterId.slice(0, 8)}
                </span>
              </span>
              <span className={styles.scans}>
                {scans} {scans === 1 ? "scan" : "scans"}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
