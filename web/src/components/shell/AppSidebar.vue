<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { useNavigation } from "../../composables/useNavigation.ts";
import { themes, useTheme } from "../../composables/useTheme.ts";
import { car } from "../../navigation.ts";
import UiSegmented from "../ui/UiSegmented.vue";
import AppWordmark from "./AppWordmark.vue";
import CarNumber from "./CarNumber.vue";

const { main, teams, isActive } = useNavigation();
const { store: theme } = useTheme();
const groups = computed(() => [
  { title: "", items: main.value },
  { title: "Teams", items: teams.value },
]);
</script>

<template>
  <aside aria-label="Main navigation" class="flex w-59 flex-none flex-col gap-0.5 overflow-y-auto py-4 pr-2.5 pl-3.5">
    <RouterLink to="/" class="px-2 pt-1.5 pb-4.5"><AppWordmark /></RouterLink>

    <div class="mb-2.5 flex items-center gap-2.5 rounded-lg p-2.5 inset-ring inset-ring-line-strong">
      <CarNumber>{{ car.number }}</CarNumber>
      <b class="truncate font-semibold">{{ car.name }}</b>
    </div>

    <template v-for="group in groups" :key="group.title">
      <div v-if="group.title && group.items.length" class="px-2 pt-6 pb-2 text-xs font-medium text-faint">
        {{ group.title }}
      </div>
      <RouterLink
        v-for="item in group.items"
        :key="item.to"
        :to="item.to"
        class="flex h-8.5 items-center gap-2.5 rounded-md px-2 whitespace-nowrap transition-colors hover:bg-hover hover:text-fg"
        :class="isActive(item) ? 'bg-selected font-semibold text-fg' : 'font-medium text-muted'"
      >
        <component :is="item.icon" :style="item.color ? { color: `var(--color-${item.color})` } : undefined" />
        {{ item.label }}
      </RouterLink>
    </template>

    <UiSegmented v-model="theme" :options="themes" label="Theme" class="mt-auto self-start" />
  </aside>
</template>
