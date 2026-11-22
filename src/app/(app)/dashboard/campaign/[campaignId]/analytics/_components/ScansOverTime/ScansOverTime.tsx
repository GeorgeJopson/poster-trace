"use client";

import { useState, useSyncExternalStore } from "react";

import type { ScansOverTimeDto } from "@application/dto/AnalyticsDto";
import StackedAreaChart, { MAX_SERIES } from "@/components/StackedAreaChart";

import { dailyScans } from "./dailyScans";
import styles from "./ScansOverTime.module.css";

interface ScansOverTimeProps {
  scansOverTime: ScansOverTimeDto;
}

/** The viewer's time zone never changes while the page is open. */
const subscribe = () => () => {};
const viewerTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
/** The server doesn't know the viewer's time zone. */
const noTimeZone = () => null;

/** A `YYYY-MM-DD` day written with `options`. */
function formatDay(day: string, options: Intl.DateTimeFormatOptions) {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-GB", {
    ...options,
    timeZone: "UTC",
  });
}

/** Each day's scans of each design since the campaign began. */
export default function ScansOverTime({ scansOverTime }: ScansOverTimeProps) {
  // Days are the viewer's, so the chart is only drawn in the browser.
  const timeZone = useSyncExternalStore(subscribe, viewerTimeZone, noTimeZone);
  const [now] = useState(() => new Date());

  return (
    <section
      className={styles.section}
      aria-labelledby="scans-over-time-heading"
    >
      <h2 id="scans-over-time-heading" className={styles.heading}>
        Scans over time
      </h2>
      {timeZone === null ? (
        <div className={styles.placeholder} />
      ) : (
        <Chart scansOverTime={scansOverTime} now={now} timeZone={timeZone} />
      )}
    </section>
  );
}

function Chart({
  scansOverTime,
  now,
  timeZone,
}: ScansOverTimeProps & { now: Date; timeZone: string }) {
  const { days, series } = dailyScans(scansOverTime, now, timeZone, MAX_SERIES);
  return (
    <StackedAreaChart
      title="Number of scans each day since the campaign began, by poster design"
      xValues={days}
      series={series}
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
  );
}
