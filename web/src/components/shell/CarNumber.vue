<script setup lang="ts">
/** The car's number, in plain condensed figures. `idle` greys it out when the car is offline. */
const { idle = false, size = "md" } = defineProps<{ idle?: boolean; size?: "sm" | "md" }>();
</script>

<template>
  <span
    class="flex-none border-r border-line-strong pr-2.75 leading-none font-bold tracking-tight tabular-nums font-stretch-82%"
    :class="[idle ? 'text-faint' : 'text-fg', size === 'md' ? 'text-2xl' : 'text-xl']"
  >
    <slot />
  </span>
</template>
