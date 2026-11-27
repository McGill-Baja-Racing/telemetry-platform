<script setup lang="ts">
import { ChevronLeft, ChevronRight } from "@lucide/vue";
import { computed } from "vue";
import { type RouteLocationRaw, RouterLink } from "vue-router";

/**
 * The frame of every page: its title, up to three actions in the `actions` slot, a line about it
 * in `details`, then the page's sections. A page inside another one (a run inside Runs) names its `parents`: a breadcrumb on a
 * computer, a back button on a phone.
 */
const { title, parents = [] } = defineProps<{
  title: string;
  parents?: { label: string; to: RouteLocationRaw }[];
}>();

const back = computed(() => parents.at(-1));
</script>

<template>
  <div>
    <nav
      v-if="parents.length"
      aria-label="Breadcrumb"
      class="hidden min-h-14 items-center gap-2 overflow-hidden border-b border-line py-2 pr-3.5 pl-10 font-medium whitespace-nowrap text-faint lg:flex"
    >
      <template v-for="(parent, index) in parents" :key="index">
        <ChevronRight v-if="index > 0" class="size-3.5" />
        <RouterLink :to="parent.to" class="hover:text-fg">{{ parent.label }}</RouterLink>
      </template>
    </nav>
    <RouterLink
      v-if="back"
      :to="back.to"
      class="flex min-h-11 items-center gap-0.5 px-2 text-muted lg:hidden"
    >
      <ChevronLeft class="size-5" />{{ back.label }}
    </RouterLink>
    <div class="mx-auto grid w-full max-w-page grid-cols-1 gap-5 px-4.5 pt-1.5 pb-8 sm:gap-10 sm:px-10 sm:pt-10 sm:pb-16">
      <header class="grid gap-3">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <h1>{{ title }}</h1>
          <div v-if="$slots.actions" class="flex flex-wrap items-center gap-2.5">
            <slot name="actions" />
          </div>
        </div>
        <slot name="details" />
      </header>
      <slot />
    </div>
  </div>
</template>
