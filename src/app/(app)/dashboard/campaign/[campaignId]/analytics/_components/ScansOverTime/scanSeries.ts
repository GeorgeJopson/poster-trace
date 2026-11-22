import { posterDesignLabel } from "../../../posterDesignLabel";

/** A stacked series of daily scan counts, one per day. */
export type DailySeries = { label: string; values: number[] };

/**
 * A labelled series of each design's daily scans, in campaign order, from
 * daily scans indexed by design position. Past `maxSeries`, the last designs
 * are combined into one series.
 */
export function scanSeries(
  dailyScansByDesign: number[][],
  maxSeries: number,
): DailySeries[] {
  if (dailyScansByDesign.length <= maxSeries) {
    return dailyScansByDesign.map((values, position) => ({
      label: posterDesignLabel(position),
      values,
    }));
  }
  // Past the series the chart can tell apart, the last designs share one
  // series rather than reusing a colour.
  const own = dailyScansByDesign.slice(0, maxSeries - 1);
  const rest = dailyScansByDesign.slice(maxSeries - 1);
  return [
    ...own.map((values, position) => ({
      label: posterDesignLabel(position),
      values,
    })),
    {
      label: "Other poster designs",
      values: rest[0].map((_, day) =>
        rest.reduce((total, values) => total + values[day], 0),
      ),
    },
  ];
}
