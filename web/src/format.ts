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

/** A measured value with `digits` decimals, or a dash when there is none. */
export function formatValue(value: number | null | undefined, digits: number) {
  return value === null || value === undefined ? "–" : value.toFixed(digits);
}

/** A difference with its sign, such as "+1.2" or "−0.30", and no sign when it rounds to zero. */
export function formatChange(value: number, digits: number) {
  const size = Math.abs(value).toFixed(digits);
  if (Number(size) === 0) return size;
  return `${value > 0 ? "+" : "−"}${size}`;
}

/** The local day of a moment, such as "2026-11-08". Days in this form sort and compare as text. */
export function localDay(time: string | number) {
  const date = new Date(time);
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((part) => String(part).padStart(2, "0"))
    .join("-");
}

/** Whether a value, such as one read from the address, is a day that exists in that form. */
export function isDay(value: unknown): value is string {
  return typeof value === "string" && localDay(`${value}T00:00`) === value;
}

const dayFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

/** A day or a range of days, such as "Nov 8, 2026" or "Nov 1 – 8, 2026". */
export function formatDays([from, to]: [string, string]) {
  return dayFormat.formatRange(new Date(`${from}T00:00`), new Date(`${to}T00:00`));
}

/** The day of a run as the team names test days, such as "Saturday, November 8". */
export function testDay(iso: string) {
  const date = new Date(iso);
  const thisYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: thisYear ? undefined : "numeric",
  });
}
