<script setup lang="ts">
import { Link } from "@lucide/vue";
import { keepPreviousData, useQuery } from "@tanstack/vue-query";
import { useClipboard, useElementSize } from "@vueuse/core";
import { computed, ref, useTemplateRef, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { pointsFor, readSamples, useRun } from "../../components/run/queries.ts";
import RunCharts from "../../components/run/RunCharts.vue";
import RunCursor from "../../components/run/RunCursor.vue";
import RunHighlight from "../../components/run/RunHighlight.vue";
import RunLaps from "../../components/run/RunLaps.vue";
import RunRangeBar from "../../components/run/RunRangeBar.vue";
import {
  bestLap,
  durationOf,
  type Highlight,
  indexAt,
  type Lap,
  lapAt,
  runFacts,
} from "../../components/run/run.ts";
import TrackMap from "../../components/run/TrackMap.vue";
import { useRunViews } from "../../components/run/views.ts";
import UiButton from "../../components/ui/UiButton.vue";
import UiPage from "../../components/ui/UiPage.vue";
import UiTabs from "../../components/ui/UiTabs.vue";
import { testDay } from "../../format.ts";
import { chartableSignals } from "../../signals.ts";

const route = useRoute("/runs/[id]");
const router = useRouter();
const loaded = useRun(() => route.params.id);
const { param, hasTrack, startLine } = loaded;
const { data: run } = loaded.run;
const { data: track } = loaded.track;
const { data: lapResult } = loaded.laps;

const duration = computed(() => (run.value ? durationOf(run.value) : 0));
const groups = computed(() => chartableSignals(run.value?.signals ?? []));
const signals = computed(() => [...groups.value.values()].flat());

/** Kept from one run to the next. */
const { name: viewName, view } = useRunViews();
const shown = computed(() => signals.value.filter((signal) => view.value.signals.includes(signal.name)));
const highlight = ref<Highlight | null>(null);
/** The shown signals, and the highlighted one to find its moments even when it is not shown. */
const loadedNames = computed(() => {
  const names = shown.value.map((signal) => signal.name);
  const extra = highlight.value?.signal;
  return extra && !names.includes(extra) ? [...names, extra] : names;
});

/** Seconds from the start of the run that the charts show, kept in the address; null for all. */
const range = computed<[number, number] | null>({
  get: () => {
    const seconds: [number, number] = [Number(route.query.from), Number(route.query.to)];
    return seconds[1] > seconds[0] ? seconds : null;
  },
  set: (seconds) => {
    const query = seconds ? { from: String(seconds[0]), to: String(seconds[1]) } : {};
    router.replace({ query });
  },
});
const { copy, copied } = useClipboard({ copiedDuring: 2000 });
/** The address has the range in it, so the link shows what is shown here. */
const copyLink = () => copy(location.href);
/** Seconds from the start of the run under the cursor. */
const cursor = ref<number | null>(null);
const tab = ref<"charts" | "laps">("charts");
watch(param, () => {
  cursor.value = null;
});
watch(range, (shown) => {
  const at = cursor.value;
  if (shown && at !== null && (at < shown[0] || at > shown[1])) cursor.value = null;
});

const charts = useTemplateRef("charts");
const { width } = useElementSize(() => charts.value?.$el);
const points = computed(() => pointsFor(width.value));

const { data: samples } = useQuery({
  queryKey: ["samples", param, loadedNames, range, points],
  queryFn: () => readSamples(param.value, loadedNames.value, points.value, range.value),
  enabled: computed(() => loadedNames.value.length > 0 && width.value > 0),
  placeholderData: keepPreviousData,
});

/** The whole run's speed, or its first signal, for the strip above the charts. */
const overviewSignal = computed(
  () => signals.value.find((signal) => signal.name === "gps_speed") ?? signals.value[0],
);
const { data: overviewSamples } = useQuery({
  queryKey: ["overview", param, overviewSignal],
  queryFn: () => readSamples(param.value, [overviewSignal.value.name], 500, null),
  enabled: computed(() => overviewSignal.value !== undefined),
});
const overview = computed(() => {
  const data = overviewSamples.value;
  const values = data?.values[overviewSignal.value?.name ?? ""];
  return data && values ? { time: data.time, values } : undefined;
});

const laps = computed<Lap[]>(() => lapResult.value?.laps ?? []);
const best = computed(() => bestLap(laps.value));

const meta = computed(() =>
  run.value ? runFacts(run.value, track.value?.distance.at(-1), laps.value) : [],
);

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
  const ms = (seconds: number) => Math.round(seconds * 1000) / 1000;
  range.value = [ms(Math.max(from, 0)), ms(Math.min(to, duration.value))];
}

function showLap(lap: Lap) {
  zoom(lap.start, lap.end);
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
    <template #actions>
      <UiButton @click="copyLink"><Link />{{ copied ? "Copied" : "Copy link" }}</UiButton>
    </template>
    <template #details>
      <dl class="flex flex-wrap gap-x-8 gap-y-3">
        <div v-for="item in meta" :key="item.label" class="grid gap-0.5">
          <dt class="text-sm text-faint">{{ item.label }}</dt>
          <dd class="num font-medium whitespace-nowrap">{{ item.value }} {{ item.unit }}</dd>
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
            v-model:view="viewName"
            v-model:shown="view.signals"
            v-model:settings="view.charts"
            :groups
            :samples
            :highlight
            @zoom="zoom"
            @cursor="onCursor"
          >
            <RunRangeBar :range :laps :duration :overview @zoom="zoom" @whole="range = null" />
            <RunHighlight v-model="highlight" :run-id="route.params.id" :signals :range @zoom="zoom" />
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
        <RunLaps :run-id="route.params.id" :laps :best :has-track="hasTrack" @pick="showLap" />
      </template>
    </UiTabs>
  </UiPage>
</template>
