<script setup lang="ts">
/** Settings or counters, one per line: the name on the left, the value on the right. */
const { items } = defineProps<{ items: { label: string; value: string; unit?: string }[] }>();
</script>

<template>
  <dl class="grid grid-cols-1">
    <div
      v-for="item in items"
      :key="item.label"
      class="flex items-baseline justify-between gap-4 py-2.75 whitespace-nowrap not-first:border-t not-first:border-line"
    >
      <dt class="truncate text-muted">{{ item.label }}</dt>
      <dd class="num font-semibold">
        {{ item.value }}<small v-if="item.unit" class="ml-0.75 font-normal text-faint">{{ item.unit }}</small>
      </dd>
    </div>
  </dl>
</template>
