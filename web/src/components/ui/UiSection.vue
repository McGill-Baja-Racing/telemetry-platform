<script setup lang="ts">
/** A part of a page with its own heading, such as "Today's runs". Links like "All runs" go in `actions`. */
const { title } = defineProps<{ title: string }>();
</script>

<template>
  <section class="grid grid-cols-1 gap-3.5">
    <div class="flex flex-wrap items-baseline justify-between gap-4">
      <h2>{{ title }}</h2>
      <div v-if="$slots.actions" class="-my-1 -mr-2.5 flex items-center gap-2">
        <slot name="actions" />
      </div>
    </div>
    <slot />
  </section>
</template>
