<script setup lang="ts">
import { computed } from "vue";
import { formatChange, formatClock, formatValue } from "../../format.ts";
import type { Signal } from "../../signals.ts";
import type { Lap } from "../run/run.ts";
import type { Column } from "../ui/types.ts";
import UiTable from "../ui/UiTable.vue";
import UiValue from "../ui/UiValue.vue";

type Stats = Record<string, { min: number; max: number; mean: number } | null>;

/**
 * Both laps' time, then each signal's peak and mean, and the lowest value of a signal that goes
 * below zero. The change is the first lap minus the second.
 */
const { laps, stats, signals, labels } = defineProps<{
  laps: [Lap, Lap];
  stats: [Stats | undefined, Stats | undefined];
  signals: Signal[];
  labels: [string, string];
}>();

const columns = computed((): Column[] => [
  { key: "label", label: "" },
  { key: "first", label: labels[0], align: "right" },
  { key: "second", label: labels[1], align: "right" },
  { key: "change", label: "Change", align: "right" },
]);

type Row = {
  label: string;
  first: string;
  second: string;
  change: string;
  unit?: string;
  changeUnit: string;
  faster?: boolean;
};

function measure(label: string, [first, second]: (number | undefined)[], signal: Signal): Row {
  const { digits, unit } = signal;
  const change =
    first === undefined || second === undefined ? "–" : formatChange(first - second, digits);
  const [a, b] = [first, second].map((value) => formatValue(value, digits));
  return { label, first: a, second: b, change, unit, changeUnit: unit };
}

/** "Acceleration Z" reads "acceleration Z" after "Peak", but "GPS speed" stays as it is. */
function lowerFirst(label: string) {
  return label.replace(/^[A-Z](?=[a-z])/, (letter) => letter.toLowerCase());
}

const rows = computed((): Row[] => {
  const [first, second] = laps.map((lap) => lap.end - lap.start);
  const lapTime = {
    label: "Lap time",
    first: formatClock(first),
    second: formatClock(second),
    change: formatChange(first - second, 3),
    changeUnit: "s",
    faster: first < second,
  };
  const measures = signals.flatMap((signal) => {
    const of = (key: "min" | "max" | "mean") => stats.map((list) => list?.[signal.name]?.[key]);
    const name = lowerFirst(signal.label);
    const lowest = of("min");
    const signed = lowest.some((value) => value !== undefined && value < 0);
    return [
      measure(`Peak ${name}`, of("max"), signal),
      ...(signed ? [measure(`Lowest ${name}`, lowest, signal)] : []),
      measure(`Mean ${name}`, of("mean"), signal),
    ];
  });
  return [lapTime, ...measures];
});
</script>

<template>
  <UiTable :columns :rows :row-key="(row) => row.label">
    <template #cell-label="{ row }">
      <span class="whitespace-normal text-muted">{{ row.label }}</span>
    </template>
    <template #cell-first="{ row }">
      <UiValue :value="row.first" :unit="row.unit" />
    </template>
    <template #cell-second="{ row }">
      <UiValue :value="row.second" :unit="row.unit" class="text-muted" />
    </template>
    <template #cell-change="{ row }">
      <UiValue :value="row.change" :unit="row.changeUnit" :class="row.faster ? 'text-ok' : 'text-muted'" />
    </template>
  </UiTable>
</template>
