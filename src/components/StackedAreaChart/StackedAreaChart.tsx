"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import styles from "./StackedAreaChart.module.css";

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

export type AreaSeries = {
  label: string;
  /** This series' value at each point, in `xValues` order. */
  values: number[];
};

interface StackedAreaChartProps {
  /** The x-axis value of each point, in order along the axis. */
  xValues: string[];
  /**
   * The series, stacked in order from the bottom. At most `MAX_SERIES`, each
   * with as many values as there are `xValues`.
   */
  series: AreaSeries[];
  xLabel: string;
  yLabel: string;
  /** Describes the chart for screen readers. */
  title: string;
  /** How an x-axis value is written on the axis. */
  formatTick: (x: string) => string;
  /** How an x-axis value is written at the top of the tooltip. */
  formatTooltipLabel: (x: string) => string;
}

/** The key of each row that holds its x-axis value. */
const X_KEY = "x";

/** The key of each row that holds series `index`'s value. */
const seriesKey = (index: number) => `series${index}`;

/**
 * An area chart with its series stacked, so the top edge shows their total
 * and each band's thickness shows one series.
 */
export default function StackedAreaChart({
  xValues,
  series,
  xLabel,
  yLabel,
  title,
  formatTick,
  formatTooltipLabel,
}: StackedAreaChartProps) {
  if (series.length > MAX_SERIES) {
    throw new Error(`A stacked area chart has at most ${MAX_SERIES} series.`);
  }
  // Recharts takes one row per point, so the series' columns are turned into
  // rows here.
  const data = xValues.map((x, point) => ({
    [X_KEY]: x,
    ...Object.fromEntries(
      series.map(({ values }, index) => [seriesKey(index), values[point]]),
    ),
  }));
  return (
    <figure className={styles.wrapper}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          title={title}
          accessibilityLayer
          margin={{ top: 8, right: 8, bottom: 24, left: 8 }}
        >
          <CartesianGrid vertical={false} stroke="var(--grid-color)" />
          <XAxis
            dataKey={X_KEY}
            tickLine={false}
            stroke="var(--axis-color)"
            tickFormatter={formatTick}
            minTickGap={16}
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
            cursor={{ stroke: "var(--axis-color)" }}
            labelFormatter={(x) => formatTooltipLabel(String(x))}
          />
          <Legend
            verticalAlign="top"
            wrapperStyle={{ paddingBottom: 16 }}
            formatter={(label) => (
              <span className={styles.legendLabel}>{label}</span>
            )}
          />
          {series.map(({ label }, index) => (
            <Area
              key={index}
              dataKey={seriesKey(index)}
              name={label}
              stackId="series"
              type="monotone"
              stroke={SERIES_COLORS[index]}
              fill={SERIES_COLORS[index]}
              fillOpacity={0.6}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </figure>
  );
}
