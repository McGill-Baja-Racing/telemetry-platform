import { randomUUID } from "node:crypto";
import { mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { debuglog } from "node:util";
import { db } from "../db/index.ts";
import { masterLogs } from "../db/schema.ts";
import { Master, MasterError, type MasterLog, type SignalInfo } from "../master/client.ts";
import { importRecording } from "../recordings/import.ts";
import { type Download, downloadLog } from "./download.ts";

const SYNC_INTERVAL_MS = 10_000;
const DOWNLOAD_DIR = join(tmpdir(), "baja-collector");

const debug = debuglog("collector");

type Task = { log: string; step: "downloading" | "importing"; progress: number };

type CollectorStatus = {
  master: "online" | "offline";
  current: Task | null;
  lastError: { message: string; at: Date } | null;
};

export const status: CollectorStatus = { master: "offline", current: null, lastError: null };

/** Logs that failed after a complete download. Downloading them again would fail the same way. */
const rejectedLogs = new Set<string>();
let printedError: string | null = null;

export async function runCollector(masterUrl: string): Promise<never> {
  const master = new Master(masterUrl);
  console.info(`Collecting logs from the master at ${masterUrl}`);
  // A restart in the middle of a download leaves its file behind.
  await rm(DOWNLOAD_DIR, { recursive: true, force: true });
  await mkdir(DOWNLOAD_DIR);
  while (true) {
    await sync(master);
    await sleep(SYNC_INTERVAL_MS);
  }
}

async function sync(master: Master) {
  let logs: MasterLog[];
  try {
    logs = await master.listLogs();
  } catch (error) {
    const answered = error instanceof MasterError;
    setMaster(answered ? "online" : "offline");
    if (answered) report(error);
    else debug(`Master unreachable: ${messageOf(error)}`);
    return;
  }
  setMaster("online");

  try {
    const pending = await newLogs(logs);
    debug(`The master has ${logs.length} logs, ${pending.length} to collect`);
    if (pending.length > 0) {
      const signals = await master.signals();
      for (const log of pending) await collect(master, log, signals);
    }
    printedError = null;
  } catch (error) {
    report(error);
  }
}

async function newLogs(logs: MasterLog[]): Promise<MasterLog[]> {
  const known = new Set((await db.select().from(masterLogs)).map(logKey));
  const isNew = (log: MasterLog) =>
    log.sampleCount > 0 && !known.has(logKey(log)) && !rejectedLogs.has(logKey(log));
  return logs.filter(isNew).toSorted((a, b) => a.name.localeCompare(b.name));
}

async function collect(master: Master, log: MasterLog, signals: Map<number, SignalInfo>) {
  const path = join(DOWNLOAD_DIR, `${randomUUID()}.bin`);
  const current: Task = { log: log.name, step: "downloading", progress: 0 };
  status.current = current;
  debug(`${log.name}: downloading ${log.sampleCount} samples`);

  try {
    const onProgress = (progress: number) => {
      current.progress = progress;
    };
    const download = await downloadLog(master, log, path, onProgress).catch((error) => {
      throw new Error(`Download of ${log.name} failed`, { cause: error });
    });

    current.step = "importing";
    await store(log, path, download, signals).catch((error) => {
      rejectedLogs.add(logKey(log));
      throw new Error(`${log.name} is skipped until the server restarts`, { cause: error });
    });
  } finally {
    status.current = null;
    await rm(path, { force: true });
  }
}

async function store(
  log: MasterLog,
  path: string,
  download: Download,
  signals: Map<number, SignalInfo>,
) {
  if (download.sampleCount !== log.sampleCount) {
    throw new Error(
      `its download has ${download.sampleCount} samples instead of ${log.sampleCount}`,
    );
  }
  const startedAt = performance.now();
  const { sha256, firstUtc } = download;
  const recording = await importRecording({ name: log.name, path, sha256, signals, firstUtc });
  await db
    .insert(masterLogs)
    .values({ name: log.name, sizeBytes: log.sizeBytes, recordingId: recording.id });
  console.info(recording.isNew ? `Imported ${log.name}` : `${log.name} was already imported`);
  debug(`${log.name}: stored in ${((performance.now() - startedAt) / 1000).toFixed(1)} s`);
}

function logKey(log: { name: string; sizeBytes: number }) {
  return `${log.name}:${log.sizeBytes}`;
}

function setMaster(state: CollectorStatus["master"]) {
  if (status.master !== state) console.info(`Master ${state}`);
  status.master = state;
}

/** Prints an error once while it repeats round after round, such as a master that is too old. */
function report(error: unknown) {
  const message = messageOf(error);
  if (message !== printedError) console.error(error);
  printedError = message;
  status.lastError = { message, at: new Date() };
}

function messageOf(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const message = error.message || ("code" in error ? String(error.code) : error.name);
  return error.cause ? `${message}: ${messageOf(error.cause)}` : message;
}
