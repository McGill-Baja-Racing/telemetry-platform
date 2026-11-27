<script setup lang="ts">
/** A keyboard shortcut, such as "⌘K". `inverse` is for coloured buttons. */
const { inverse = false } = defineProps<{ inverse?: boolean }>();
</script>

<template>
  <kbd
    class="inline-flex flex-none items-center rounded-sm px-1.25 py-0.75 font-sans text-2xs leading-none font-medium"
    :class="inverse ? 'opacity-70 inset-ring inset-ring-current' : 'text-faint inset-ring inset-ring-line-strong'"
  >
    <slot />
  </kbd>
</template>
