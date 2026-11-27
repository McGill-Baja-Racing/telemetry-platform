<script setup lang="ts">
/** Shows or hides a signal on the charts. `color` is the signal's colour token, such as "axis-z". */
const { color, name, unit } = defineProps<{ color: string; name: string; unit?: string }>();
const shown = defineModel<boolean>({ default: false });
</script>

<template>
  <button
    type="button"
    :aria-pressed="shown"
    class="flex h-7 w-full cursor-pointer items-center gap-2.5 rounded-md px-2 text-left whitespace-nowrap transition-colors hover:bg-hover hover:text-fg pointer-coarse:h-11"
    :class="shown ? 'text-fg' : 'text-faint'"
    @click="shown = !shown"
  >
    <span
      class="size-2.5 flex-none rounded-xs transition"
      :class="shown ? '' : 'inset-ring inset-ring-line-strong'"
      :style="shown ? { background: `var(--color-${color})` } : undefined"
    />
    <span class="flex-1 truncate">{{ name }}</span>
    <span v-if="unit" class="text-xs text-faint">{{ unit }}</span>
  </button>
</template>
