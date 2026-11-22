import type { DesignPosition } from "@application/dto/AnalyticsDto";

import { posterDesignLabel } from "../../../posterDesignLabel";

/** A stacked series of daily scan counts, one per day. */
export type DailySeries = { label: string; values: number[] };

/**
 * A labelled series of each design's daily scans, in campaign order. Past
 * `maxSeries`, the last designs are combined into one series.
 */
export function scanSeries(
  dailyScansByDesign: Map<DesignPosition, number[]>,
  maxSeries: number,
): DailySeries[] {
  const designCount = dailyScansByDesign.size;
  // Past the series the chart can tell apart, the last designs share one
  // series rather than reusing a colour.
  const ownSeriesCount = designCount > maxSeries ? maxSeries - 1 : designCount;
  const series: DailySeries[] = [];
  for (const [position, values] of dailyScansByDesign) {
    if (position < ownSeriesCount) {
      series.push({ label: posterDesignLabel(position), values: [...values] });
    } else if (series.length === ownSeriesCount) {
      series.push({ label: "Other poster designs", values: [...values] });
    } else {
      const other = series[ownSeriesCount].values;
      values.forEach((count, day) => (other[day] += count));
    }
  }
  return series;
}
