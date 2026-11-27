<script setup lang="ts">
/** A short label, such as a setup name. `color` tints it, with a colour token name. */
const { color } = defineProps<{ color?: string }>();
</script>

<template>
  <span
    class="inline-flex h-5.5 items-center gap-1.5 rounded-sm px-2 text-xs font-medium whitespace-nowrap"
    :class="color ? '' : 'bg-hover text-muted'"
    :style="
      color
        ? {
            color: `var(--color-${color})`,
            background: `color-mix(in oklab, var(--color-${color}) 15%, transparent)`,
          }
        : undefined
    "
  >
    <slot />
  </span>
</template>
