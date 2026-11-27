<script setup lang="ts">
import { useQuery, useQueryClient } from "@tanstack/vue-query";
import { parseResponse } from "hono/client";
import { computed, watch } from "vue";
import { client } from "./api.ts";
import AppSidebar from "./components/shell/AppSidebar.vue";
import CarBarFull from "./components/shell/CarBarFull.vue";
import CarBarSmall from "./components/shell/CarBarSmall.vue";
import PhoneTabBar from "./components/shell/PhoneTabBar.vue";
import PhoneTopBar from "./components/shell/PhoneTopBar.vue";
import { car } from "./navigation.ts";

const { data: collector } = useQuery({
  queryKey: ["collector"],
  queryFn: () => parseResponse(client.api.collector.$get()),
  refetchInterval: 2000,
});

const queryClient = useQueryClient();
watch(
  () => collector.value?.current?.log,
  (_, finished) => {
    if (finished) queryClient.invalidateQueries({ queryKey: ["recordings"] });
  },
);

const percent = new Intl.NumberFormat(undefined, { style: "percent" });

/** Until the server reads the logger's state, the bar only knows whether the car answers. */
const bar = computed(() => {
  if (collector.value?.master !== "online") return { state: "offline" as const, detail: undefined };
  const task = collector.value.current;
  const detail =
    task?.step === "downloading"
      ? `Downloading ${task.log}, ${percent.format(task.progress)}`
      : task
        ? `Importing ${task.log}`
        : "Logs are collected automatically";
  return { state: "connected" as const, detail };
});
</script>

<template>
  <div class="flex h-dvh flex-col bg-screen lg:bg-chrome">
    <div class="flex min-h-0 flex-1">
      <AppSidebar class="max-lg:hidden" />
      <div class="flex min-w-0 flex-1 flex-col lg:pt-2 lg:pr-2">
        <PhoneTopBar class="lg:hidden" />
        <main class="min-h-0 flex-1 overflow-y-auto lg:rounded-2xl lg:bg-screen lg:shadow-screen">
          <RouterView />
        </main>
      </div>
    </div>
    <CarBarSmall class="pt-2 lg:hidden" :number="car.number" :state="bar.state" :detail="bar.detail" />
    <CarBarFull class="max-lg:hidden" :number="car.number" :state="bar.state" :detail="bar.detail" />
    <PhoneTabBar class="lg:hidden" />
  </div>
</template>
