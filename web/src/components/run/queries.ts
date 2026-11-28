import { useQuery } from "@tanstack/vue-query";
import { StorageSerializers, useLocalStorage } from "@vueuse/core";
import { parseResponse } from "hono/client";
import { computed, type MaybeRefOrGetter, toValue } from "vue";
import { client } from "../../api.ts";

const runApi = client.api.recordings[":id"];

type Param = { id: string };

/** A run, its GPS track and its laps from the start line. Nothing loads while `id` is undefined. */
export function useRun(id: MaybeRefOrGetter<string | undefined>) {
  const param = computed(() => ({ id: toValue(id) ?? "" }));
  const picked = computed(() => toValue(id) !== undefined);

  const run = useQuery({
    queryKey: ["recording", param],
    queryFn: () => parseResponse(runApi.$get({ param: param.value })),
    enabled: picked,
  });
  const track = useQuery({
    queryKey: ["track", param],
    queryFn: () => parseResponse(runApi.track.$get({ param: param.value })),
    enabled: picked,
  });
  const hasTrack = computed(() => (track.data.value?.time.length ?? 0) > 1);

  /** Kept from one run to the next: runs of the same test day share it. */
  const startLine = useLocalStorage<{ lat: number; lon: number } | null>("start-line", null, {
    serializer: StorageSerializers.object,
  });
  const laps = useQuery({
    queryKey: ["laps", param, startLine],
    queryFn: () => {
      const { lat, lon } = startLine.value ?? { lat: 0, lon: 0 };
      const query = { lat: String(lat), lon: String(lon) };
      return parseResponse(runApi.laps.$get({ param: param.value, query }));
    },
    enabled: computed(() => picked.value && startLine.value !== null && hasTrack.value),
  });

  return { param, run, track, hasTrack, startLine, laps };
}

/** About one point per pixel of `width`, in steps, so that resizing the window rarely reloads. */
export function pointsFor(width: number) {
  return Math.min(Math.max(Math.round(width / 200) * 200, 200), 4000);
}

/** Seconds from the start of the run; the whole run when null. */
type Range = [number, number] | null;

function span(range: Range) {
  return range ? { from: String(range[0]), to: String(range[1]) } : {};
}

export function readSamples(param: Param, names: string[], points: number, range: Range) {
  const query = { signals: names.join(","), points: String(points), ...span(range) };
  return parseResponse(runApi.samples.$get({ param, query }));
}
