<script setup lang="ts" generic="T extends string">
import { TabsContent, TabsIndicator, TabsList, TabsRoot, TabsTrigger } from "reka-ui";

/**
 * Views of one thing, such as a run's charts, laps and notes. Each tab's content goes in a slot
 * named after its value: `<template #laps>…</template>`.
 */
const { tabs } = defineProps<{ tabs: { label: string; value: T; count?: number }[] }>();
const model = defineModel<T>({ required: true });
</script>

<template>
  <TabsRoot v-model="model" class="grid grid-cols-1 gap-6">
    <TabsList class="relative flex gap-x-5.5 overflow-x-auto border-b border-line scrollbar-none">
      <TabsTrigger
        v-for="tab in tabs"
        :key="tab.value"
        :value="tab.value"
        class="inline-flex h-11 flex-none cursor-pointer items-center gap-1.5 font-medium whitespace-nowrap text-faint transition-colors hover:text-fg data-[state=active]:text-fg"
      >
        {{ tab.label }}
        <span v-if="tab.count !== undefined" class="num text-xs text-faint">{{ tab.count }}</span>
      </TabsTrigger>
      <TabsIndicator
        class="absolute bottom-0 left-0 h-0.5 w-(--reka-tabs-indicator-size) translate-x-(--reka-tabs-indicator-position) bg-fg transition-all duration-200"
      />
    </TabsList>
    <TabsContent v-for="tab in tabs" :key="tab.value" :value="tab.value">
      <slot :name="tab.value" />
    </TabsContent>
  </TabsRoot>
</template>
