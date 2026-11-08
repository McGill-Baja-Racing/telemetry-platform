<script setup lang="ts">
import { useQuery } from "@tanstack/vue-query";
import { client } from "../api";

const { data, isError } = useQuery({
  queryKey: ["health"],
  queryFn: async () => (await client.api.health.$get()).json(),
});
</script>

<template>
  <main class="grid min-h-dvh place-items-center bg-zinc-950 text-zinc-100">
    <div class="text-center">
      <h1 class="text-3xl font-semibold">Baja Telemetry</h1>
      <p class="mt-2 text-sm text-zinc-400">
        API {{ isError ? "unreachable" : data?.ok ? "online" : "…" }}
      </p>
    </div>
  </main>
</template>
