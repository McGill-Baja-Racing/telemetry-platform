<script setup lang="ts">
import { Check, Link } from "@lucide/vue";
import { useQuery } from "@tanstack/vue-query";
import { useClipboard, useElementSize, useLocalStorage } from "@vueuse/core";
import { parseResponse } from "hono/client";
import { computed, reactive, ref, useTemplateRef } from "vue";
import { useRoute, useRouter } from "vue-router";
import { client } from "../api.ts";
import { type Aligned, type Axis, align } from "../components/compare/align.ts";
import CompareCharts from "../components/compare/CompareCharts.vue";
import CompareResults from "../components/compare/CompareResults.vue";
import CompareRun from "../components/compare/CompareRun.vue";
import { useLap } from "../components/compare/useLap.ts";
import { pointsFor } from "../components/run/queries.ts";
import UiButton from "../components/ui/UiButton.vue";
import UiPage from "../components/ui/UiPage.vue";
import UiSection from "../components/ui/UiSection.vue";
import UiSegmented from "../components/ui/UiSegmented.vue";
import UiSignalToggle from "../components/ui/UiSignalToggle.vue";
import { chartableSignals } from "../signals.ts";

const route = useRoute("/compare");
const router = useRouter();

/** `?runs=20,21&laps=6,5`, laps counted from 1. A run without a lap shows its best one. */
function listOf(value: unknown) {
  return typeof value === "string" ? value.split(",") : [];
}
const ids = computed(() => listOf(route.query.runs).map((id) => id || undefined));
const numbers = computed(() => listOf(route.query.laps).map((n) => Number(n) || undefined));

const axis = ref<Axis>("distance");
/** Kept from one comparison to the next. */
const shownNames = useLocalStorage("compare-signals", ["gps_speed", "engine_rpm", "mpu_accel_z"]);

const charts = useTemplateRef("charts");
const { width } = useElementSize(charts);
const points = computed(() => (width.value > 0 ? pointsFor(width.value) : 0));

const first = reactive(
  useLap({
    id: () => ids.value[0],
    number: () => numbers.value[0],
    taken: undefined,
    signals: shownNames,
    points,
  }),
);
const second = reactive(
  useLap({
    id: () => ids.value[1],
    number: () => numbers.value[1],
    taken: () => (ids.value[0] === ids.value[1] ? first.lap : undefined),
    signals: shownNames,
    points,
  }),
);
const sides = [first, second];

/** The other side keeps the lap it shows, even when it was picked by default. */
function change(side: number, run: string | undefined, lap?: number) {
  const runs = sides.map((each, i) => (i === side ? run : each.id) ?? "");
  const laps = sides.map((each, i) => (i === side ? lap : each.number) ?? "");
  const query: Record<string, string> = { runs: runs.join(",") };
  if (laps.some(Boolean)) query.laps = laps.join(",");
  router.replace({ query });
}

const { data: recordings } = useQuery({
  queryKey: ["recordings"],
  queryFn: () => parseResponse(client.api.recordings.$get()),
});
const started = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });
/** Only runs with GPS time can have laps. */
const runOptions = computed(() =>
  (recordings.value ?? [])
    .filter((run) => run.gpsTime)
    .map((run) => ({
      label: `${run.name}, ${started.format(Date.parse(run.startedAt))}`,
      value: String(run.id),
    })),
);

/** The signals both runs have. */
const groups = computed(() => {
  const [own, other] = sides.map((side) => side.run?.signals ?? []);
  const common = new Set(other.map((signal) => signal.name));
  return chartableSignals(own.filter((signal) => common.has(signal.name)));
});
const shown = computed(() =>
  [...groups.value.values()].flat().filter((signal) => shownNames.value.includes(signal.name)),
);

function show(name: string, on: boolean) {
  shownNames.value = on ? [...shownNames.value, name] : shownNames.value.filter((n) => n !== name);
}

const labels = computed(() => sides.map((side) => `Lap ${side.number}`) as [string, string]);
const title = computed(() => {
  const [a, b] = sides.map((side) => side.run?.name);
  if (!a || !b) return "Compare laps";
  if (first.id !== second.id) return `${a} against ${b}`;
  return first.number && second.number ? `Lap ${first.number} against lap ${second.number}` : a;
});

const comparable = computed(() => sides.every((side) => side.id && !side.problem));
/** The last laps shown stay on screen while the next ones load. */
const aligned = computed<Aligned | undefined>((previous) => {
  if (!comparable.value) return undefined;
  const [a, b] = sides.map((side) => side.data);
  return a && b ? align(axis.value, [a, b], points.value) : previous;
});

const { copy, copied } = useClipboard();
const { location } = window;
</script>

<template>
  <UiPage :title :parents="[{ label: 'Runs', to: '/runs' }]">
    <template #actions>
      <span class="text-faint">Align by</span>
      <UiSegmented
        v-model="axis"
        label="Align by"
        :options="[
          { label: 'Distance', value: 'distance' },
          { label: 'Time', value: 'time' },
        ]"
      />
      <UiButton @click="copy(location.href)">
        <Check v-if="copied" /><Link v-else />{{ copied ? "Copied" : "Copy link" }}
      </UiButton>
    </template>

    <section class="grid grid-cols-1 border-y border-line sm:grid-cols-2">
      <CompareRun
        v-for="(side, index) in sides"
        :key="index"
        :class="index === 0 ? 'sm:pr-6' : 'border-line max-sm:border-t sm:border-l sm:pl-6'"
        :color="index === 0 ? 'fg' : 'muted'"
        :runs="runOptions"
        :run="side.run"
        :laps="side.laps"
        :lap="side.lap"
        :number="side.number"
        :problem="side.problem"
        @run="change(index, $event)"
        @lap="change(index, side.id, $event)"
      />
    </section>

    <section v-if="comparable" class="grid grid-cols-1 gap-12 lg:grid-cols-5 lg:items-start">
      <div ref="charts" class="min-w-0 lg:col-span-3">
        <CompareCharts v-if="aligned" :aligned :signals="shown" :labels :axis />
        <p v-else class="text-faint">Loading the laps…</p>
      </div>
      <div class="grid grid-cols-1 gap-10 lg:col-span-2">
        <UiSection title="Results">
          <CompareResults
            v-if="first.lap && second.lap"
            :laps="[first.lap, second.lap]"
            :stats="[first.stats, second.stats]"
            :signals="shown"
            :labels
          />
        </UiSection>
        <UiSection title="Signals">
          <div class="grid grid-cols-1 gap-0.5 sm:grid-cols-2">
            <template v-for="[node, list] in groups" :key="node">
              <UiSignalToggle
                v-for="signal in list"
                :key="signal.name"
                :model-value="shownNames.includes(signal.name)"
                :color="signal.color"
                :name="signal.label"
                :unit="signal.unit"
                @update:model-value="show(signal.name, $event)"
              />
            </template>
          </div>
        </UiSection>
      </div>
    </section>
    <p v-else-if="!first.id || !second.id" class="text-faint">Pick two runs to compare their laps.</p>
  </UiPage>
</template>
