<script setup lang="ts">
import { computed } from "vue";
import { formatClock } from "../../format.ts";
import UiButton from "../ui/UiButton.vue";
import RunOverview from "./RunOverview.vue";
import { type Lap, lapOf } from "./run.ts";

/** What the charts show, a way back to the whole lap or run, and the whole run to pick from. */
const { range, laps, duration, overview } = defineProps<{
  /** Seconds from the start of the run; the whole run when null. */
  range: [number, number] | null;
  laps: Lap[];
  duration: number;
  overview?: { time: number[]; values: (number | null)[] };
}>();
const emit = defineEmits<{ zoom: [from: number, to: number]; whole: [] }>();

const inLap = computed(() => (range ? lapOf(laps, range) : undefined));

const label = computed(() => {
  if (!range) return "Whole run";
  const name = inLap.value ? `Lap ${inLap.value.index + 1} of ${laps.length}, ` : "";
  return `${name}${formatClock(range[0])} to ${formatClock(range[1])}`;
});
</script>

<template>
  <div class="grid gap-4">
    <div class="flex items-baseline justify-between gap-4">
      <span class="num font-medium">{{ label }}</span>
      <UiButton
        v-if="inLap && !inLap.whole"
        variant="quiet"
        size="sm"
        class="-my-1.5 -mr-2.5"
        @click="emit('zoom', inLap.lap.start, inLap.lap.end)"
      >
        Show whole lap
      </UiButton>
      <UiButton v-else-if="range" variant="quiet" size="sm" class="-my-1.5 -mr-2.5" @click="emit('whole')">
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
