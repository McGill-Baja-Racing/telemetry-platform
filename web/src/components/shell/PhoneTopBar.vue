<script setup lang="ts">
import { Moon, Sun, SunMoon } from "@lucide/vue";
import { computed } from "vue";
import { RouterLink } from "vue-router";
import { useTheme } from "../../composables/useTheme.ts";
import { car } from "../../navigation.ts";
import UiIconButton from "../ui/UiIconButton.vue";
import AppWordmark from "./AppWordmark.vue";
import CarNumber from "./CarNumber.vue";

const { store: theme } = useTheme();
const order = ["auto", "light", "dark"] as const;
const next = computed(() => order[(order.indexOf(theme.value as (typeof order)[number]) + 1) % order.length]);
const icons = { auto: SunMoon, light: Sun, dark: Moon };
</script>

<template>
  <header class="flex items-center justify-between gap-2.5 px-4.5 pt-safe pb-2.5">
    <RouterLink to="/"><AppWordmark /></RouterLink>
    <div class="flex items-center gap-1">
      <UiIconButton :label="`Theme: ${theme}`" @click="theme = next">
        <component :is="icons[theme as keyof typeof icons] ?? SunMoon" />
      </UiIconButton>
      <span class="flex items-center gap-2 rounded-full py-1 pr-2.5 pl-1 inset-ring inset-ring-line-strong">
        <CarNumber size="sm" class="pl-2">{{ car.number }}</CarNumber>
        <b class="font-semibold">{{ car.name }}</b>
      </span>
    </div>
  </header>
</template>
