<script setup lang="ts">
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { themes, useTheme } from "../../composables/useTheme.ts";
import { car } from "../../navigation.ts";
import UiIconButton from "../ui/UiIconButton.vue";
import AppWordmark from "./AppWordmark.vue";
import CarNumber from "./CarNumber.vue";

const { store: theme } = useTheme();
const index = computed(() => Math.max(themes.findIndex((option) => option.value === theme.value), 0));
const current = computed(() => themes[index.value]);

function nextTheme() {
  theme.value = themes[(index.value + 1) % themes.length].value;
}
</script>

<template>
  <header class="flex items-center justify-between gap-2.5 px-4.5 pt-safe pb-2.5">
    <RouterLink to="/"><AppWordmark /></RouterLink>
    <div class="flex items-center gap-1">
      <UiIconButton :label="`Theme: ${current.label}`" @click="nextTheme">
        <component :is="current.icon" />
      </UiIconButton>
      <span class="flex items-center gap-2 rounded-full py-1 pr-2.5 pl-1 inset-ring inset-ring-line-strong">
        <CarNumber size="sm" class="pl-2">{{ car.number }}</CarNumber>
        <b class="font-semibold">{{ car.name }}</b>
      </span>
    </div>
  </header>
</template>
