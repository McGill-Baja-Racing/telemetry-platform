/** One line on a chart. `color` is a colour token, such as "axis-x". A null value leaves a gap. */
export type ChartSeries = { label: string; color: string; values: (number | null)[] };

/** How a chart is drawn: a y axis set by hand, and its smoothing in seconds. */
export type ChartSettings = { y?: [number, number]; smoothing?: number };
