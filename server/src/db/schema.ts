import {
  bigint,
  boolean,
  doublePrecision,
  index,
  integer,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const recordings = pgTable("recordings", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  name: text().notNull(),
  /** Identifies a log even after it is renamed on the master. */
  sha256: text().notNull().unique(),
  startedAt: timestamp({ withTimezone: true }).notNull(),
  endedAt: timestamp({ withTimezone: true }).notNull(),
  /** False without a GPS fix: times then count from 1970-01-01, when the master powered on. */
  gpsTime: boolean().notNull(),
  sampleCount: integer().notNull(),
  importedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/** A TimescaleDB hypertable. No foreign key on `recordingId`: checking it slowed imports 3×. */
export const samples = pgTable(
  "samples",
  {
    time: timestamp({ withTimezone: true }).notNull(),
    recordingId: integer().notNull(),
    canId: smallint().notNull(),
    value: doublePrecision().notNull(),
  },
  (table) => [index().on(table.recordingId, table.canId, table.time)],
);

export const signals = pgTable("signals", {
  canId: smallint().primaryKey(),
  name: text().notNull(),
  node: text().notNull(),
  units: text().notNull(),
});

/** Lets the collector skip logs it already downloaded. */
export const masterLogs = pgTable(
  "master_logs",
  {
    name: text().notNull(),
    sizeBytes: bigint({ mode: "number" }).notNull(),
    recordingId: integer()
      .notNull()
      .references(() => recordings.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.name, table.sizeBytes] })],
);
