import { z } from "zod";

/** Sizes from ESP32DataLogger `docs/LOG_FORMAT.md`. */
export const RECORD_BYTES = 16;
export const UTC_BYTES = 8;

const REQUEST_TIMEOUT_MS = 5_000;

const logsSchema = z.array(z.object({ name: z.string(), size_bytes: z.number() }));
const signalsSchema = z.array(
  z.object({ can_id: z.number(), signal: z.string(), node: z.string(), units: z.string() }),
);
const errorSchema = z.object({ error: z.string() });

export type MasterLog = { name: string; sizeBytes: number; sampleCount: number };

export type SignalInfo = { name: string; node: string; units: string };

export class MasterError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "MasterError";
    this.status = status;
  }
}

/** The API is defined in ESP32DataLogger, `master-node/src/web/web_server.c`. */
export class Master {
  readonly url: string;

  constructor(url: string) {
    this.url = url;
  }

  /** The log being recorded only shows up after Stop. */
  async listLogs(): Promise<MasterLog[]> {
    const response = await this.request("/api/logs", AbortSignal.timeout(REQUEST_TIMEOUT_MS));
    const logs = logsSchema.parse(await response.json());
    return logs.map((log) => ({
      name: log.name,
      sizeBytes: log.size_bytes,
      sampleCount: Math.floor(log.size_bytes / RECORD_BYTES),
    }));
  }

  async signals(): Promise<Map<number, SignalInfo>> {
    const response = await this.request(
      "/api/live/signals",
      AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    );
    const signals = signalsSchema.parse(await response.json());
    return new Map(
      signals.map(({ can_id, signal, node, units }) => [can_id, { name: signal, node, units }]),
    );
  }

  /**
   * `bin` is the file as recorded, `utc` its companion with the GPS time of each sample. The master
   * answers 404 for a `.utc` that does not exist, and 400 when its firmware predates `utc`.
   */
  async download(
    name: string,
    format: "bin" | "utc",
    signal: AbortSignal,
  ): Promise<ReadableStream<Uint8Array>> {
    const query = new URLSearchParams({ name, format });
    const response = await this.request(`/api/logs/download?${query}`, signal);
    if (!response.body) throw new Error(`The master sent no data for ${name}`);
    return response.body;
  }

  private async request(path: string, signal: AbortSignal): Promise<Response> {
    const response = await fetch(new URL(path, this.url), { signal });
    if (response.ok) return response;

    const body = errorSchema.safeParse(await response.json().catch(() => null));
    throw new MasterError(response.status, body.success ? body.data.error : response.statusText);
  }
}
