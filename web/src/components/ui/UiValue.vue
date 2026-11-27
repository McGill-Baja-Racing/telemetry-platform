<script setup lang="ts">
/** A measured value and its unit, such as 48.4 km/h. Give it its size: `class="text-2xl"`. */
const { value, unit } = defineProps<{ value: string; unit?: string }>();
</script>

<template>
  <span class="num font-semibold whitespace-nowrap">
    {{ value }}<small v-if="unit" class="ml-1 text-xs font-medium tracking-normal text-faint font-stretch-100%">{{ unit }}</small>
  </span>
</template>
