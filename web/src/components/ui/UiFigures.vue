<script setup lang="ts">
import UiValue from "./UiValue.vue";

/** Up to four key values side by side, such as a run's best lap and top speed. */
const { items } = defineProps<{
  items: { label: string; value: string; unit?: string; hint?: string }[];
}>();
</script>

<template>
  <dl
    class="grid border-y border-line md:grid-flow-col md:grid-cols-none"
    :class="items.length === 3 ? 'grid-cols-3' : 'grid-cols-2'"
  >
    <div
      v-for="(item, index) in items"
      :key="item.label"
      class="grid min-w-0 content-start gap-1.25 border-line py-3 pr-3 md:gap-2.25 md:py-5 md:pr-5 md:not-first:border-l md:not-first:pl-6"
      :class="{
        'border-l pl-3': items.length === 3 ? index > 0 : index % 2 === 1,
        'border-t': items.length !== 3 && index > 1,
        'md:border-t-0': index > 1,
      }"
    >
      <dt class="truncate text-sm text-muted">{{ item.label }}</dt>
      <dd><UiValue :value="item.value" :unit="item.unit" class="text-3xl md:text-4xl" /></dd>
      <dd v-if="item.hint" class="text-sm text-faint">{{ item.hint }}</dd>
    </div>
  </dl>
</template>
