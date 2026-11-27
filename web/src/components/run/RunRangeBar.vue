<script setup lang="ts">
import { computed } from "vue";
import { formatClock } from "../../format.ts";
import UiButton from "../ui/UiButton.vue";
import RunOverview from "./RunOverview.vue";
import type { Lap } from "./run.ts";

/** What the charts show, a way back to the whole run, and the whole run as a strip to pick from. */
const { range, laps, duration, overview } = defineProps<{
  /** Seconds from the start of the run; the whole run when null. */
  range: [number, number] | null;
  laps: Lap[];
  duration: number;
  overview?: { time: number[]; values: (number | null)[] };
}>();
const emit = defineEmits<{ zoom: [from: number, to: number]; whole: [] }>();

const label = computed(() => {
  if (!range) return "Whole run";
  const [from, to] = range;
  const lap = laps.findIndex((lap) => lap.start === from && lap.end === to);
  const name = lap < 0 ? "" : `Lap ${lap + 1} of ${laps.length}, `;
  return `${name}${formatClock(from)} to ${formatClock(to)}`;
});
</script>

<template>
  <div class="grid gap-4">
    <div class="flex items-baseline justify-between gap-4">
      <span class="num font-medium">{{ label }}</span>
      <UiButton v-if="range" variant="quiet" size="sm" class="-my-1.5 -mr-2.5" @click="emit('whole')">
        Show whole run
      </UiButton>
    </div>
    <RunOverview
      v-if="overview"
      :time="overview.time"
      :values="overview.values"
      :duration
      :range
      :laps
      @zoom="(from, to) => emit('zoom', from, to)"
    />
  </div>
</template>
