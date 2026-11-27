<script setup lang="ts">
import UiStatus from "../ui/UiStatus.vue";
import type { CarState } from "./car.ts";

const { state } = defineProps<{ state: CarState }>();

const labels: Record<CarState, string> = {
  recording: "Recording",
  starting: "Starting",
  idle: "Connected, not recording",
  reconnecting: "Reconnecting",
  offline: "Car offline",
  connected: "Connected",
};
</script>

<template>
  <span
    class="inline-flex items-center gap-1.75 font-semibold whitespace-nowrap"
    :class="{ 'text-muted': state === 'offline' }"
  >
    <span v-if="state === 'recording'" class="size-2 rounded-full bg-live" />
    <span v-else-if="state === 'idle'" class="size-2 rounded-full inset-ring inset-ring-faint" />
    <UiStatus v-else-if="state === 'reconnecting'" tone="warn" />
    <UiStatus v-else-if="state === 'connected'" tone="ok" />
    {{ labels[state] }}
  </span>
</template>
