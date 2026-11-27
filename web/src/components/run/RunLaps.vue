<script setup lang="ts">
import { computed } from "vue";
import { formatClock } from "../../format.ts";
import type { Column } from "../ui/types.ts";
import UiTable from "../ui/UiTable.vue";
import UiTag from "../ui/UiTag.vue";
import type { Lap } from "./run.ts";

/** The laps of a run, best marked; picking one shows it on the charts. */
const { laps, best, hasTrack } = defineProps<{ laps: Lap[]; best?: Lap; hasTrack: boolean }>();
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
  <UiTable v-if="laps.length" :columns :rows :row-key="(row) => row.n">
    <template #cell-lap="{ row }">
      <button type="button" class="cursor-pointer font-medium hover:underline" @click="emit('pick', row.lap)">
        Lap {{ row.n }}
      </button>
      <UiTag v-if="row.lap === best" class="ml-2">Best</UiTag>
    </template>
  </UiTable>
  <p v-else class="text-faint">
    {{ hasTrack ? "Click the track on the Charts tab to set the start line." : "This run has no GPS track." }}
  </p>
</template>
