/** A signal silent for longer than this shows a gap in its line. */
export const MAX_SPAN_SECONDS = 2;

/**
 * uPlot breaks a line at `null` and draws across `undefined`. Signals recorded at different rates
 * leave nulls between each other's samples: those become `undefined`, so only a real silence, such
 * as a GPS dropout, stays a gap. `maxSpan` is in the units of `time`.
 */
export function withGaps(time: number[], values: (number | null)[], maxSpan = MAX_SPAN_SECONDS) {
  const drawn: (number | null | undefined)[] = [...values];
  let previous = -1;
  for (let i = 0; i < values.length; i++) {
    if (values[i] === null) continue;
    if (previous >= 0 && time[i] - time[previous] <= maxSpan) {
      drawn.fill(undefined, previous + 1, i);
    }
    previous = i;
  }
  return drawn;
}

/**
 * The value at `index`, or the last one before it as long as its line is drawn there: null after a
 * silence longer than `maxSpan`, so a slower signal shows where it is between its samples.
 */
export function lastValue(
  time: number[],
  values: (number | null)[],
  index: number,
  maxSpan = MAX_SPAN_SECONDS,
) {
  for (let i = index; i >= 0 && time[index] - time[i] <= maxSpan; i--) {
    if (values[i] !== null) return values[i];
  }
  return null;
}
