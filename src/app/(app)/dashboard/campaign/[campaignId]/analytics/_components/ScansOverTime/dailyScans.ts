import type { ScansOverTimeDto } from "@application/dto/AnalyticsDto";

import { posterDesignLabel } from "../../../posterDesignLabel";

/** A stacked series of daily scan counts, one per day. */
export type DailySeries = { label: string; values: number[] };

/** A campaign's scans per day, ready to chart. */
export type DailyScans = {
  /** Each day as `YYYY-MM-DD`, in order. */
  days: string[];
  series: DailySeries[];
};

/** The day `time` falls on in `timeZone`, as `YYYY-MM-DD`. */
function dayOf(time: Date, timeZone: string): string {
  // en-CA writes dates as YYYY-MM-DD.
  return time.toLocaleDateString("en-CA", { timeZone });
}

/** Every day from `first` to `last`, both `YYYY-MM-DD`, in order. */
function daysFrom(first: string, last: string): string[] {
  const days = [first];
  // A day as midnight UTC, so adding a day's milliseconds never meets a
  // daylight saving change.
  const day = new Date(`${first}T00:00:00Z`);
  while (days.at(-1)! < last) {
    day.setUTCDate(day.getUTCDate() + 1);
    days.push(day.toISOString().slice(0, 10));
  }
  return days;
}

/**
 * Each day's scans of each design in `timeZone`, from the day the campaign
 * began through the day of `now`. Days without scans count 0. Every design
 * gets a series, in campaign order, but past `maxSeries` the last designs
 * are combined into one series.
 */
export function dailyScans(
  { createdAt, designCount, slots }: ScansOverTimeDto,
  now: Date,
  timeZone: string,
  maxSeries: number,
): DailyScans {
  const days = daysFrom(dayOf(createdAt, timeZone), dayOf(now, timeZone));
  // Past the series the chart can tell apart, the last designs share one
  // series rather than reusing a colour.
  const ownSeriesCount = designCount > maxSeries ? maxSeries - 1 : designCount;
  const series = Array.from(
    { length: Math.min(designCount, maxSeries) },
    (_, index) => ({
      label:
        index < ownSeriesCount
          ? posterDesignLabel(index)
          : "Other poster designs",
      values: new Array<number>(days.length).fill(0),
    }),
  );
  const indexOfDay = new Map(days.map((day, index) => [day, index]));
  for (const { position, slotStart, scanCount } of slots) {
    // A slot outside the days, from a clock running ahead, is left out.
    const index = indexOfDay.get(dayOf(slotStart, timeZone));
    if (index === undefined) continue;
    series[Math.min(position, ownSeriesCount)].values[index] += scanCount;
  }
  return { days, series };
}
