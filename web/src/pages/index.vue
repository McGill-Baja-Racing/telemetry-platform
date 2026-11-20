<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import { client } from "../api";

const { data: collector } = useQuery({
  queryKey: ["collector"],
  queryFn: async () => (await client.api.collector.$get()).json(),
  refetchInterval: 1000,
});

const { data: recordings } = useQuery({
  queryKey: ["recordings"],
  queryFn: async () => (await client.api.recordings.$get()).json(),
  refetchInterval: 5000,
});

const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "medium" });
const time = new Intl.DateTimeFormat(undefined, { timeStyle: "short" });
const percent = new Intl.NumberFormat(undefined, { style: "percent" });

const formatDate = (iso: string) => dateTime.format(Date.parse(iso));

function duration(start: string, end: string) {
  const seconds = Math.round((Date.parse(end) - Date.parse(start)) / 1000);
  return `${Math.floor(seconds / 60)} min ${seconds % 60} s`;
}
</script>

<template>
  <main class="mx-auto max-w-4xl px-4 py-10">
    <h1 class="text-2xl font-semibold">Baja Telemetry</h1>

    <section v-if="collector" class="mt-6 rounded-lg border border-zinc-800 p-4 text-sm">
      <p class="flex items-center gap-2">
        <span
          class="size-2 rounded-full"
          :class="collector.master === 'online' ? 'bg-emerald-400' : 'bg-zinc-600'"
        />
        <template v-if="collector.master === 'online'">Master online</template>
        <template v-else>Master offline: join the car's Wi-Fi to collect its logs</template>
      </p>
      <p v-if="collector.current" class="mt-2 text-zinc-400">
        <template v-if="collector.current.step === 'downloading'">
          Downloading {{ collector.current.log }}: {{ percent.format(collector.current.progress) }}
        </template>
        <template v-else>Importing {{ collector.current.log }}</template>
      </p>
      <p v-if="collector.lastError" class="mt-2 text-red-400">
        {{ time.format(Date.parse(collector.lastError.at)) }}: {{ collector.lastError.message }}
      </p>
    </section>

    <div class="mt-6 overflow-x-auto">
      <table class="w-full text-left text-sm whitespace-nowrap">
        <thead class="text-zinc-400">
          <tr>
            <th scope="col" class="py-2 pr-6 font-medium">Recording</th>
            <th scope="col" class="py-2 pr-6 font-medium">Started</th>
            <th scope="col" class="py-2 pr-6 font-medium">Duration</th>
            <th scope="col" class="py-2 text-right font-medium">Samples</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="recording in recordings" :key="recording.id" class="border-t border-zinc-800">
            <td class="py-2 pr-6 font-mono">{{ recording.name }}</td>
            <td class="py-2 pr-6">
              {{ recording.gpsTime ? formatDate(recording.startedAt) : "No GPS time" }}
            </td>
            <td class="py-2 pr-6">{{ duration(recording.startedAt, recording.endedAt) }}</td>
            <td class="py-2 text-right tabular-nums">
              {{ recording.sampleCount.toLocaleString() }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="recordings?.length === 0" class="mt-4 text-sm text-zinc-400">No recordings yet.</p>
  </main>
</template>
