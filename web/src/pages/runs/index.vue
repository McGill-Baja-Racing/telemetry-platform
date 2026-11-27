<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import { parseResponse } from "hono/client";
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { client } from "../../api.ts";
import type { Column } from "../../components/ui/types.ts";
import UiPage from "../../components/ui/UiPage.vue";
import UiSection from "../../components/ui/UiSection.vue";
import UiTable from "../../components/ui/UiTable.vue";
import { formatClock, testDay } from "../../format.ts";

const { data: recordings } = useQuery({
  queryKey: ["recordings"],
  queryFn: () => parseResponse(client.api.recordings.$get()),
});

/** Runs without GPS time are dated from when the master powered on, so they go last. */
const days = computed(() =>
  Map.groupBy(
    (recordings.value ?? []).toSorted((a, b) => Number(b.gpsTime) - Number(a.gpsTime)),
    (run) => (run.gpsTime ? testDay(run.startedAt) : "No GPS time"),
  ),
);

const columns: Column[] = [
  { key: "name", label: "Run" },
  { key: "started", label: "Started", optional: true },
  { key: "duration", label: "Duration", align: "right" },
  { key: "samples", label: "Samples", align: "right", optional: true },
];

const time = new Intl.DateTimeFormat(undefined, { timeStyle: "short" });

function duration(start: string, end: string) {
  return formatClock((Date.parse(end) - Date.parse(start)) / 1000, false);
}
</script>

<template>
  <UiPage title="Runs">
    <UiSection v-for="[day, runs] in days" :key="day" :title="day">
      <UiTable :columns :rows="runs" :row-key="(row) => row.id">
        <template #cell-name="{ row }">
          <RouterLink :to="`/runs/${row.id}`" class="font-mono text-xs hover:underline">
            {{ row.name }}
          </RouterLink>
        </template>
        <template #cell-started="{ row }">
          {{ row.gpsTime ? time.format(Date.parse(row.startedAt)) : "" }}
        </template>
        <template #cell-duration="{ row }">{{ duration(row.startedAt, row.endedAt) }}</template>
        <template #cell-samples="{ row }">{{ row.sampleCount.toLocaleString() }}</template>
      </UiTable>
    </UiSection>
    <p v-if="recordings?.length === 0" class="text-faint">No runs yet.</p>
  </UiPage>
</template>
