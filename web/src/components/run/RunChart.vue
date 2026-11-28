<script setup lang="ts">
import { computed, ref, watch } from "vue";
import LineChart from "../chart/LineChart.vue";
import type { ChartSeries, ChartSettings } from "../chart/types.ts";
import type { MenuItem } from "../ui/types.ts";
import UiButton from "../ui/UiButton.vue";
import UiTextField from "../ui/UiTextField.vue";

/** A chart of the run with its options: a y axis set by hand, smoothing, or removing it. */
const { title, unit, digits, time, series } = defineProps<{
  title: string;
  unit: string;
  digits: number;
  time: number[];
  series: ChartSeries[];
}>();
const settings = defineModel<ChartSettings>("settings", { required: true });
const emit = defineEmits<{
  remove: [];
  zoom: [from: number, to: number];
  cursor: [index: number | null];
}>();

const SMOOTHING = [0, 0.5, 2];

function update(change: ChartSettings) {
  settings.value = { ...settings.value, ...change };
}

/** The shown values, widened to round numbers: 0 to 1,999 gives 0 to 2,000. */
function extent(): [number, number] {
  const values = series.flatMap((line) => line.values.filter((value) => value !== null));
  const low = Math.min(...values);
  const high = Math.max(...values);
  if (!(high > low)) return values.length ? [low - 1, low + 1] : [0, 1];
  const step = 10 ** (Math.floor(Math.log10(high - low)) - 1);
  const round = (value: number) => Number(value.toPrecision(12));
  return [round(Math.floor(low / step) * step), round(Math.ceil(high / step) * step)];
}

const menu = computed<MenuItem[]>(() => [
  { label: "Auto Y axis", checked: !settings.value.y, select: () => update({ y: undefined }) },
  { label: "Set min and max", checked: !!settings.value.y, select: () => update({ y: extent() }) },
  "separator",
  ...SMOOTHING.map((seconds) => ({
    label: seconds ? `Smooth over ${seconds} s` : "No smoothing",
    checked: (settings.value.smoothing ?? 0) === seconds,
    select: () => update({ smoothing: seconds }),
  })),
  "separator",
  { label: "Remove from the view", select: () => emit("remove") },
]);

/** The fields keep what is typed, such as "1.50", until it is a different number. */
const min = ref("");
const max = ref("");
watch(
  () => settings.value.y,
  (y) => {
    if (y && (min.value === "" || Number(min.value) !== y[0])) min.value = String(y[0]);
    if (y && (max.value === "" || Number(max.value) !== y[1])) max.value = String(y[1]);
  },
  { immediate: true },
);
watch([min, max], ([low, high]) => {
  const y: [number, number] = [Number(low), Number(high)];
  if (settings.value.y && low !== "" && high !== "" && y[0] < y[1]) update({ y });
});
</script>

<template>
  <LineChart
    :title
    :unit
    :digits
    :time
    :series
    :height="150"
    :menu
    :y-range="settings.y"
    :smoothing="settings.smoothing"
    sync="run"
    @zoom="(from, to) => emit('zoom', from, to)"
    @cursor="emit('cursor', $event)"
  >
    <div v-if="settings.y" class="flex flex-wrap items-center gap-2 pb-2 pl-11">
      <UiTextField v-model="min" type="number" label="Y axis minimum" class="w-32">
        <span class="text-sm">Min</span>
      </UiTextField>
      <UiTextField v-model="max" type="number" label="Y axis maximum" class="w-32">
        <span class="text-sm">Max</span>
      </UiTextField>
      <UiButton variant="quiet" size="sm" @click="update({ y: undefined })">Auto</UiButton>
    </div>
  </LineChart>
</template>
