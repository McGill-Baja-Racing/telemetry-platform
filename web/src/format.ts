/** Seconds as minutes and seconds, such as 518.5 → "8:38.5", or "8:38" without tenths. */
export function formatClock(seconds: number, tenths = true) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds - minutes * 60;
  const secs = tenths
    ? rest.toFixed(1).padStart(4, "0")
    : Math.floor(rest).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
}
