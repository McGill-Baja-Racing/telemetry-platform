<script setup lang="ts">
import { ChevronRight } from "@lucide/vue";
import { type RouteLocationRaw, RouterLink } from "vue-router";
import UiValue from "../ui/UiValue.vue";
import CarNumber from "./CarNumber.vue";
import CarStateLabel from "./CarStateLabel.vue";
import type { CarState, CarValue } from "./car.ts";

/** The car's state on a phone, above the tab bar. It opens `to`, the Live page with the controls. */
const {
  state,
  number,
  detail,
  values = [],
  to,
} = defineProps<{
  state: CarState;
  number: string;
  detail?: string;
  values?: CarValue[];
  to?: RouteLocationRaw;
}>();
</script>

<template>
  <section aria-label="Car status">
    <component
      :is="to ? RouterLink : 'div'"
      :to
      class="mx-2.5 flex items-center gap-2.5 rounded-2xl bg-chrome px-2.5 py-2"
    >
      <CarNumber size="sm" :idle="state === 'offline'">{{ number }}</CarNumber>
      <span class="grid min-w-0 flex-1 leading-tight">
        <CarStateLabel :state class="text-sm" />
        <span class="truncate text-xs text-faint">{{ detail }}</span>
      </span>
      <UiValue
        v-if="values[0] && (state === 'recording' || state === 'reconnecting')"
        :value="values[0].value"
        :unit="values[0].unit"
        class="text-2xl"
        :class="{ 'opacity-45': state === 'reconnecting' }"
      />
      <ChevronRight v-if="to" class="text-faint" />
    </component>
  </section>
</template>
