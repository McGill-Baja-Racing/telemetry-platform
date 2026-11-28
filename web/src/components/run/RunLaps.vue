<script setup lang="ts">
import { ArrowLeftRight } from "@lucide/vue";
import { computed } from "vue";
import { formatClock } from "../../format.ts";
import type { Column } from "../ui/types.ts";
import UiButton from "../ui/UiButton.vue";
import UiTable from "../ui/UiTable.vue";
import UiTag from "../ui/UiTag.vue";
import type { Lap } from "./run.ts";

/**
 * The laps of a run, best marked; picking one shows it on the charts. "Compare with…" opens the
 * best two side by side, to change from there.
 */
const { runId, laps, best, hasTrack } = defineProps<{
  runId: string;
  laps: Lap[];
  best?: Lap;
  hasTrack: boolean;
}>();
const emit = defineEmits<{ pick: [lap: Lap] }>();

const columns: Column[] = [
  { key: "lap", label: "Lap" },
  { key: "time", label: "Time", align: "right" },
  { key: "distance", label: "Distance", align: "right" },
  { key: "start", label: "Starts at", align: "right", optional: true },
];

const rows = computed(() =>
  laps.map((lap, index) => ({
    lap,
    n: index + 1,
    time: formatClock(lap.end - lap.start),
    distance: `${Math.round(lap.distance)} m`,
    start: formatClock(lap.start),
  })),
);
</script>

<template>
  <div v-if="laps.length" class="grid grid-cols-1 gap-3">
    <UiButton :to="{ path: '/compare', query: { runs: `${runId},${runId}` } }" class="justify-self-end">
      <ArrowLeftRight />Compare with…
    </UiButton>
    <UiTable :columns :rows :row-key="(row) => row.n">
      <template #cell-lap="{ row }">
        <button type="button" class="cursor-pointer font-medium hover:underline" @click="emit('pick', row.lap)">
          Lap {{ row.n }}
        </button>
        <UiTag v-if="row.lap === best" class="ml-2">Best</UiTag>
      </template>
    </UiTable>
  </div>
  <p v-else class="text-faint">
    {{ hasTrack ? "Click the track on the Charts tab to set the start line." : "This run has no GPS track." }}
  </p>
</template>
