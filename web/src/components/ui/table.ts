import type { Sort } from "./types.ts";

export function cellOf(row: object, key: string) {
  return (row as Record<string, unknown>)[key];
}

const collator = new Intl.Collator(undefined, { numeric: true });

function compare(a: unknown, b: unknown) {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return collator.compare(String(a ?? ""), String(b ?? ""));
}

/**
 * Sorted by `row[sort.key]`, numbers by value and text as people read it ("log_9" before
 * "log_10"), then cut into groups of neighbours that `group` names the same.
 */
export function groupRows<Row extends object>(
  rows: Row[],
  sort: Sort | undefined,
  group: ((row: Row) => string) | undefined,
) {
  const sign = sort?.descending ? -1 : 1;
  const sorted = sort
    ? rows.toSorted((a, b) => sign * compare(cellOf(a, sort.key), cellOf(b, sort.key)))
    : rows;
  const groups: { name: string; rows: Row[] }[] = [];
  for (const row of sorted) {
    const name = group?.(row) ?? "";
    const last = groups.at(-1);
    if (last?.name === name) last.rows.push(row);
    else groups.push({ name, rows: [row] });
  }
  return groups;
}
