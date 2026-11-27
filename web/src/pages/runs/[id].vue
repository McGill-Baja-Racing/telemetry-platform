<script setup lang="ts">
import { keepPreviousData, useQuery } from "@tanstack/vue-query";
import { StorageSerializers, useElementSize, useLocalStorage } from "@vueuse/core";
import { parseResponse } from "hono/client";
import { computed, ref, useTemplateRef, watch } from "vue";
import { useRoute } from "vue-router";
import { client } from "../../api.ts";
import RunCharts from "../../components/run/RunCharts.vue";
import RunCursor from "../../components/run/RunCursor.vue";
import RunLaps from "../../components/run/RunLaps.vue";
import RunRangeBar from "../../components/run/RunRangeBar.vue";
import { bestLap, indexAt, type Lap, lapAt } from "../../components/run/run.ts";
import TrackMap from "../../components/run/TrackMap.vue";
import UiPage from "../../components/ui/UiPage.vue";
import UiTabs from "../../components/ui/UiTabs.vue";
import { formatClock, testDay } from "../../format.ts";
import { chartableSignals } from "../../signals.ts";

const route = useRoute("/runs/[id]");
const param = computed(() => ({ id: route.params.id }));
const runApi = client.api.recordings[":id"];

const { data: run } = useQuery({
  queryKey: ["recording", param],
  queryFn: () => parseResponse(runApi.$get({ param: param.value })),
});

const duration = computed(() =>
  run.value ? (Date.parse(run.value.endedAt) - Date.parse(run.value.startedAt)) / 1000 : 0,
);
const groups = computed(() => chartableSignals(run.value?.signals ?? []));
const signals = computed(() => [...groups.value.values()].flat());

/** Kept from one run to the next. */
const shownNames = useLocalStorage("run-signals", [
  "gps_speed",
  "engine_rpm",
  "front_brake_pressure",
  "rear_brake_pressure",
  "mpu_accel_x",
  "mpu_accel_y",
  "mpu_accel_z",
]);
const shown = computed(() => signals.value.filter((signal) => shownNames.value.includes(signal.name)));
const shownList = computed(() => shown.value.map((signal) => signal.name));

/** Seconds from the start of the run that the charts show; the whole run when null. */
const range = ref<[number, number] | null>(null);
/** Seconds from the start of the run under the cursor. */
const cursor = ref<number | null>(null);
const tab = ref<"charts" | "laps">("charts");
watch(param, () => {
  range.value = null;
  cursor.value = null;
});
watch(range, (shown) => {
  const at = cursor.value;
  if (shown && at !== null && (at < shown[0] || at > shown[1])) cursor.value = null;
});

const charts = useTemplateRef("charts");
const { width } = useElementSize(() => charts.value?.$el);
/** About one point per pixel, in steps so that resizing the window rarely loads again. */
const points = computed(() => Math.min(Math.max(Math.round(width.value / 200) * 200, 200), 4000));

function readSamples(names: string[], points: number, range: [number, number] | null) {
  const query = { signals: names.join(","), points: String(points) };
  const span = range ? { from: String(range[0]), to: String(range[1]) } : {};
  return parseResponse(runApi.samples.$get({ param: param.value, query: { ...query, ...span } }));
}

const { data: samples } = useQuery({
  queryKey: ["samples", param, shownList, range, points],
  queryFn: () => readSamples(shownList.value, points.value, range.value),
  enabled: computed(() => shownList.value.length > 0 && width.value > 0),
  placeholderData: keepPreviousData,
});

/** The whole run's speed, or its first signal, for the strip above the charts. */
const overviewSignal = computed(
  () => signals.value.find((signal) => signal.name === "gps_speed") ?? signals.value[0],
);
const { data: overviewSamples } = useQuery({
  queryKey: ["overview", param, overviewSignal],
  queryFn: () => readSamples([overviewSignal.value.name], 500, null),
  enabled: computed(() => overviewSignal.value !== undefined),
});
const overview = computed(() => {
  const data = overviewSamples.value;
  const values = data?.values[overviewSignal.value?.name ?? ""];
  return data && values ? { time: data.time, values } : undefined;
});

const { data: track } = useQuery({
  queryKey: ["track", param],
  queryFn: () => parseResponse(runApi.track.$get({ param: param.value })),
});
const hasTrack = computed(() => (track.value?.time.length ?? 0) > 1);

