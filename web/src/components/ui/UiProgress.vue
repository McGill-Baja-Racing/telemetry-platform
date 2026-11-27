<script setup lang="ts">
/** A progress bar. `value` goes from 0 to 1. */
const { value, label } = defineProps<{ value: number; label?: string }>();
</script>

<template>
  <div
    role="progressbar"
    :aria-label="label"
    aria-valuemin="0"
    aria-valuemax="100"
    :aria-valuenow="Math.round(value * 100)"
    class="h-1.5 overflow-hidden rounded-xs bg-selected"
  >
    <div class="h-full rounded-xs bg-fg transition-all duration-300" :style="{ width: `${Math.min(Math.max(value, 0), 1) * 100}%` }" />
  </div>
</template>
