<script setup lang="ts">
import { computed } from "vue";
import type { Signal } from "../../signals.ts";
import LineChart from "../chart/LineChart.vue";
import UiSignalToggle from "../ui/UiSignalToggle.vue";
import type { Samples } from "./run.ts";

/**
 * The run's signals grouped by node, beside a chart for each group of shown signals. The default
 * slot goes above the charts.
 */
const { groups, samples } = defineProps<{ groups: Map<string, Signal[]>; samples?: Samples }>();
/** The names of the shown signals. */
const shown = defineModel<string[]>("shown", { required: true });
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
    series: list.map((signal) => ({
      label: signal.short,
      color: signal.color,
      values: data.values[signal.name],
    })),
  }));
});

function show(name: string, on: boolean) {
  shown.value = on ? [...shown.value, name] : shown.value.filter((n) => n !== name);
}
</script>

<template>
  <div class="flex flex-col gap-8 xl:flex-row xl:items-start">
    <aside class="order-last grid gap-0.5 xl:order-first xl:w-48 xl:flex-none" aria-label="Signals">
      <template v-for="[node, list] in groups" :key="node">
        <h3 class="px-2 pt-4 pb-1 text-sm text-faint first:pt-0">{{ node }}</h3>
        <UiSignalToggle
          v-for="signal in list"
          :key="signal.name"
          :model-value="shown.includes(signal.name)"
          :color="signal.color"
          :name="signal.label"
          :unit="signal.unit"
          @update:model-value="show(signal.name, $event)"
        />
      </template>
    </aside>
    <div class="grid min-w-0 flex-1 gap-4">
      <slot />
      <LineChart
        v-for="chart in charts"
        :key="chart.title"
        :title="chart.title"
        :unit="chart.unit"
        :digits="chart.digits"
        :time="samples?.time ?? []"
        :series="chart.series"
        :height="150"
        sync="run"
        @zoom="(from, to) => emit('zoom', from, to)"
        @cursor="emit('cursor', $event)"
      />
      <p v-if="charts.length === 0" class="text-faint">Pick signals to chart.</p>
    </div>
  </div>
</template>
