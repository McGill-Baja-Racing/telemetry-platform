<script setup lang="ts">
import type { Tone } from "./types.ts";
import UiStatus from "./UiStatus.vue";

/**
 * Something that needs attention: what is wrong, what it means for the data, its likely cause, and
 * an action in the default slot.
 */
const {
  tone = "warn",
  title,
  effect,
  cause,
} = defineProps<{ tone?: Tone; title: string; effect?: string; cause?: string }>();
</script>

<template>
  <div class="flex items-start gap-3 py-3.5">
    <UiStatus :tone class="mt-1.75" />
    <div class="grid min-w-0 flex-1 gap-0.75">
      <b class="font-semibold">{{ title }}</b>
      <span v-if="effect" class="text-muted">{{ effect }}</span>
      <small v-if="cause" class="text-sm text-faint">{{ cause }}</small>
    </div>
    <slot />
  </div>
</template>
