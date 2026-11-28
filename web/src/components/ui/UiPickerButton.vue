<script setup lang="ts">
import { ChevronDown } from "@lucide/vue";

/** The button that opens a list or a calendar: what it picks, then the value in the default slot. */
const { label } = defineProps<{ label: string }>();
</script>

<template>
  <button
    type="button"
    class="inline-flex h-8 min-w-0 cursor-pointer items-center gap-2 rounded-md pr-2.25 pl-3 font-medium whitespace-nowrap inset-ring inset-ring-line-strong transition-colors hover:bg-hover pointer-coarse:h-11"
  >
    <span class="font-normal text-faint">{{ label }}</span>
    <slot />
    <ChevronDown class="size-3.5 text-faint" />
  </button>
</template>
