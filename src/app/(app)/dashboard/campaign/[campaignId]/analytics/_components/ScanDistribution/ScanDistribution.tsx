import type { DesignScanDistributionDto } from "@application/dto/AnalyticsDto";
import GroupedBarChart, {
  type BarSeries,
  MAX_SERIES,
} from "@/components/GroupedBarChart";

import { posterDesignLabel } from "../../../posterDesignLabel";
import styles from "./ScanDistribution.module.css";

interface ScanDistributionProps {
  /** Every design of the campaign, in campaign order. At least one. */
  distribution: DesignScanDistributionDto[];
}

/** How many of each design's posters have each scan count. */
export default function ScanDistribution({
  distribution,
}: ScanDistributionProps) {
  // Every design has a poster count for each scan count from 0 up.
  const scanCounts = [...distribution[0].posterCounts.keys()];

  // Past the colours the chart can tell apart, the last designs are
  // combined into one series rather than reusing a colour.
  const shown =
    distribution.length > MAX_SERIES
      ? distribution.slice(0, MAX_SERIES - 1)
      : distribution;
  const others = distribution.slice(shown.length);

  const series: BarSeries[] = shown.map(({ position, posterCounts }) => ({
    label: posterDesignLabel(position),
    values: posterCounts,
  }));
  if (others.length > 0) {
    series.push({
      label: "Other poster designs",
      values: scanCounts.map((scanCount) =>
        others.reduce(
          (sum, { posterCounts }) => sum + posterCounts[scanCount],
          0,
        ),
      ),
    });
  }

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
        xValues={scanCounts}
        series={series}
        xLabel="Scans"
        yLabel="Posters"
      />
    </section>
  );
}
