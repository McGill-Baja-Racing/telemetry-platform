import { useQueryClient } from "@tanstack/vue-query";
import type { InferResponseType } from "hono/client";
import { ref } from "vue";
import { client } from "../../api.ts";

export type LogImport =
  | { step: "uploading"; name: string; progress: number }
  | { step: "importing"; name: string }
  | { step: "done"; name: string; id: number; isNew: boolean }
  | { step: "failed"; name: string; error: string };

type Imported = InferResponseType<typeof client.api.uploads.$post, 200>;

/**
 * The `.bin` log among the picked files, and its `.utc` companion if picked too. On the card,
 * the companion of `log_0001.bin` is `log_0001.bin.utc`.
 */
export function pairLog<File extends { name: string }>(files: File[]) {
  const bins = files.filter((file) => /\.bin$/i.test(file.name));
  const utcs = files.filter((file) => /\.utc$/i.test(file.name));
  if (bins.length !== 1 || utcs.length > 1 || files.length !== bins.length + utcs.length) {
    return "Pick one .bin log, and its .utc file if it has one.";
  }
  const [bin, utc] = [bins[0], utcs[0]];
  const companions = [`${bin.name}.utc`, bin.name.replace(/\.bin$/i, ".utc")];
  if (utc && !companions.includes(utc.name))
    return `${utc.name} is not the .utc file of ${bin.name}.`;
  return { bin, utc };
}

/**
 * Uploads a log with its progress, then waits while the server imports it. XMLHttpRequest, as
 * `fetch` cannot tell how much of the body was sent.
 */
export function useLogImport(onImported: (id: number) => void) {
  const state = ref<LogImport | null>(null);
  const queryClient = useQueryClient();
  let request: XMLHttpRequest | undefined;

  function start(files: File[]) {
    const pair = pairLog(files);
    if (typeof pair === "string") {
      state.value = { step: "failed", name: "", error: pair };
      return;
    }
    const { name } = pair.bin;
    const fail = (error: string) => {
      state.value = { step: "failed", name, error };
    };
    const xhr = new XMLHttpRequest();
    request = xhr;
    xhr.responseType = "json";
    xhr.upload.onprogress = (event) => {
      state.value = { step: "uploading", name, progress: event.loaded / event.total };
    };
    xhr.upload.onload = () => {
      state.value = { step: "importing", name };
    };
    xhr.onload = () => {
      if (xhr.status !== 200)
        return fail(xhr.response?.error ?? `The server answered ${xhr.status}.`);
      const { id, isNew }: Imported = xhr.response;
      state.value = { step: "done", name, id, isNew };
      queryClient.invalidateQueries({ queryKey: ["recordings"] });
      onImported(id);
    };
    xhr.onerror = () => fail("The server could not be reached.");
    xhr.onabort = () => {
      state.value = null;
    };
    const utcBytes = String(pair.utc?.size ?? 0);
    xhr.open("POST", client.api.uploads.$path({ query: { name, utcBytes } }));
    xhr.send(new Blob(pair.utc ? [pair.utc, pair.bin] : [pair.bin]));
    state.value = { step: "uploading", name, progress: 0 };
  }

  return { state, start, cancel: () => request?.abort(), dismiss: () => (state.value = null) };
}
