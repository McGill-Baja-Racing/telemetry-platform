<script setup lang="ts">
/** A button that shows only an icon. `label` is what screen readers and the tooltip say. */
const { label, size = "md" } = defineProps<{ label: string; size?: "md" | "sm" }>();
</script>

<template>
  <button
    type="button"
    :aria-label="label"
    :title="label"
    class="grid flex-none cursor-pointer place-items-center rounded-md text-muted transition not-disabled:hover:bg-hover not-disabled:hover:text-fg not-disabled:active:scale-97 disabled:cursor-default disabled:opacity-40"
    :class="size === 'md' ? 'size-8 pointer-coarse:size-11' : 'size-6.5 pointer-coarse:size-10'"
  >
    <slot />
  </button>
</template>