/** Kept from one run to the next: runs of the same test day share it. */
const startLine = useLocalStorage<{ lat: number; lon: number } | null>("start-line", null, {
  serializer: StorageSerializers.object,
});
const { data: lapResult } = useQuery({
  queryKey: ["laps", param, startLine],
  queryFn: () => {
    const { lat, lon } = startLine.value ?? { lat: 0, lon: 0 };
    const query = { lat: String(lat), lon: String(lon) };
    return parseResponse(runApi.laps.$get({ param: param.value, query }));
  },
  enabled: computed(() => startLine.value !== null && hasTrack.value),
});
const laps = computed<Lap[]>(() => lapResult.value?.laps ?? []);
const best = computed(() => bestLap(laps.value));

const meta = computed(() => {
  if (!run.value) return [];
  const started = run.value.gpsTime
    ? new Date(run.value.startedAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "No GPS time";
  const items = [
    { label: "Started", value: started },
    { label: "Duration", value: formatClock(duration.value, false) },
  ];
  const distance = track.value?.distance.at(-1);
  if (distance) items.push({ label: "Distance", value: `${(distance / 1000).toFixed(1)} km` });
  if (best.value) {
    const time = formatClock(best.value.end - best.value.start);
    items.push({ label: "Laps", value: `${laps.value.length}, best ${time}` });
  }
  return items;
});

function distanceAt(seconds: number) {
  const fixes = track.value;
  if (!fixes) return 0;
  return fixes.distance[indexAt(fixes.time, seconds)] ?? 0;
}

const where = computed(() => {
  const at = cursor.value;
  if (at === null) return "";
  const index = lapAt(laps.value, at);
  if (index < 0) return `${(distanceAt(at) / 1000).toFixed(2)} km into the run`;
  return `${Math.round(distanceAt(at) - distanceAt(laps.value[index].start))} m into lap ${index + 1}`;
});

function zoom(from: number, to: number) {
  range.value = [Math.max(from, 0), Math.min(to, duration.value)];
}

function showLap(lap: Lap) {
  range.value = [lap.start, lap.end];
  tab.value = "charts";
}

function onCursor(index: number | null) {
  const time = index === null ? undefined : samples.value?.time[index];
  if (time !== undefined) cursor.value = time;
}
</script>

<template>
  <UiPage
    v-if="run"
    :title="run.name"
    :parents="[
      { label: 'Runs', to: '/runs' },
      { label: run.gpsTime ? testDay(run.startedAt) : 'No GPS time', to: '/runs' },
    ]"
  >
    <template #details>
      <dl class="flex flex-wrap gap-x-8 gap-y-3">
        <div v-for="item in meta" :key="item.label" class="grid gap-0.5">
          <dt class="text-sm text-faint">{{ item.label }}</dt>
          <dd class="num font-medium whitespace-nowrap">{{ item.value }}</dd>
        </div>
      </dl>
    </template>

    <UiTabs
      v-model="tab"
      :tabs="[
        { label: 'Charts', value: 'charts' },
        { label: 'Laps', value: 'laps', count: laps.length },
      ]"
    >
      <template #charts>
        <div class="flex flex-col gap-8 xl:flex-row xl:items-start">
          <RunCharts
            ref="charts"
            class="min-w-0 flex-1"
            v-model:shown="shownNames"
            :groups
            :samples
            @zoom="zoom"
            @cursor="onCursor"
          >
            <RunRangeBar :range :laps :duration :overview @zoom="zoom" @whole="range = null" />
          </RunCharts>
          <aside class="grid gap-4 xl:w-68 xl:flex-none">
            <RunCursor :cursor :samples :signals="shown" :laps />
            <template v-if="track && hasTrack">
              <TrackMap :track :range :cursor :gate="lapResult?.gate ?? null" @pick="startLine = $event" />
              <p class="text-sm text-faint">
                {{ lapResult?.gate ? where : "Click the track to set the start line." }}
              </p>
            </template>
          </aside>
        </div>
      </template>
      <template #laps>
        <RunLaps :laps :best :has-track="hasTrack" @pick="showLap" />
      </template>
    </UiTabs>
  </UiPage>
</template>
