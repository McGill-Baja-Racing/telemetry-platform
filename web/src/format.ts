/**
 * Seconds as minutes, seconds and milliseconds, such as 518.512 → "8:38.512", or "8:38" without
 * milliseconds. Cut like a stopwatch, not rounded, so a time reads the same either way.
 */
export function formatClock(seconds: number, milliseconds = true) {
  const ms = Math.round(seconds * 1000);
  const minutes = Math.floor(ms / 60_000);
  const secs = String(Math.floor((ms % 60_000) / 1000)).padStart(2, "0");
  const rest = String(ms % 1000).padStart(3, "0");
  return milliseconds ? `${minutes}:${secs}.${rest}` : `${minutes}:${secs}`;
}
