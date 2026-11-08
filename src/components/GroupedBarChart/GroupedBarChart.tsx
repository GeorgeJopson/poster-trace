"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import styles from "./GroupedBarChart.module.css";

/**
 * Series colours, assigned in this order and never reused, so each series
 * keeps its colour. A validated colour-blind-safe categorical palette.
 */
const SERIES_COLORS = [
  "#2a78d6",
  "#eb6834",
  "#1baf7a",
  "#eda100",
  "#e87ba4",
  "#008300",
  "#6250d6",
  "#e34948",
];

/** The most series the chart can tell apart by colour. */
export const MAX_SERIES = SERIES_COLORS.length;

export type BarSeries = {
  label: string;
  /** The height of this series' bar in each group, in `xValues` order. */
  values: number[];
};

interface GroupedBarChartProps {
  /** The x-axis value of each group of bars, in order along the axis. */
  xValues: (string | number)[];
  /**
   * The bars of each group, side by side. At most `MAX_SERIES`, each with as
   * many values as there are `xValues`.
   */
  series: BarSeries[];
  xLabel: string;
  yLabel: string;
  /** Describes the chart for screen readers. */
  title: string;
}

/** The key of each row that holds its x-axis value. */
const X_KEY = "x";

/** The key of each row that holds series `index`'s value. */
const seriesKey = (index: number) => `series${index}`;

/** A bar chart with a group of side-by-side bars for each x-axis value. */
export default function GroupedBarChart({
  xValues,
  series,
  xLabel,
  yLabel,
  title,
}: GroupedBarChartProps) {
  if (series.length > MAX_SERIES) {
    throw new Error(`A grouped bar chart has at most ${MAX_SERIES} series.`);
  }
  // Recharts takes one row per group, so the series' columns are turned
  // into rows here.
  const data = xValues.map((x, group) => ({
    [X_KEY]: x,
    ...Object.fromEntries(
      series.map(({ values }, index) => [seriesKey(index), values[group]]),
    ),
  }));
  return (
    <figure className={styles.wrapper}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          title={title}
          accessibilityLayer
          barGap={2}
          margin={{ top: 8, right: 8, bottom: 24, left: 8 }}
        >
          <CartesianGrid vertical={false} stroke="var(--grid-color)" />
          <XAxis
            dataKey={X_KEY}
            tickLine={false}
            stroke="var(--axis-color)"
            label={{ value: xLabel, position: "bottom", offset: 4 }}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            stroke="var(--axis-color)"
            label={{ value: yLabel, angle: -90, position: "insideLeft" }}
          />
          <Tooltip
            cursor={{ fill: "var(--cursor-color)" }}
            labelFormatter={(value) => `${xLabel}: ${value}`}
          />
          <Legend
            verticalAlign="top"
            wrapperStyle={{ paddingBottom: 16 }}
            formatter={(label) => (
              <span className={styles.legendLabel}>{label}</span>
            )}
          />
          {series.map(({ label }, index) => (
            <Bar
              key={index}
              dataKey={seriesKey(index)}
              name={label}
              fill={SERIES_COLORS[index]}
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}
