import { expect, test } from "vitest";
import { groupRows } from "./table.ts";

const runs = [
  { name: "log_10.bin", day: "Nov 8", minutes: 3 },
  { name: "log_9.bin", day: "Nov 1", minutes: 12 },
  { name: "log_11.bin", day: "Nov 8", minutes: 3 },
];

test("sorts numbers by value and names as people read them", () => {
  const names = (rows: typeof runs) => rows.map((run) => run.name);
  const [byName] = groupRows(runs, { key: "name", descending: false }, undefined);
  expect(names(byName.rows)).toEqual(["log_9.bin", "log_10.bin", "log_11.bin"]);
  const [longest] = groupRows(runs, { key: "minutes", descending: true }, undefined);
  expect(names(longest.rows)).toEqual(["log_9.bin", "log_10.bin", "log_11.bin"]);
});

test("groups neighbours with the same name, in the sorted order", () => {
  const groups = groupRows(runs, { key: "name", descending: true }, (run) => run.day);
  expect(groups.map((group) => [group.name, group.rows.length])).toEqual([
    ["Nov 8", 2],
    ["Nov 1", 1],
  ]);
});
