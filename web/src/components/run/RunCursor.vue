<script setup lang="ts">
import { computed } from "vue";
import { formatClock, formatValue } from "../../format.ts";
import type { Signal } from "../../signals.ts";
import { lastValue } from "../chart/gaps.ts";
import UiKeyValues from "../ui/UiKeyValues.vue";
import UiValue from "../ui/UiValue.vue";
import { indexAt, type Lap, lapAt, type Samples } from "./run.ts";

/** The time under the cursor, its lap, and the value of each shown signal there. */
const { cursor, samples, signals, laps } = defineProps<{
  /** Seconds from the start of the run. */
  cursor: number | null;
  samples?: Samples;
  signals: Signal[];
  laps: Lap[];
}>();

const lap = computed(() => {
  if (cursor === null) return "";
  const index = lapAt(laps, cursor);
  return index < 0 ? "" : `Lap ${index + 1}, ${formatClock(cursor - laps[index].start)}`;
});

/** A signal without a sample at the cursor shows its last one before it, as its line does. */
const values = computed(() => {
  if (!samples || cursor === null) return [];
  const index = indexAt(samples.time, cursor);
  return signals
    .filter((signal) => signal.name in samples.values)
    .map((signal) => {
      const value = lastValue(samples.time, samples.values[signal.name], index);
      return { label: signal.label, value: formatValue(value, signal.digits), unit: signal.unit };
    });
});
</script>

<template>
  <div class="grid gap-3 rounded-xl bg-raised p-4">
    <div class="flex items-baseline justify-between gap-3">
      <h3>At the cursor</h3>
      <span class="num text-sm text-faint">{{ lap }}</span>
    </div>
    <UiValue :value="cursor === null ? '–' : formatClock(cursor)" class="text-3xl" />
    <UiKeyValues :items="values" />
  </div>
</template>
