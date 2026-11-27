<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import { client } from "../api.ts";
import UiPage from "../components/ui/UiPage.vue";
import UiTable from "../components/ui/UiTable.vue";
import { formatClock } from "../format.ts";

const { data: recordings } = useQuery({
  queryKey: ["recordings"],
  queryFn: async () => (await client.api.recordings.$get()).json(),
  refetchInterval: 5000,
});

const columns: { key: string; label: string; align?: "right"; optional?: boolean }[] = [
  { key: "name", label: "Recording" },
  { key: "started", label: "Started", optional: true },
  { key: "duration", label: "Duration", align: "right" },
  { key: "samples", label: "Samples", align: "right", optional: true },
];

const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });

function duration(start: string, end: string) {
  return formatClock((Date.parse(end) - Date.parse(start)) / 1000, false);
}
</script>

<template>
  <UiPage title="Runs">
    <UiTable :columns :rows="recordings ?? []" :row-key="(row) => row.id">
      <template #cell-name="{ row }">
        <span class="font-mono text-xs">{{ row.name }}</span>
      </template>
      <template #cell-started="{ row }">
        {{ row.gpsTime ? dateTime.format(Date.parse(row.startedAt)) : "No GPS time" }}
      </template>
      <template #cell-duration="{ row }">{{ duration(row.startedAt, row.endedAt) }}</template>
      <template #cell-samples="{ row }">{{ row.sampleCount.toLocaleString() }}</template>
    </UiTable>
    <p v-if="recordings?.length === 0" class="text-faint">No runs yet.</p>
  </UiPage>
</template>
