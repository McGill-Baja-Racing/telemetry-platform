<script setup lang="ts">
import { RouterLink } from "vue-router";
import { useNavigation } from "../../composables/useNavigation.ts";

const { phone, isActive } = useNavigation();
</script>

<template>
  <nav v-if="phone.length" aria-label="Main navigation" class="flex bg-screen px-1.5 pt-2 pb-safe">
    <RouterLink
      v-for="item in phone"
      :key="item.to"
      :to="item.to"
      class="grid min-h-11 flex-1 justify-items-center gap-0.75 py-1 text-2xs font-medium transition-colors"
      :class="isActive(item) ? 'text-fg' : 'text-faint'"
    >
      <component :is="item.icon" class="size-5" />
      {{ item.label }}
    </RouterLink>
  </nav>
</template>
