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
  /** The key of each row that holds this series' value. */
  key: string;
  label: string;
};

interface GroupedBarChartProps {
  /** One row per group of bars, in order along the x-axis. */
  data: Record<string, number>[];
  /** The key of each row that holds its x-axis value. */
  xKey: string;
  /** The bars of each group, side by side. At most `MAX_SERIES`. */
  series: BarSeries[];
  xLabel: string;
  yLabel: string;
  /** Describes the chart for screen readers. */
  title: string;
}

/** A bar chart with a group of side-by-side bars for each x-axis value. */
export default function GroupedBarChart({
  data,
  xKey,
  series,
  xLabel,
  yLabel,
  title,
}: GroupedBarChartProps) {
  if (series.length > MAX_SERIES) {
    throw new Error(`A grouped bar chart has at most ${MAX_SERIES} series.`);
  }
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
            dataKey={xKey}
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
          {series.map(({ key, label }, index) => (
            <Bar
              key={key}
              dataKey={key}
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
