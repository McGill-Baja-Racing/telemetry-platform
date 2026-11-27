<script setup lang="ts">
/** A filter that is on or off, such as "My team". `color` adds a swatch, with a colour token name. */
const { color } = defineProps<{ color?: string }>();
const pressed = defineModel<boolean>({ default: false });
</script>

<template>
  <button
    type="button"
    :aria-pressed="pressed"
    class="inline-flex h-7 cursor-pointer items-center gap-1.75 rounded-full px-2.75 text-sm font-medium whitespace-nowrap transition active:scale-97 pointer-coarse:h-8.5 pointer-coarse:px-3.5"
    :class="pressed ? 'bg-ink text-on-ink' : 'text-muted inset-ring inset-ring-line-strong hover:bg-hover hover:text-fg'"
    @click="pressed = !pressed"
  >
    <span v-if="color" class="size-2 rounded-xs" :style="{ background: `var(--color-${color})` }" />
    <slot />
  </button>
</template>
