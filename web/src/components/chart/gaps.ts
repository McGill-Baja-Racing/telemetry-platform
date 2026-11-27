/** A signal silent for longer than this shows a gap in its line. */
const MAX_SPAN_SECONDS = 2;

/**
 * uPlot breaks a line at `null` and draws across `undefined`. Signals recorded at different rates
 * leave nulls between each other's samples: those become `undefined`, so only a real silence, such
 * as a GPS dropout, stays a gap.
 */
export function withGaps(time: number[], values: (number | null)[]) {
  const drawn: (number | null | undefined)[] = [...values];
  let previous = -1;
  for (let i = 0; i < values.length; i++) {
    if (values[i] === null) continue;
    if (previous >= 0 && time[i] - time[previous] <= MAX_SPAN_SECONDS) {
      drawn.fill(undefined, previous + 1, i);
    }
    previous = i;
  }
  return drawn;
}
