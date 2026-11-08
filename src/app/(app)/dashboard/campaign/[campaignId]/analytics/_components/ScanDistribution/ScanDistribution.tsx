import type {
  DesignId,
  ScanDistributionBucketDto,
} from "@application/dto/AnalyticsDto";
import GroupedBarChart, {
  type BarSeries,
  MAX_SERIES,
} from "@/components/GroupedBarChart";

import { posterDesignLabel } from "../../../posterDesignLabel";
import styles from "./ScanDistribution.module.css";

const SCAN_COUNT_KEY = "scanCount";
const OTHER_KEY = "other";

interface ScanDistributionProps {
  distribution: ScanDistributionBucketDto[];
  /** The campaign's design ids, in campaign order. */
  designIds: DesignId[];
}

/** How many of each design's posters have each scan count. */
export default function ScanDistribution({
  distribution,
  designIds,
}: ScanDistributionProps) {
  // Past the colours the chart can tell apart, the last designs are
  // combined into one series rather than reusing a colour.
  const shown =
    designIds.length > MAX_SERIES
      ? designIds.slice(0, MAX_SERIES - 1)
      : designIds;
  const others = designIds.slice(shown.length);

  const series: BarSeries[] = shown.map((id, index) => ({
    key: id,
    label: posterDesignLabel(index),
  }));
  if (others.length > 0) {
    series.push({ key: OTHER_KEY, label: "Other poster designs" });
  }
  const data = distribution.map(({ scanCount, posterCountByDesign }) => {
    const row: Record<string, number> = { [SCAN_COUNT_KEY]: scanCount };
    for (const id of shown) row[id] = posterCountByDesign[id];
    if (others.length > 0) {
      row[OTHER_KEY] = others.reduce(
        (sum, id) => sum + posterCountByDesign[id],
        0,
      );
    }
    return row;
  });

  return (
    <section
      className={styles.section}
      aria-labelledby="scan-distribution-heading"
    >
      <h2 id="scan-distribution-heading" className={styles.heading}>
        Scan distribution
      </h2>
      <GroupedBarChart
        title="Number of posters with each number of scans, by poster design"
        data={data}
        xKey={SCAN_COUNT_KEY}
        series={series}
        xLabel="Scans"
        yLabel="Posters"
      />
    </section>
  );
}
