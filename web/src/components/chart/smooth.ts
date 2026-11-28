/**
 * Each value as the mean of the values within `seconds / 2` of it, for a calmer line. Nulls stay
 * null and are left out of the means, so a silence longer than `seconds` is never bridged.
 */
export function smooth(time: number[], values: (number | null)[], seconds: number) {
  const half = seconds / 2;
  const smoothed: (number | null)[] = values.map(() => null);
  let sum = 0;
  let count = 0;
  let low = 0;
  let high = 0;
  for (let i = 0; i < values.length; i++) {
    if (values[i] === null) continue;
    for (; high < values.length && time[high] <= time[i] + half; high++) {
      const value = values[high];
      if (value !== null) {
        sum += value;
        count++;
      }
    }
    for (; time[low] < time[i] - half; low++) {
      const value = values[low];
      if (value !== null) {
        sum -= value;
        count--;
      }
    }
    smoothed[i] = sum / count;
  }
  return smoothed;
}
