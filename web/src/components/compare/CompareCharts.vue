<script setup lang="ts">
import { computed } from "vue";
import type { Signal } from "../../signals.ts";
import LineChart from "../chart/LineChart.vue";
import type { Aligned, Axis } from "./align.ts";

/**
 * A chart per signal with the first lap in the signal's colour over the second in grey, then the
 * time the first lap gains or loses along the way. All share one cursor.
 */
const { aligned, signals, labels, axis } = defineProps<{
  aligned: Aligned;
  signals: Signal[];
  labels: [string, string];
  axis: Axis;
}>();

const charts = computed(() =>
  signals
    .filter((signal) => signal.name in aligned.values[0] && signal.name in aligned.values[1])
    .map((signal) => ({
      signal,
      series: [
        { label: labels[0], color: signal.color, values: aligned.values[0][signal.name] },
        { label: labels[1], color: "muted", values: aligned.values[1][signal.name] },
      ],
    })),
);
</script>

<template>
  <div class="grid min-w-0 gap-4">
    <LineChart
      v-for="{ signal, series } in charts"
      :key="signal.name"
      :title="signal.label"
      :unit="signal.unit"
      :digits="signal.digits"
      :time="aligned.x"
      :axis
      :series
      :height="150"
      sync="compare"
    />
    <LineChart
      title="Time delta"
      :unit="`s, below zero ${labels[0]} is ahead`"
      :digits="2"
      :time="aligned.x"
      :axis
      :series="[{ label: 'Delta', color: 'fg', values: aligned.delta }]"
      :height="110"
      sync="compare"
    />
  </div>
</template>
