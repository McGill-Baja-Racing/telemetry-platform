<script setup lang="ts">
import { computed } from "vue";
import type { Signal } from "../../signals.ts";
import type { ChartSettings } from "../chart/types.ts";
import RunChart from "./RunChart.vue";
import RunSignals from "./RunSignals.vue";
import type { Samples } from "./run.ts";

/**
 * The view's signals beside a chart for each group of them. The default slot goes above the charts.
 */
const { groups, samples } = defineProps<{ groups: Map<string, Signal[]>; samples?: Samples }>();
/** The view's name, the names of its signals, and how it draws each chart, by title. */
const view = defineModel<string>("view", { required: true });
const shown = defineModel<string[]>("shown", { required: true });
const settings = defineModel<Record<string, ChartSettings>>("settings", { required: true });
const emit = defineEmits<{
  zoom: [from: number, to: number];
  /** The index in `samples.time` under the cursor. */
  cursor: [index: number | null];
}>();

const charts = computed(() => {
  const data = samples;
  if (!data) return [];
  const loaded = [...groups.values()]
    .flat()
    .filter((signal) => shown.value.includes(signal.name) && signal.name in data.values);
  return [...Map.groupBy(loaded, (signal) => signal.chart)].map(([title, list]) => ({
    title,
    unit: list[0].unit,
    digits: list[0].digits,
    names: list.map((signal) => signal.name),
    series: list.map((signal) => ({
      label: signal.short,
      color: signal.color,
      values: data.values[signal.name],
    })),
  }));
});
</script>

<template>
  <div class="flex flex-col gap-8 xl:flex-row xl:items-start">
    <RunSignals
      v-model:view="view"
      v-model:shown="shown"
      :groups
      class="order-last xl:order-first xl:w-48 xl:flex-none"
    />
    <div class="grid min-w-0 flex-1 gap-4">
      <slot />
      <RunChart
        v-for="chart in charts"
        :key="chart.title"
        :title="chart.title"
        :unit="chart.unit"
        :digits="chart.digits"
        :time="samples?.time ?? []"
        :series="chart.series"
        :settings="settings[chart.title] ?? {}"
        @update:settings="settings = { ...settings, [chart.title]: $event }"
        @remove="shown = shown.filter((name) => !chart.names.includes(name))"
        @zoom="(from, to) => emit('zoom', from, to)"
        @cursor="emit('cursor', $event)"
      />
      <p v-if="charts.length === 0" class="text-faint">Pick signals to chart.</p>
    </div>
  </div>
</template>
