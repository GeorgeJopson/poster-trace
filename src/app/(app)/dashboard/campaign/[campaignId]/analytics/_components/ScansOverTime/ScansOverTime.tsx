"use client";

import type { ScansOverTimeDto } from "@application/dto/AnalyticsDto";
import StackedAreaChart, { MAX_SERIES } from "@/components/StackedAreaChart";

import styles from "./ScansOverTime.module.css";
import { scanSeries } from "./scanSeries";

interface ScansOverTimeProps {
  scansOverTime: ScansOverTimeDto;
}

/** A `YYYY-MM-DD` day written with `options`. */
function formatDay(day: string, options: Intl.DateTimeFormatOptions) {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", {
    ...options,
    timeZone: "UTC",
  });
}

/** Each day's scans of each design since the campaign began. */
export default function ScansOverTime({
  scansOverTime: { days, dailyScansByDesign },
}: ScansOverTimeProps) {
  return (
    <section
      className={styles.section}
      aria-labelledby="scans-over-time-heading"
    >
      <h2 id="scans-over-time-heading" className={styles.heading}>
        Scans over time
      </h2>
      <StackedAreaChart
        title="Number of scans each day since the campaign began, by poster design"
        xValues={days}
        series={scanSeries(dailyScansByDesign, MAX_SERIES)}
        xLabel="Day"
        yLabel="Scans"
        formatTick={(day) =>
          formatDay(day, { weekday: "short", day: "numeric", month: "short" })
        }
        formatTooltipLabel={(day) =>
          formatDay(day, {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        }
      />
      <p className={styles.note}>Days are in UTC.</p>
    </section>
  );
}
