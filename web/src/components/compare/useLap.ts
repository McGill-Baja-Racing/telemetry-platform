import { useQuery } from "@tanstack/vue-query";
import { computed, type MaybeRefOrGetter, toValue } from "vue";
import { readSamples, readStats, useRun } from "../run/queries.ts";
import { bestLap, type Lap } from "../run/run.ts";
import type { LapData } from "./align.ts";

/** Lap `number` from 1, or else the best lap that is not `taken`. */
function pickLap(laps: Lap[], number: number | undefined, taken: Lap | undefined) {
  if (number !== undefined) return laps[number - 1];
  return bestLap(laps.filter((lap) => lap.start !== taken?.start)) ?? bestLap(laps);
}

/** Why a run has no lap to compare. */
function whyNoLap(loaded: ReturnType<typeof useRun>, lap: Lap | undefined, number?: number) {
  if (loaded.track.data.value && !loaded.hasTrack.value) {
    return "This run has no GPS track, so it has no laps.";
  }
  if (loaded.hasTrack.value && loaded.startLine.value === null) {
    return "No start line yet: set one on a run's map.";
  }
  const found = loaded.laps.data.value;
  if (!found || lap) return undefined;
  if (!found.gate) return "The start line is not on this run's track.";
  return found.laps.length === 0
    ? "No full lap from the start line."
    : `This run has no lap ${number}.`;
}

/**
 * One side of a comparison: a run, a lap of it, and that lap's samples and stats for `signals`.
 * The lap is its `number` from 1, or else the best lap that is not `taken` by the other side.
 */
export function useLap(options: {
  id: MaybeRefOrGetter<string | undefined>;
  number: MaybeRefOrGetter<number | undefined>;
  taken: MaybeRefOrGetter<Lap | undefined>;
  signals: MaybeRefOrGetter<string[]>;
  points: MaybeRefOrGetter<number>;
}) {
  const loaded = useRun(options.id);
  const { param } = loaded;
  const laps = computed(() => loaded.laps.data.value?.laps ?? []);
  const lap = computed(() => pickLap(laps.value, toValue(options.number), toValue(options.taken)));

  const range = computed((): [number, number] | null =>
    lap.value ? [lap.value.start, lap.value.end] : null,
  );
  const names = computed(() => toValue(options.signals));
  const points = computed(() => toValue(options.points));
  const enabled = computed(() => range.value !== null && names.value.length > 0);
  const samples = useQuery({
    queryKey: ["samples", param, names, range, points],
    queryFn: () => readSamples(param.value, names.value, points.value, range.value),
    enabled: computed(() => enabled.value && points.value > 0),
  });
  const stats = useQuery({
    queryKey: ["stats", param, names, range],
    queryFn: () => readStats(param.value, names.value, range.value),
    enabled,
  });

  const failed = computed(() =>
    [loaded.run, loaded.track, loaded.laps, samples, stats].some((query) => query.error.value),
  );
  const problem = computed(() =>
    failed.value
      ? "This run could not be loaded."
      : whyNoLap(loaded, lap.value, toValue(options.number)),
  );

  const data = computed((): LapData | undefined => {
    const track = loaded.track.data.value;
    const lapSamples = samples.data.value;
    return lap.value && track && lapSamples && { lap: lap.value, track, samples: lapSamples };
  });

  return {
    id: computed(() => toValue(options.id)),
    run: computed(() => loaded.run.data.value),
    laps,
    lap,
    number: computed(() => (lap.value ? laps.value.indexOf(lap.value) + 1 : undefined)),
    stats: computed(() => stats.data.value),
    data,
    problem,
  };
}
