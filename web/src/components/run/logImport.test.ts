import { expect, test } from "vitest";
import { pairLog } from "./logImport.ts";

const files = (...names: string[]) => names.map((name) => ({ name }));

test("pairs a log with its .utc companion, named as on the card or without .bin", () => {
  expect(pairLog(files("log_0001.bin.utc", "log_0001.bin"))).toEqual({
    bin: { name: "log_0001.bin" },
    utc: { name: "log_0001.bin.utc" },
  });
  expect(pairLog(files("log_0001.bin", "log_0001.utc"))).toMatchObject({
    utc: { name: "log_0001.utc" },
  });
  expect(pairLog(files("log_0001.bin"))).toEqual({ bin: { name: "log_0001.bin" }, utc: undefined });
});

test("refuses anything else", () => {
  expect(pairLog(files("log_0001.bin", "log_0002.bin.utc"))).toBe(
    "log_0002.bin.utc is not the .utc file of log_0001.bin.",
  );
  for (const picked of [
    files("a.bin", "b.bin"),
    files("a.csv"),
    files("a.bin", "a.csv"),
    files(),
  ]) {
    expect(pairLog(picked)).toBe("Pick one .bin log, and its .utc file if it has one.");
  }
});
