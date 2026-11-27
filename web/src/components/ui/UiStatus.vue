<script setup lang="ts">
import type { Tone } from "./types.ts";

/** A status lamp, followed by the word it stands for. A lamp is never shown without its word. */
const { tone = "ok" } = defineProps<{ tone?: Tone }>();

const lamps: Record<Tone, string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  crit: "bg-crit",
  info: "bg-info",
  off: "inset-ring inset-ring-faint",
};
</script>

<template>
  <span
    class="inline-flex items-center gap-2 font-medium whitespace-nowrap"
    :class="tone === 'off' ? 'text-faint' : 'text-fg'"
  >
    <span class="h-1.5 w-3.5 flex-none rounded-xs" :class="lamps[tone]" />
    <slot />
  </span>
</template>
